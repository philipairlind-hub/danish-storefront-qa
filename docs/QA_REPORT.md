# QA report — prototype `da_storefront_check.py`

Dato: 30.10.2026. Testet af Claude (Cowork). **Status: NOT production-ready.** Det er en feasibility-prototype til intern brug.

| # | Test | Kommando / metode | Observeret resultat | Status |
|---|---|---|---|---|
| 1 | Alle 8 tjek på fixture | Lokal `http.server` + `da_storefront_check.py fixture.html` | T1=1, T2=2, T3=1, T4=1, F1=1, F2=1, F3=1, F4=1 | PASS |
| 2 | 404 håndteres som fejl, ikke fund | Ikke-eksisterende fixture-URL | `error: HTTP 404`, 0 fund | PASS |
| 3 | Live: 29 offentlige forsider (linket computer, 30.10) | `python3 -I da_storefront_check.py <URL'er>` | 27 analyserbare, 1×403 (inconclusive), 1 JS-renderet (0 tekstnoder) og 12 med fund | PASS (kørsel). Præcision: se 5 |
| 4 | Falske fund på brandnavne (v0.1) | Gennemgang af output | v0.1: BabyBjörn, Röhnisch, Björn Axén m.fl. markeret som svensk | FAIL → rettet i v0.2/v0.3 |
| 5 | Præcision efter v0.4 (AI-triage af Claude, ikke indfødt) | Gennemgang af 18 unikke fund | Klare synlige tekstrester på 4 sites. Resten er attribut-fund, bevidste valg (engelsk tagline, EUR), låneord eller mulige skjulte felter | DELVIS. Ejeren skal bekræfte som indfødt og i browser |
| 6 | "Menu" som engelsk UI (v0.1) | Gennemgang | Falsk fund ("Menu" er normalt på dansk) | FAIL → fjernet i v0.2 |
| 7 | "hos"/"fri" som svensk (v0.3) | Gennemgang (zooplus, vidaXL, Tradeinn) | Falske T4-fund på dansk brødtekst | FAIL → rettet i v0.4 |
| 8 | Skjulte input-værdier | Ikke testet | `attr:value` læses også fra `type=hidden` | **NOT_CHECKED, kendt fejl** |
| 9 | SSRF-beskyttelse | Ikke implementeret i prototypen | – | **FAIL (blokerer enhver drift i skyen)** |
| 10 | JS-renderede sider | én B2B-butik | 0 tekstnoder | Rapporteres korrekt som inconclusive. Headless er ikke implementeret |
| 11 | Unit-tests i repo / CI | – | Findes ikke endnu | NOT_CHECKED |
| 12 | T1 placering (revision) | Kodegennemgang | T1 er regex over rå HTML, så et match kan ligge i `<script>` eller en attribut og være usynligt | **Kendt fejl** |
| 13 | Synlighed af fund | Optælling på demo-JSON | 12 sites med fund. Kun 7 har fund i server-renderet tekst, 5 har kun attribut-fund. Ingen browserkontrol | NOT_CHECKED i browser |

**Integritet:** Workspace-kopi og kopi på Noh har samme SHA-256 for v0.4: `91eb77fd6d40127f6718daf0b1ad3280f1b6615174a48268acc3b936b327185e`.

**Konklusion:** Feasibility er bekræftet. Værktøjet finder rigtige rester på rigtige sider. Før det bruges i en betalt leverance, skal punkt 8 og 12 rettes. Før drift i skyen skal punkt 8, 9, 11 og 12 rettes.
