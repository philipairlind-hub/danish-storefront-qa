# Sample report — Danish Storefront QA

Status: KLADDE. Ejeren skal bekræfte de danske rettelser som indfødt, før rapporten bruges over for kunder.

Rapporten har to dele. **Del A** er aggregerede tal fra en rigtig maskinel scanning af offentlige sider, uden navne. **Del B** er et komplet eksempel på en leverance, bygget på en *opdigtet demobutik*, så ingen virksomheds fejl bruges som reklame.

---

## Part A — What a machine scan finds on live Danish storefronts (30 Oct 2026)

We fetched the public Danish homepages of 29 retailers and brands headquartered outside Denmark, mostly Swedish, plus German, Dutch and Spanish ones.

- 27 pages could be analysed. One returned HTTP 403, and one renders its text only with JavaScript.
- 12 of the 27 had at least one machine finding. In 5 of them the findings sit only in attributes (image alt text, link titles, labels for screen readers, form values), and these are not necessarily visible to shoppers.
- **7 had findings in server-rendered page text.** 4 of these are clear leftovers: a Swedish slogan, English "Sign up", "Search" and "Shop Now". The others are deliberate choices (an English brand tagline, prices in EUR) or common loanwords ("Login", "Newsletter").
- One site also contains untranslated Shopify keys ("Translation missing: da.…") in its HTML. Whether they are visible has not been checked in a browser.
- 15 had no machine findings on the homepage.
- This triage is AI-assisted and **not yet confirmed by a native speaker or by a browser visibility check**.

What this does **not** show: whether the Danish text itself reads naturally. A scanner cannot judge that. That is the native review.

*Method: one GET request per page, identifying user agent, no crawling, homepage only. Tool: `da_storefront_check.py` v0.4.*

---

## Part B — Example deliverable (fictional demo store)

**Client:** Demo Store (fictional) · **Scope:** Entry, 1 page · **Reviewer:** native Danish speaker, Aarhus

### 1. Machine pre-scan

| # | Check | Severity | Original (as found) | Suggested fix (Danish) | Reviewer verdict |
|---|---|---|---|---|---|
| 1 | Untranslated theme key | high | `Translation missing: da.products.product.add_to_cart` | Add the missing translation key. The button should read **"Læg i kurv"** | [owner to confirm] |
| 2 | English UI text | high | Add to cart | **Læg i kurv** | [owner to confirm] |
| 3 | English UI text (aria-label) | high | Search | **Søg** | [owner to confirm] |
| 4 | Swedish text | high | Lägg i varukorg och betala i kassan | **Læg varen i kurven, og betal i kassen** | [owner to confirm] |
| 5 | Page language | medium | `<html lang="en">` | `<html lang="da">` | [owner to confirm] |
| 6 | English text block | medium | Free shipping on all orders over 499 kr and easy returns for your new favourite products. | **Fri fragt ved køb over 499 kr. og nem returnering af dine nye favoritter.** | [owner to confirm] |
| 7 | Currency | medium | Fra 49 € i dag | Show the price in DKK (e.g. **"Fra 365 kr. i dag"**, using the shop's real DKK price) | [owner to confirm] |
| 8 | hreflang | low | Alternates for sv-se and nb-no, none for da | Add `hreflang="da-DK"` for the Danish page | [owner to confirm] |
| 9 | Price format | low | Pris: 199.95 kr | **Pris: 199,95 kr.** | [owner to confirm] |

### 2. Native read-through (human)

| # | Page / element | Original | Problem | Fix | Severity |
|---|---|---|---|---|---|
| H1 | Heading | Velkommen til vores butik | Correct, but generic. Consider a heading that says what the shop sells | (client's choice) | low |
| H2 | Delivery text | Vi sender din pakke med GLS, og du kan returnere varen inden for 30 dage. | Natural Danish. No change | – | – |

### 3. Summary for the client (one paragraph)

Three customer-facing elements on the page are not in Danish: the cart button, the search label and a Swedish checkout sentence. Fix these first. The page also declares itself as English and shows one price in euro. A Danish shopper notices both, and so do search engines. The rest of the Danish copy on this page reads naturally.

*Fictional example. No real store or customer is shown.*
