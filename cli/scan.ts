// Local delivery CLI: scan several Danish pages with the same checks as the hosted scanner.
// Usage: deno run --allow-net cli/scan.ts [--md] URL [URL ...] > out.json|out.md
// Respects the same limits: one GET per URL, SSRF-safe, 12 s timeout, 2 MB cap.
import { USER_AGENT } from "../supabase/functions/dsqa-scan/lib/config.ts";
import { dohResolver } from "../supabase/functions/dsqa-scan/lib/safety.ts";
import { scanUrl, type ScanResponse } from "../supabase/functions/dsqa-scan/lib/scan.ts";

const args = Deno.args.filter((a) => a !== "--md");
const md = Deno.args.includes("--md");
if (!args.length) {
  console.error("Usage: deno run --allow-net cli/scan.ts [--md] URL [URL ...]");
  Deno.exit(2);
}
const deps = {
  fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init),
  resolve: dohResolver((input, init) => fetch(input, init)),
  now: () => Date.now(),
  userAgent: USER_AGENT,
};
const results: ScanResponse[] = [];
for (const url of args) results.push(await scanUrl(url, deps));

if (!md) {
  console.log(JSON.stringify(results, null, 2));
} else {
  const out = ["# Danish Storefront QA — machine pre-scan issue log", "",
    "Machine findings are candidates. The reviewer confirms each one before it reaches the client.", ""];
  for (const r of results) {
    out.push(`## ${r.finalUrl ?? r.url}`);
    if (!r.ok) { out.push(`Inconclusive — ${r.inconclusive?.message ?? "no response"}`, ""); continue; }
    if (!r.findings?.length) { out.push("No machine findings.", ""); continue; }
    out.push("| # | Check | Severity | Where | Evidence | Suggested fix | Reviewer verdict |", "|---|---|---|---|---|---|---|");
    r.findings.forEach((f, i) => {
      const where = f.location === "attribute" ? `attr ${f.attribute ?? ""}` : f.location;
      out.push(`| ${i + 1} | ${f.check} | ${f.severity} | ${where} | ${f.evidence.replaceAll("|", "/")} | | |`);
    });
    out.push("");
  }
  console.log(out.join("\n"));
}
