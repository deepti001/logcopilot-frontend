// /src/components/GlobalContextBar.tsx

import React, { useState, useEffect } from "react";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";
import { ChipFilter } from "./ui/chip-filter";
import { Button } from "./ui/button";
import { Download, RefreshCw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "./ui/utils";
import { getReleases, getRepositories, getPods } from "../services/api";

type TimePeriodValue = "latest" | "1-day" | "1-week" | "1-month" | `image-digest:${string}`;

type GlobalContextBarProps = {
  environment: string;
  // onEnvironmentChange: (env: string) => void;
  release: string;
  onReleaseChange: (release: string | null) => void;
  activeTab: string;
  // Vulnerabilities specific
  timePeriod?: TimePeriodValue;
  onTimePeriodChange?: (value: TimePeriodValue) => void;
  repo?: string | null;
  onRepoChange?: (value: string | null) => void;
  // Exceptions specific (kept in props for compatibility, but UI removed)
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
  onApplyExceptions?: () => void;
}

const clusters = ["all", "prod-cluster", "staging-cluster", "dev-cluster"];

const timePeriods = [
  { value: "latest", label: "Latest" },
  { value: "1-day", label: "1 Day" },
  { value: "1-week", label: "1 Week" },
  { value: "1-month", label: "1 Month" },
];

export const GlobalContextBar: React.FC<GlobalContextBarProps> = ({
  environment,
  // onEnvironmentChange,
  release,
  onReleaseChange,
  activeTab,
  timePeriod,
  onTimePeriodChange,
  repo,
  onRepoChange,
  // timeRange, onTimeRangeChange,  // kept in props above, not used in UI now
  cluster,
  onClusterChange,
  namespace,
  onNamespaceChange,
  activeFilters = [],
  onRemoveFilter,
  onExportCsv,
  className,
  onApplyExceptions,
}: GlobalContextBarProps) => {
  const [isExporting, setIsExporting] = useState(false);

  const [isImageTagMode, setIsImageTagMode] = useState(false);
  const [imageTagInput, setImageTagInput] = useState("");
  const [_appliedImageTag, setAppliedImageTag] = useState<string | null>("");

  const [repositories, setRepositories] = useState<string[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>("");

  const [podsCache, setPodsCache] = useState<Record<string, string[]>>({});
  const [pods, setPods] = useState<string[]>([]);
  const [selectedPod, setSelectedPod] = useState<string>("");

  const [releasesMap, setReleasesMap] = useState<Record<string, string>>({});
  const [_loading, setLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);


  // 🔹 Unified loader for environments + releases + repositories
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        setLoading(true);
        setError(null);

        const [ rels, repos] = await Promise.all([
          getReleases(),
          getRepositories(),
        ]);

        if (cancelled) return;

        // Save results
        setReleasesMap(rels || []);
        setRepositories(repos || []);

        // Auto-select repo only once (like before)
        if (repos && repos.length > 0) {
          setSelectedRepo((prev) => {
            const next = prev || repos[0];
            if (!prev) {
              onRepoChange?.(next);
            }
            return next;
          });
        }

        setLoading(false);
      } catch (err) {
        if (cancelled) return;

        console.error("Failed to load initial release/repository data:", err);
        setError("Failed to load context data");
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [onRepoChange]);

  // ✅ Load pods whenever environment changes — only for Exceptions tab
  useEffect(() => {
    if (activeTab !== "exceptions" || !environment) return;

    let cancelled = false;

    async function fetchPods() {
      try {
        // Clear current list to avoid briefly showing stale options
        setPods([]);

        // 1) Check cache first
        const cached = podsCache[environment];
        if (cached && cached.length) {
          if (cancelled) return;

          // Replace the list entirely
          setPods(cached);

          // Pick selectedPod if still valid, otherwise first
          const next = cached.includes(selectedPod) && selectedPod ? selectedPod : (cached[0] || "");
          // Always propagate selection (ensures ExceptionsDashboard refetch even if names overlap across envs)
          setSelectedPod(next);
          onNamespaceChange?.(next);
          return;
        }

        // 2) No cache → fetch
        const data = await getPods(environment);
        if (cancelled) return;

        // Cache & replace list
        setPodsCache((prev) => ({ ...prev, [environment]: data }));
        setPods(data);

        // Default to first pod
        const first = data[0] || "";
        setSelectedPod(first);
        onNamespaceChange?.(first);
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to fetch pods for environment", environment, err);
          setPods([]);
          setSelectedPod("");
          onNamespaceChange?.("");
        }
      }
    }

    void fetchPods();
    return () => { cancelled = true; };
  }, [environment, activeTab, onNamespaceChange, podsCache, selectedPod]);

  // 🔄 Auto-update release based on environment → releasesMap
  useEffect(() => {
    if (!environment || !onReleaseChange) return;

    const mapped = releasesMap[environment];
    if (mapped && mapped !== release) {
      onReleaseChange(mapped);
    }
  }, [environment, releasesMap, release, onReleaseChange]);


  const handleRepoChange = (value: string) => {
    setSelectedRepo(value);
    onRepoChange?.(value);
  };

  const handleExport = async () => {
    if (!onExportCsv) return;

    setIsExporting(true);
    try {
      await Promise.resolve(onExportCsv());
    } finally {
      setIsExporting(false);
    }
  };

  // 👉 Now ONLY builds scope info for the Vulnerabilities tab
  const getScopeInfo = () => {
    const scopes: string[] = [];
    if (activeTab === "vulnerabilities") {
      if (isImageTagMode) {
        scopes.push("Image Digest");
      } else if (timePeriod && timePeriod !== "latest") {
        scopes.push(timePeriods.find((tp) => tp.value === timePeriod)?.label || timePeriod);
      } else if (timePeriod === "latest") {
        scopes.push("Last Build");
      }
    }
    return scopes;
  };

  const onToggleSourceMode = (checked: boolean) => {
    setIsImageTagMode(checked);
    if (!checked) {
      // Back to Last Build mode: reset tag UI and notify parent
      setAppliedImageTag(null);
      setImageTagInput("");
      onTimePeriodChange?.("latest");
    }
  };

  const applyImageTag = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = imageTagInput.trim();
    if (!tag) return;
    setAppliedImageTag(tag);
    // Emit a special timePeriod marker; parent parses it to add image_digest param
    onTimePeriodChange?.(`image-digest:${tag}`);
  };

  return (
    <div className={cn("bg-background border-b p-4", className)}>
      <div className="flex flex-wrap items-center gap-4 mb-4">
        {/* Core Context */}
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">Env:</Label>
          <Badge variant="outline" className="font-mono">
            {environment || "—"}
          </Badge>
        </div>

        {/* 🔒 Release (non-clickable, driven by environment → releases map) */}
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">Release:</Label>
          <Badge
            variant="outline"
            className="font-mono opacity-70 cursor-not-allowed select-none"
          >
            {release ||
              (environment && releasesMap[environment]) ||
              "—"}
          </Badge>
        </div>

        {/* Tab-specific Controls */}
        {activeTab === "vulnerabilities" && (
          <>
            {/* Scope Badge — shown only for Vulnerabilities */}
            {getScopeInfo().length > 0 && (
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Scope:</Label>
                <Badge variant="secondary" className="text-xs">
                  {getScopeInfo().join(" • ")}
                </Badge>
              </div>
            )}

            {/* Source Switch: Last Build <-> Image Digest */}
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Source:</Label>
              <div className="flex items-center gap-2">
                <Switch
                  checked={isImageTagMode}
                  onCheckedChange={onToggleSourceMode}
                  aria-label="Toggle between Last Build and Image Digest"
                />
              </div>

              {isImageTagMode ? (
                <form onSubmit={applyImageTag} className="flex items-center gap-2">
                  <Label htmlFor="image-digest-input" className="sr-only">
                    Image digest
                  </Label>
                  <input
                    type="text"
                    id="image-digest-input"
                    value={imageTagInput}
                    onChange={(e) => setImageTagInput(e.target.value)}
                    placeholder="Enter image digest"
                    className="h-8 w-[220px] rounded-md border border-[var(--border)] bg-[var(--input-background)] px-2 text-sm outline-none focus:ring-2"
                  />
                  <Button type="submit" size="sm" variant="outline">
                    Apply
                  </Button>
                </form>
              ) : null}

              {/* Repo Dropdown */}
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Repo:</Label>
                <Select value={selectedRepo} onValueChange={handleRepoChange}>
                  <SelectTrigger className="w-[200px]" aria-label="Select repository">
                    <SelectValue placeholder="Select Repo" />
                  </SelectTrigger>
                  <SelectContent>
                    {repositories.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Export Action */}
            {onExportCsv && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleExport()}
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
          </>
        )}

        {activeTab === "exceptions" && (
          <>
            {/* ⛔ Time Range block removed for Exceptions tab */}
            {cluster && onClusterChange && (
              <Select value={cluster} onValueChange={onClusterChange}>
                <SelectTrigger className="w-[150px]" aria-label="Select cluster">
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

            {pods.length > 0 && (
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Pod:</Label>
                <Select
                  value={selectedPod}
                  onValueChange={(val) => {
                    setSelectedPod(val);
                    onNamespaceChange?.(val); // reuse namespace prop as podname
                  }}
                >
                  <SelectTrigger className="w-[180px]" aria-label="Select pod">
                    <SelectValue placeholder="Select Pod" />
                  </SelectTrigger>
                  <SelectContent>
                    {pods.map((pod) => (
                      <SelectItem key={pod} value={pod}>
                        {pod}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  className="ml-1"
                  onClick={() => onApplyExceptions?.()}
                  disabled={!selectedPod}
                >
                  Apply changes
                </Button>
              </div>
            )}
          </>
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
