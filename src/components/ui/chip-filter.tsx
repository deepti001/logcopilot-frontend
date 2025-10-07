import { X } from "lucide-react";
import { cn } from "./utils";
import { Button } from "./button";
import { Badge } from "./badge";

interface ChipFilterProps {
  label: string;
  selected?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
  className?: string;
}

export function ChipFilter({ 
  label, 
  selected = false, 
  onRemove, 
  onClick, 
  className 
}: ChipFilterProps) {
  return (
    <Badge
      variant={selected ? "default" : "secondary"}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 text-xs transition-all",
        selected 
          ? "bg-primary text-primary-foreground hover:bg-primary/90" 
          : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={`Filter: ${label}${selected ? ' (active)' : ''}`}
    >
      <span>{label}</span>
      {selected && onRemove && (
        <Button
          variant="ghost"
          size="sm"
          className="h-3 w-3 p-0 hover:bg-transparent"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={`Remove ${label} filter`}
        >
          <X className="h-2 w-2" />
        </Button>
      )}
    </Badge>
  );
}