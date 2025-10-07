import type { VulnerabilityDTO } from "../types/vulnerability";
import { suggestRemediation } from "../services/api";

// We keep a simple in-memory cache per session so repeated exports are fast.
const memo = new Map<string, string>();

export type VulnerabilityWithAI = VulnerabilityDTO & { aiSuggestion?: string };

function suggestionKey(v: VulnerabilityDTO) {
  // Keyed by CVE + pkg + version to keep it stable per vuln instance
  const cve = (v.name || v.cve_id || "").trim();
  const pkg = (v.package_name || "").trim();
  const ver = (v.package_version || "").trim();
  return `${cve}::${pkg}::${ver}`;
}

async function fetchSuggestionFor(v: VulnerabilityDTO): Promise<string> {
  const key = suggestionKey(v);
  if (memo.has(key)) return memo.get(key)!;

  // Backend expects: name (CVE), severity, package name/version, (optional) description
  const res = await suggestRemediation({
    name: v.name || v.cve_id || "",
    severity: v.severity || "",
    package_name: v.package_name,
    package_version: v.package_version,
    description: v.description || v.nvd_description || "",
  });

  const text = res?.suggestion || "";
  memo.set(key, text);
  return text;
}

/**
 * Enrich a list of vulnerabilities with AI suggestions where missing.
 * Concurrency-limited to avoid hammering the backend.
 */
export async function enrichWithSuggestions(
  rows: VulnerabilityWithAI[],
  { concurrency = 4 } = {}
): Promise<VulnerabilityWithAI[]> {
  const out = [...rows];
  let idx = 0;
  async function worker() {
    while (idx < out.length) {
      const i = idx++;
      const v = out[i];
      // Skip if already has AI text
      if (v.aiSuggestion && v.aiSuggestion.trim().length > 0) continue;

      try {
        const s = await fetchSuggestionFor(v);
        out[i] = { ...v, aiSuggestion: s };
      } catch {
        // Leave blank on error; export will show empty "Remediation"
      }
    }
  }

  const workers = Array.from({ length: Math.max(1, concurrency) }, worker);
  await Promise.all(workers);
  return out;
}
