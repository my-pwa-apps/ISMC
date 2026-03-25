import type { NextConfig } from "next";

// Enable Cloudflare bindings in local development when using `next-on-pages`
// No-op in production builds and when not using `npx @cloudflare/next-on-pages`.
if (process.env.NODE_ENV === "development") {
  const { setupDevPlatform } = await import("@cloudflare/next-on-pages/next-dev");
  await setupDevPlatform();
}

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Experimental features
  experimental: {
    // Required for server actions
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },

  // Headers for security
  async headers() {
    return [
      // Prevent browsers from caching JS chunks in dev — avoids stale bundle hydration errors
      ...(process.env.NODE_ENV === "development"
        ? [
            {
              source: "/_next/static/:path*",
              headers: [{ key: "Cache-Control", value: "no-store" }],
            },
          ]
        : []),
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-eval in dev
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self'",
              "connect-src 'self' https://graph.microsoft.com https://login.microsoftonline.com",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
