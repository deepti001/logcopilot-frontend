import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { BadgeSeverity } from "./ui/badge-severity";
import { CardKPI } from "./ui/card-kpi";
import { EmptyState } from "./ui/empty-state";
import { ErrorState } from "./ui/error-state";
import { LoadingState } from "./ui/loading-state";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Skeleton } from "./ui/skeleton";
import { Separator } from "./ui/separator";
import { Label } from "./ui/label";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import {
  AlertCircle,
  RefreshCw,
  Eye,
  RotateCcw,
  Brain,
} from "lucide-react";
import { motion } from "motion/react";
import { getExceptions, postLogsNlp } from "../services/api";
import { toast } from "sonner";

/** ===== Types from backend shape ===== */
type BackendLogEntry = {
  timestamp: string;   // ISO string
  message: string;
  log_stream?: string | null;
  log_group?: string | null;
};

type BackendExceptionsResponse = {
  count: number;
  exceptions: BackendLogEntry[];
  summary: string; // markdown-ish text
};

interface ExceptionsDashboardProps {
  environment: string;
  release: string;
  /** Not used by backend — we keep it for existing API. */
  timeRange?: "hourly" | "daily";
  /** Not used by backend — kept to preserve UI. */
  cluster?: string;
  namespace?: string;
  activeFilters?: string[];
  onFiltersChange?: (filters: string[]) => void;
}

/** Derived table row for UI */
interface ExceptionRow {
  id: string;
  timestamp: string;     // displayable local string
  type: string;          // extracted from message when possible
  message: string;
  servicePod: string;    // derived from log_stream (best-effort)
  clusterNS: string;     // derived from log_group (best-effort)
  count: number;         // fixed 1 per log line; we still compute KPIs across the list
  firstSeen: string;
  lastSeen: string;
  severity: "Critical" | "High" | "Medium" | "Low"; // heuristic
  stackTrace: string;    // not available — leave blank
  k8sEvent: string;      // not available — leave blank
  tsMs: number;
}

export function ExceptionsDashboard({
  environment,
  release,
  timeRange = "hourly",
  cluster = "all",
  namespace = "all",
}: ExceptionsDashboardProps) {
  const [hours, setHours] = useState<number>(1); // 1, 2, 3, 4
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<string | null>(null);

  const [raw, setRaw] = useState<BackendExceptionsResponse | null>(null);
  const [rows, setRows] = useState<ExceptionRow[]>([]);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [showPromptForm, setShowPromptForm] = useState<boolean>(false);
  const [promptText, setPromptText] = useState<string>("Summarize recent failures");
  const [nlpLoading, setNlpLoading] = useState<boolean>(false);

  // --- Pagination state (10 rows per page) ---
  const rowsPerPage = 10;
  const [currentPage, setCurrentPage] = useState<number>(1);

  /** ===== Fetch exceptions from backend ===== */
  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        setIsLoading(true);
        setHasError(null);
        const data = await getExceptions(hours); // GET /v1/logs/exceptions?hours=<hours>
        if (aborted) return;

        setRaw(data);
        setAiSummary(data.summary || "");
        // Map backend items to our table rows
        const mapped = (data.exceptions || []).map((e, idx) => mapBackendLogToRow(e, idx));
        setRows(mapped);
        setCurrentPage(1); // ensure we start at first page after fetch
      } catch (err: any) {
        setHasError(err?.message || "Failed to load exceptions");
      } finally {
        if (!aborted) setIsLoading(false);
      }
    })();

    return () => { aborted = true; };
  }, [hours]);

  /** ===== Heuristics & helpers ===== */
  function mapBackendLogToRow(e: BackendLogEntry, idx: number): ExceptionRow {
    const when = new Date(e.timestamp);
    const local = isNaN(when.getTime()) ? e.timestamp : when.toLocaleString();

    // naive type extraction based on message content
    const type = extractType(e.message);
    const severity = inferSeverity(type, e.message);

    // log_stream looks like "ecs/<service>/...." — take middle segment as pod/service best-effort
    const servicePod = (e.log_stream || "").split("/").slice(1, 3).join("/") || "unknown";
    // log_group looks like "ACCOUNT:/ecs/<service>" — show the tail two segments
    const lgParts = (e.log_group || "").split("/");
    const clusterNS = lgParts.length >= 2 ? `${lgParts.slice(-2).join("/")}` : (e.log_group || "unknown");

    return {
      id: `EX-${idx + 1}`,
      timestamp: local,
      type,
      message: e.message,
      servicePod,
      clusterNS,
      count: 1,
      firstSeen: local,
      lastSeen: local,
      severity,
      stackTrace: "",
      k8sEvent: "",
      tsMs: when.getTime(),
    };
  }

  function extractType(msg: string): string {
    // Pull out common error tokens
    if (/OutOfMemory/i.test(msg)) return "OutOfMemoryError";
    if (/NullPointer/i.test(msg)) return "NullPointerException";
    if (/Timeout/i.test(msg)) return "ConnectionTimeout";
    if (/RateLimit/i.test(msg)) return "RateLimitExceeded";
    if (/Internal Server Error/i.test(msg)) return "InternalServerError";
    if (/Neo\.ClientError\.[\w.]+/i.test(msg)) return "Neo4jClientError";
    return "Exception";
  }

  function inferSeverity(type: string, msg: string): ExceptionRow["severity"] {
    if (/OutOfMemory|InternalServerError|Neo4jClientError/i.test(type)) return "High";
    if (/Timeout/i.test(type)) return "Medium";
    if (/RateLimit/i.test(type)) return "Low";
    // bump to Critical if 5xx mentioned
    if (/ 5\d\d /.test(msg)) return "Critical";
    return "Medium";
  }

  /** ===== KPIs derived from rows ===== */
  const kpis = useMemo(() => {
    const total = rows.length;
    const high = rows.filter(r => r.severity === "High" || r.severity === "Critical").length;
    const timeouts = rows.filter(r => /Timeout/i.test(r.type)).length;
    const oom = rows.filter(r => /OutOfMemory/i.test(r.type)).length;

    // tiny deltas to keep your existing styling
    return [
      { label: "Total Exceptions", value: total, delta: 0, deltaType: "increase", icon: AlertCircle, color: "text-blue-600" },
      { label: "High/Critical", value: high, delta: 0, deltaType: "increase", icon: AlertCircle, color: "text-red-600" },
      { label: "Timeouts", value: timeouts, delta: 0, deltaType: "increase", icon: AlertCircle, color: "text-yellow-600" },
      { label: "OOMKilled", value: oom, delta: 0, deltaType: "increase", icon: AlertCircle, color: "text-orange-600" },
      { label: "Unique Services", value: new Set(rows.map(r => r.servicePod)).size, delta: 0, deltaType: "increase", icon: AlertCircle, color: "text-green-600" },
    ] as const;
  }, [rows]);

  /** ===== Simple chart data (group by type over time “buckets”) ===== */
  const chartData = useMemo(() => {
    // Make 6 buckets for the selected window
    const bucketCount = 6;
    const start = Date.now() - hours * 3600_000;
    const end = start + hours * 3600_000;
    const bucketMs = (hours * 3600_000) / bucketCount;

    const buckets = Array.from({ length: bucketCount }, (_, i) => ({
      time: new Date(start + i * bucketMs).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      OutOfMemoryError: 0,
      NullPointerException: 0,
      ConnectionTimeout: 0,
      RateLimitExceeded: 0,
      Exception: 0,
      InternalServerError: 0,
      Neo4jClientError: 0,
    }));

    rows.forEach((r) => {
      const ts = r.tsMs;
      if (!Number.isFinite(ts)) return;
      if (ts < start || ts > end) return;

      const idx = Math.min(
        buckets.length - 1,
        Math.max(0, Math.floor((ts - start) / bucketMs))
      );

      const key = (["OutOfMemoryError","NullPointerException","ConnectionTimeout","RateLimitExceeded","InternalServerError","Neo4jClientError"] as const)
        .includes(r.type as any)
        ? (r.type as keyof typeof buckets[number])
        : "Exception";
      (buckets[idx] as any)[key] = ((buckets[idx] as any)[key] || 0) + 1;
    });

    return buckets;
  }, [rows, hours]);

  /** ===== LLM summary (regenerate) ===== */
  const [isSummarizing, setIsSummarizing] = useState(false);
  async function regenerateSummary() {
    try {
      setIsSummarizing(true);
      const res = await postLogsNlp({ query: "Summarize recent failures", timeframe: { hours } });
      setAiSummary(res.answer || "");
      toast.success("Summary refreshed");
    } catch (e: any) {
      toast.error(`Failed to regenerate summary: ${e?.message || "unknown error"}`);
    } finally {
      setIsSummarizing(false);
    }
  }

  const handleCustomPromptSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();

    const query = promptText.trim();
    if (!query) {
      toast.error("Please enter a prompt");
      return;
    }

    try {
      setNlpLoading(true);
      const res = await postLogsNlp({
        query,
        timeframe: { hours }, // use your existing hours state
      });
      // res.answer is a markdown string from the backend
      setAiSummary(res.answer);
      toast.success("Summary updated from custom prompt");
      setShowPromptForm(false); // optional: collapse the form on success
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to generate summary";
      console.error(err);
      toast.error(msg);
    } finally {
      setNlpLoading(false);
    }
  };


  /** ===== UI helpers ===== */
  function getSeverityColor(sev: ExceptionRow["severity"]) {
    switch (sev) {
      case "Critical": return "bg-red-100 text-red-800";
      case "High": return "bg-orange-100 text-orange-800";
      case "Medium": return "bg-yellow-100 text-yellow-800";
      case "Low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  }

  /** ===== Drawers ===== */
  const ExceptionDetailDrawer = ({ row }: { row: ExceptionRow }) => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Eye className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[600px] max-w-[90vw]">
        <SheetHeader>
          <SheetTitle>Exception Details</SheetTitle>
        <SheetDescription>{row.type} — {row.id}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Service/Pod</Label>
              <p className="text-sm text-muted-foreground font-mono">{row.servicePod}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Log Group</Label>
              <p className="text-sm text-muted-foreground">{row.clusterNS}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">First Seen</Label>
              <p className="text-sm text-muted-foreground">{row.firstSeen}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Last Seen</Label>
              <p className="text-sm text-muted-foreground">{row.lastSeen}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Severity</Label>
              <Badge className={getSeverityColor(row.severity)}>{row.severity}</Badge>
            </div>
          </div>

          <Separator />

          <div>
            <Label className="text-sm font-medium">Message</Label>
            <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{row.message}</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );


  // --- Pagination helpers computed from rows ---
  const totalRows = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    const end = currentPage * rowsPerPage;
    return rows.slice(start, end);
  }, [rows, currentPage]);

  if (hasError) {
    return (
      <ErrorState
        title="Failed to load exceptions data"
        description={hasError}
        onRetry={() => { setHasError(null); setHours(h => h); }}
        retryLabel="Try Again"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Runtime Exceptions</h2>
          <p className="text-sm text-muted-foreground">
            {environment} • {release}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={String(hours)}
            onValueChange={(v) => setHours(Number(v))}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Hours" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last 1 hours</SelectItem>
              <SelectItem value="2">Last 2 hours</SelectItem>
              <SelectItem value="3">Last 3 hours</SelectItem>
              <SelectItem value="4">Last 4 hours</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={() => setHours(h => h)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-5"
      >
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <CardKPI
              title={kpi.label}
              value={kpi.value}
              delta={kpi.delta}
              deltaType={kpi.deltaType as any}
              icon={kpi.icon}
              iconColor={kpi.color}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Exception Trends */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Exception Trends</CardTitle>
              <CardDescription>Count of key exception types over the selected window</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[320px] flex items-center justify-center">
              <div className="space-y-3 w-full">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-8 w-1/2" />
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <RechartsTooltip />
                <Area type="monotone" dataKey="OutOfMemoryError" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.5} />
                <Area type="monotone" dataKey="NullPointerException" stackId="1" stroke="#f97316" fill="#f97316" fillOpacity={0.5} />
                <Area type="monotone" dataKey="ConnectionTimeout" stackId="1" stroke="#eab308" fill="#eab308" fillOpacity={0.5} />
                <Area type="monotone" dataKey="RateLimitExceeded" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.5} />
                <Area type="monotone" dataKey="InternalServerError" stackId="1" stroke="#64748b" fill="#64748b" fillOpacity={0.5} />
                <Area type="monotone" dataKey="Neo4jClientError" stackId="1" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.5} />
                <Area type="monotone" dataKey="Exception" stackId="1" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.4} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* LLM Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>AI Summary</CardTitle>
              <CardDescription>Root-cause hypothesis & suggested next actions</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={regenerateSummary} disabled={isSummarizing}>
                {isSummarizing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Brain className="h-4 w-4 mr-2" />}
                {isSummarizing ? "Generating..." : "Regenerate"}
              </Button>
              <Button variant="outline" size="sm" className="ml-2" onClick={() => setShowPromptForm((prev) => !prev)}>
                Custom Summary
              </Button>
            </div>
          </div>
        </CardHeader>
        {showPromptForm && (
          <div className="px-6 pb-4">
            <form onSubmit={handleCustomPromptSubmit} className="flex gap-2 items-start">
              <input
                type="text"
                value={promptText}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPromptText(e.target.value)
                }
                placeholder='Ask something like: "Cluster by service and give counts; flag anomalies"'
                className="flex-1 rounded-md border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm outline-none focus:ring-2"
              />
              <Button type="submit" size="sm" disabled={nlpLoading}>
                {nlpLoading ? "Generating..." : "Run"}
              </Button>
            </form>
          </div>
        )}
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-[90%]" />
              <Skeleton className="h-4 w-[80%]" />
              <Skeleton className="h-4 w-[70%]" />
            </div>
          ) : aiSummary ? (
            <div className="prose prose-sm max-w-none whitespace-pre-wrap">{aiSummary}</div>
          ) : (
            <div className="text-sm text-muted-foreground">No summary available for this window.</div>
          )}
        </CardContent>
      </Card>

      {/* Exceptions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Exceptions ({rows.length})</CardTitle>
              <CardDescription>
                Showing raw exception lines from backend (window: last {hours}h)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingState variant="table" />
          ) : rows.length === 0 ? (
            <EmptyState variant="exceptions" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Service/Pod</TableHead>
                    <TableHead>Log Group</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.timestamp}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{r.type}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xl">
                        <div className="truncate" title={r.message}>{r.message}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{r.servicePod}</TableCell>
                      <TableCell className="text-xs">{r.clusterNS}</TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(r.severity)}>{r.severity}</Badge>
                      </TableCell>
                      <TableCell>
                        <ExceptionDetailDrawer row={r} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination controls */}
              <div className="flex items-center justify-between mt-4 text-sm">
                <div>
                  Showing {(currentPage - 1) * rowsPerPage + 1}–
                  {Math.min(currentPage * rowsPerPage, rows.length)} of {rows.length}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= Math.max(1, Math.ceil(rows.length / rowsPerPage))}
                    onClick={() => setCurrentPage(p => Math.min(Math.max(1, Math.ceil(rows.length / rowsPerPage)), p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
