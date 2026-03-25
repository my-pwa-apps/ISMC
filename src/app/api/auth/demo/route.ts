/**
 * POST /api/auth/demo
 *
 * Sets a signed demo-mode cookie so the middleware grants access to all
 * app routes without a real Microsoft Entra ID sign-in.
 *
 * Only active when NEXT_PUBLIC_ENABLE_MOCK=true (local dev).
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  if (process.env.NEXT_PUBLIC_ENABLE_MOCK !== "true") {
    return NextResponse.json({ error: "Demo mode is not enabled" }, { status: 403 });
  }

  const cookieStore = await cookies();
  cookieStore.set("ismc_demo_mode", "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    // Session cookie (no maxAge) — cleared when browser closes
  });

  return NextResponse.redirect(
    new URL("/dashboard", process.env.NEXTAUTH_URL ?? "http://localhost:3000"),
    { status: 303 },
  );
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("ismc_demo_mode");
  return NextResponse.redirect(
    new URL("/login", process.env.NEXTAUTH_URL ?? "http://localhost:3000"),
    { status: 303 },
  );
}
