"use client";

import { Suspense, useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Shield, FlaskConical } from "lucide-react";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const error = searchParams.get("error");
  const [isMockMode, setIsMockMode] = useState(false);

  useEffect(() => {
    setIsMockMode(process.env.NEXT_PUBLIC_ENABLE_MOCK === "true");
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-card p-8">
      <h2 className="text-lg font-semibold mb-1">Sign in</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Use your Microsoft work or school account
      </p>

      {error && (
        <div className="mb-4 p-3 rounded bg-red-50 text-red-700 text-sm">
          {error === "AccessDenied"
            ? "Access denied. Check that your account has the required Intune admin permissions."
            : "Authentication error. Please try again."}
        </div>
      )}

      {/* Demo mode shortcut — only shown when NEXT_PUBLIC_ENABLE_MOCK=true */}
      {isMockMode && (
        <form action="/api/auth/demo" method="POST" className="mb-4">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded transition-colors"
          >
            <FlaskConical className="w-5 h-5" />
            Enter Demo Mode (Mock Data)
          </button>
        </form>
      )}

      <button
        onClick={() => signIn("microsoft-entra-id", { callbackUrl })}
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded transition-colors"
      >
        <MicrosoftIcon className="w-5 h-5" />
        Sign in with Microsoft
      </button>

      {isMockMode && (
        <p className="mt-4 text-xs text-amber-700 bg-amber-50 rounded p-2 text-center">
          Running in mock mode — no real Intune tenant required.
        </p>
      )}

      <p className="mt-4 text-xs text-muted-foreground text-center">
        This application requires Microsoft Graph permissions.
        <br />
        Your administrator may need to grant consent on first sign-in.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-overlay">
      <div className="w-full max-w-sm">
        {/* Logo / branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-500 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">ISMC</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Intune Settings Management Console
          </p>
        </div>

        {/* Sign-in card */}
        <Suspense fallback={<div className="bg-white rounded-lg shadow-card p-8 animate-pulse h-48" />}>
          <LoginForm />
        </Suspense>

        {/* Environment indicator */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          {process.env.NEXT_PUBLIC_APP_NAME} v{process.env.NEXT_PUBLIC_APP_VERSION}
        </p>
      </div>
    </div>
  );
}

function MicrosoftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21" fill="none">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}
