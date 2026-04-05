/**
 * GET /api/health
 *
 * Health check endpoint for load balancer probes and uptime monitoring.
 * Returns 200 if the application is running and can serve requests.
 */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? "unknown",
  });
}
