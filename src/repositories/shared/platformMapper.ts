/**
 * Canonical platform-string → Platform enum mapper.
 *
 * All repositories should use this single mapping instead of maintaining
 * their own lookup tables.
 */

import { Platform } from "@/domain/enums";

const PLATFORM_MAP: Record<string, Platform> = {
  // Windows variants
  windows10andlater: Platform.Windows,
  windows10: Platform.Windows,
  windowsphone: Platform.WindowsPhone,
  windows: Platform.Windows,
  // macOS
  macosgeneral: Platform.macOS,
  macos: Platform.macOS,
  mac: Platform.macOS,
  // iOS / iPadOS (iPadOS before iOS to avoid false match)
  ipados: Platform.iPadOS,
  ipad: Platform.iPadOS,
  ioseas: Platform.iOS,
  ios: Platform.iOS,
  // Android Enterprise (more specific before generic android)
  androidenterprise: Platform.AndroidEnterprise,
  androidworkprofile: Platform.AndroidEnterprise,
  androidforwork: Platform.AndroidEnterprise,
  androiddeviceowner: Platform.AndroidEnterprise,
  // Android (generic — must come after enterprise variants)
  android: Platform.Android,
  // Linux
  linux: Platform.Linux,
  // ChromeOS
  chromeos: Platform.ChromeOS,
};

// Pre-sort entries by key length descending for substring matching
// so that more specific keys (e.g., "androidworkprofile") match
// before less specific ones (e.g., "android").
const PLATFORM_ENTRIES = Object.entries(PLATFORM_MAP).sort(
  ([a], [b]) => b.length - a.length
);

/**
 * Map a raw platform string (from Graph API) to the canonical Platform enum.
 *
 * The input can be:
 *  - A `platforms` field value like "windows10", "macOS"
 *  - An `@odata.type` string fragment like "#microsoft.graph.windows10EndpointProtectionConfiguration"
 *  - An assignment filter platform key like "androidForWork"
 *
 * Matching is case-insensitive and uses substring matching for @odata.type strings.
 */
export function mapPlatform(raw: string | undefined | null): Platform {
  if (!raw) return Platform.Unknown;

  // First try exact lowercase match (catches platform field values)
  const exactMatch = PLATFORM_MAP[raw.toLowerCase()];
  if (exactMatch) return exactMatch;

  // Then try substring match (catches @odata.type strings)
  // Use longest-key-first ordering to prevent partial matches
  const lower = raw.toLowerCase();
  for (const [key, platform] of PLATFORM_ENTRIES) {
    if (lower.includes(key)) return platform;
  }

  return Platform.Unknown;
}
