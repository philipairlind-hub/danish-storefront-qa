# PRD — Danish Storefront QA

Version 0.2, 30.10.2026 (efter uafhængig revision). Status: **Fase 1 er klar til ejerens godkendelse (0 kr, internt værktøj). Fase 1.5 er blokeret af Gate A, fase 2 af Gate B** (se `research/decision.md`).

## 1. Problem og evidens

Udenlandske webshops lancerer dansk med AI- eller maskinoversættelse. Tilbage står svenske og engelske rester, uoversatte tema-nøgler og formatfejl, og teksten kan være korrekt dansk uden at lyde naturlig.

- Betalt efterspørgsel er dokumenteret som service på Upwork (svensk dyrebrand, USD 17–45/t).
- Egen scanning af 29 offentlige forsider: 12 af 27 analyserbare havde mindst ét maskinelt fund.
- Kilder: `research/evidence-ledger.csv`, P05.

## 2. Målgruppe og job

- **Køber:** Grundlægger eller e-handelsansvarlig i et udenlandsk DTC-brand eller en webshop med dansk site (1–50 ansatte).
- **Job-to-be-done:** "Før og efter vi går live på dansk, vil jeg vide, hvad en dansk kunde ser, som er forkert, og have rettelser, jeg kan sætte direkte ind."
- **Nuværende alternativ:** Freelance-korrekturlæser på timebasis, brandets egen AI, MakesYouLocal (enterprise) eller ingenting.
- **Aktiveringsøjeblik:** Kunden modtager første fejllog med mindst ét fund, de ikke kendte, og retter det.

## 3. Personas

| Persona | Behov | Bruger produktet sådan |
|---|---|---|
| Ejer (Philip), reviewer | Mindre tid på mekaniske fejl, mere på sproglig vurdering | Kører scanner, triagerer og skriver rettelser |
| Køber (e-handelsansvarlig) | En liste, der kan handles på, uden møder | Modtager rapport (Markdown/XLSX via Upwork) |
| (Fase 2) Køberens udvikler | Vide hvilke nøgler/filer der skal rettes | Læser rapportens "evidence"-kolonne |

## 4. Fase 1 — kerneflow (bygges nu)

1. Reviewer indtaster 1–50 URL'er (eller en sitemap-URL med en grænse).
2. Værktøjet henter hver side én gang med SSRF-sikkerhed, timeout og størrelsesgrænse og kører tjek T1–T4 og F1–F4.
3. Netværksfejl, 403/429 og JS-renderede sider markeres **inconclusive**. De er aldrig fund.
4. Rapportgeneratoren laver en fejllog i Markdown og XLSX med kolonnerne *Suggested fix* og *Reviewer verdict* tomme til reviewer.
5. **Synlighedsfilter:** Skjulte inputs og `hidden`/`aria-hidden`-elementer ignoreres. T1-fund rapporteres med placering (synlig tekst, attribut eller script), så kun synlige fund vises som "synlig".

**Fase 1.5 (først efter Gate A):** Diff-mode (kun nye fund mellem to kørsler) og ordlistetjek (CSV-termliste). Begge tjener RECURRING og bygges derfor ikke, før nogen har betalt for gentagelse.

### Accept-kriterier (fase 1)

- [ ] Fixture-testen (`fixture_demo_store.html`) udløser alle 8 tjek. Tests ligger i repoet og kører i CI.
- [ ] `<input type="hidden">` ignoreres. Test med en fixture, hvor en skjult værdi er "newsletter".
- [ ] Brandnavne med ä/ö (BabyBjörn, Röhnisch, Isbjörn) giver **ingen** T4-fund. Regressionstest med de strenge, der gav falske fund i v0.1.
- [ ] Svenske UI-ord ("Sök", "Köpvillkor", "Gå till våra möbler") giver T4-fund (regressionstest).
- [ ] Shopify "Translation missing: da.…" giver T1-fund i både tekst og attributter.
- [ ] Private IP'er, localhost, ikke-http(s), credentials i URL og redirect til privat adresse afvises (SSRF-tests).
- [ ] Højst 1 request pr. URL pr. kørsel, timeout 15 s, max 2 MB og en identificerende User-Agent.
- [ ] T1 angiver placering (text/attribute/script). Et "Translation missing" inde i `<script>` markeres ikke som synligt.
- [ ] XLSX-rapporten åbner uden fejl, og kolonneoverskrifterne er som i `sales/sample-report.md`.
- [ ] Ingen netværkskald i unit-tests. Live-kørsler er et separat, manuelt script.

## 5. Fase 2 — "Watch" (blokeret indtil Gate B: ≥3 betalende RECURRING-kunder)

- Ugentlig scanning i skyen (Cloudflare Workers Cron) af op til 50 URL'er pr. kunde. Resultater gemmes i D1.
- Ved nye fund: privat rapportlink med token, plus besked til reviewer, som triagerer før noget sendes til kunden.
- Ingen offentlig selvbetjent tilmelding. Kunder oprettes manuelt (invite-only).
- Betaling via Upwork-kontrakt. Stripe først efter `revenue/BILLING_FLOW.md`-betingelserne.
- Dataretention: rå HTML gemmes ikke, kun fund (evidence ≤160 tegn). Slettes 90 dage efter kontraktens ophør.

## 6. Non-goals

Oversættelse fra bunden, AI-genererede rettelser til kunder uden menneskelig kontrol, juridisk eller compliance-vurdering (GPSR, forbrugerret, EAA), SEO-garantier, andre sprog end dansk, crawling ud over de angivne URL'er, login bag kundens adgangskode, rigtige testkøb, en offentlig SaaS-tilmelding og et dashboard.

## 7. Instrumentering

Pr. kørsel: antal URL'er, analyserbare, inconclusive, fund pr. tjek og varighed. Pr. leverance (manuelt logget): reviewer-minutter pr. fase og antal fund bekræftet vs. afvist. Det giver præcision pr. tjek, og præcision under 60 % på et tjek betyder, at tjekket rettes eller fjernes. Ingen tracking af slutkunder.

## 8. Antagelser og reversible beslutninger

- Python CLI i fase 1 er reversibel. Tjekkene kan porteres til TypeScript i fase 2.
- At homepage + 4 nøglesider afslører nok til at sælge ENTRY er en antagelse, der testes ved første levering.
- Dataklassifikation: Offentlige sider er offentlige data. Kundefiler (Word/Excel) er fortrolige og må kun behandles lokalt og kun i AI-værktøjer med skriftligt samtykke.
