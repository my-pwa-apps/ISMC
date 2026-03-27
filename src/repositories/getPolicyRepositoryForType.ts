import type { RepositoryRegistry } from "@/repositories/interfaces";
import { PolicyType } from "@/domain/enums";

export function getPolicyRepositoryForType(registry: RepositoryRegistry, type: PolicyType) {
  switch (type) {
    case PolicyType.SettingsCatalog:
      return registry.settingsCatalog;
    case PolicyType.AdministrativeTemplate:
      return registry.adminTemplates;
    case PolicyType.DeviceConfiguration:
      return registry.deviceConfig;
    case PolicyType.EndpointSecurity:
      return registry.endpointSecurity;
    case PolicyType.SecurityBaseline:
      return registry.securityBaseline;
    case PolicyType.CompliancePolicy:
      return registry.compliance;
    case PolicyType.Script:
      return registry.scripts;
    case PolicyType.Remediation:
      return registry.remediations;
    default:
      return null;
  }
}