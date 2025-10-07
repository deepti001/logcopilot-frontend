import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./button";
import { cn } from "./utils";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  isRetrying?: boolean;
  variant?: "inline" | "full";
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  description = "There was an error loading the data. Please try again.",
  onRetry,
  retryLabel = "Try Again",
  isRetrying = false,
  variant = "full",
  className
}: ErrorStateProps) {
  if (variant === "inline") {
    return (
      <div className={cn("flex items-center justify-center p-4 text-center", className)}>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">{title}</span>
          </div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          {onRetry && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRetry}
              disabled={isRetrying}
              className="text-xs"
            >
              {isRetrying ? (
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3 mr-1" />
              )}
              {retryLabel}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center h-64", className)}>
      <div className="text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        {onRetry && (
          <Button 
            variant="outline" 
            onClick={onRetry}
            disabled={isRetrying}
          >
            {isRetrying ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {retryLabel}
          </Button>
        )}
      </div>
    </div>
  );
}