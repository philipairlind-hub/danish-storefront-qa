# Danish Storefront QA — live Shopify language and supplier-file QA

Independent ecommerce QA utilities and fixed-scope services by Philip Lind, Aarhus, Denmark.

## Free public tools and guides

| Resource | Public URL | Scope |
| --- | --- | --- |
| Free Danish storefront text scan | [Open scanner](https://philipairlind-hub.github.io/danish-storefront-qa/) | One publicly available page; candidate English/Swedish remnants and missing translation strings |
| Danish Shopify launch checklist | [Read 12-point checklist](https://philipairlind-hub.github.io/danish-storefront-qa/checklist/) | Manual pre-launch review of language, pricing, theme strings, checkout and emails |
| Supplier spreadsheet import guide | [Read 10-point checklist](https://philipairlind-hub.github.io/danish-storefront-qa/supplier-file-qa/) | New-product import preparation, variants, SKUs, prices and exceptions |
| SupplierPreflight synthetic delivery demo | [Inspect the full 10-row conversion](https://philipairlind-hub.github.io/danish-storefront-qa/supplier-file-qa/demo/) | Invented supplier input, real mapped CSV output, held exceptions, cell lineage, QA report, downloadable ZIP. Not a client case or live Shopify import |
| Free Stocky historical export preservation checklist | [Read the no-signup guide](https://philipairlind-hub.github.io/danish-storefront-qa/stocky-archive-checklist/) | Free archive inventory and CSV preservation steps, with official Shopify references and limitations |
| Stocky legacy CSV archive audit | [Read-only audit page](https://philipairlind-hub.github.io/danish-storefront-qa/stocky-export-audit/) | Live $49 manual scoped pilot through [Stripe checkout](https://buy.stripe.com/14A14pfl4769enh86Gg7e03); 100% synthetic demo, no historical migration |
| PO / receipt / invoice 3-way CSV review | [Read-only pilot and demo](https://philipairlind-hub.github.io/danish-storefront-qa/po-invoice-reconciliation/) | Live $99 scoped pilot via [Stripe checkout](https://buy.stripe.com/bJedRb0qa1LPdjdcmWg7e04), 7 synthetic test cases, no ERP writes or payment authorization |
| Supplier CSV Quick Check | [Check a CSV locally](https://philipairlind-hub.github.io/danish-storefront-qa/csv-check/) | Free client-side CSV structure check; no upload, account or analytics. Maximum 3 MiB and 10,000 data records |
| HVAC estimate follow-up review checklist | [Read 7-step review process](https://philipairlind-hub.github.io/danish-storefront-qa/hvac-estimate-follow-up-checklist/) | Human-led CSV review checks and synthetic example; separate from the paid offline quote tool |

The CSV tool flags unusual record widths, repeated SKU *candidates*, column-heading problems and basic price-format issues. **It does not certify Shopify import readiness.** A CSV with zero warnings can still be unsafe to import.

## Existing paid buyer routes

- **Danish native QA $49 first-order pilot:** One public page, up to 500 existing words, prioritized wording findings and corrections, within 3 business days after scope/payment agreement. [Request through the main site](https://philipairlind-hub.github.io/danish-storefront-qa/). This $49 button opens a written inquiry; it is **not an instant card checkout**.
- **Danish Entry $95 / Core $350:** [Contra Entry service](https://contra.com/s/67lEQPZ2-native-danish-review-of-your-ai-translated-store), or [Upwork tiered service](https://www.upwork.com/services/product/2116240404745706041). For independently sourced direct customers *after written scope agreement*, existing Stripe checkout links are [Entry $95](https://buy.stripe.com/8x2aEZ2yiail4MH72Cg7e01) and [Core $350](https://buy.stripe.com/28EfZj4Gq9eh3IDbiSg7e02). Entry covers up to 1,500 existing words; Core up to 5,000. Do not pay until scope, storefront URLs, deliverables and delivery have been agreed in writing. Marketplace-origin orders remain on their respective platforms.
- **Stocky archive CSV review $49 and 3-way PO / receipt / invoice review $99:** Two separate [publicly purchasable manual pilots](https://philipairlind-hub.github.io/danish-storefront-qa/stocky-export-audit/) on the Mille-owned DK STORE REVIEW Stripe account. Maximum two buyer checkouts per pilot, strict input requirements, private secure-file handoff after purchase and a full refund or agreed revised quote if files fall outside scope. The [PO-review scope and checkout](https://philipairlind-hub.github.io/danish-storefront-qa/po-invoice-reconciliation/) require three usable CSV exports and do not accept Shopify PO PDFs. No proof of paid customer orders yet.
- **SupplierPreflight from $49:** [Shopify new-product supplier-file preparation](https://www.upwork.com/services/product/admin-customer-support-a-shopify-import-csv-from-your-supplier-spreadsheet-with-a-qa-report-2117968533993668014), up to 100 variant rows/30 source columns/8 MiB in Starter. Output is a Shopify import candidate, exceptions, HTML QA report and source-level provenance. Buyer performs the actual import. No scraping, image hosting, inventory synchronization or overwriting existing products.
- **General CSV/Excel QA from $99:** [Independent data QA service](https://www.upwork.com/services/product/development-it-an-audited-csv-or-excel-product-file-with-an-error-log-and-safe-fixes-2117654130963966547). Scope differs from SupplierPreflight.

## Separate Lind Workbench product — offline estimate review

- **Quote Recovery Workbench ($19 one time):** [Live independent product overview](https://philipairlind-hub.github.io/danish-storefront-qa/quote-recovery/) with a direct [Gumroad purchase route](https://lindworkbench.gumroad.com/l/quote-recovery-workbench), free synthetic starter kit and accurate limitations. This is a separate HVAC/plumbing/home-service product, not Shopify QA. The [interactive ten-row synthetic example](https://philipairlind-hub.github.io/danish-storefront-qa/quote-recovery/demo/) is hosted publicly on GitHub Pages with the free starter ZIP and the verified direct Gumroad checkout link. It is not a real customer dashboard or proof of sales. The older ChatGPT Sites preview still has an outdated checkout notice; use the verified new overview or direct Gumroad page for buyers. Purchase and payout readiness are distinct; Gumroad PayPal Connect payout verification is pending.

Written questions: shopairlind@gmail.com. Don't send confidential source or customer files before a data-handling agreement.

## Source and deployment

- \`supabase/functions/dsqa-scan/\`: Deno/Supabase free public-page scanner. Historical design: SSRF-safe public IP validation, port 80/443 restrictions, re-validation after redirects, a 12-second timeout and 2 MiB cap. The Postgres rate-limit design states 10 scans/hour per caller, 300/day total; salted IP hashes are rotated and deleted after 30 days, and only scanned domains are retained, not page contents.
- \`web/index.html\`: main page source; \`gh-pages/index.html\` is the public deployed copy.
- \`web/checklist.html\`, \`web/supplier-file-qa.html\`, \`web/csv-check.html\`: the three new guides/free-tool sources on \`main\`. Their public copies live in matching subfolders of \`gh-pages/\`.
- \`cli/scan.ts\`: Deno local-delivery issue-log CLI.
- \`test/\`: Danish page-scanner test suite; historical project documentation reported 14 checks.
- \`docs/\`: requirements, QA notes and synthetic example documentation. Some documents are historical, not proof of orders.

[Public sitemap, 10 URLs](https://philipairlind-hub.github.io/danish-storefront-qa/sitemap.xml). Update both source and public GitHub branches when editing the website, then independently verify the live page.

## Limits and verification (13 November 2026)

The Danish language scanner is a limited machine pre-scan, not native Danish proofreading. It cannot see protected checkout, JavaScript-only rendering, customer notifications or geolocation-specific content, and it cannot judge natural language tone.

The separate CSV Quick Check has 12 logic checks passed for quoting, line endings, UTF-8 BOM, field widths, duplicate SKU candidates and basic price warnings. A synthetic-data DOM-script smoke test also passed: four records and three review findings. This is not a complete real-browser or Shopify-import acceptance test. Historical Danish scanner tests were not freshly rerun during this update.

The four Shopify QA pages and separate Quote Recovery overview were fetched after deployment; published SEO metadata does not establish search indexing or traffic. **No independently paid customer orders, claims of increased conversion, testimonials or certification are asserted.** This project is independent and is not endorsed by Shopify.
