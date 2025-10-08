const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";

/** ========================
 *  VULNERABILITIES SECTION
 *  ======================== */
export async function getVulnerabilities(params?: {
  env?: string;
  release_id?: string;
  timeframe?: "last-build" | "1d" | "1w" | "1m";
  severity?: string[];
  repo?: string;
  image?: string;
}) {
  const q = new URLSearchParams();
  if (params?.env) q.set("env", params.env);
  if (params?.release_id) q.set("release_id", params.release_id);
  if (params?.timeframe) q.set("timeframe", params.timeframe);
  if (params?.repo) q.set("repo", params.repo);
  if (params?.image) q.set("image", params.image);
  if (params?.severity?.length) {
    const sev = params.severity.map((s) => s.toUpperCase().trim()).join(",");
    q.set("severity", sev);
  }

  const r = await fetch(`${API}/v1/vulnerabilities/?${q.toString()}`);
  if (!r.ok) throw new Error(`GET vulnerabilities failed: ${r.status}`);
  return (await r.json()) as import("../types/vulnerability").VulnerabilityDTO[];
}

export async function suggestRemediation(body: {
  name: string;
  severity: string;
  package_name?: string;
  package_version?: string;
  description?: string;
}) {
  const r = await fetch(`${API}/v1/vulnerabilities/suggest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`POST suggest failed: ${r.status}`);
  return (await r.json()) as import("../types/vulnerability").SuggestionResponse;
}

// TODO: Deprecate getRemediationSuggestion in favor of suggestRemediation by <date>
export async function getRemediationSuggestion(body: {
  name: string;
  severity: string;
  package_name?: string;
  package_version?: string;
  description?: string;
}): Promise<string> {
  const r = await suggestRemediation(body);
  return (r?.suggestion || "").trim();
}

/** ========================
 *  EXCEPTIONS SECTION
 *  ======================== */

/**
 * Fetch recent runtime exceptions.
 * GET /v1/logs/exceptions?hours=<int>
 */
export async function getExceptions(hours: number = 6) {
  const r = await fetch(`${API}/v1/logs/exceptions?hours=${hours}`);
  if (!r.ok) throw new Error(`GET exceptions failed: ${r.status}`);
  return (await r.json()) as {
    count: number;
    exceptions: {
      timestamp: string;
      message: string;
      log_stream?: string | null;
      log_group?: string | null;
    }[];
    summary: string;
  };
}

export type NLQueryRequest = {
  query: string;
  timeframe: { hours: number };
};

export type NLQueryResponse = {
  answer: string;   // markdown string
  used_logs: number;
};

/**
 * Request an AI summary of the recent exceptions.
 * POST /v1/logs/nlp
 */

export async function postLogsNlp(body: NLQueryRequest): Promise<NLQueryResponse> {
  const r = await fetch(`${API}/v1/logs/nlp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`POST /logs/nlp failed: ${r.status}`);
  return (await r.json()) as NLQueryResponse;
}