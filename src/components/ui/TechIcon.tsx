import { Blocks } from "lucide-react";
import StackIcon from "tech-stack-icons";

type StackIconName = Parameters<typeof StackIcon>[0]["name"];

interface TechIconProps {
  slug: string;
  size?: number;
  className?: string;
}

const KNOWN_FALLBACK_SIZE = 18;

export function TechIcon({ slug, size = KNOWN_FALLBACK_SIZE, className = "" }: TechIconProps) {
  if (!slug) {
    return <Blocks size={size} className={`text-muted ${className}`} aria-hidden />;
  }

  return (
    <StackIcon
      name={slug as StackIconName}
      variant="dark"
      className={className}
      style={{ width: size, height: size, display: "inline-block" }}
    />
  );
}
