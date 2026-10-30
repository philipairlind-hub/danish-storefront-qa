import { LIMITS, USER_AGENT } from "./config.ts";
import { CheckContext, fetchChain, type Deps } from "./http.ts";
import { normalizeInput, SafetyError, validateUrl } from "./safety.ts";
import { runChecks, type Finding } from "./checks.ts";

export interface ScanResponse {
  ok: boolean;
  url: string;
  finalUrl?: string;
  status?: number;
  inconclusive?: { code: string; message: string };
  htmlLang?: string | null;
  textNodes?: number;
  findings?: Finding[];
  summary?: Record<string, number>;
  visibleFindings?: number;
  scannedAt: string;
  version: string;
  note: string;
}

const NOTE =
  "Machine findings are candidates, not verdicts. One public page was fetched once. " +
  "A scanner cannot judge whether Danish text reads naturally; that needs a native reviewer.";

export async function scanUrl(rawUrl: string, deps: Deps): Promise<ScanResponse> {
  const scannedAt = new Date(deps.now()).toISOString();
  const base = { scannedAt, version: "1.0.0", note: NOTE };
  let u: URL;
  try {
    u = validateUrl(normalizeInput(rawUrl), deps.selfHosts);
  } catch (e) {
    const err = e instanceof SafetyError ? e : new SafetyError("invalid_url", "This is not a valid URL.");
    return { ok: false, url: rawUrl, inconclusive: { code: err.code, message: err.message }, ...base };
  }
  const ctx = new CheckContext(deps, LIMITS.totalBudgetMs);
  const chain = await fetchChain(u, ctx, {
    maxRedirects: LIMITS.maxRedirects,
    maxBytes: LIMITS.maxHtmlBytes,
    stopAtHeadEnd: false,
    accept: "text/html,application/xhtml+xml",
    acceptLanguage: "da-DK,da;q=0.9",
  });
  if (chain.error || !chain.final) {
    return { ok: false, url: u.href, inconclusive: chain.error ?? { code: "no_response", message: "No response." }, ...base };
  }
  const f = chain.final;
  if (f.status !== 200) {
    const msg = f.status === 403 || f.status === 429
      ? `The site answered HTTP ${f.status}; it may block automated checks. This is not a finding.`
      : `The page answered HTTP ${f.status}. This is not a finding.`;
    return { ok: false, url: u.href, finalUrl: f.url, status: f.status, inconclusive: { code: `http_${f.status}`, message: msg }, ...base };
  }
  const ctype = f.headers.get("content-type") ?? "";
  if (ctype && !/html/i.test(ctype)) {
    return { ok: false, url: u.href, finalUrl: f.url, status: f.status, inconclusive: { code: "not_html", message: `The URL returned ${ctype}, not an HTML page.` }, ...base };
  }
  const r = runChecks(f.body);
  if (r.textNodes < 5) {
    return {
      ok: false, url: u.href, finalUrl: f.url, status: f.status, htmlLang: r.htmlLang, textNodes: r.textNodes,
      inconclusive: { code: "client_rendered", message: "The page has almost no server-rendered text (it is probably built by JavaScript), so it cannot be checked this way." },
      ...base,
    };
  }
  return {
    ok: true, url: u.href, finalUrl: f.url, status: f.status, htmlLang: r.htmlLang, textNodes: r.textNodes,
    findings: r.findings.slice(0, 60), summary: r.summary, visibleFindings: r.visibleFindings, ...base,
  };
}
