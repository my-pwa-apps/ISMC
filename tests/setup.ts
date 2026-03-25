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

// Silence console.error for React act() warnings
vi.spyOn(console, "error").mockImplementation(() => {});
