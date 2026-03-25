/**
 * Comprehensive mock data for local development and testing.
 *
 * These fixtures represent realistic Intune policy objects covering
 * multiple policy types, platforms, and assignment patterns.
 *
 * Run the app with NEXT_PUBLIC_ENABLE_MOCK=true to use this data
 * instead of calling the real Microsoft Graph API.
 */

import {
  AssignmentIntent,
  AssignmentTargetType,
  FilterMode,
  OverlapSeverity,
  Platform,
  PolicyStatus,
  PolicyType,
  SettingDataType,
  SettingSource,
  TargetingModel,
} from "@/domain/enums";
import type {
  AssignmentFilter,
  PolicyAssignment,
  PolicyObject,
  PolicySetting,
  ScopeTag,
} from "@/domain/models";

// ============================================================
// Scope Tags
// ============================================================

export const MOCK_SCOPE_TAGS: ScopeTag[] = [
  { id: "1", displayName: "IT-Corporate", description: "Corporate-owned device policies" },
  { id: "2", displayName: "IT-BYOD", description: "Personal device policies" },
  { id: "3", displayName: "IT-Kiosk", description: "Kiosk and shared device policies" },
  { id: "4", displayName: "IT-SecOps", description: "Security operations team policies" },
  { id: "5", displayName: "IT-Finance", description: "Finance department policies" },
];

// ============================================================
// Assignment Filters
// ============================================================

export const MOCK_FILTERS: AssignmentFilter[] = [
  {
    id: "filter-001",
    displayName: "Windows Corporate Devices",
    description: "Filter targeting Windows devices that are corporate-owned",
    rule: '(device.deviceOwnership -eq "Company") and (device.operatingSystem -eq "Windows")',
    platform: Platform.Windows,
    mode: FilterMode.Include,
  },
  {
    id: "filter-002",
    displayName: "iOS Personal Devices",
    description: "Filter for personal iOS devices",
    rule: '(device.deviceOwnership -eq "Personal") and (device.operatingSystem -eq "iOS")',
    platform: Platform.iOS,
    mode: FilterMode.Include,
  },
  {
    id: "filter-003",
    displayName: "Exclude Test Devices",
    description: "Exclude devices in the test group",
    rule: '(device.deviceCategory -eq "TestDevices")',
    platform: Platform.CrossPlatform,
    mode: FilterMode.Exclude,
  },
];

// ============================================================
// Common assignment patterns
// ============================================================

const ASSIGNMENT_ALL_DEVICES: PolicyAssignment = {
  id: "assign-alldevices",
  intent: AssignmentIntent.Required,
  target: { type: AssignmentTargetType.AllDevices },
};

const ASSIGNMENT_ALL_USERS: PolicyAssignment = {
  id: "assign-allusers",
  intent: AssignmentIntent.Required,
  target: { type: AssignmentTargetType.AllUsers },
};

const makeGroupAssignment = (
  id: string,
  groupId: string,
  groupName: string,
  exclude = false,
  filter?: AssignmentFilter
): PolicyAssignment => ({
  id,
  intent: exclude ? undefined : AssignmentIntent.Required,
  target: {
    type: exclude ? AssignmentTargetType.ExcludeGroup : AssignmentTargetType.Group,
    groupId,
    groupDisplayName: groupName,
    filter,
  },
});

// ============================================================
// Settings Catalog mock settings
// ============================================================

const BITLOCKER_SETTINGS: PolicySetting[] = [
  {
    id: "com.microsoft.intune.mam.policy.bitlocker.enableBitLockerForOsAndFixedDrives",
    displayName: "Enable BitLocker for OS and fixed drives",
    path: "Device > Windows > BitLocker Drive Encryption",
    value: true,
    dataType: SettingDataType.Boolean,
    source: SettingSource.SettingsCatalog,
    cspPath: "./Device/Vendor/MSFT/BitLocker/RequireDeviceEncryption",
  },
  {
    id: "com.microsoft.intune.mam.policy.bitlocker.fixedDriveRecoveryOptions",
    displayName: "Fixed drive recovery options",
    path: "Device > Windows > BitLocker Drive Encryption > Fixed Data Drives",
    value: "RecoveryPasswordAndKey",
    dataType: SettingDataType.ChoiceGroup,
    source: SettingSource.SettingsCatalog,
    children: [
      {
        id: "...allowDataRecoveryAgent",
        displayName: "Allow Data Recovery Agent",
        path: "...",
        value: true,
        dataType: SettingDataType.Boolean,
        source: SettingSource.SettingsCatalog,
      },
      {
        id: "...recoveryPasswordUsage",
        displayName: "Recovery Password Usage",
        path: "...",
        value: "required",
        dataType: SettingDataType.ChoiceGroup,
        source: SettingSource.SettingsCatalog,
      },
    ],
  },
  {
    id: "com.microsoft.intune.mam.policy.bitlocker.encryptionMethod",
    displayName: "Encryption method for OS drives",
    path: "Device > Windows > BitLocker Drive Encryption > Operating System Drives",
    value: "XtsAes256",
    dataType: SettingDataType.ChoiceGroup,
    source: SettingSource.SettingsCatalog,
  },
];

const WINDOWS_UPDATE_SETTINGS: PolicySetting[] = [
  {
    id: "device.vendormsft.policy.update.deferupgradeindays",
    displayName: "Defer Feature Updates (days)",
    path: "Device > Windows > Windows Update > Update Rings",
    value: 30,
    dataType: SettingDataType.Integer,
    source: SettingSource.SettingsCatalog,
    cspPath: "./Device/Vendor/MSFT/Policy/Config/Update/DeferFeatureUpdatesPeriodInDays",
  },
  {
    id: "device.vendormsft.policy.update.deferqualityupdates",
    displayName: "Defer Quality Updates (days)",
    path: "Device > Windows > Windows Update",
    value: 7,
    dataType: SettingDataType.Integer,
    source: SettingSource.SettingsCatalog,
  },
  {
    id: "device.vendormsft.policy.update.activeHoursStart",
    displayName: "Active Hours Start",
    path: "Device > Windows > Windows Update",
    value: 8,
    dataType: SettingDataType.Integer,
    source: SettingSource.SettingsCatalog,
  },
  {
    id: "device.vendormsft.policy.update.activeHoursEnd",
    displayName: "Active Hours End",
    path: "Device > Windows > Windows Update",
    value: 20,
    dataType: SettingDataType.Integer,
    source: SettingSource.SettingsCatalog,
  },
];

const DEFENDER_AV_SETTINGS: PolicySetting[] = [
  {
    id: "defender.allowrealTimemonitoring",
    displayName: "Allow Real-Time Monitoring",
    path: "Device > Windows > Microsoft Defender Antivirus",
    value: true,
    dataType: SettingDataType.Boolean,
    source: SettingSource.SettingsCatalog,
    cspPath: "./Device/Vendor/MSFT/Policy/Config/Defender/AllowRealtimeMonitoring",
  },
  {
    id: "defender.cloudDeliveredProtection",
    displayName: "Cloud-Delivered Protection Level",
    path: "Device > Windows > Microsoft Defender Antivirus > Cloud protection",
    value: "High",
    dataType: SettingDataType.ChoiceGroup,
    source: SettingSource.SettingsCatalog,
  },
  {
    id: "defender.submitSamplesConsent",
    displayName: "Submit Samples Consent",
    path: "Device > Windows > Microsoft Defender Antivirus",
    value: "SendSafeSamples",
    dataType: SettingDataType.ChoiceGroup,
    source: SettingSource.SettingsCatalog,
  },
  {
    id: "defender.signatureUpdateInterval",
    displayName: "Security Intelligence Update Interval (hours)",
    path: "Device > Windows > Microsoft Defender Antivirus > Security Intelligence Updates",
    value: 4,
    dataType: SettingDataType.Integer,
    source: SettingSource.SettingsCatalog,
  },
  {
    id: "defender.puaProtection",
    displayName: "PUA Protection",
    path: "Device > Windows > Microsoft Defender Antivirus",
    value: "AuditMode",
    dataType: SettingDataType.ChoiceGroup,
    source: SettingSource.SettingsCatalog,
  },
];

const MACOS_FILEVAULT_SETTINGS: PolicySetting[] = [
  {
    id: "macos.filevault.encrypt",
    displayName: "Enable FileVault",
    path: "Device > macOS > Full disk encryption",
    value: true,
    dataType: SettingDataType.Boolean,
    source: SettingSource.SettingsCatalog,
  },
  {
    id: "macos.filevault.escrowRecoveryKey",
    displayName: "Escrow Personal Recovery Key to Intune",
    path: "Device > macOS > Full disk encryption",
    value: true,
    dataType: SettingDataType.Boolean,
    source: SettingSource.SettingsCatalog,
  },
];

const IOS_PASSCODE_SETTINGS: PolicySetting[] = [
  {
    id: "ios.passcode.requirePasscode",
    displayName: "Require passcode",
    path: "Device > iOS/iPadOS > Passcode",
    value: true,
    dataType: SettingDataType.Boolean,
    source: SettingSource.SettingsCatalog,
  },
  {
    id: "ios.passcode.minimumLength",
    displayName: "Minimum passcode length",
    path: "Device > iOS/iPadOS > Passcode",
    value: 6,
    dataType: SettingDataType.Integer,
    source: SettingSource.SettingsCatalog,
  },
  {
    id: "ios.passcode.maxInactivityLock",
    displayName: "Maximum minutes of inactivity before the screen locks",
    path: "Device > iOS/iPadOS > Passcode",
    value: 5,
    dataType: SettingDataType.Integer,
    source: SettingSource.SettingsCatalog,
  },
];

// ============================================================
// Settings Catalog Policies
// ============================================================

export const MOCK_SETTINGS_CATALOG_POLICIES: PolicyObject[] = [
  {
    id: "sc-001",
    tenantId: "tenant-demo-001",
    displayName: "WIN - BitLocker - Corporate Devices",
    description:
      "BitLocker encryption policy enforced on all corporate Windows devices. Requires TPM 2.0.",
    policyType: PolicyType.SettingsCatalog,
    platform: Platform.Windows,
    odataType: "#microsoft.graph.deviceManagementConfigurationPolicy",
    status: PolicyStatus.Active,
    createdDateTime: "2024-01-15T10:00:00Z",
    lastModifiedDateTime: "2024-11-20T14:30:00Z",
    settingCount: 3,
    settings: BITLOCKER_SETTINGS,
    scopeTags: [MOCK_SCOPE_TAGS[0]],
    roleScopeTagIds: ["1"],
    assignments: [
      ASSIGNMENT_ALL_DEVICES,
      makeGroupAssignment("a-test-excl", "grp-test-000", "Test Devices", true),
    ],
    targetingModel: TargetingModel.Device,
    createdBy: { id: "user-admin-001", displayName: "James Chen", email: "jchen@contoso.com" },
  },
  {
    id: "sc-002",
    tenantId: "tenant-demo-001",
    displayName: "WIN - Defender AV - Corporate",
    description: "Microsoft Defender Antivirus configuration for corporate Windows endpoints.",
    policyType: PolicyType.SettingsCatalog,
    platform: Platform.Windows,
    odataType: "#microsoft.graph.deviceManagementConfigurationPolicy",
    status: PolicyStatus.Active,
    createdDateTime: "2024-02-01T09:00:00Z",
    lastModifiedDateTime: "2024-12-01T11:00:00Z",
    settingCount: 5,
    settings: DEFENDER_AV_SETTINGS,
    scopeTags: [MOCK_SCOPE_TAGS[0], MOCK_SCOPE_TAGS[3]],
    roleScopeTagIds: ["1", "4"],
    assignments: [ASSIGNMENT_ALL_DEVICES],
    targetingModel: TargetingModel.Device,
    createdBy: { id: "user-secops-001", displayName: "Sarah Okonkwo", email: "sokonkwo@contoso.com" },
  },
  {
    id: "sc-003",
    tenantId: "tenant-demo-001",
    displayName: "WIN - Windows Update Ring - Standard",
    description: "Standard Windows Update configuration for most corporate devices.",
    policyType: PolicyType.SettingsCatalog,
    platform: Platform.Windows,
    odataType: "#microsoft.graph.deviceManagementConfigurationPolicy",
    status: PolicyStatus.Active,
    createdDateTime: "2024-03-10T08:00:00Z",
    lastModifiedDateTime: "2025-01-10T09:00:00Z",
    settingCount: 4,
    settings: WINDOWS_UPDATE_SETTINGS,
    scopeTags: [MOCK_SCOPE_TAGS[0]],
    roleScopeTagIds: ["1"],
    assignments: [
      makeGroupAssignment(
        "a-sc003-001",
        "grp-corp-windows-001",
        "SG — Windows Corporate",
        false,
        MOCK_FILTERS[0]
      ),
    ],
    targetingModel: TargetingModel.Device,
    createdBy: { id: "user-admin-001", displayName: "James Chen", email: "jchen@contoso.com" },
    conflictingPolicyIds: ["sc-009"],
    overlapSeverity: OverlapSeverity.Medium,
  },
  {
    id: "sc-004",
    tenantId: "tenant-demo-001",
    displayName: "MAC - FileVault Encryption",
    description: "macOS FileVault encryption with escrow to Intune.",
    policyType: PolicyType.SettingsCatalog,
    platform: Platform.macOS,
    odataType: "#microsoft.graph.deviceManagementConfigurationPolicy",
    status: PolicyStatus.Active,
    createdDateTime: "2024-04-05T10:00:00Z",
    lastModifiedDateTime: "2024-10-15T16:00:00Z",
    settingCount: 2,
    settings: MACOS_FILEVAULT_SETTINGS,
    scopeTags: [MOCK_SCOPE_TAGS[0]],
    roleScopeTagIds: ["1"],
    assignments: [
      makeGroupAssignment("a-sc004-001", "grp-mac-corp-001", "SG — macOS Corporate"),
    ],
    targetingModel: TargetingModel.Device,
  },
  {
    id: "sc-005",
    tenantId: "tenant-demo-001",
    displayName: "iOS - Passcode Policy",
    description: "Passcode requirements for corporate iOS devices.",
    policyType: PolicyType.SettingsCatalog,
    platform: Platform.iOS,
    odataType: "#microsoft.graph.deviceManagementConfigurationPolicy",
    status: PolicyStatus.Active,
    createdDateTime: "2024-05-20T09:00:00Z",
    lastModifiedDateTime: "2024-09-30T10:00:00Z",
    settingCount: 3,
    settings: IOS_PASSCODE_SETTINGS,
    scopeTags: [MOCK_SCOPE_TAGS[0]],
    roleScopeTagIds: ["1"],
    assignments: [ASSIGNMENT_ALL_DEVICES],
    targetingModel: TargetingModel.Device,
  },
  {
    id: "sc-006",
    tenantId: "tenant-demo-001",
    displayName: "WIN - Edge Browser Settings",
    description:
      "Microsoft Edge browser configuration. Sets restrictions and security defaults.",
    policyType: PolicyType.SettingsCatalog,
    platform: Platform.Windows,
    odataType: "#microsoft.graph.deviceManagementConfigurationPolicy",
    status: PolicyStatus.Active,
    createdDateTime: "2024-06-01T08:00:00Z",
    lastModifiedDateTime: "2024-11-05T13:00:00Z",
    settingCount: 12,
    scopeTags: [MOCK_SCOPE_TAGS[0]],
    roleScopeTagIds: ["1"],
    assignments: [ASSIGNMENT_ALL_USERS],
    targetingModel: TargetingModel.User,
    createdBy: { id: "user-admin-001", displayName: "James Chen" },
  },
  {
    id: "sc-007",
    tenantId: "tenant-demo-001",
    displayName: "WIN - Defender ASR Rules",
    description: "Attack Surface Reduction rules for Windows endpoint protection.",
    policyType: PolicyType.SettingsCatalog,
    platform: Platform.Windows,
    odataType: "#microsoft.graph.deviceManagementConfigurationPolicy",
    status: PolicyStatus.Active,
    createdDateTime: "2024-07-01T10:00:00Z",
    lastModifiedDateTime: "2024-12-15T09:00:00Z",
    settingCount: 15,
    scopeTags: [MOCK_SCOPE_TAGS[0], MOCK_SCOPE_TAGS[3]],
    roleScopeTagIds: ["1", "4"],
    assignments: [ASSIGNMENT_ALL_DEVICES],
    targetingModel: TargetingModel.Device,
    createdBy: { id: "user-secops-001", displayName: "Sarah Okonkwo" },
  },
  {
    id: "sc-008",
    tenantId: "tenant-demo-001",
    displayName: "WIN - Kiosk Configuration",
    description: "Single-app kiosk mode for lobby and shared Windows devices.",
    policyType: PolicyType.SettingsCatalog,
    platform: Platform.Windows,
    odataType: "#microsoft.graph.deviceManagementConfigurationPolicy",
    status: PolicyStatus.Active,
    createdDateTime: "2024-08-15T09:00:00Z",
    lastModifiedDateTime: "2024-11-01T08:00:00Z",
    settingCount: 7,
    scopeTags: [MOCK_SCOPE_TAGS[2]],
    roleScopeTagIds: ["3"],
    assignments: [
      makeGroupAssignment("a-sc008-001", "grp-kiosk-001", "SG — Kiosk Devices"),
    ],
    targetingModel: TargetingModel.Device,
  },
  {
    id: "sc-009",
    tenantId: "tenant-demo-001",
    displayName: "WIN - Windows Update Ring - Pilot",
    description: "Pilot/fast ring Windows Update configuration for IT team members.",
    policyType: PolicyType.SettingsCatalog,
    platform: Platform.Windows,
    odataType: "#microsoft.graph.deviceManagementConfigurationPolicy",
    status: PolicyStatus.Active,
    createdDateTime: "2024-09-01T10:00:00Z",
    lastModifiedDateTime: "2025-01-05T11:00:00Z",
    settingCount: 4,
    scopeTags: [MOCK_SCOPE_TAGS[0]],
    roleScopeTagIds: ["1"],
    assignments: [
      makeGroupAssignment("a-sc009-001", "grp-it-pilot-001", "SG — IT Pilot Group"),
    ],
    targetingModel: TargetingModel.Device,
    conflictingPolicyIds: ["sc-003"],
    overlapSeverity: OverlapSeverity.Medium,
  },
  {
    id: "sc-010",
    tenantId: "tenant-demo-001",
    displayName: "Android - Enterprise Passcode",
    description: "Passcode policy for Android Enterprise work profile devices.",
    policyType: PolicyType.SettingsCatalog,
    platform: Platform.AndroidEnterprise,
    odataType: "#microsoft.graph.deviceManagementConfigurationPolicy",
    status: PolicyStatus.Active,
    createdDateTime: "2024-10-01T09:00:00Z",
    lastModifiedDateTime: "2024-12-10T14:00:00Z",
    settingCount: 6,
    scopeTags: [MOCK_SCOPE_TAGS[1]],
    roleScopeTagIds: ["2"],
    assignments: [ASSIGNMENT_ALL_DEVICES],
    targetingModel: TargetingModel.Device,
  },
  // Unassigned policy (for reports)
  {
    id: "sc-011",
    tenantId: "tenant-demo-001",
    displayName: "WIN - Draft: Zero Trust Network Access",
    description: "Draft ZTA network configuration — NOT YET ASSIGNED.",
    policyType: PolicyType.SettingsCatalog,
    platform: Platform.Windows,
    odataType: "#microsoft.graph.deviceManagementConfigurationPolicy",
    status: PolicyStatus.Draft,
    createdDateTime: "2025-01-20T10:00:00Z",
    lastModifiedDateTime: "2025-01-25T16:00:00Z",
    settingCount: 8,
    scopeTags: [],
    roleScopeTagIds: [],
    assignments: [],
    targetingModel: TargetingModel.Unknown,
  },
];

// ============================================================
// Administrative Templates
// ============================================================

const ADMT_SETTINGS: PolicySetting[] = [
  {
    id: "admx-chrome-homePage",
    displayName: "Configure the home page URL",
    path: "User Configuration > Google Chrome > Home page",
    value: "https://intranet.contoso.com",
    dataType: SettingDataType.String,
    source: SettingSource.ADMX,
    registryPath: "Software\\Policies\\Google\\Chrome",
  },
  {
    id: "admx-chrome-disableIncognito",
    displayName: "Incognito mode availability",
    path: "User Configuration > Google Chrome",
    value: "Disabled",
    dataType: SettingDataType.ChoiceGroup,
    source: SettingSource.ADMX,
  },
  {
    id: "admx-win-screensaverTimeout",
    displayName: "Screen saver timeout",
    path: "User Configuration > Control Panel > Display > Screen Saver",
    value: "900",
    dataType: SettingDataType.String,
    source: SettingSource.ADMX,
    registryPath: "Software\\Policies\\Microsoft\\Windows\\Control Panel\\Desktop",
  },
];

export const MOCK_ADMIN_TEMPLATE_POLICIES: PolicyObject[] = [
  {
    id: "admt-001",
    tenantId: "tenant-demo-001",
    displayName: "WIN - Chrome Browser Policy",
    description: "Google Chrome ADMX-backed configuration via Administrative Templates.",
    policyType: PolicyType.AdministrativeTemplate,
    platform: Platform.Windows,
    odataType: "#microsoft.graph.groupPolicyConfiguration",
    status: PolicyStatus.Active,
    createdDateTime: "2024-01-20T08:30:00Z",
    lastModifiedDateTime: "2024-10-01T10:00:00Z",
    settingCount: 3,
    settings: ADMT_SETTINGS,
    scopeTags: [MOCK_SCOPE_TAGS[0]],
    roleScopeTagIds: ["1"],
    assignments: [ASSIGNMENT_ALL_USERS],
    targetingModel: TargetingModel.User,
  },
  {
    id: "admt-002",
    tenantId: "tenant-demo-001",
    displayName: "WIN - Office 365 ProPlus ADMX Settings",
    description: "Microsoft 365 Apps for Enterprise ADMX-backed settings.",
    policyType: PolicyType.AdministrativeTemplate,
    platform: Platform.Windows,
    odataType: "#microsoft.graph.groupPolicyConfiguration",
    status: PolicyStatus.Active,
    createdDateTime: "2024-03-01T09:00:00Z",
    lastModifiedDateTime: "2024-11-15T11:30:00Z",
    settingCount: 18,
    scopeTags: [MOCK_SCOPE_TAGS[0]],
    roleScopeTagIds: ["1"],
    assignments: [ASSIGNMENT_ALL_USERS],
    targetingModel: TargetingModel.User,
  },
];

// ============================================================
// Device Configuration (Classic) Policies
// ============================================================

export const MOCK_DEVICE_CONFIG_POLICIES: PolicyObject[] = [
  {
    id: "dc-001",
    tenantId: "tenant-demo-001",
    displayName: "WIN - Domain Join Configuration",
    description: "Windows Autopilot Hybrid Azure AD Join configuration.",
    policyType: PolicyType.DeviceConfiguration,
    platform: Platform.Windows,
    odataType: "#microsoft.graph.windowsDomainJoinConfiguration",
    status: PolicyStatus.Active,
    createdDateTime: "2023-12-01T08:00:00Z",
    lastModifiedDateTime: "2024-06-15T10:00:00Z",
    settingCount: 3,
    scopeTags: [MOCK_SCOPE_TAGS[0]],
    roleScopeTagIds: ["1"],
    assignments: [
      makeGroupAssignment("a-dc001-001", "grp-autopilot-001", "SG — Autopilot Devices"),
    ],
    targetingModel: TargetingModel.Device,
    version: "4",
  },
  {
    id: "dc-002",
    tenantId: "tenant-demo-001",
    displayName: "iOS - Email Profile - Exchange Online",
    description: "Managed email profile for iOS devices pointing to Exchange Online.",
    policyType: PolicyType.DeviceConfiguration,
    platform: Platform.iOS,
    odataType: "#microsoft.graph.iosEasEmailProfileConfiguration",
    status: PolicyStatus.Active,
    createdDateTime: "2024-02-15T09:00:00Z",
    lastModifiedDateTime: "2024-08-20T14:00:00Z",
    settingCount: 8,
    scopeTags: [MOCK_SCOPE_TAGS[0], MOCK_SCOPE_TAGS[1]],
    roleScopeTagIds: ["1", "2"],
    assignments: [ASSIGNMENT_ALL_USERS],
    targetingModel: TargetingModel.User,
  },
  {
    id: "dc-003",
    tenantId: "tenant-demo-001",
    displayName: "MAC - Certificate Profile - Internal CA",
    description: "Trusted root certificate from internal PKI infrastructure.",
    policyType: PolicyType.DeviceConfiguration,
    platform: Platform.macOS,
    odataType: "#microsoft.graph.macOSTrustedRootCertificate",
    status: PolicyStatus.Active,
    createdDateTime: "2024-01-10T09:00:00Z",
    lastModifiedDateTime: "2024-09-05T11:00:00Z",
    settingCount: 2,
    scopeTags: [MOCK_SCOPE_TAGS[0]],
    roleScopeTagIds: ["1"],
    assignments: [
      makeGroupAssignment("a-dc003-001", "grp-mac-corp-001", "SG — macOS Corporate"),
    ],
    targetingModel: TargetingModel.Device,
  },
];

// ============================================================
// Endpoint Security Policies
// ============================================================

export const MOCK_ENDPOINT_SECURITY_POLICIES: PolicyObject[] = [
  {
    id: "es-001",
    tenantId: "tenant-demo-001",
    displayName: "WIN - Endpoint Detection and Response",
    description: "Microsoft Defender for Endpoint onboarding configuration.",
    policyType: PolicyType.EndpointSecurity,
    platform: Platform.Windows,
    odataType: "#microsoft.graph.deviceManagementIntent",
    templateId: "e44c2ca3-2f9a-400a-a113-6cc88efd773d",
    status: PolicyStatus.Active,
    createdDateTime: "2024-01-25T10:00:00Z",
    lastModifiedDateTime: "2024-11-10T09:00:00Z",
    settingCount: 6,
    scopeTags: [MOCK_SCOPE_TAGS[0], MOCK_SCOPE_TAGS[3]],
    roleScopeTagIds: ["1", "4"],
    assignments: [ASSIGNMENT_ALL_DEVICES],
    targetingModel: TargetingModel.Device,
    createdBy: { id: "user-secops-001", displayName: "Sarah Okonkwo" },
  },
  {
    id: "es-002",
    tenantId: "tenant-demo-001",
    displayName: "WIN - Account Protection (LAPS)",
    description:
      "Local Administrator Password Solution via Endpoint Security Account Protection.",
    policyType: PolicyType.EndpointSecurity,
    platform: Platform.Windows,
    odataType: "#microsoft.graph.deviceManagementIntent",
    templateId: "5f59d4af-d9e0-4f63-b3a6-9cf8dc13f7a0",
    status: PolicyStatus.Active,
    createdDateTime: "2024-03-05T09:00:00Z",
    lastModifiedDateTime: "2024-10-20T14:00:00Z",
    settingCount: 4,
    scopeTags: [MOCK_SCOPE_TAGS[0]],
    roleScopeTagIds: ["1"],
    assignments: [ASSIGNMENT_ALL_DEVICES],
    targetingModel: TargetingModel.Device,
  },
];

// ============================================================
// Security Baseline Policies
// ============================================================

export const MOCK_SECURITY_BASELINE_POLICIES: PolicyObject[] = [
  {
    id: "sb-001",
    tenantId: "tenant-demo-001",
    displayName: "Windows Security Baseline — Nov 2023",
    description:
      "Microsoft-recommended security baseline for Windows 10/11. Deployed to standard corporate endpoints.",
    policyType: PolicyType.SecurityBaseline,
    platform: Platform.Windows,
    odataType: "#microsoft.graph.deviceManagementIntent",
    templateId: "034ccd46-190c-4afc-adf1-ad7cc674f145",
    templateVersion: "November 2023",
    status: PolicyStatus.Active,
    createdDateTime: "2024-01-05T08:00:00Z",
    lastModifiedDateTime: "2024-12-01T10:00:00Z",
    settingCount: 184,
    scopeTags: [MOCK_SCOPE_TAGS[0], MOCK_SCOPE_TAGS[3]],
    roleScopeTagIds: ["1", "4"],
    assignments: [ASSIGNMENT_ALL_DEVICES],
    targetingModel: TargetingModel.Device,
    createdBy: { id: "user-secops-001", displayName: "Sarah Okonkwo" },
  },
  {
    id: "sb-002",
    tenantId: "tenant-demo-001",
    displayName: "Microsoft Edge Security Baseline — Nov 2023",
    description: "Microsoft-recommended security baseline for the Edge browser.",
    policyType: PolicyType.SecurityBaseline,
    platform: Platform.Windows,
    odataType: "#microsoft.graph.deviceManagementIntent",
    templateId: "a8d6df28-abff-432e-855c-b66f75c5b9d6",
    templateVersion: "November 2023",
    status: PolicyStatus.Active,
    createdDateTime: "2024-01-05T09:00:00Z",
    lastModifiedDateTime: "2024-11-25T11:00:00Z",
    settingCount: 85,
    scopeTags: [MOCK_SCOPE_TAGS[0]],
    roleScopeTagIds: ["1"],
    assignments: [ASSIGNMENT_ALL_DEVICES],
    targetingModel: TargetingModel.Device,
  },
];

// ============================================================
// Compliance Policies
// ============================================================

export const MOCK_COMPLIANCE_POLICIES: PolicyObject[] = [
  {
    id: "cp-001",
    tenantId: "tenant-demo-001",
    displayName: "WIN - Device Compliance - Corporate",
    description: "Compliance requirements for corporate Windows devices.",
    policyType: PolicyType.CompliancePolicy,
    platform: Platform.Windows,
    odataType: "#microsoft.graph.windows10CompliancePolicy",
    status: PolicyStatus.Active,
    createdDateTime: "2024-01-10T09:00:00Z",
    lastModifiedDateTime: "2024-11-01T10:00:00Z",
    settingCount: 12,
    scopeTags: [MOCK_SCOPE_TAGS[0]],
    roleScopeTagIds: ["1"],
    assignments: [ASSIGNMENT_ALL_DEVICES],
    targetingModel: TargetingModel.Device,
  },
  {
    id: "cp-002",
    tenantId: "tenant-demo-001",
    displayName: "iOS - Device Compliance - BYOD",
    description: "Minimum compliance requirements for BYOD iOS devices.",
    policyType: PolicyType.CompliancePolicy,
    platform: Platform.iOS,
    odataType: "#microsoft.graph.iosCompliancePolicy",
    status: PolicyStatus.Active,
    createdDateTime: "2024-02-05T09:00:00Z",
    lastModifiedDateTime: "2024-09-10T11:00:00Z",
    settingCount: 8,
    scopeTags: [MOCK_SCOPE_TAGS[1]],
    roleScopeTagIds: ["2"],
    assignments: [ASSIGNMENT_ALL_USERS],
    targetingModel: TargetingModel.User,
  },
  {
    id: "cp-003",
    tenantId: "tenant-demo-001",
    displayName: "Android - Device Compliance - Enterprise",
    description: "Compliance policy for Android Enterprise work profile.",
    policyType: PolicyType.CompliancePolicy,
    platform: Platform.AndroidEnterprise,
    odataType: "#microsoft.graph.androidWorkProfileCompliancePolicy",
    status: PolicyStatus.Active,
    createdDateTime: "2024-03-01T10:00:00Z",
    lastModifiedDateTime: "2024-10-05T09:00:00Z",
    settingCount: 10,
    scopeTags: [MOCK_SCOPE_TAGS[1]],
    roleScopeTagIds: ["2"],
    assignments: [ASSIGNMENT_ALL_USERS],
    targetingModel: TargetingModel.User,
  },
  {
    id: "cp-004",
    tenantId: "tenant-demo-001",
    displayName: "MAC - Device Compliance",
    description: "Compliance policy for corporate macOS devices.",
    policyType: PolicyType.CompliancePolicy,
    platform: Platform.macOS,
    odataType: "#microsoft.graph.macOSCompliancePolicy",
    status: PolicyStatus.Active,
    createdDateTime: "2024-04-10T09:00:00Z",
    lastModifiedDateTime: "2024-12-05T11:00:00Z",
    settingCount: 9,
    scopeTags: [MOCK_SCOPE_TAGS[0]],
    roleScopeTagIds: ["1"],
    assignments: [
      makeGroupAssignment("a-cp004-001", "grp-mac-corp-001", "SG — macOS Corporate"),
    ],
    targetingModel: TargetingModel.Device,
  },
];

// ============================================================
// Script Policies
// ============================================================

export const MOCK_SCRIPTS: PolicyObject[] = [
  {
    id: "scr-001",
    tenantId: "tenant-demo-001",
    displayName: "WIN - Remediate OneDrive Known Folders",
    description: "PowerShell script to configure and enforce OneDrive KFM.",
    policyType: PolicyType.Script,
    platform: Platform.Windows,
    odataType: "#microsoft.graph.deviceManagementScript",
    status: PolicyStatus.Active,
    createdDateTime: "2024-05-01T09:00:00Z",
    lastModifiedDateTime: "2024-09-15T10:00:00Z",
    settingCount: 1,
    scopeTags: [MOCK_SCOPE_TAGS[0]],
    roleScopeTagIds: ["1"],
    assignments: [ASSIGNMENT_ALL_DEVICES],
    targetingModel: TargetingModel.Device,
  },
];

// ============================================================
// All policies combined
// ============================================================

export const ALL_MOCK_POLICIES: PolicyObject[] = [
  ...MOCK_SETTINGS_CATALOG_POLICIES,
  ...MOCK_ADMIN_TEMPLATE_POLICIES,
  ...MOCK_DEVICE_CONFIG_POLICIES,
  ...MOCK_ENDPOINT_SECURITY_POLICIES,
  ...MOCK_SECURITY_BASELINE_POLICIES,
  ...MOCK_COMPLIANCE_POLICIES,
  ...MOCK_SCRIPTS,
];
