# Data, history, indexes, and Markdown

Known wiki data is the canonical **current state of the business**. Prefer schema-backed keyed records whenever information needs to be updated, filtered, sorted, joined, validated, or acted on.

Markdown remains important, but it is not a second database.

## Current state

Use a schema-backed keyed collection for:

- entities and their current attributes;
- workflow status, ownership, next action, and due date;
- controlled classifications and assessments;
- deterministic references between concepts;
- amounts, dates, metrics, and other typed values;
- anything an agent or interface must query reliably.

Update the existing keyed record with a version precondition. Do not append another record merely to preserve the old status, and do not maintain `status_history`, `previous_values`, or similar arrays unless the domain itself requires a legally meaningful ledger.

Every update to a keyed record creates a retained record version. Read it with `wiki history <table>/<key>` and compare it with `wiki diff <table>/<key>`. Use `wiki data <table> --at <iso>` when the question is what the table looked like at a moment. History is not duplicated into current records or hand-maintained Markdown tables. Keep full version history by default. If privacy or storage policy requires a bound, declare `metadata.retain.versions` deliberately, document what older state becomes unknowable, and never invent an application-level history field.

## Historical events versus old state

An interaction, interview, decision, experiment result, financial snapshot, or other event can be a canonical structured record because it is an enduring fact that the event occurred. That is different from retaining an obsolete copy of an entity's prior state.

Use this test:

- “What is true now?” → update the current-state record.
- “What happened at a particular time?” → create an immutable event/observation record when the event matters operationally.
- “What did this page or record used to say?” → rely on Known history.

Do not edit an event's substantive historical facts to match current understanding. Add corrections, source context, or a superseding record with provenance.

## Search and indexes

Current table records now appear directly in `wiki search`, including text carried in their fields and Markdown `content`. Search returns the record address, key, and heading. Use that before building an index.

Do not maintain canonical indexes as Markdown lists or tables. The collection and its schema are the normal index: keep current searchable fields on each record and let interfaces or agents derive views from them.

A specialized resolver or index collection is justified only when ordinary record search cannot support a deterministic lookup or projection. It must have its own schema, stable key, declared source collection, and regeneration rule. It is a derived projection, never a second owner of the underlying state.

Navigation pages may link to collections and explain how to use them. They should not copy collection rows into manually maintained Markdown.

## Markdown on records and pages

A table record may carry a `content` string containing Markdown. Reading surfaces render the record as a document, headed by its `title`, then `name`, then key. The writing is searched, linked, versioned, and diffed with the rest of the record.

Use record `content` for authored meaning about one structured thing:

- a contact's context and relationship notes;
- a task or initiative description;
- decision rationale and alternatives;
- a risk response narrative;
- concise evidence synthesis tied to one record.

Prefer this over creating both a record and a detail page. Record content is limited to 16 KB, so keep it focused on that one thing.

Use a separate Markdown page when the document is independently meaningful, substantially longer, composed across many records, or needs its own page-level collaboration and navigation:

- strategy and narrative documents;
- long-form plans, memos, research, and retrospectives;
- process guidance and ontology boundaries;
- dashboards and synthesis spanning several collections;
- long correspondence or source documents with appropriate visibility.

A page can cite or embed records and collections. It must not silently redefine schema-owned current state. Keep an optional `page` field only when the separate document truly exists; it is no longer required merely to make a record readable.

## Decision rubric

| Need | Default representation |
|---|---|
| Current status, owner, date, amount, enum, or reference | Schema-backed keyed record |
| Searchable directory | Search the schema-backed keyed collection directly |
| Specialized deterministic index | Derived schema-backed projection with a regeneration rule |
| Dated event that remains operationally meaningful | Structured event/observation record |
| Prior value of current state | Record history/diff or `data --at`; page history for pages |
| Narrative about one record | Markdown in the record's `content` field |
| Strategy or synthesis across records | Separate Markdown page |
| Long correspondence or source document | Separate Markdown/evidence reference with appropriate visibility |
| Generated dashboard or table | Derived view; canonical records remain authoritative |

## Applying a skill

A proposal must state, for every planned path:

- whether it is a canonical collection, derived projection, record with Markdown content, or independent Markdown page;
- the collection key and schema when structured;
- what owns current state;
- how record/page history answers prior-state questions;
- why any separate page cannot live as record content;
- whether any Markdown duplicates structured fields.

Reject or revise a proposal that uses an independent Markdown page because schema design is inconvenient. Also reject a proposal that forces nuanced narrative into dozens of weakly typed fields: put focused writing in record `content`, and reserve a separate page for a genuinely independent document.
