# Composing skills

Every skill works independently. Composition strengthens references; it does not change ownership.

## Shared conventions

- IDs are strings and unique within their collection.
- Cross-skill references are optional and nullable.
- A record preserves its human-readable source claim even after a canonical ID is linked.
- `source_paths` records evidence locations, not foreign-key ownership.
- `page` links to optional narrative detail using `[[path]]` syntax.
- Owners are stable IDs where available; otherwise use explicit names without pretending they are resolved identities.
- Monetary amounts always pair a number with an ISO 4217 currency.

## Integration map

| Skill | Can optionally reference |
|---|---|
| `company-foundation` | Nothing; it is intentionally independent |
| `work-management` | Company objectives |
| `relationship-management` | Work tasks and company objectives |
| `customer-development` | Relationship organizations/contacts, work tasks |
| `product-development` | Customer opportunities/feedback, work initiatives |
| `finance-and-runway` | Company objectives, customer opportunities, hiring roles |
| `fundraising` | Relationship contacts/organizations, finance scenarios, work tasks |
| `hiring` | Company objectives, work initiatives, finance budgets |

## Expansion procedure

When adding a skill to an existing model:

1. Read the new skill and this integration map.
2. Find existing records that already represent the same concept.
3. Keep the existing canonical owner unless the user approves a migration.
4. Add nullable canonical IDs to new records when matches are verified.
5. Preserve original names or source claims for auditability.
6. Add backlinks or navigation pages only after canonical ownership is clear.
7. Validate every affected record against its existing schema.

## No hidden dependency installation

A domain skill may recommend another skill, but it must not apply it automatically. If a useful reference target is absent, leave the ID null and continue with the standalone model.
