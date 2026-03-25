import {
  Monitor,
  Apple,
  Smartphone,
  Tablet,
  Chrome,
  Globe,
  Server,
  type LucideProps,
} from "lucide-react";
import { Platform } from "@/domain/enums";
import { cn } from "@/lib/utils";

interface PlatformIconProps extends LucideProps {
  platform: Platform;
}

const platformIconMap: Record<Platform, React.FC<LucideProps>> = {
  [Platform.Windows]: Monitor,
  [Platform.WindowsPhone]: Smartphone,
  [Platform.macOS]: Apple,
  [Platform.iOS]: Smartphone,
  [Platform.iPadOS]: Tablet,
  [Platform.Android]: Smartphone,
  [Platform.AndroidEnterprise]: Smartphone,
  [Platform.ChromeOS]: Chrome,
  [Platform.Linux]: Server,
  [Platform.CrossPlatform]: Globe,
  [Platform.Unknown]: Globe,
};

const platformColorMap: Record<Platform, string> = {
  [Platform.Windows]: "text-blue-500",
  [Platform.WindowsPhone]: "text-blue-400",
  [Platform.macOS]: "text-gray-500",
  [Platform.iOS]: "text-gray-400",
  [Platform.iPadOS]: "text-gray-400",
  [Platform.Android]: "text-green-500",
  [Platform.AndroidEnterprise]: "text-green-600",
  [Platform.ChromeOS]: "text-yellow-500",
  [Platform.Linux]: "text-orange-500",
  [Platform.CrossPlatform]: "text-purple-500",
  [Platform.Unknown]: "text-muted-foreground",
};

export function PlatformIcon({ platform, className, ...props }: PlatformIconProps) {
  const Icon = platformIconMap[platform] ?? Globe;
  return (
    <Icon
      className={cn("w-4 h-4", platformColorMap[platform], className)}
      {...props}
    />
  );
}
