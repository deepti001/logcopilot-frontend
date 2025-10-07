import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { cn } from "./utils";

interface CardKPIProps {
  title: string;
  value: string | number;
  delta?: {
    value: number;
    type: "increase" | "decrease";
    label?: string;
  };
  icon?: LucideIcon;
  iconColor?: string;
  subtitle?: string;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
}

export function CardKPI({
  title,
  value,
  delta,
  icon: Icon,
  iconColor = "text-muted-foreground",
  subtitle,
  className,
  onClick,
  selected = false
}: CardKPIProps) {
  const isClickable = Boolean(onClick);
  
  return (
    <Card 
      className={cn(
        "transition-all duration-200",
        isClickable && "cursor-pointer hover:shadow-md hover:ring-2 hover:ring-primary/20",
        selected && "ring-2 ring-primary",
        className
      )}
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 h-16">
        <CardTitle className="text-sm font-medium leading-tight h-8">
          <span className="line-clamp-2">{title}</span>
        </CardTitle>
        {Icon && <Icon className={cn("h-4 w-4 flex-shrink-0 mt-1", iconColor)} />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
        {(delta || subtitle) && (
          <div className="flex items-center text-xs mt-1">
            {delta && (
              <>
                {delta.type === "increase" ? (
                  <TrendingUp className="h-3 w-3 text-red-500 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-green-500 mr-1" />
                )}
                <span className={delta.type === "increase" ? "text-red-500" : "text-green-500"}>
                  {Math.abs(delta.value)} {delta.label || "vs previous"}
                </span>
              </>
            )}
            {subtitle && !delta && (
              <span className="text-muted-foreground">{subtitle}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}