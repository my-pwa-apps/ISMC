/**
 * Circuit breaker for Graph API availability.
 *
 * Prevents thundering herd when Graph is down by failing fast after
 * detecting repeated failures. The circuit has three states:
 *
 * 1. CLOSED (normal) — requests flow through normally
 * 2. OPEN (tripped) — all requests fail immediately without hitting Graph
 * 3. HALF_OPEN (probing) — allow one request through to test recovery
 *
 * The circuit opens after `failureThreshold` consecutive failures and
 * resets after `resetTimeoutMs` milliseconds.
 */

import logger from "@/lib/logger";

enum State {
  Closed = "CLOSED",
  Open = "OPEN",
  HalfOpen = "HALF_OPEN",
}

const DEFAULT_FAILURE_THRESHOLD = 5;
const DEFAULT_RESET_TIMEOUT_MS = 30_000; // 30 seconds

export class CircuitBreaker {
  private state: State = State.Closed;
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;

  constructor(
    private readonly name: string,
    options?: {
      failureThreshold?: number;
      resetTimeoutMs?: number;
    }
  ) {
    this.failureThreshold =
      options?.failureThreshold ?? DEFAULT_FAILURE_THRESHOLD;
    this.resetTimeoutMs =
      options?.resetTimeoutMs ?? DEFAULT_RESET_TIMEOUT_MS;
  }

  /**
   * Execute a function through the circuit breaker.
   * Throws CircuitOpenError if the circuit is open.
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === State.Open) {
      if (Date.now() - this.lastFailureTime >= this.resetTimeoutMs) {
        this.state = State.HalfOpen;
        logger.info(
          { circuit: this.name },
          "Circuit breaker half-open — allowing probe request"
        );
      } else {
        throw new CircuitOpenError(this.name, this.resetTimeoutMs);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  /** Check if the circuit is currently open (blocking requests). */
  get isOpen(): boolean {
    return this.state === State.Open;
  }

  /** Current state for diagnostics. */
  get currentState(): string {
    return this.state;
  }

  private onSuccess(): void {
    if (this.state === State.HalfOpen) {
      logger.info(
        { circuit: this.name },
        "Circuit breaker recovered — closing circuit"
      );
    }
    this.failureCount = 0;
    this.state = State.Closed;
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (
      this.failureCount >= this.failureThreshold ||
      this.state === State.HalfOpen
    ) {
      this.state = State.Open;
      logger.error(
        {
          circuit: this.name,
          failureCount: this.failureCount,
          resetAfterMs: this.resetTimeoutMs,
        },
        "Circuit breaker OPEN — failing fast for subsequent requests"
      );
    }
  }
}

export class CircuitOpenError extends Error {
  constructor(
    public readonly circuitName: string,
    public readonly resetAfterMs: number
  ) {
    super(
      `Circuit breaker "${circuitName}" is open — Graph API appears unavailable. Will retry after ${Math.round(resetAfterMs / 1000)}s.`
    );
    this.name = "CircuitOpenError";
  }
}

/**
 * Shared circuit breaker instance for Graph API calls.
 * All Graph requests flow through this circuit.
 */
export const graphCircuitBreaker = new CircuitBreaker("GraphAPI", {
  failureThreshold: Number(process.env.GRAPH_CIRCUIT_FAILURE_THRESHOLD) || DEFAULT_FAILURE_THRESHOLD,
  resetTimeoutMs: Number(process.env.GRAPH_CIRCUIT_RESET_MS) || DEFAULT_RESET_TIMEOUT_MS,
});
