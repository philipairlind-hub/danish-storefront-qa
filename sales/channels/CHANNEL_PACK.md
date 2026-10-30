# Channel pack — Danish Storefront QA

Dato: 30.10.2026. Status: **KLAR TIL PUBLICERING, IKKE PUBLICERET.** Alle offentlige opslag kræver ejerens udtrykkelige OK. Det gælder hver kanal for sig, fordi offentliggørelse er blokeret uden det.

Fælles regler for alle kanaler:
- Priserne er de samme overalt: Entry USD 95 / Core USD 350 / Recurring USD 300 pr. md.
- Ingen påstande om tidligere kunder, anmeldelser eller "trusted by".
- Betaling sker via platformens egen escrow, aldrig udenom.
- Ingen eksterne links eller kontaktoplysninger, hvor platformen forbyder det (Upwork, Fiverr).
- Kunder fundet på en platform betales på den platform.

## Rækkefølge (begrundet)

| # | Kanal | Konto | Hvorfor i denne rækkefølge | Gebyr / betaling |
|---|---|---|---|---|
| 1 | **Upwork Project Catalog** + portfolio | Findes (Plus) | Købere søger aktivt. Kataloget giver inbound uden Connects. Profilen er allerede omlagt til dansk QA | 0–15 % pr. kontrakt (Upwork Help) |
| 2 | **Contra** (service) | Findes (24.10) | Konto og portfolio findes. Profilen kan pege på den hostede scanner | Ikke kontrolleret i dag |
| 3 | **LinkedIn** (Services-side + ét opslag) | Findes | Gratis. Viser tilbuddet for udenlandske e-handelsfolk i netværket. Kun inbound | Ingen betaling på LinkedIn. Køb sker via Upwork Direct Contract |
| 4 | **Hostet produktside med gratis scanner** | Kræver hosting-OK | Leadmagnet til alle andre kanaler. Uden den mangler links et sted at lande | – |
| 5 | **Fiverr** gig | Ukendt, ejeren skal selv oprette konto | Stort købervolumen i "proofreading/localization", men mange billige sælgere | Fiverr tager en andel (ikke kontrolleret i dag) |
| 6 | **PeoplePerHour** Offer | Ukendt | Sekundært marked (UK) | Ikke kontrolleret |
| 7 | **ProZ.com / Smartcat** (LSP-kanal) | Ukendt | Lokaliseringsbureauer køber dansk korrektur løbende (Million-planens model 4) | Ikke kontrolleret |
| 8 | **Shopify Partner Directory** | Kræver Partner-konto og optagelse | Køberne er præcis målgruppen, men optagelseskrav (track record) er ikke kontrolleret | – |
| — | Fravalgt: kold e-mail, kontaktformularer, Reddit-reklame | – | Markedsføringslovens §10, platformregler og ejerens stopbeslutning 30.10 | – |

## 1. Upwork Project Catalog (engelsk, klar til indsættelse)

**Titel:** You will get a native Danish review of your AI-translated store or website

**Kategori:** Writing > Editing & Proofreading Services. Alternativt Translation > Localization. Vælg den, formularen tillader.

**Tiers**

| | Starter — USD 95 | Standard — USD 350 |
|---|---|---|
| Omfang | Up to 1,500 words of Danish store/website text | Up to 5,000 words + one purchase flow tested as a Danish customer (desktop + mobile, your test mode) |
| Leverance | Machine pre-scan of the live pages, native read-through, issue log, corrected text | Same + screenshots of flow issues + one-page priority summary |
| Levering | 3 days | 5 days |
| Revisioner | 1 | 1 |

Hvis formularen kræver 3 tiers: Advanced = Standard op til 10.000 ord. Prisen er **ejerbeslutning**, og intet er sat.

**Beskrivelse:**
```text
Your store or website was translated into Danish with AI or machine translation. It may be grammatically fine and still read like a translation, and leftovers from English or Swedish often survive on buttons, banners and checkout pages.

I am a native Danish speaker in Aarhus, Denmark. I check your live Danish pages the way a Danish customer reads them:

1. A machine pre-scan of the live pages flags leftover English or Swedish text, untranslated theme keys ("Translation missing: da…"), non-DKK prices, wrong decimal format and a page language that is not set to Danish.
2. A native read-through fixes wording that is correct but unnatural, compound-word errors (særskrivning), inconsistent terms, tone (du/De), and Danish date, price and address formats.
3. You get an issue log (page, original, problem, fix, severity) and the corrected text, ready to paste.

Written communication only. I review and correct existing Danish text; translation from scratch is not included.
```

**Krav til køber (Requirements):**
1. Links to the pages, or the text in a file.
2. Who your Danish customer is, and the tone you want (du or De).
3. Any term list or words that must stay in English (brand names, product names).
4. Whether AI tools may be used on your material.

**FAQ:**
- Do you guarantee more sales? No. You get fewer errors and Danish that reads as Danish.
- Will you place a real order? No. Checkout is tested only in your test mode or with test data you provide.
- Swedish, Norwegian or Finnish? Danish only.

**Galleri:** `gallery-1-page.png` (2000×1500) og `gallery-2-scan.png`. Begge er skærmbilleder af produktsiden. Billederne må ikke indeholde URL eller kontaktinfo (Upwork-regel).

**Portfolio-item (Upwork):** Titlen er "Sample: native Danish storefront QA issue log". Vedhæft `sales/sample-report.md` del B som PDF. Markér den tydeligt som eksempel på en fiktiv butik. Det udløser desuden 10 gratis Connects (profilopgaven "Portfolio items").

## 2. Contra — service

Titel, omfang og priser som Upwork Starter/Standard. Kort intro:
```text
Native Danish review of AI-translated stores. Machine scan of your live Danish pages + native read-through. Fixed price, written delivery, issue log you can paste from.
```
Link til den hostede scanner, når den er live.

## 3. LinkedIn

**Services-side (felter):** Service = "Translation / Proofreading / Localization". Beskrivelse = første afsnit af Upwork-beskrivelsen.

**Ét opslag (kun hvis ejeren godkender teksten):**
```text
I scanned the Danish homepages of 29 retailers from outside Denmark. 12 had machine-detectable leftovers: Swedish slogans, English "Sign up" buttons, untranslated Shopify keys, prices in EUR.

None of that says whether the Danish actually reads like Danish. That part needs a native reader.

If your shop sells in Denmark and was translated with AI, I'm offering a fixed-price native review (written, no calls). There's also a free one-page scan: [link].
```
Tallene er fra egen scanning 30.10 (`sales/sample-report.md`). Der nævnes ingen virksomhedsnavne.

## 5. Fiverr — gig (ejeren opretter konto selv)

**Titel:** I will review your AI-translated Danish website as a native speaker

**Pakker:** Basic USD 95 (1.500 ord, 3 dage) · Standard USD 350 (5.000 ord + købsflow, 5 dage). Premium er en ejerbeslutning.

**Beskrivelse:** Som Upwork-beskrivelsen, men uden eksterne links (Fiverr-regel).

## 6–7. PeoplePerHour Offer / ProZ / Smartcat

Samme kerneskrift. Til LSP-kanalerne vinkles det på **"Danish proofreading / MTPE review of AI output"** med timepris i stedet for pakker. Timeprisen er ejerbeslutning, og Upwork-profilen står i dag til USD 30/t.

## Kontrol før hver publicering

- [ ] Priser identiske med `sales/offer.md`
- [ ] Ingen kunde-, anmeldelses- eller resultatpåstande
- [ ] Ingen eksterne links, hvor platformen forbyder dem
- [ ] Skærmbilleder uden navne på tredjepartsbutikker
- [ ] Ejerens OK registreret i Notion-checkpointet
