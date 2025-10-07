import { useState } from "react";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";
import { ChipFilter } from "./ui/chip-filter";
import { Button } from "./ui/button";
import { Download, RefreshCw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "./ui/utils";

interface GlobalContextBarProps {
  environment: string;
  release: string;
  activeTab: string;
  // Vulnerabilities specific
  timePeriod?: string;
  onTimePeriodChange?: (value: string) => void;
  // Exceptions specific  
  timeRange?: "hourly" | "daily";
  onTimeRangeChange?: (value: "hourly" | "daily") => void;
  cluster?: string;
  onClusterChange?: (value: string) => void;
  namespace?: string;
  onNamespaceChange?: (value: string) => void;
  // Common
  activeFilters?: string[];
  onRemoveFilter?: (filter: string) => void;
  onExportCsv?: () => void;
  className?: string;
}

const clusters = ["all", "prod-cluster", "staging-cluster", "dev-cluster"];
const namespaces = [
  "all", 
  "auth-ns", 
  "payments-ns", 
  "orders-ns", 
  "notifications-ns",
  "user-ns",
  "cache-ns", 
  "api-ns",
  "features-ns",
  "config-ns",
  "testing-ns",
  "perf-ns"
];
const timePeriods = [
  { value: "last-build", label: "Last Build" },
  { value: "1-day", label: "1 Day" },
  { value: "1-week", label: "1 Week" },
  { value: "1-month", label: "1 Month" }
];

export function GlobalContextBar({
  environment,
  release,
  activeTab,
  timePeriod,
  onTimePeriodChange,
  timeRange,
  onTimeRangeChange,
  cluster,
  onClusterChange,
  namespace,
  onNamespaceChange,
  activeFilters = [],
  onRemoveFilter,
  onExportCsv,
  className
}: GlobalContextBarProps) {
  const [isExporting, setIsExporting] = useState(false);
  
  const handleExport = async () => {
    if (!onExportCsv) return;
    
    setIsExporting(true);
    try {
      await onExportCsv();
    } finally {
      setIsExporting(false);
    }
  };

  const getScopeInfo = () => {
    const scopes = [];
    if (activeTab === "vulnerabilities" && timePeriod && timePeriod !== "last-build") {
      scopes.push(timePeriods.find(tp => tp.value === timePeriod)?.label || timePeriod);
    }
    if (activeTab === "exceptions") {
      if (cluster && cluster !== "all") scopes.push(`Cluster: ${cluster}`);
      if (namespace && namespace !== "all") scopes.push(`NS: ${namespace}`);
      if (timeRange) scopes.push(timeRange);
    }
    return scopes;
  };

  return (
    <div
      className={cn(
        "bg-background border-b p-4",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-4 mb-4">
        {/* Core Context */}
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">Env:</Label>
          <Badge variant="outline" className="font-mono">
            {environment}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">Release:</Label>
          <Badge variant="outline" className="font-mono">
            {release}
          </Badge>
        </div>

        {/* Scope Badge */}
        {getScopeInfo().length > 0 && (
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Scope:</Label>
            <Badge variant="secondary" className="text-xs">
              {getScopeInfo().join(" • ")}
            </Badge>
          </div>
        )}

        {/* Tab-specific Controls */}
        {activeTab === "vulnerabilities" && timePeriod && onTimePeriodChange && (
          <Select value={timePeriod} onValueChange={onTimePeriodChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timePeriods.map((period) => (
                <SelectItem key={period.value} value={period.value}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {activeTab === "exceptions" && (
          <>
            {timeRange && onTimeRangeChange && (
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Time Range:</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={timeRange === "daily"}
                    onCheckedChange={(checked) => onTimeRangeChange(checked ? "daily" : "hourly")}
                    aria-label="Toggle between hourly and daily view"
                  />
                  <Label className="text-sm">
                    {timeRange === "hourly" ? "Hourly" : "Daily"}
                  </Label>
                </div>
              </div>
            )}
            
            {cluster && onClusterChange && (
              <Select value={cluster} onValueChange={onClusterChange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Cluster" />
                </SelectTrigger>
                <SelectContent>
                  {clusters.map((clusterOption) => (
                    <SelectItem key={clusterOption} value={clusterOption}>
                      {clusterOption === "all" ? "All Clusters" : clusterOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {namespace && onNamespaceChange && (
              <Select value={namespace} onValueChange={onNamespaceChange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Namespace" />
                </SelectTrigger>
                <SelectContent>
                  {namespaces.map((namespaceOption) => (
                    <SelectItem key={namespaceOption} value={namespaceOption}>
                      {namespaceOption === "all" ? "All Namespaces" : namespaceOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </>
        )}

        {/* Export Action */}
        {onExportCsv && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExport}
            disabled={isExporting}
            className="ml-auto"
          >
            {isExporting ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export CSV
          </Button>
        )}
      </div>
      
      {/* Active Filters */}
      <AnimatePresence>
        {activeFilters.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2"
          >
            {activeFilters.map((filter) => (
              <motion.div
                key={filter}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <ChipFilter
                  label={filter}
                  selected={true}
                  onRemove={() => onRemoveFilter?.(filter)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}