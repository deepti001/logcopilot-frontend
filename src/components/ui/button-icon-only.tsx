import * as React from "react";
import { LucideIcon } from "lucide-react";
import { Button, ButtonProps } from "./button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";
import { cn } from "./utils";

interface ButtonIconOnlyProps extends Omit<ButtonProps, "children" | "variant"> {
  icon: LucideIcon;
  tooltip: string;
  tone?: "view" | "copy" | "jira" | "default";
}

const variantStyles: Record<NonNullable<ButtonIconOnlyProps["tone"]>, string> = {
  view: "hover:bg-blue-50 hover:text-blue-600",
  copy: "hover:bg-green-50 hover:text-green-600",
  jira: "hover:bg-purple-50 hover:text-purple-600",
  default: "",
};

export const ButtonIconOnly = React.forwardRef<
  HTMLButtonElement,
  ButtonIconOnlyProps
>(({ icon: Icon, tooltip, tone = "default", className, ...props }, ref) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            ref={ref}
            variant="ghost"
            size="sm"
            className={cn("h-8 w-8 p-0", variantStyles[tone], className)}
            aria-label={tooltip}
            {...props}
          >
            <Icon className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

ButtonIconOnly.displayName = "ButtonIconOnly";
