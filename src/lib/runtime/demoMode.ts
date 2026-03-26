export function isServerDemoModeEnabled(): boolean {
  return process.env.ISMC_SERVER_DEMO_MODE === "true" && process.env.NODE_ENV !== "production";
}

export function isDemoModeCookieEnabled(cookieValue?: string): boolean {
  return cookieValue === "1";
}