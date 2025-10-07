import { cn } from "./utils";
import { Badge } from "./badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

export type SeverityLevel = "critical" | "high" | "medium" | "low";

interface BadgeSeverityProps {
  severity: SeverityLevel;
  className?: string;
  showTooltip?: boolean;
}

const severityConfig = {
  critical: {
    label: "Critical",
    description: "Critical severity - immediate action required",
    className: "bg-[var(--color-severity-critical-background)] text-[var(--color-severity-critical)] border-[var(--color-severity-critical)]"
  },
  high: {
    label: "High", 
    description: "High severity - action required soon",
    className: "bg-[var(--color-severity-high-background)] text-[var(--color-severity-high)] border-[var(--color-severity-high)]"
  },
  medium: {
    label: "Medium",
    description: "Medium severity - monitor and plan remediation", 
    className: "bg-[var(--color-severity-medium-background)] text-[var(--color-severity-medium)] border-[var(--color-severity-medium)]"
  },
  low: {
    label: "Low",
    description: "Low severity - address when convenient",
    className: "bg-[var(--color-severity-low-background)] text-[var(--color-severity-low)] border-[var(--color-severity-low)]"
  }
};

export function BadgeSeverity({ severity, className, showTooltip = true }: BadgeSeverityProps) {
  const config = severityConfig[severity];
  
  const badge = (
    <Badge 
      variant="secondary" 
      className={cn(
        config.className,
        "font-medium text-xs border",
        className
      )}
      role="status"
      aria-label={`${config.label} severity level`}
    >
      {config.label}
    </Badge>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.description}</p>
          <p className="text-xs text-muted-foreground mt-1">
            WCAG AA compliant contrast (≥4.5:1)
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}