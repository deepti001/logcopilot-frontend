import { LucideIcon, Activity, Shield } from "lucide-react";
import { Button } from "./button";
import { cn } from "./utils";

interface EmptyStateProps {
  variant?: "vulnerabilities" | "exceptions" | "general";
  title?: string;
  description?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const variantConfig = {
  vulnerabilities: {
    icon: Shield,
    title: "No vulnerabilities found",
    description: "No vulnerabilities detected in this period. Try adjusting your filters or time range."
  },
  exceptions: {
    icon: Activity,
    title: "No exceptions in this period",
    description: "No runtime exceptions found. Try adjusting your time range or filters to see more results."
  },
  general: {
    icon: Activity,
    title: "No data available",
    description: "No data found for the current selection."
  }
};

export function EmptyState({
  variant = "general",
  title,
  description,
  icon: CustomIcon,
  action,
  className
}: EmptyStateProps) {
  const config = variantConfig[variant];
  const Icon = CustomIcon || config.icon;
  
  return (
    <div className={cn("text-center py-12", className)}>
      <Icon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="font-medium mb-2">
        {title || config.title}
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        {description || config.description}
      </p>
      {action && (
        <Button variant="outline" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}