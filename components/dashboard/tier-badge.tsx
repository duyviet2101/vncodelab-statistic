import { cn } from "@/lib/utils"

interface TierBadgeProps {
  tier: "High" | "Mid" | "Disengaged"
  size?: "sm" | "md" | "lg"
}

export function TierBadge({ tier, size = "md" }: TierBadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  }

  const tierClasses = {
    High: "bg-tier-high-bg text-tier-high border-tier-high/30",
    Mid: "bg-tier-mid-bg text-tier-mid border-tier-mid/30",
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
