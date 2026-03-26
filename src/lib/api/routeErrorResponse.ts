import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { MissingTenantContextError, PolicyNotFoundError } from "@/lib/errors";
import { GraphApiError, GraphThrottleError } from "@/lib/graph/client";
import { InvalidCursorError } from "@/lib/pagination";

export function toRouteErrorResponse(
  err: unknown,
  invalidMessage = "Invalid request"
): NextResponse {
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: invalidMessage, details: err.flatten() },
      { status: 400 }
    );
  }

  if (err instanceof InvalidCursorError) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  if (err instanceof PolicyNotFoundError) {
    return NextResponse.json({ error: err.message }, { status: 404 });
  }

  if (err instanceof MissingTenantContextError) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }

  if (err instanceof GraphThrottleError) {
    return NextResponse.json(
      { error: err.message, code: err.graphCode },
      {
        status: 429,
        headers: { "Retry-After": String(err.retryAfterSeconds) },
      }
    );
  }

  if (err instanceof GraphApiError) {
    if (err.statusCode === 401 || err.statusCode === 403) {
      return NextResponse.json(
        { error: err.message, code: err.graphCode },
        { status: err.statusCode }
      );
    }

    return NextResponse.json(
      { error: "Microsoft Graph request failed", code: err.graphCode },
      { status: 502 }
    );
  }

  return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}