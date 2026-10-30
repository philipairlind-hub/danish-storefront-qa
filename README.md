# Danish Storefront QA

Free one-page scan for leftover English and Swedish text on Danish webshops, plus a fixed-price native Danish review (sold via Upwork).

## Parts
- `supabase/functions/dsqa-scan/` — Supabase Edge Function (Deno). POST `{"url": "..."}` returns machine findings for ONE public page.
  SSRF-safe fetch (public IPs only, ports 80/443, re-validated per redirect; adapted from `seo-regression-guard`), 12 s timeout, 2 MB cap.
  Rate limits in Postgres: 10 scans/hour per caller, 300/day total (`supabase/migrations/20261030_scan_events.sql`).
  Stores only the scanned domain and a daily-rotating salted IP hash, deleted after 30 days.
- `web/page.html` — product page source (artifact fragment). `web/index.html` = static-hosting build. `web/artifact.html` = preview build (scanner disabled).
- `cli/scan.ts` — local delivery CLI: `deno run --allow-net cli/scan.ts --md URL...` writes a Markdown issue log.
- `test/` — `deno test --allow-net=none test/` (14 tests: checks, regressions, SSRF, scan states).
- `docs/` — PRD, handoff, QA report, offer, sample report. Internal research, prospects and economics are kept outside the repo (owner folder + Notion).

## Deployed
- Supabase project `danish-storefront-qa` (ref `jgmvatoywfebukdaagle`, eu-north-1, free plan). Function `dsqa-scan` v1, `verify_jwt=true` (callers send the public anon key).
- Product page: not publicly hosted yet (needs owner approval). Private preview exists as a Claude artifact.

## Limits (honest)
Machine findings are candidates. The scanner cannot judge whether Danish reads naturally, cannot see JavaScript-rendered text,
and sees the page as a visitor in Sweden would (geo-dependent shops may differ). Attribute findings (alt, title, aria-label) are often not visible.
