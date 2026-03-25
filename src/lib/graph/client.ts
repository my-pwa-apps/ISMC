/**
 * Microsoft Graph HTTP Client
 *
 * A thin, typed wrapper around axios providing:
 *  - Automatic Bearer token injection (token supplied by caller)
 *  - Configurable retry with exponential back-off
 *  - 429 Retry-After header support
 *  - 401/403 error surfacing (no silent re-auth from client code)
 *  - Correlation ID propagation
 *  - Structured logging of all requests/responses
 *  - Isolation between v1.0 and beta base URLs
 *
 * SECURITY NOTE: Access tokens are NEVER logged. The pino redact config
 * is a belt-and-braces defence, but the client also explicitly avoids
 * including the token in any log statement.
 */

import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  isAxiosError,
} from "axios";
import { graphBase, type EndpointVersion } from "./endpoints";
import type { GraphODataCollection, GraphError } from "./types";
import logger from "@/lib/logger";

// ============================================================
// Configuration
// ============================================================

const MAX_RETRIES = Number(process.env.GRAPH_MAX_RETRIES ?? 3);
const TIMEOUT_MS = Number(process.env.GRAPH_TIMEOUT_MS ?? 30_000);
const RETRY_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

// ============================================================
// Error types
// ============================================================

export class GraphApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly graphCode: string,
    public readonly requestId?: string,
    message?: string
  ) {
    super(message ?? `Graph API error [${statusCode}]: ${graphCode}`);
    this.name = "GraphApiError";
  }
}

export class GraphThrottleError extends GraphApiError {
  constructor(
    public readonly retryAfterSeconds: number,
    requestId?: string
  ) {
    super(429, "TooManyRequests", requestId, `Graph throttle — retry after ${retryAfterSeconds}s`);
    this.name = "GraphThrottleError";
  }
}

// ============================================================
// Client factory
// ============================================================

export interface GraphClientOptions {
  /** Bearer access token — obtained server-side from the auth session */
  accessToken: string;
  /** Endpoint version to use for this client instance */
  version?: EndpointVersion;
  /** Optional correlation ID for request tracing */
  correlationId?: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function buildAxiosInstance(opts: GraphClientOptions): AxiosInstance {
  const baseURL = graphBase(opts.version ?? "v1.0");

  const instance = axios.create({
    baseURL,
    timeout: TIMEOUT_MS,
    headers: {
      Authorization: `Bearer ${opts.accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ConsistencyLevel: "eventual", // required for $count and $search
      ...(opts.correlationId
        ? { "client-request-id": opts.correlationId }
        : {}),
    },
  });

  // Request interceptor — log outgoing requests (no tokens in logs)
  instance.interceptors.request.use((config) => {
    logger.debug(
      {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        correlationId: opts.correlationId,
      },
      "Graph request"
    );
    return config;
  });

  // Response interceptor — log responses and surface request IDs
  instance.interceptors.response.use(
    (response) => {
      const requestId =
        response.headers["request-id"] ??
        response.headers["x-ms-ags-diagnostic"] ??
        undefined;
      logger.debug(
        {
          status: response.status,
          url: response.config.url,
          requestId,
          correlationId: opts.correlationId,
        },
        "Graph response"
      );
      return response;
    },
    (error) => {
      if (isAxiosError(error) && error.response) {
        const { status, data, headers } = error.response as AxiosResponse<GraphError>;
        const requestId = headers["request-id"] ?? undefined;
        logger.error(
          {
            status,
            url: error.config?.url,
            graphCode: data?.error?.code,
            requestId,
          },
          "Graph error response"
        );
      }
      return Promise.reject(error);
    }
  );

  return instance;
}

// ============================================================
// Core client with retry logic
// ============================================================

export class GraphClient {
  private readonly axiosV1: AxiosInstance;
  private readonly axiosBeta: AxiosInstance;
  private readonly correlationId?: string;

  constructor(opts: GraphClientOptions) {
    this.correlationId = opts.correlationId;
    this.axiosV1 = buildAxiosInstance({ ...opts, version: "v1.0" });
    this.axiosBeta = buildAxiosInstance({ ...opts, version: "beta" });
  }

  private instance(version: EndpointVersion = "v1.0"): AxiosInstance {
    return version === "beta" ? this.axiosBeta : this.axiosV1;
  }

  /** Perform a GET request with automatic retry and throttle handling. */
  async get<T>(
    path: string,
    version: EndpointVersion = "v1.0",
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.withRetry(() => this.instance(version).get<T>(path, config));
  }

  /** Perform a POST request (write operation). */
  async post<T>(
    path: string,
    body: unknown,
    version: EndpointVersion = "v1.0",
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.withRetry(
      () => this.instance(version).post<T>(path, body, config),
      1 // fewer retries for mutating operations
    );
  }

  /** Perform a PATCH request (write operation). */
  async patch<T>(
    path: string,
    body: unknown,
    version: EndpointVersion = "v1.0",
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.withRetry(
      () => this.instance(version).patch<T>(path, body, config),
      1
    );
  }

  /** Perform a DELETE request. */
  async delete(
    path: string,
    version: EndpointVersion = "v1.0",
    config?: AxiosRequestConfig
  ): Promise<void> {
    await this.withRetry(
      () => this.instance(version).delete(path, config),
      0 // no retry on deletes
    );
  }

  /**
   * Fetch a paginated collection, automatically following @odata.nextLink.
   * Returns all items across all pages.
   */
  async getAll<T>(
    path: string,
    version: EndpointVersion = "v1.0",
    maxItems?: number
  ): Promise<T[]> {
    const { paginate } = await import("./pagination");
    return paginate(
      (url) => this.get<GraphODataCollection<T>>(url, version),
      path,
      { maxItems }
    );
  }

  // ---- Internal ----

  private async withRetry<T>(
    fn: () => Promise<AxiosResponse<T>>,
    maxRetries: number = MAX_RETRIES
  ): Promise<T> {
    let attempt = 0;

    while (true) {
      try {
        const response = await fn();
        return response.data;
      } catch (err) {
        if (!isAxiosError(err) || !err.response) throw err;

        const { status, headers } = err.response;

        if (!RETRY_STATUS_CODES.has(status) || attempt >= maxRetries) {
          throw this.toGraphApiError(err);
        }

        const retryAfter =
          status === 429
            ? Number(headers["retry-after"] ?? 1)
            : Math.pow(2, attempt); // exponential back-off

        logger.warn(
          { status, attempt, retryAfterSeconds: retryAfter },
          "Graph request failed — retrying"
        );

        if (status === 429) {
          throw new GraphThrottleError(retryAfter, headers["request-id"]);
        }

        await sleep(retryAfter * 1000);
        attempt++;
      }
    }
  }

  private toGraphApiError(err: ReturnType<typeof isAxiosError> extends true ? never : unknown): GraphApiError {
    if (isAxiosError(err) && err.response) {
      const { status, data, headers } = err.response as AxiosResponse<GraphError>;
      const requestId = headers["request-id"] ?? undefined;
      return new GraphApiError(
        status,
        data?.error?.code ?? "Unknown",
        requestId,
        data?.error?.message
      );
    }
    return new GraphApiError(0, "NetworkError", undefined, String(err));
  }
}

// ============================================================
// Factory — create a Graph client from a raw access token
// ============================================================

export function createGraphClient(accessToken: string, correlationId?: string): GraphClient {
  return new GraphClient({ accessToken, correlationId });
}
