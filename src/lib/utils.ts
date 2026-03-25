/**
 * Shared utility functions.
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, parseISO, format } from "date-fns";
import { Platform, PolicyType } from "@/domain/enums";

// ============================================================
// Tailwind class merging
// ============================================================

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ============================================================
// Date formatting
// ============================================================

export function formatRelativeDate(isoString: string | undefined): string {
  if (!isoString) return "—";
  try {
    return formatDistanceToNow(parseISO(isoString), { addSuffix: true });
  } catch {
    return isoString;
  }
}

export function formatAbsoluteDate(isoString: string | undefined): string {
  if (!isoString) return "—";
  try {
    return format(parseISO(isoString), "MMM d, yyyy HH:mm");
  } catch {
    return isoString;
  }
}

export function isStale(isoString: string, thresholdDays = 90): boolean {
  try {
    const date = parseISO(isoString);
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - thresholdDays);
    return date < threshold;
  } catch {
    return false;
  }
}

// ============================================================
// Policy type display helpers
// ============================================================

const POLICY_TYPE_LABELS: Record<PolicyType, string> = {
  [PolicyType.SettingsCatalog]: "Settings Catalog",
  [PolicyType.AdministrativeTemplate]: "Administrative Template",
  [PolicyType.DeviceConfiguration]: "Device Configuration",
  [PolicyType.EndpointSecurity]: "Endpoint Security",
  [PolicyType.SecurityBaseline]: "Security Baseline",
  [PolicyType.CompliancePolicy]: "Compliance Policy",
  [PolicyType.Script]: "Script",
  [PolicyType.Remediation]: "Remediation",
  [PolicyType.PolicySet]: "Policy Set",
  [PolicyType.AppProtection]: "App Protection",
  [PolicyType.AppConfiguration]: "App Configuration",
  [PolicyType.UpdatePolicy]: "Update Policy",
  [PolicyType.FeatureUpdate]: "Feature Update",
  [PolicyType.QualityUpdate]: "Quality Update",
  [PolicyType.DriverUpdate]: "Driver Update",
  [PolicyType.AutopilotProfile]: "Autopilot Profile",
  [PolicyType.EnrollmentRestriction]: "Enrollment Restriction",
  [PolicyType.Unknown]: "Unknown",
};

export function getPolicyTypeLabel(type: PolicyType): string {
  return POLICY_TYPE_LABELS[type] ?? type;
}

const PLATFORM_LABELS: Record<Platform, string> = {
  [Platform.Windows]: "Windows",
  [Platform.WindowsPhone]: "Windows Phone",
  [Platform.macOS]: "macOS",
  [Platform.iOS]: "iOS",
  [Platform.iPadOS]: "iPadOS",
  [Platform.Android]: "Android",
  [Platform.AndroidEnterprise]: "Android Enterprise",
  [Platform.Linux]: "Linux",
  [Platform.ChromeOS]: "Chrome OS",
  [Platform.CrossPlatform]: "Cross-Platform",
  [Platform.Unknown]: "Unknown",
};

export function getPlatformLabel(platform: Platform): string {
  return PLATFORM_LABELS[platform] ?? platform;
}

// ============================================================
// Truncation / text
// ============================================================

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + "…";
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? `${count} ${singular}` : `${count} ${plural ?? singular + "s"}`;
}

// ============================================================
// JSON utilities
// ============================================================

export function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function prettyJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

// ============================================================
// Array utilities
// ============================================================

export function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

export function uniqueBy<T, K>(arr: T[], key: (item: T) => K): T[] {
  const seen = new Set<K>();
  return arr.filter((item) => {
    const k = key(item);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function groupBy<T, K extends string>(arr: T[], key: (item: T) => K): Record<K, T[]> {
  return arr.reduce(
    (acc, item) => {
      const k = key(item);
      if (!acc[k]) acc[k] = [];
      acc[k].push(item);
      return acc;
    },
    {} as Record<K, T[]>
  );
}

export function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// ============================================================
// URL / routing
// ============================================================

export function getPolicyUrl(policyId: string): string {
  return `/policies/${policyId}`;
}

export function getExplorerUrl(nodes: string[]): string {
  return `/explorer/${nodes.join("/")}`;
}
