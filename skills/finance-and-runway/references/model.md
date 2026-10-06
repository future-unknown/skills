# Finance and runway model

## Budgets

Statuses: `draft`, `approved`, `active`, `superseded`, `closed`.

A budget records period, currency, owner, scenario, total, and category allocations. Category totals must reconcile to the stated total or explicitly explain the difference.

## Snapshots

A dated, immutable financial planning snapshot with cash, expected inflows, known liabilities, monthly cash burn, monthly economic cost, and calculated runway. Update by adding a new snapshot, not rewriting history.

Unknown values remain null. Zero means evidenced zero, not missing information.

## Assumptions

Statuses: `proposed`, `active`, `invalidated`, `replaced`.

An assumption records value, unit, currency when monetary, rationale, confidence, review date, and evidence. `replaced_by_id` preserves changes over time.

## Currency

Use ISO 4217 codes such as `USD`, `EUR`, or `GBP`. If a plan contains several currencies, keep original amounts and record explicit conversion assumptions rather than flattening them invisibly.
