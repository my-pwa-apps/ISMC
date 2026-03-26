import { SettingDataType, SettingSource } from "@/domain/enums";
import type { PolicySetting } from "@/domain/models";

interface RawPolicySettingsOptions {
  skipKeys?: Iterable<string>;
  source?: SettingSource;
}

export function mapRawPolicySettings(
  raw: Record<string, unknown>,
  options: RawPolicySettingsOptions = {}
): PolicySetting[] {
  const skipKeys = new Set(options.skipKeys ?? []);

  return Object.entries(raw)
    .filter(([key, value]) => !skipKeys.has(key) && value !== null && value !== undefined)
    .map(([key, value]) => toPolicySetting(key, value, options.source ?? SettingSource.Unknown));
}

function toPolicySetting(
  key: string,
  value: unknown,
  source: SettingSource
): PolicySetting {
  const normalizedValue = normalizeValue(value);

  return {
    id: key,
    displayName: prettifyPropertyName(key),
    value: normalizedValue.value,
    rawValue: value,
    dataType: normalizedValue.dataType,
    source,
    cspPath: key,
    path: buildPath(key),
  };
}

function normalizeValue(value: unknown): {
  value: PolicySetting["value"];
  dataType: SettingDataType;
} {
  if (typeof value === "boolean") {
    return { value, dataType: SettingDataType.Boolean };
  }

  if (typeof value === "number") {
    return { value, dataType: SettingDataType.Integer };
  }

  if (typeof value === "string") {
    return { value, dataType: SettingDataType.String };
  }

  if (Array.isArray(value)) {
    if (value.every((item) => typeof item === "string" || typeof item === "number" || typeof item === "boolean")) {
      return {
        value: value.map((item) => String(item)),
        dataType: SettingDataType.StringList,
      };
    }

    return {
      value: JSON.stringify(value),
      dataType: SettingDataType.Json,
    };
  }

  return {
    value: JSON.stringify(value),
    dataType: SettingDataType.Json,
  };
}

function prettifyPropertyName(key: string): string {
  return key
    .replace(/^@odata\./i, "OData ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/[._-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildPath(key: string): string | undefined {
  const segments = key
    .replace(/^@odata\./i, "odata.")
    .split(/[._-]+/)
    .filter(Boolean);

  if (segments.length <= 1) {
    return undefined;
  }

  return segments
    .slice(0, -1)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" > ");
}