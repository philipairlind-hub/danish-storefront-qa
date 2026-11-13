# Supplier file -> Shopify product CSV: supplier_SYNTHETIC.csv

Processed 2026-11-09T08:22:23+00:00 (UTC) with CSV QA Engine supplier mapping 1.1.0. Mapping: `delivery_mapping.json` (Synthetic first-sale demonstration; explicit agreed mapping).

## Delivery status: **READY_FOR_CONTROLLED_IMPORT_TEST**

The available checks passed and the operator recorded a review. Suitable for a controlled test import (a development store, or a few products with a backup). Shopify's acceptance and the effect on a live store are NOT guaranteed.

- All automated checks passed and the operator recorded a review. This is not proof that a live-store import is safe.

Accepted conditions:
- No store export: accepted because the import will not overwrite (Shopify ignores rows whose handle already exists in the store).
- 3 product(s) (6 source rows, 6 exception records) were held back and are not in the file: accepted by the operator; they go back to the customer with exceptions.csv.

## Counts

- Source rows (non-blank): 10
- Converted rows: 4 (2 products)
- Held back: 6 rows (3 products) - see `exceptions.csv`
- Every source row accounted for exactly once: True
- Output read back identical: True; every filled cell has a lineage record: True
- Supplier file unchanged (SHA-256): True
- Unmapped source columns (not carried over): none

## Files

- `shopify_products.csv` - the generated Shopify product CSV (UTF-8, comma-separated). Import candidate only within the status above.
- `exceptions.csv` - products held back and values that need review, with the reason.
- `lineage.csv` - for every output cell: source row, source column, source value and the transformation applied.
- `qa/` - Shopify pre-import review of the generated file (`qa_report.html`).
- `conversion_summary.json`, `mapping_used.json` - machine-readable record and the exact mapping used.

## Before any import

- Never import into a live store without a product export (backup) and the store owner's authorisation.
- Do not open and re-save `shopify_products.csv` in Excel (leading zeros and long numbers can change).
- Test with a few products first. Shopify can change its importer; no status here guarantees acceptance.
