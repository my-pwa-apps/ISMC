import { describe, expect, it } from "vitest";

import { SettingDataType, SettingSource } from "@/domain/enums";
import { mapRawPolicySettings } from "@/repositories/shared/rawPolicySettings";

describe("mapRawPolicySettings", () => {
  it("maps non-metadata properties into normalized settings", () => {
    const settings = mapRawPolicySettings(
      {
        id: "policy-1",
        displayName: "Contoso iOS Compliance",
        passwordRequired: true,
        osMinimumVersion: "16.0",
        restrictedApps: ["camera", "facetime"],
        deviceThreatProtectionEnabled: false,
      },
      {
        skipKeys: ["id", "displayName"],
        source: SettingSource.CSP,
      }
    );

    expect(settings).toHaveLength(4);
    expect(settings).toEqual([
      expect.objectContaining({
        id: "passwordRequired",
        displayName: "Password Required",
        value: true,
        dataType: SettingDataType.Boolean,
        source: SettingSource.CSP,
      }),
      expect.objectContaining({
        id: "osMinimumVersion",
        displayName: "Os Minimum Version",
        value: "16.0",
        dataType: SettingDataType.String,
      }),
      expect.objectContaining({
        id: "restrictedApps",
        value: ["camera", "facetime"],
        dataType: SettingDataType.StringList,
      }),
      expect.objectContaining({
        id: "deviceThreatProtectionEnabled",
        value: false,
        dataType: SettingDataType.Boolean,
      }),
    ]);
  });

  it("serializes complex objects as json settings", () => {
    const [setting] = mapRawPolicySettings(
      {
        nestedRule: {
          operator: "and",
          values: [1, 2, 3],
        },
      },
      { source: SettingSource.Unknown }
    );

    expect(setting).toEqual(
      expect.objectContaining({
        id: "nestedRule",
        dataType: SettingDataType.Json,
        value: JSON.stringify({ operator: "and", values: [1, 2, 3] }),
      })
    );
  });
});