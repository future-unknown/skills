---
name: finance-and-runway
description: Create or improve a lightweight finance workflow in Known for budgets, cash/runway snapshots, and explicit financial assumptions. Use when a company needs planning visibility without storing bank credentials, transaction ledgers, tax records, or sensitive accounting documents in the wiki.
license: MIT
compatibility: Requires the Known CLI and permission to read and write an appropriately restricted wiki.
metadata:
  version: "0.1.0"
  category: business-ontology
---

# Finance and runway

Create decision-useful planning records while keeping accounting systems and sensitive originals outside the wiki.

## Required reading

Read:

1. `../../references/known-cli.md`
2. `../../references/ontology-principles.md`
3. `../../references/composition.md`
4. `../../references/skill-run.md`
5. `references/model.md`

## Default model

Propose a restricted root such as `finance` with:

- `finance.budgets` keyed by `id`
- `finance.snapshots` keyed by `id`
- `finance.assumptions` keyed by `id`

Use the schemas in `assets/`. Inspect existing finance, runway, budget, fundraising, and company-fact models first.

## Boundaries

- Every amount has an explicit ISO 4217 currency; never infer currency from locale or company jurisdiction.
- Budgets are plans, snapshots are dated states, and assumptions are inputs. Do not merge them.
- Do not store bank account numbers, payment credentials, tax IDs, payroll files, invoices containing personal data, or complete accounting exports.
- A runway calculation must name the cash date, burn basis, currency, and included/excluded obligations.
- Do not present planning records as audited financial statements.

## Composition

Works alone. Budgets may optionally reference company objectives, hiring roles, customer opportunities, or fundraising rounds. Cross-currency composition requires an explicit rate, source, and date; do not silently convert.
