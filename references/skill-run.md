# Standard skill run

Use this sequence for every ontology skill.

## 1. Bootstrap

Read `known-cli.md`, discover the installed CLI through public help, establish an explicit session, verify identity and permissions, and discover accessible wikis.

## 2. Orient

Ask for the business outcome and target wiki/root only when not already clear. Search for existing concepts and inspect targeted pages, metadata, and representative records. Do not use a full-wiki dump by default.

## 3. Propose

Present:

- concepts and boundaries;
- paths to create, reuse, or merge;
- whether each path is a canonical collection, derived projection, record with Markdown content, or independent Markdown page;
- collection keys and schemas, including nullable `content` where writing belongs with a record;
- current-state owner and record/page history behavior;
- optional cross-skill references;
- privacy implications;
- exact writes and likely conflicts.

Wait for approval before writing.

## 4. Apply

Create only the independent Markdown pages needed for long-form documents, cross-record synthesis, process, or navigation. For every canonical current-state concept, create or reuse a collection page, keep its prose concise, then attach the stable key and schema before inserting any records. Let the schema accept nullable Markdown `content`; prefer that over a separate page for record-specific context. Existing pages use revision preconditions; existing records use version preconditions.

Update keyed records in place for current-state changes and rely on record history, diff, and `data --at` for prior versions. Create separate records only for genuine events, observations, snapshots, or independently meaningful facts. Search current table records directly before proposing an index. Do not create hand-maintained Markdown indexes or current-state tables.

Synthetic examples are documentation. Do not seed examples unless the user explicitly asks.

## 5. Verify

Re-read changed pages and metadata. Read each inserted/updated keyed record. Use record history/diff when verifying an update, and confirm a representative record is discoverable through search. Validate counts, enums, required fields, paths, references, visibility, and absence of accidental sample/private data. Confirm that current state has one canonical schema-backed owner, old state was not duplicated, indexes are unnecessary or structured/derived, and independent Markdown does not shadow record fields.

## 6. Report

List:

- created paths;
- reused or merged paths;
- attached schemas and keys;
- record changes;
- unresolved decisions;
- optional next skill, without applying it.

If a write partially fails, stop, report actual state, and propose a repair plan. Never report the intended plan as completed state.
