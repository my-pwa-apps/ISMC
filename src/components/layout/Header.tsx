"use client";

import { Bell, Search, User, LogOut, ChevronDown } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function Header({ title, breadcrumbs }: HeaderProps) {
  const { data: session } = useSession();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const environment = process.env.NEXT_PUBLIC_ENVIRONMENT;

  return (
    <>
      {/* Environment banner for non-production */}
      {environment && environment !== "production" && (
        <div
          className={cn(
            "w-full text-center text-xs font-semibold py-0.5",
            environment === "development" && "env-banner-dev",
            environment === "staging" && "env-banner-staging"
          )}
        >
          {environment === "development" && "⚠ DEVELOPMENT ENVIRONMENT"}
          {environment === "staging" && "⚠ STAGING ENVIRONMENT — DO NOT USE FOR PRODUCTION"}
        </div>
      )}

      <header className="app-shell-header">
        {/* Breadcrumb / title */}
        <div className="flex-1 min-w-0">
          {breadcrumbs && breadcrumbs.length > 0 ? (
            <nav aria-label="Breadcrumb" className="text-sm">
              <ol className="flex items-center gap-1 text-muted-foreground">
                {breadcrumbs.map((crumb, i) => (
                  <li key={i} className="flex items-center gap-1">
                    {i > 0 && <span>/</span>}
                    {crumb.href && i < breadcrumbs.length - 1 ? (
                      <Link href={crumb.href} className="hover:text-foreground transition-colors">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className={i === breadcrumbs.length - 1 ? "text-foreground font-medium" : ""}>
                        {crumb.label}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          ) : (
            title && <h1 className="text-base font-semibold truncate">{title}</h1>
          )}
        </div>

        {/* Quick search shortcut */}
        <Link
          href="/search"
          className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground border border-border rounded hover:bg-muted transition-colors mr-2"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search policies…</span>
          <kbd className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded border">
            Ctrl K
          </kbd>
        </Link>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted transition-colors"
            aria-expanded={userMenuOpen}
            aria-haspopup="true"
          >
            <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center">
              <User className="w-4 h-4 text-brand-600" />
            </div>
            <div className="hidden md:block text-left min-w-0">
              <div className="text-sm font-medium truncate max-w-[150px]">
                {session?.user?.name ?? "User"}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>

          {/* Dropdown */}
          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-md shadow-panel border border-border z-20">
              <div className="px-3 py-2.5 border-b border-border">
                <div className="text-sm font-medium truncate">{session?.user?.name}</div>
                <div className="text-xs text-muted-foreground truncate">{session?.user?.email}</div>
                {session?.tenantId && (
                  <div className="text-2xs text-muted-foreground mt-0.5 font-mono truncate">
                    Tenant: {session.tenantId}
                  </div>
                )}
              </div>
              <div className="py-1">
                <Link
                  href="/settings/diagnostics"
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                  onClick={() => setUserMenuOpen(false)}
                >
                  Tenant Diagnostics
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-status-error hover:bg-muted transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
