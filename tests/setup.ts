import "@testing-library/jest-dom";
import { vi } from "vitest";

// Suppress Next.js router warnings in tests
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next-auth in tests
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { name: "Test User" } }, status: "authenticated" }),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Selectively suppress known React warnings — keep real errors visible
const originalError = console.error;
vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
  const msg = typeof args[0] === "string" ? args[0] : "";
  // Suppress known noisy React warnings in tests
  if (
    msg.includes("act(") ||
    msg.includes("ReactDOMTestUtils.act") ||
    msg.includes("Warning: An update to")
  ) {
    return;
  }
  originalError.call(console, ...args);
});
