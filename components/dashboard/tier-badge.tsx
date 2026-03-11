import { cn } from "@/lib/utils"

export type TierLevel = "Disengaged" | "Low" | "Moderate" | "High"

interface TierBadgeProps {
  tier: TierLevel
  size?: "sm" | "md" | "lg"
}

export function TierBadge({ tier, size = "md" }: TierBadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  }

  const tierClasses: Record<TierLevel, string> = {
    High: "bg-tier-high-bg text-tier-high border-tier-high/30",
    Moderate: "bg-tier-moderate-bg text-tier-moderate border-tier-moderate/30",
    Low: "bg-tier-low-bg text-tier-low border-tier-low/30",
    Disengaged: "bg-tier-disengaged-bg text-tier-disengaged border-tier-disengaged/30",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full border",
        sizeClasses[size],
        tierClasses[tier]
      )}
    >
      {tier}
    </span>
  )
}
