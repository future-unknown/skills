# Composing skills

Every skill works independently. Composition strengthens references; it does not change ownership.

## Shared conventions

- IDs are strings and unique within their collection.
- Cross-skill references are optional and nullable.
- A record preserves its human-readable source claim even after a canonical ID is linked.
- Current state is updated in its existing canonical keyed record; composition must not create historical copies.
- Historical events remain separate immutable records only when the event itself is a durable business fact.
- `source_paths` records evidence locations, not foreign-key ownership.
- `content` carries focused Markdown about the record and versions with it.
- `page` is optional and links to a genuinely separate long-form document; it is never required just to render a record.
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
6. Search current table records and use record links/backlinks before building an index.
7. Add concise navigation pages only after canonical ownership is clear; do not copy record rows into Markdown indexes.
8. Use a schema-backed derived collection only if direct record search cannot support a necessary deterministic lookup.
9. Validate every affected record against its existing schema.

## No hidden dependency installation

A domain skill may recommend another skill, but it must not apply it automatically. If a useful reference target is absent, leave the ID null and continue with the standalone model.
