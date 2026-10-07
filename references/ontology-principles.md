# Ontology principles

These rules apply to every Known business skill.

## Separate kinds of truth

1. **Current business state** belongs in schema-backed keyed records.
2. **Prior versions of current state** belong to Known history, not duplicate records, status-history arrays, or Markdown tables.
3. **Events that happened** may be structured immutable records when they remain operationally meaningful.
4. **Context and meaning** belong in authored pages.
5. **Evidence and communication history** remain attributable and dated.
6. **Source claims** stay distinct from internal assessments.
7. **Workflow state** is not evidence of real-world intent or commitment.
8. **Derived projections** point back to canonical records rather than replacing them.

## Model conservatively

- Use stable, human-readable IDs that do not change with display names.
- Use controlled enums for workflow states.
- Use `null` or absence for unknown values; do not substitute guesses.
- Include `source_paths` where records depend on wiki evidence.
- Keep references deterministic strings. Do not claim referential integrity the platform does not enforce.
- Avoid global master abstractions until identity, permissions, merges, and migration semantics work end to end.
- Store sensitive originals in purpose-built secure systems; Known stores safe metadata and references.

## Data first, Markdown deliberately

A useful domain usually has:

- schema-backed keyed collections for canonical current state;
- optional Markdown `content` on records when one structured thing needs authored context;
- concise independent pages for purpose, boundaries, cross-record synthesis, process, and navigation;
- derived views that clearly point back to canonical collections.

Prefer schemas when information must be queried, filtered, validated, related, or acted on. Table records are searchable, so search the canonical collection before inventing an index. Do not maintain indexes or current-state tables manually in Markdown; a specialized index is a declared schema-backed derived projection.

Prefer Markdown in a record's `content` field over a page per row. Create a separate page only when the document is independently meaningful, cross-record, long-form, or larger than the record's 16 KB writing limit. Markdown supplements structured state; it does not redefine it.

Read `data-modeling.md` for the full representation and history rules.

## Safe adaptation

Before applying a template:

- search for existing concepts and synonyms;
- inspect existing schemas and records;
- identify the current canonical owner;
- map reusable fields and preserve provenance;
- surface semantic conflicts to the user;
- never replace a live model solely because the template is newer.

## Privacy

Do not seed real people, companies, financial accounts, legal identifiers, credentials, health data, payment information, or private correspondence. Examples use unmistakably synthetic entities.
