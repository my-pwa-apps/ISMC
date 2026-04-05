import { describe, it, expect, beforeEach } from "vitest";
import { CircuitBreaker, CircuitOpenError } from "@/lib/graph/circuitBreaker";

describe("CircuitBreaker", () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker("test", {
      failureThreshold: 3,
      resetTimeoutMs: 100, // fast for tests
    });
  });

  it("allows requests in closed state", async () => {
    const result = await breaker.execute(async () => "ok");
    expect(result).toBe("ok");
    expect(breaker.currentState).toBe("CLOSED");
  });

  it("opens after reaching failure threshold", async () => {
    for (let i = 0; i < 3; i++) {
      try {
        await breaker.execute(async () => {
          throw new Error("fail");
        });
      } catch {
        // expected
      }
    }

    expect(breaker.isOpen).toBe(true);
    expect(breaker.currentState).toBe("OPEN");
  });

  it("rejects requests when open", async () => {
    // Trip the breaker
    for (let i = 0; i < 3; i++) {
      try {
        await breaker.execute(async () => {
          throw new Error("fail");
        });
      } catch {
        // expected
      }
    }

    await expect(
      breaker.execute(async () => "should not run")
    ).rejects.toThrow(CircuitOpenError);
  });

  it("transitions to half-open after reset timeout", async () => {
    // Trip the breaker
    for (let i = 0; i < 3; i++) {
      try {
        await breaker.execute(async () => {
          throw new Error("fail");
        });
      } catch {
        // expected
      }
    }

    // Wait for reset timeout (100ms)
    await new Promise((r) => setTimeout(r, 150));

    // Should allow a probe request
    const result = await breaker.execute(async () => "recovered");
    expect(result).toBe("recovered");
    expect(breaker.currentState).toBe("CLOSED");
  });

  it("re-opens from half-open on failure", async () => {
    // Trip the breaker
    for (let i = 0; i < 3; i++) {
      try {
        await breaker.execute(async () => {
          throw new Error("fail");
        });
      } catch {
        // expected
      }
    }

    // Wait for reset timeout
    await new Promise((r) => setTimeout(r, 150));

    // Probe request fails
    try {
      await breaker.execute(async () => {
        throw new Error("still broken");
      });
    } catch {
      // expected
    }

    expect(breaker.isOpen).toBe(true);
  });

  it("resets failure count on success", async () => {
    // 2 failures (below threshold)
    for (let i = 0; i < 2; i++) {
      try {
        await breaker.execute(async () => {
          throw new Error("fail");
        });
      } catch {
        // expected
      }
    }

    // Success resets counter
    await breaker.execute(async () => "ok");

    // 2 more failures should not trip (counter was reset)
    for (let i = 0; i < 2; i++) {
      try {
        await breaker.execute(async () => {
          throw new Error("fail");
        });
      } catch {
        // expected
      }
    }

    expect(breaker.isOpen).toBe(false);
  });
});
