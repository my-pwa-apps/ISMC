/**
 * Auth.js (NextAuth v5) configuration for Microsoft Entra ID.
 *
 * SECURITY DESIGN:
 *  - Access tokens are stored server-side in encrypted JWT cookies only.
 *  - The browser never receives a raw Graph access token.
 *  - Token refresh is handled automatically inside the session callback.
 *  - Short-lived sessions are enforced (maxAge = 8h, matching a work day).
 */

import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import logger from "@/lib/logger";
import type { NextAuthConfig } from "next-auth";

// Microsoft Graph delegated permissions we request.
// Kept minimal for read-only mode. Add write scopes only when needed.
const GRAPH_SCOPES = [
  "openid",
  "profile",
  "email",
  "offline_access",
  "DeviceManagementConfiguration.Read.All",
  "DeviceManagementManagedDevices.Read.All",
  "DeviceManagementApps.Read.All",
  "Group.Read.All",
  "Policy.Read.All",
  "RoleManagement.Read.Directory",
].join(" ");

export const authConfig: NextAuthConfig = {
  // Required for CF Pages / reverse-proxy deployments — tells NextAuth v5 to
  // trust the Host header coming from Cloudflare's edge instead of failing
  // the CSRF / redirect-URI validation and silently looping back to sign-in.
  trustHost: true,

  // JWT strategy — no database adapter needed; tokens stored in encrypted cookies.
  // Use JWT so we can embed the access token for server-side Graph calls.
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },

  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_ENTRA_CLIENT_ID!,
      clientSecret: process.env.AUTH_ENTRA_CLIENT_SECRET!,
      issuer: `https://login.microsoftonline.com/${process.env.AUTH_ENTRA_TENANT_ID ?? "common"}/v2.0`,
      authorization: {
        params: {
          scope: GRAPH_SCOPES,
          // Always prompt for consent on first sign-in so new scopes are
          // picked up when the app is updated.
          prompt: "select_account",
        },
      },
    }),
  ],

  callbacks: {
    async jwt({ token, account, profile }) {
      // Store Graph access token on first sign-in
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        token.tenantId = account.providerAccountId.split(".").pop() // heuristic; override below
          ?? process.env.AUTH_ENTRA_TENANT_ID;

        // Extract tenant ID from the ID token claims
        if (profile) {
          const p = profile as Record<string, unknown>;
          if (typeof p.tid === "string") token.tenantId = p.tid;
        }
      }

      // Refresh if the access token is about to expire (within 5 minutes)
      const expiresAt = (token.expiresAt as number) ?? 0;
      const isExpiring = Date.now() / 1000 > expiresAt - 300;

      if (isExpiring && token.refreshToken) {
        try {
          token = await refreshAccessToken(token);
        } catch (err) {
          logger.error({ err }, "Failed to refresh Entra access token");
          token.error = "RefreshAccessTokenError";
        }
      }

      return token;
    },

    async session({ session, token }) {
      // Expose safe, non-sensitive data to session
      session.accessToken = token.accessToken as string;
      session.tenantId = token.tenantId as string;
      session.error = token.error as string | undefined;
      return session;
    },
  },

  events: {
    async signIn({ user }) {
      logger.info({ userId: user.id }, "User signed in");
    },
    async signOut(params) {
      const token = "token" in params ? params.token : null;
      logger.info({ userId: token?.sub }, "User signed out");
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },
};

// Augment Auth.js types
// The empty import anchors @auth/core in the TS compilation graph so the
// declare module augmentation below can resolve it.
import type {} from "@auth/core/jwt";
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    tenantId?: string;
    error?: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    tenantId?: string;
    error?: string;
  }
}

// ============================================================
// Token refresh helper
// ============================================================

async function refreshAccessToken(token: Record<string, unknown>): Promise<Record<string, unknown>> {
  const tenantId = (token.tenantId as string) ?? process.env.AUTH_ENTRA_TENANT_ID ?? "common";
  const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const params = new URLSearchParams({
    client_id: process.env.AUTH_ENTRA_CLIENT_ID!,
    client_secret: process.env.AUTH_ENTRA_CLIENT_SECRET!,
    grant_type: "refresh_token",
    refresh_token: token.refreshToken as string,
    scope: GRAPH_SCOPES,
  });

  const res = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const refreshed = await res.json() as Record<string, unknown>;

  if (!res.ok) {
    throw new Error(`Token refresh failed: ${JSON.stringify(refreshed)}`);
  }

  return {
    ...token,
    accessToken: refreshed.access_token,
    refreshToken: refreshed.refresh_token ?? token.refreshToken,
    expiresAt: Math.floor(Date.now() / 1000) + Number(refreshed.expires_in ?? 3600),
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
