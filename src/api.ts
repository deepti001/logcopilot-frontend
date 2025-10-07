const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export async function ingestVulns(path: string, env: string, releaseId: string) {
  const r = await fetch(`${API_BASE}/ingest/vulns/local`, {
    method: "POST", headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ path, env, release_id: releaseId }),
  });
  if (!r.ok) throw new Error(await r.text()); return r.json();
}

export async function ingestRuntime(path: string, env: string, releaseId: string) {
  const r = await fetch(`${API_BASE}/ingest/runtime/local`, {
    method: "POST", headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ path, env, release_id: releaseId }),
  });
  if (!r.ok) throw new Error(await r.text()); return r.json();
}

export async function getStats(env: string, releaseId: string) {
  const r = await fetch(`${API_BASE}/stats/overview?env=${env}&release_id=${releaseId}`);
  if (!r.ok) throw new Error(await r.text()); return r.json();
}

export async function getVulns(env: string, releaseId: string) {
  const r = await fetch(`${API_BASE}/vulns?env=${env}&release_id=${releaseId}`);
  if (!r.ok) throw new Error(await r.text()); return r.json();
}

export async function getRuntime(env: string, releaseId: string, limit=200) {
  const r = await fetch(`${API_BASE}/runtime?env=${env}&release_id=${releaseId}&limit=${limit}`);
  if (!r.ok) throw new Error(await r.text()); return r.json();
}

export async function getRootCause(env: string, releaseId: string) {
  const r = await fetch(`${API_BASE}/runtime/rootcause?env=${env}&release_id=${releaseId}`);
  if (!r.ok) throw new Error(await r.text()); return r.json();
}

export async function searchAll(q: string, topK=30) {
  const r = await fetch(`${API_BASE}/search`, {
    method: "POST", headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ q, top_k: topK }),
  });
  if (!r.ok) throw new Error(await r.text()); return r.json();
}

export async function getClusters() {
  const r = await fetch(`${API_BASE}/clusters`);
  if (!r.ok) throw new Error(await r.text()); return r.json();
}
