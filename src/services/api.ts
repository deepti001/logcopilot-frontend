// src/services/api.ts

const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";

/** ========================
 *  VULNERABILITIES SECTION
 *  ======================== */
export async function getVulnerabilities(params?: {
  env?: string;
  timeframe?: string;
  image_digest?: string;
  severity?: string[];
  repo?: string;
}) {
  const q = new URLSearchParams();
  if (params?.env) q.set("env", params.env);
  if (params?.repo) q.set("image", params.repo);
  if (params?.image_digest) {
    q.set("image_digest", params.image_digest);
  } else if (params?.timeframe) q.set("timeframe", params.timeframe);
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
// services/api.ts
export async function getExceptions(
  type: "hours" | "minutes" | "time-range" = "hours",
  value: number | null = 6,
  startTime?: string | null,
  endTime?: string | null,
  podName?: string | null,
) {
  const params = new URLSearchParams();

  if (type === "hours" || type === "minutes") {
    if (value !== null) params.append(type, String(value));
  } else if (type === "time-range" && startTime && endTime) {
    params.append("start_time", startTime);
    params.append("end_time", endTime);
  }

  if(podName) params.append("podname", podName);

  const r = await fetch(`${API}/v1/logs/exceptions?${params.toString()}`);
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

/** ========================
 *  ENVIRONMENTS SECTION
 *  ======================== */
export async function getEnvironments(): Promise<string[]> {
  const r = await fetch(`${API}/v1/dashboard/environments`);
  if (!r.ok) throw new Error(`GET environments failed: ${r.status}`);
  return await r.json();
}


export async function getRepositories(): Promise<string[]> {
  const r = await fetch(`${API}/v1/dashboard/repositories`);
  if (!r.ok) throw new Error(`GET repositories failed: ${r.status}`);

  const urls = (await r.json()) as string[];

  const repoNames = urls
    .map((u) => {
      try {
        const parts = u.split("/").filter(Boolean);
        return parts[parts.length - 1] || u;
      } catch {
        return u;
      }
    })
    .filter(Boolean);

  return repoNames;
}


/** ========================
 *  PODS SECTION
 *  ======================== */
export async function getPods(environment: string): Promise<string[]> {
  if (!environment) return [];
  const r = await fetch(`${API}/v1/dashboard/pods?environment=${encodeURIComponent(environment)}`);
  if (!r.ok) throw new Error(`GET pods failed: ${r.status}`);
  return await r.json();
}


/** ========================
 *  LOG GROUPS SECTION
 *  ======================== */
export async function getLogGroups(environment: string): Promise<string[]> {
  if (!environment) return [];
  const r = await fetch(
    `${API}/v1/dashboard/log-groups?environment=${encodeURIComponent(environment)}`
  );
  if (!r.ok) throw new Error(`GET log groups failed: ${r.status}`);
  return await r.json();
}

/** ========================
 *  RELEASES MAP SECTION
 *  ======================== */
export async function getReleases(): Promise<Record<string, string>> {
  const r = await fetch(`${API}/v1/dashboard/releases`);
  if (!r.ok) throw new Error(`GET releases failed: ${r.status}`);
  return await r.json();
}
