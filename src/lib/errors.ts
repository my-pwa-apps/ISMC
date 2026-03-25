/**
 * Domain-specific error types.
 *
 * Use these instead of checking err.message.includes(...) to discriminate
 * errors across service and API layers.
 */

export class PolicyNotFoundError extends Error {
  constructor(public readonly policyId: string) {
    super(`Policy not found: ${policyId}`);
    this.name = "PolicyNotFoundError";
  }
}

export class GraphThrottleError extends Error {
  constructor(
    public readonly retryAfterSeconds: number,
    message = `Graph throttle — retry after ${retryAfterSeconds}s`
  ) {
    super(message);
    this.name = "GraphThrottleError";
  }
}
