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

export class MissingTenantContextError extends Error {
  constructor() {
    super("Tenant context is missing from the authenticated session");
    this.name = "MissingTenantContextError";
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

export class UnsupportedPolicyOperationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsupportedPolicyOperationError";
  }
}

export class WriteAccessDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WriteAccessDeniedError";
  }
}
