"use client";

/**
 * Sidebar navigation — GPMC-inspired tree navigation for Intune policy management.
 *
 * Structure mirrors the on-prem GPMC hierarchy but mapped to Intune concepts.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Cog,
  FileSearch,
  GitCompare,
  History,
  Home,
  Import,
  MonitorSmartphone,
  Shield,
  TreePine,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Platform, PolicyType } from "@/domain/enums";

// ============================================================
// Nav tree definition
// ============================================================

interface NavLeaf {
  kind: "leaf";
  label: string;
  href: string;
  icon?: React.ElementType;
  /** Mark as not yet built — renders as disabled with "Soon" badge */
  soon?: boolean;
}

interface NavGroup {
  kind: "group";
  label: string;
  icon?: React.ElementType;
  children: NavItem[];
  defaultOpen?: boolean;
}

type NavItem = NavLeaf | NavGroup;

const NAV_TREE: NavItem[] = [
  {
    kind: "leaf",
    label: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    kind: "group",
    label: "Policy Explorer",
    icon: TreePine,
    defaultOpen: true,
    children: [
      { kind: "leaf", label: "All Policies", href: "/explorer" },
      {
        kind: "group",
        label: "Windows",
        children: [
          { kind: "leaf", label: "Settings Catalog", href: `/explorer/windows/settings-catalog` },
          { kind: "leaf", label: "Admin Templates", href: `/explorer/windows/admin-templates` },
          { kind: "leaf", label: "Device Configuration", href: `/explorer/windows/device-config` },
          { kind: "leaf", label: "Endpoint Security", href: `/explorer/windows/endpoint-security` },
          { kind: "leaf", label: "Security Baselines", href: `/explorer/windows/baselines` },
          { kind: "leaf", label: "Compliance", href: `/explorer/windows/compliance` },
        ],
      },
      {
        kind: "group",
        label: "macOS",
        children: [
          { kind: "leaf", label: "Settings Catalog", href: `/explorer/macos/settings-catalog` },
          { kind: "leaf", label: "Device Configuration", href: `/explorer/macos/device-config` },
          { kind: "leaf", label: "Compliance", href: `/explorer/macos/compliance` },
        ],
      },
      {
        kind: "group",
        label: "iOS / iPadOS",
        children: [
          { kind: "leaf", label: "Settings Catalog", href: `/explorer/ios/settings-catalog` },
          { kind: "leaf", label: "Device Configuration", href: `/explorer/ios/device-config` },
          { kind: "leaf", label: "Compliance", href: `/explorer/ios/compliance` },
        ],
      },
      {
        kind: "group",
        label: "Android",
        children: [
          { kind: "leaf", label: "Settings Catalog", href: `/explorer/android/settings-catalog` },
          { kind: "leaf", label: "Compliance", href: `/explorer/android/compliance` },
        ],
      },
      {
        kind: "group",
        label: "Scripts & Remediations",
        children: [
          { kind: "leaf", label: "PowerShell Scripts", href: `/explorer/scripts` },
          { kind: "leaf", label: "Remediations", href: `/explorer/remediations` },
        ],
      },
      {
        kind: "group",
        label: "Assignment Scopes",
        children: [
          { kind: "leaf", label: "By Group", href: `/explorer/by-group`, soon: true },
          { kind: "leaf", label: "By Scope Tag", href: `/explorer/by-scope-tag`, soon: true },
          { kind: "leaf", label: "Assignment Filters", href: `/explorer/filters`, soon: true },
        ],
      },
    ],
  },
  {
    kind: "leaf",
    label: "Search",
    href: "/search",
    icon: FileSearch,
  },
  {
    kind: "leaf",
    label: "Compare Policies",
    href: "/compare",
    icon: GitCompare,
  },
  {
    kind: "group",
    label: "Reports",
    icon: BarChart3,
    children: [
      { kind: "leaf", label: "Unassigned Policies", href: "/reports/unassigned-policies" },
      { kind: "leaf", label: "Duplicate Policies", href: "/reports/duplicate-policies" },
      { kind: "leaf", label: "Conflicting Settings", href: "/reports/conflicting-settings" },
      { kind: "leaf", label: "Missing Scope Tags", href: "/reports/missing-scope-tags" },
      { kind: "leaf", label: "Stale Policies", href: "/reports/stale-policies" },
      { kind: "leaf", label: "Overlapping Assignments", href: "/reports/overlapping-assignments" },
      { kind: "leaf", label: "Settings Usage", href: "/reports/settings-usage" },
    ],
  },
  {
    kind: "group",
    label: "GPO Migration",
    icon: Import,
    children: [
      { kind: "leaf", label: "Migration Workspace", href: "/migration" },
      { kind: "leaf", label: "Import GPO Analysis", href: "/migration/import", soon: true },
      { kind: "leaf", label: "Readiness Dashboard", href: "/migration/readiness", soon: true },
      { kind: "leaf", label: "Setting Mappings", href: "/migration/mappings", soon: true },
    ],
  },
  {
    kind: "leaf",
    label: "Audit & History",
    href: "/audit",
    icon: History,
  },
  {
    kind: "group",
    label: "Settings",
    icon: Cog,
    children: [
      { kind: "leaf", label: "Tenant Diagnostics", href: "/diagnostics" },
      { kind: "leaf", label: "Permissions", href: "/settings/permissions", soon: true },
    ],
  },
];

// ============================================================
// Component
// ============================================================

export function Sidebar() {
  return (
    <aside className="app-shell-sidebar scrollbar-thin flex flex-col">
      {/* Branding */}
      <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-sidebar-border">
        <Shield className="w-5 h-5 text-brand-400 flex-shrink-0" />
        <div className="min-w-0">
          <div className="text-sm font-semibold text-sidebar-text truncate">ISMC</div>
          <div className="text-2xs text-sidebar-muted truncate">Intune Management Console</div>
        </div>
      </div>

      {/* Navigation tree */}
      <nav className="flex-1 py-2 px-1.5 overflow-y-auto scrollbar-thin">
        {NAV_TREE.map((item, i) => (
          <NavItemComponent key={i} item={item} depth={0} />
        ))}
      </nav>

      {/* Mock mode indicator */}
      {process.env.NEXT_PUBLIC_ENABLE_MOCK === "true" && (
        <div className="px-3 py-2 border-t border-sidebar-border">
          <span className="text-2xs text-yellow-400 font-medium">
            ⚠ MOCK DATA MODE
          </span>
        </div>
      )}
    </aside>
  );
}

// ============================================================
// Nav item component (recursive)
// ============================================================

function NavItemComponent({ item, depth }: { item: NavItem; depth: number }) {
  const pathname = usePathname();

  if (item.kind === "leaf") {
    const Icon = item.icon;
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

    if (item.soon) {
      return (
        <span
          className={cn(
            "sidebar-nav-item opacity-50 cursor-not-allowed select-none",
            depth > 0 && "text-xs"
          )}
          style={{ paddingLeft: `${(depth * 12) + 12}px` }}
          title="Coming soon"
        >
          {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0 opacity-80" />}
          <span className="flex-1 truncate">{item.label}</span>
          <span className="ml-auto text-2xs bg-sidebar-border text-sidebar-muted px-1 rounded">Soon</span>
        </span>
      );
    }

    return (
      <Link
        href={item.href}
        className={cn(
          "sidebar-nav-item",
          isActive && "active",
          depth > 0 && "text-xs"
        )}
        style={{ paddingLeft: `${(depth * 12) + 12}px` }}
      >
        {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0 opacity-80" />}
        <span className="truncate">{item.label}</span>
      </Link>
    );
  }

  // Group item
  return <NavGroupComponent group={item} depth={depth} />;
}

function NavGroupComponent({ group, depth }: { group: NavGroup; depth: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(() => {
    if (group.defaultOpen) return true;
    // Open if any child is active
    return isGroupActive(group, pathname);
  });

  const Icon = group.icon;
  const Chevron = open ? ChevronDown : ChevronRight;

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "sidebar-nav-item w-full text-left",
          depth === 0 && "font-medium",
          depth > 0 && "text-xs"
        )}
        style={{ paddingLeft: `${(depth * 12) + 12}px` }}
      >
        {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0 opacity-80" />}
        <span className="flex-1 truncate">{group.label}</span>
        <Chevron className="w-3 h-3 flex-shrink-0 opacity-60" />
      </button>

      {open && (
        <div>
          {group.children.map((child, i) => (
            <NavItemComponent key={i} item={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function isGroupActive(group: NavGroup, pathname: string): boolean {
  for (const child of group.children) {
    if (child.kind === "leaf" && pathname.startsWith(child.href)) return true;
    if (child.kind === "group" && isGroupActive(child, pathname)) return true;
  }
  return false;
}
