import { saveAs } from "file-saver";
import Papa from "papaparse";
import type { VulnerabilityDTO } from "../types/vulnerability";

export function exportVulnerabilitiesToCSV(
  data: (VulnerabilityDTO & { aiSuggestion?: string })[],
  filename = "vulnerabilities_export.csv"
) {
  if (!data?.length) {
    alert("No vulnerabilities to export.");
    return;
  }

  const formatted = data.map((v) => ({
    CVE: v.name || v.cve_id || "",
    Severity: v.severity || "",
    Package: v.package_name || "",
    "Installed Version": v.package_version || "",
    "Fixed Version": v.fixed_version || "",
    Repo: v.repo || "",
    Image: v.image || "",
    "First Seen Time": v.first_seen_time || v.nvd_published_date || "",
    CVSS: v.nvd_cvss_v3_score ?? v.cvss_score ?? "",
    Description: (v.description || "").replace(/\r?\n|\r/g, " "),
    Remediation: v.aiSuggestion || "",
  }));

  const csv = Papa.unparse(formatted);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, filename);
}
