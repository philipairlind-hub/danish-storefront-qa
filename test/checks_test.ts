import { assert, assertEquals } from "jsr:@std/assert@1";
import { runChecks } from "../supabase/functions/dsqa-scan/lib/checks.ts";
import { scanUrl } from "../supabase/functions/dsqa-scan/lib/scan.ts";
import { validateUrl, SafetyError } from "../supabase/functions/dsqa-scan/lib/safety.ts";

const FIXTURE = `<!doctype html><html lang="en"><head>
<link rel="alternate" hreflang="sv-se" href="/se"><link rel="alternate" hreflang="nb-no" href="/no"></head>
<body><nav><a href="/">Hjem</a><button aria-label="Search">x</button></nav>
<h1>Velkommen til vores butik</h1>
<button>Add to cart</button><span>Udsolgt</span>
<p>Free shipping on all orders over 499 kr and easy returns for your new favourite products.</p>
<p>Lägg i varukorg och betala i kassan</p>
<p>Pris: 199.95 kr</p><p>Fra 49 € i dag</p>
<p>Translation missing: da.products.product.add_to_cart</p>
<p>Vi sender din pakke med GLS, og du kan returnere varen inden for 30 dage.</p>
<script>var x="Add to cart"; window.t="Translation missing: da.general.search";</script>
</body></html>`;

Deno.test("fixture fires all eight checks", () => {
  const r = runChecks(FIXTURE);
  for (const c of ["T1", "T2", "T3", "T4", "F1", "F2", "F3", "F4"]) assert(r.summary[c] >= 1, `${c} should fire`);
});

Deno.test("T1 reports location: visible text vs script", () => {
  const r = runChecks(FIXTURE);
  const t1 = r.findings.filter((f) => f.check === "T1");
  assert(t1.some((f) => f.location === "text" && f.visible && f.severity === "high"));
  assert(t1.some((f) => f.location === "script" && !f.visible));
});

Deno.test("hidden inputs and hidden subtrees are ignored", () => {
  const html = `<html lang="da"><body>${"<p>Velkommen til butikken her</p>".repeat(5)}
    <input type="hidden" value="newsletter"><div hidden><button>Sign up</button></div>
    <span aria-hidden="true">Search</span><div style="display: none">Add to cart</div></body></html>`;
  const r = runChecks(html);
  assertEquals(r.summary.T2, 0, JSON.stringify(r.findings));
});

Deno.test("submit input value is still checked", () => {
  const r = runChecks(`<html lang="da"><body><form><input type="submit" value="Subscribe"></form></body></html>`);
  assertEquals(r.summary.T2, 1);
  assertEquals(r.findings[0].location, "attribute");
  assertEquals(r.findings[0].visible, false);
});

Deno.test("brand names with ä/ö are not flagged (regression v0.1)", () => {
  const html = `<html lang="da"><body><p>BabyBjörn</p><p>Röhnisch</p><p>Björn Axén Tools</p>
    <p>nyheder fra Isbjörn of Sweden</p><p>Drakenberg Sjölin</p></body></html>`;
  assertEquals(runChecks(html).summary.T4, 0);
});

Deno.test("Swedish UI words are flagged (regression)", () => {
  const html = `<html lang="da"><body><button value="Sök">x</button><a title="Köpvillkor" href="/k">Handelsbetingelser</a>
    <p>Allt för hemmet till lågt pris</p><a title="Gå till våra möbler" href="/m">Møbler</a></body></html>`;
  const t4 = runChecks(html).findings.filter((f) => f.check === "T4");
  assert(t4.some((f) => f.evidence.includes("Köpvillkor")));
  assert(t4.some((f) => f.evidence.includes("Allt för hemmet") && f.visible));
  assert(t4.some((f) => f.evidence.includes("våra möbler")));
});

Deno.test("'hos', 'fri' and 'Menu' are not false positives (regression v0.3)", () => {
  const html = `<html lang="da"><body><p>Hos os finder du fri fragt og et stort udvalg af møbler til hjemmet og haven.</p>
    <button>Menu</button></body></html>`;
  const r = runChecks(html);
  assertEquals(r.summary.T4, 0);
  assertEquals(r.summary.T2, 0);
});

Deno.test("Danish page with Danish lang produces no F1", () => {
  assertEquals(runChecks(`<html lang="da-DK"><body><p>Hej</p></body></html>`).summary.F1, 0);
});

Deno.test("SSRF: private and odd targets are rejected before any fetch", () => {
  for (const bad of ["http://127.0.0.1/", "http://[::1]/", "http://localhost/", "ftp://example.dk/",
    "https://user:pw@shop.dk/", "https://shop.dk:8080/", "http://10.0.0.5/", "https://intranet/", "http://169.254.169.254/latest/"]) {
    let threw = false;
    try { validateUrl(bad); } catch (e) { threw = e instanceof SafetyError; }
    assert(threw, `should reject ${bad}`);
  }
});

function fakeDeps(pages: Record<string, { status: number; body?: string; location?: string; ctype?: string }>, ips: Record<string, string[]> = {}) {
  let fetches = 0;
  return {
    deps: {
      fetch: (async (input: string | URL | Request) => {
        fetches++;
        const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
        const p = pages[url];
        if (!p) throw new Error("connection refused");
        const h = new Headers({ "content-type": p.ctype ?? "text/html; charset=utf-8" });
        if (p.location) h.set("location", p.location);
        return new Response(p.body ?? "", { status: p.status, headers: h });
      }) as typeof fetch,
      resolve: async (host: string) => ips[host] ?? ["93.184.216.34"],
      now: () => Date.now(),
      userAgent: "test",
      selfHosts: ["supabase.co"],
    },
    count: () => fetches,
  };
}

Deno.test("scan: redirect to a private address is not followed", async () => {
  const { deps } = fakeDeps({ "https://shop.dk/": { status: 302, location: "https://evil.dk/" } }, { "evil.dk": ["10.1.2.3"] });
  const r = await scanUrl("shop.dk", deps);
  assertEquals(r.ok, false);
  assertEquals(r.inconclusive?.code, "unsafe_redirect");
});

Deno.test("scan: 403 is inconclusive, not a finding", async () => {
  const { deps } = fakeDeps({ "https://shop.dk/": { status: 403, body: "no" } });
  const r = await scanUrl("https://shop.dk/", deps);
  assertEquals(r.ok, false);
  assertEquals(r.inconclusive?.code, "http_403");
  assertEquals(r.findings, undefined);
});

Deno.test("scan: JS-rendered page is inconclusive", async () => {
  const { deps } = fakeDeps({ "https://shop.dk/": { status: 200, body: `<html lang="da"><body><div id="app"></div></body></html>` } });
  const r = await scanUrl("https://shop.dk/", deps);
  assertEquals(r.inconclusive?.code, "client_rendered");
});

Deno.test("scan: happy path returns findings with visibility", async () => {
  const { deps, count } = fakeDeps({ "https://shop.dk/": { status: 200, body: FIXTURE } });
  const r = await scanUrl("https://shop.dk/", deps);
  assert(r.ok);
  assert((r.visibleFindings ?? 0) > 0);
  assertEquals(count(), 1);
});

Deno.test("scan: self-reference to supabase is refused", async () => {
  const { deps } = fakeDeps({});
  const r = await scanUrl("https://abc.supabase.co/functions/v1/dsqa-scan", deps);
  assertEquals(r.inconclusive?.code, "self_reference");
});
