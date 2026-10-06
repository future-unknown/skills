# Ontology principles

These rules apply to every Known business skill.

## Separate kinds of truth

1. **Current state** belongs in keyed structured records.
2. **Context and meaning** belong in authored pages.
3. **Evidence and communication history** remain attributable and dated.
4. **Source claims** stay distinct from internal assessments.
5. **Workflow state** is not evidence of real-world intent or commitment.
6. **Derived projections** point back to canonical records rather than replacing them.

## Model conservatively

- Use stable, human-readable IDs that do not change with display names.
- Use controlled enums for workflow states.
- Use `null` or absence for unknown values; do not substitute guesses.
- Include `source_paths` where records depend on wiki evidence.
- Keep references deterministic strings. Do not claim referential integrity the platform does not enforce.
- Avoid global master abstractions until identity, permissions, merges, and migration semantics work end to end.
- Store sensitive originals in purpose-built secure systems; Known stores safe metadata and references.

## Pages and records

A useful domain usually has:

- a root page explaining purpose, boundaries, and navigation;
- one collection page per canonical record type;
- a JSON Schema and stable key on each collection;
- optional detail pages for records requiring narrative or evidence;
- a process page explaining transitions and non-inferences.

Do not create detail pages mechanically for every record. Create them when context, evidence, or collaboration needs authored space.

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
