import { describe, it, expect } from "vitest";
import { mapPlatform } from "@/repositories/shared/platformMapper";
import { Platform } from "@/domain/enums";

describe("platformMapper", () => {
  it("maps exact platform field values", () => {
    expect(mapPlatform("windows10")).toBe(Platform.Windows);
    expect(mapPlatform("macOS")).toBe(Platform.macOS);
    expect(mapPlatform("iOS")).toBe(Platform.iOS);
    expect(mapPlatform("linux")).toBe(Platform.Linux);
  });

  it("is case-insensitive", () => {
    expect(mapPlatform("WINDOWS10")).toBe(Platform.Windows);
    expect(mapPlatform("MacOS")).toBe(Platform.macOS);
    expect(mapPlatform("ios")).toBe(Platform.iOS);
  });

  it("handles @odata.type strings via substring matching", () => {
    expect(mapPlatform("#microsoft.graph.windows10EndpointProtectionConfiguration")).toBe(Platform.Windows);
    expect(mapPlatform("#microsoft.graph.iosGeneralDeviceConfiguration")).toBe(Platform.iOS);
    expect(mapPlatform("#microsoft.graph.macOSGeneralDeviceConfiguration")).toBe(Platform.macOS);
    expect(mapPlatform("#microsoft.graph.androidWorkProfileCompliancePolicy")).toBe(Platform.AndroidEnterprise);
  });

  it("returns Unknown for empty/null/undefined", () => {
    expect(mapPlatform(undefined)).toBe(Platform.Unknown);
    expect(mapPlatform(null)).toBe(Platform.Unknown);
    expect(mapPlatform("")).toBe(Platform.Unknown);
  });

  it("returns Unknown for unrecognized strings", () => {
    expect(mapPlatform("someUnknownPlatform")).toBe(Platform.Unknown);
  });

  it("maps Android Enterprise variants", () => {
    expect(mapPlatform("androidForWork")).toBe(Platform.AndroidEnterprise);
    expect(mapPlatform("androidWorkProfile")).toBe(Platform.AndroidEnterprise);
    expect(mapPlatform("androidDeviceOwner")).toBe(Platform.AndroidEnterprise);
  });

  it("maps WindowsPhone separately from Windows", () => {
    expect(mapPlatform("windowsPhone")).toBe(Platform.WindowsPhone);
  });
});
