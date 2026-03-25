import { ExplorerView } from "@/features/explorer/components/ExplorerView";
import { PolicyType, Platform } from "@/domain/enums";
import { getPlatformLabel, getPolicyTypeLabel } from "@/lib/utils";
import { notFound } from "next/navigation";

// Slug → enum mappings (must match sidebar hrefs)
const PLATFORM_MAP: Record<string, Platform> = {
  windows: Platform.Windows,
  macos: Platform.macOS,
  ios: Platform.iOS,
  ipados: Platform.iPadOS,
  android: Platform.Android,
  "android-enterprise": Platform.AndroidEnterprise,
  linux: Platform.Linux,
  chromeos: Platform.ChromeOS,
};

const TYPE_MAP: Record<string, PolicyType> = {
  "settings-catalog": PolicyType.SettingsCatalog,
  "admin-templates": PolicyType.AdministrativeTemplate,
  "device-config": PolicyType.DeviceConfiguration,
  "endpoint-security": PolicyType.EndpointSecurity,
  baselines: PolicyType.SecurityBaseline,
  compliance: PolicyType.CompliancePolicy,
  scripts: PolicyType.Script,
  remediations: PolicyType.Remediation,
  "app-protection": PolicyType.AppProtection,
  "app-configuration": PolicyType.AppConfiguration,
  "update-rings": PolicyType.UpdatePolicy,
  "feature-updates": PolicyType.FeatureUpdate,
  "quality-updates": PolicyType.QualityUpdate,
  "driver-updates": PolicyType.DriverUpdate,
};

interface Props {
  params: Promise<{ platform: string; type: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { platform, type } = await params;
  const platformEnum = PLATFORM_MAP[platform];
  const typeEnum = TYPE_MAP[type];
  const title = [
    typeEnum ? getPolicyTypeLabel(typeEnum) : type,
    platformEnum ? getPlatformLabel(platformEnum) : platform,
  ]
    .filter(Boolean)
    .join(" — ");
  return { title: `${title} | Policy Explorer` };
}

export default async function ExplorerSubPage({ params }: Props) {
  const { platform, type } = await params;

  const platformEnum = PLATFORM_MAP[platform];
  const typeEnum = TYPE_MAP[type];

  if (!platformEnum && !typeEnum) {
    notFound();
  }

  const initialFilters = {
    ...(platformEnum ? { platform: platformEnum } : {}),
    ...(typeEnum ? { policyType: typeEnum } : {}),
  };

  const heading = [
    typeEnum ? getPolicyTypeLabel(typeEnum) : null,
    platformEnum ? `(${getPlatformLabel(platformEnum)})` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">{heading}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Browse and filter Intune policies
        </p>
      </div>
      <ExplorerView initialFilters={initialFilters} />
    </div>
  );
}
