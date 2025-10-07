const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export async function getVulnerabilities(params?: {
  env?: string;
  release_id?: string;
  timeframe?: "last-build" | "1d" | "1w" | "1m";
  severity?: string[];            // e.g., ["CRITICAL","HIGH"]
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
    const sev = params.severity.map(s => s.toUpperCase().trim()).join(",");
    q.set("severity", sev);
  }

  const r = await fetch(`${API}/v1/vulnerabilities/?${q.toString()}`);
  if (!r.ok) throw new Error(`GET vulnerabilities failed: ${r.status}`);
  return (await r.json()) as import("../types/vulnerability").VulnerabilityDTO[];
}

export async function suggestRemediation(body: {
  name: string;              // CVE id
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
