// Supabase Edge Function: dsqa-scan
// POST {"url": "https://example.dk/"} -> JSON scan result for ONE public page.
// Abuse controls: SSRF-safe fetch (public IPs only, ports 80/443, re-validated per redirect),
// per-IP and global rate limits enforced atomically in Postgres (dsqa_register_scan).
// Privacy: only a daily-rotating salted hash of the caller IP is stored, for 30 days.
import { USER_AGENT } from "./lib/config.ts";
import { dohResolver } from "./lib/safety.ts";
import { scanUrl } from "./lib/scan.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

function serviceKey(): string | undefined {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  try {
    const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}");
    return keys.default ?? Object.values(keys)[0] as string | undefined;
  } catch {
    return undefined;
  }
}

async function ipHash(ip: string): Promise<string> {
  const day = new Date().toISOString().slice(0, 10);
  const data = new TextEncoder().encode(`${ip}|${day}|dsqa`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

async function register(hash: string, host: string): Promise<{ allowed: boolean; reason?: string }> {
  const url = Deno.env.get("SUPABASE_URL");
  const key = serviceKey();
  if (!url || !key) return { allowed: false, reason: "server_not_configured" }; // fail closed
  const res = await fetch(`${url}/rest/v1/rpc/dsqa_register_scan`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_ip_hash: hash, p_host: host.slice(0, 253) }),
  });
  if (!res.ok) return { allowed: false, reason: "rate_limit_unavailable" };
  return await res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "Use POST with a JSON body {\"url\": \"...\"}." }, 405);
  let body: { url?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "Body must be JSON." }, 400);
  }
  const raw = typeof body.url === "string" ? body.url.trim() : "";
  if (!raw || raw.length > 2048) return json({ ok: false, error: "Send one URL (max 2048 characters)." }, 400);

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  let host = "invalid";
  try {
    host = new URL(/^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`).hostname;
  } catch { /* validated again in scanUrl */ }
  const gate = await register(await ipHash(ip), host);
  if (!gate.allowed) {
    const status = gate.reason === "server_not_configured" || gate.reason === "rate_limit_unavailable" ? 503 : 429;
    return json({ ok: false, error: status === 429 ? "Scan limit reached. Please try again later." : "Scanner temporarily unavailable.", reason: gate.reason }, status);
  }

  const result = await scanUrl(raw, {
    fetch: (input, init) => fetch(input, init),
    resolve: dohResolver((input, init) => fetch(input, init)),
    now: () => Date.now(),
    userAgent: USER_AGENT,
    selfHosts: ["supabase.co", "supabase.in"],
  });
  return json(result, 200);
});
