/**
 * Structured API request/response logger.
 *
 * Wraps an API route handler to automatically log:
 *  - Request method, path, correlation ID
 *  - Response status code
 *  - Duration in milliseconds
 *
 * Usage:
 *   export const GET = withRequestLogging(async (request) => { ... });
 *
 * Or as a standalone helper:
 *   const { log, end } = startRequestLog(request);
 *   // ... handle request ...
 *   end(response.status);
 */

import { type NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";

export interface RequestLogContext {
  /** Child logger pre-bound with request context */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  log: any;
  /** Call with the response status code to emit the completion log entry */
  end: (statusCode: number) => void;
  /** The correlation ID for this request */
  correlationId: string;
}

/**
 * Create a structured request log context.
 */
export function startRequestLog(request: NextRequest): RequestLogContext {
  const correlationId =
    request.headers.get("x-correlation-id") ?? crypto.randomUUID();
  const startTime = Date.now();

  const childLog = logger.child({
    method: request.method,
    path: request.nextUrl.pathname,
    correlationId,
  });

  childLog.info("API request started");

  return {
    log: childLog,
    correlationId,
    end(statusCode: number) {
      const durationMs = Date.now() - startTime;
      childLog.info(
        { statusCode, durationMs },
        "API request completed"
      );
    },
  };
}

/**
 * Higher-order function wrapping an API route handler with request logging.
 */
export function withRequestLogging(
  handler: (
    request: NextRequest,
    context: RequestLogContext,
    routeContext?: unknown
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest, routeContext?: unknown): Promise<NextResponse> => {
    const reqLog = startRequestLog(request);
    try {
      const response = await handler(request, reqLog, routeContext);
      reqLog.end(response.status);
      return response;
    } catch (err) {
      reqLog.log.error({ err }, "Unhandled API error");
      reqLog.end(500);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
  };
}
