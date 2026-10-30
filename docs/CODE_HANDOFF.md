# Claude Code handoff — Danish Storefront QA

Dato: 30.10.2026. Claude Code er **ikke** startet (projektregel). Ejeren indsætter prompten nederst i Claude Code.

## Mandat

- **Fase 1 (kræver ejerens OK, 0 kr):** Gør prototypen til et testet internt CLI-værktøj med SSRF-sikker fetch, synlighedsfilter og rapport. Ingen cloud-deploy, ingen betaling, intet offentligt.
- **Fase 1.5 (blokeret af Gate A):** Diff-mode og ordlistetjek.
- **Fase 2 (blokeret af Gate B, ≥3 betalende RECURRING-kunder):** Cloudflare Worker "Watch". Kræver ejerens skriftlige GO.

## Repo

- **Ny privat repo:** `philipairlind-hub/danish-storefront-qa`. Den skal oprettes af ejeren eller af Claude Code med ejerens OK. GitHub-tokenet i Cowork-sessionen var ugyldigt den 30.10, så repoet er ikke oprettet.
- Startfiler ligger på Noh: `PENGE MULIGHEDER/SAAS_VENTURE_STUDIO_2026-10-30/product/prototype/`. Det er `da_storefront_check.py` v0.4 (SHA-256 `91eb77fd…185e`), `render_report.py`, `fixture_demo_store.html` og demo-JSON'er.
- **Genbrug til fase 2 (kopiér, merge ikke):** SSRF-sikker fetch fra den private repo `philipairlind-hub/seo-regression-guard`. Den har scheme/port/credential-tjek, IP-literal-blokering, DNS-over-HTTPS-tjek pr. redirect-hop, timeouts og 76 tests. Den repo må ikke ændres.

## Fase 1 — opgaver

1. Opret struktur: `src/dsqa/{fetch.py,checks.py,report.py,cli.py}`, `tests/`, `fixtures/`, `pyproject.toml` og GitHub Actions CI (pytest, ingen netværk).
2. Flyt tjekkene T1–T4 og F1–F4 uændret, og lås adfærden med regressionstests fra `product/QA_REPORT.md` (brandnavne, "Sök", "Köpvillkor", "Translation missing", "hos"/"fri").
3. Ret kendte fejl: Ignorér `<input type="hidden">` og elementer med `hidden`/`aria-hidden="true"`. T1 skal rapportere placering (text/attribute/script) i stedet for en ren regex over rå HTML.
4. SSRF-sikker fetch i Python: kun http/https på port 80/443, afvis credentials i URL, afvis private/reserverede IP'er (efter DNS-opslag og ved hvert redirect, maks 5 hop), 15 s timeout, 2 MB loft, én request pr. URL og en identificerende User-Agent. Netværksfejl giver `inconclusive`.
5. `report.py`: Markdown (som `sales/sample-report.md`) og XLSX via `openpyxl` med kolonnerne #, Page, Check, Severity, Evidence, Suggested fix, Reviewer verdict.
6. `cli.py`: `dsqa scan URL... --out run.json` og `dsqa report run.json --xlsx out.xlsx [--anonymise]`. Sitemap-input må højst give 50 URL'er.
7. (Fase 1.5, ikke nu) `diff.py` og `glossary.py`, se PRD §4.
8. `scripts/live_smoke.sh` (manuel, ikke i CI): kører mod 3 offentlige URL'er og skriver resultatet i `QA_REPORT.md`.
9. README: formål, begrænsninger, "machine findings are candidates", og at kundefiler ikke må sendes til AI uden samtykke.

**Definition of done (fase 1):** Alle accept-kriterier i `product/PRD.md` §4 er grønne i CI. `QA_REPORT.md` er opdateret med kommando og output. Der er åbnet en PR mod `main`. Den merges ikke uden ejerens OK.

## Fase 2 — arkitektur (spec, må ikke bygges endnu)

```
Cron (Workers, ugentligt) ─► scan-queue (D1-tabel)        ┌─► D1: findings, runs, clients, tokens
                              │                            │
                              └► fetch (SSRF-safe) ─► checks (TS-port af T1–F4) ─► diff mod forrige run
                                                                         │
                                       reviewer-notifikation ◄───────────┘
                                       (kun nye fund; reviewer triagerer før klienten ser noget)
Klient ─► GET /r/{token} (privat, read-only rapport; token 128-bit, kan tilbagekaldes)
```

- **Platform:** Cloudflare Workers + D1. Free: 100k requests/dag og 10 ms CPU pr. invocation. Paid: USD 5/md med 30 mio. CPU-ms. Parsing af store sider kan overskride 10 ms, og så kræves Paid, som skal godkendes af ejeren.
- **Miljøvariabler (kun navne):** `REVIEWER_NOTIFY_URL`, `REPORT_TOKEN_PEPPER`, `SCAN_USER_AGENT`, `MAX_URLS_PER_CLIENT`, `LIVE_PAYMENTS_APPROVED` (default `false`), `STRIPE_SECRET_KEY` og `STRIPE_WEBHOOK_SECRET` (kun test-nøgler indtil GO).
- **Miljøer:** `staging` og `production` som separate Workers og D1-databaser. Ingen deling af data.
- **Fejltilstande:** Kundens site blokerer (403/429) giver inconclusive og ingen alarm. Cron fejler giver en "check failing"-besked efter 2 mislykkede kørsler. D1-kvoten nås, og så stopper skrivninger, hvilket alarmerer reviewer.
- **Backup:** Ugentligt D1-eksport til privat lager. Restore testes én gang før første kunde.
- **Lock-in:** Lav. Tjekkene er ren kode, og D1 er SQLite. Port til en anden runtime tager få dage.
- **Opgraderingstriggere:** CPU-fejl på Free → Paid (ejer-OK). Mere end 50 URL'er pr. kunde eller JS-sider → vurdér Browser Rendering (betalt, pris ukendt) → ejer-OK.
- **Sikkerhed (skal testes):** Tenant-isolation pr. token, ingen kundedata i logs, rate limit pr. token, SSRF-tests, og hvis Stripe kommer i spil: forfalsket webhook afvises, idempotens og udløbet abonnement stopper scanninger.

## Kopierbar prompt til Claude Code (fase 1)

```text
Du er implementerende softwareagent for Danish Storefront QA, fase 1 (internt CLI-værktøj). Læs først disse filer, som ejeren lægger i repoets docs/-mappe: PRD.md, CODE_HANDOFF.md, QA_REPORT.md og sample-report.md. Startkoden ligger i prototype/ (da_storefront_check.py v0.4, render_report.py, fixture_demo_store.html, demo-JSON).

Regler:
- Arbejd i den private repo philipairlind-hub/danish-storefront-qa på en feature-branch. Opret repoet kun, hvis ejeren har skrevet OK i denne session.
- Implementér KUN fase 1 i CODE_HANDOFF.md, opgave 1-9. Ikke diff, ordliste eller cloud. Ingen Cloudflare-deploy, ingen Stripe, ingen offentlig publicering, ingen betalte API'er eller LLM-kald.
- Bevar tjekkenes adfærd, og lås den med regressionstests før refaktorering. Ret kun den kendte fejl (skjulte felter).
- Unit-tests må ikke lave netværkskald. live_smoke.sh køres kun manuelt og højst mod 3 offentlige URL'er.
- Skriv aldrig hemmeligheder i repo, filer eller prompts.
- Opdatér QA_REPORT.md med præcise kommandoer og observeret output. Det, der fejler, markeres FAIL.

Afslut med: branch, commit-hash, PR-link (ikke merget), testresultat (antal pass/fail), kendte begrænsninger og præcise blokeringer.
```
