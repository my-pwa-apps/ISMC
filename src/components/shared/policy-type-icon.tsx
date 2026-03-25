import {
  Settings,
  FileText,
  Shield,
  ClipboardCheck,
  Terminal,
  Package,
  AlertTriangle,
  RefreshCw,
  Zap,
  Users,
  Lock,
  type LucideProps,
} from "lucide-react";
import { PolicyType } from "@/domain/enums";
import { cn } from "@/lib/utils";

interface PolicyTypeIconProps extends LucideProps {
  type: PolicyType;
}

const typeIconMap: Record<PolicyType, React.FC<LucideProps>> = {
  [PolicyType.SettingsCatalog]: Settings,
  [PolicyType.AdministrativeTemplate]: FileText,
  [PolicyType.DeviceConfiguration]: ClipboardCheck,
  [PolicyType.EndpointSecurity]: Shield,
  [PolicyType.SecurityBaseline]: Lock,
  [PolicyType.CompliancePolicy]: ClipboardCheck,
  [PolicyType.Script]: Terminal,
  [PolicyType.Remediation]: RefreshCw,
  [PolicyType.PolicySet]: Package,
  [PolicyType.AppProtection]: Shield,
  [PolicyType.AppConfiguration]: Settings,
  [PolicyType.UpdatePolicy]: RefreshCw,
  [PolicyType.FeatureUpdate]: Zap,
  [PolicyType.QualityUpdate]: Zap,
  [PolicyType.DriverUpdate]: RefreshCw,
  [PolicyType.AutopilotProfile]: Users,
  [PolicyType.EnrollmentRestriction]: AlertTriangle,
  [PolicyType.Unknown]: FileText,
};

const typeColorMap: Record<PolicyType, string> = {
  [PolicyType.SettingsCatalog]: "text-brand-600",
  [PolicyType.AdministrativeTemplate]: "text-purple-500",
  [PolicyType.DeviceConfiguration]: "text-blue-500",
  [PolicyType.EndpointSecurity]: "text-red-500",
  [PolicyType.SecurityBaseline]: "text-red-600",
  [PolicyType.CompliancePolicy]: "text-green-500",
  [PolicyType.Script]: "text-yellow-600",
  [PolicyType.Remediation]: "text-orange-500",
  [PolicyType.PolicySet]: "text-cyan-500",
  [PolicyType.AppProtection]: "text-pink-500",
  [PolicyType.AppConfiguration]: "text-indigo-500",
  [PolicyType.UpdatePolicy]: "text-teal-500",
  [PolicyType.FeatureUpdate]: "text-teal-600",
  [PolicyType.QualityUpdate]: "text-teal-400",
  [PolicyType.DriverUpdate]: "text-slate-500",
  [PolicyType.AutopilotProfile]: "text-blue-600",
  [PolicyType.EnrollmentRestriction]: "text-amber-500",
  [PolicyType.Unknown]: "text-muted-foreground",
};

export function PolicyTypeIcon({ type, className, ...props }: PolicyTypeIconProps) {
  const Icon = typeIconMap[type] ?? FileText;
  return (
    <Icon
      className={cn("w-4 h-4", typeColorMap[type], className)}
      {...props}
    />
  );
}
