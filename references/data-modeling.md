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

Known's version and page history preserve how current state changed. History is not duplicated into current records or hand-maintained Markdown tables.

## Historical events versus old state

An interaction, interview, decision, experiment result, financial snapshot, or other event can be a canonical structured record because it is an enduring fact that the event occurred. That is different from retaining an obsolete copy of an entity's prior state.

Use this test:

- “What is true now?” → update the current-state record.
- “What happened at a particular time?” → create an immutable event/observation record when the event matters operationally.
- “What did this page or record used to say?” → rely on Known history.

Do not edit an event's substantive historical facts to match current understanding. Add corrections, source context, or a superseding record with provenance.

## Indexes

Do not maintain canonical indexes as Markdown lists or tables.

When a concept needs lookup, filtering, or a directory:

1. create or reuse a keyed collection;
2. define its JSON Schema;
3. keep each record's current indexable fields there;
4. let interfaces or agents derive views from those records.

A specialized resolver or index collection is justified only when it has its own schema, deterministic key, declared source collection, and regeneration rule. It is a derived projection, never a second owner of the underlying state.

Navigation pages may link to collections and explain how to use them. They should not copy the collection's rows into manually maintained Markdown.

## When Markdown is right

Use Markdown for material whose value is primarily authored meaning:

- purpose, scope, and ontology boundaries;
- strategy and narrative documents;
- rationale, alternatives, and decision context;
- process guidance and non-inference rules;
- evidence synthesis and communication history;
- long-form plans, memos, research, and retrospectives;
- navigation between canonical collections.

Markdown can cite records and sources. It must not silently redefine schema-owned current state.

Do not create a detail page for every record by default. Create one when the record needs substantial narrative, evidence, discussion, or collaboration that would make its schema brittle or unreadable.

## Decision rubric

| Need | Default representation |
|---|---|
| Current status, owner, date, amount, enum, or reference | Schema-backed keyed record |
| Searchable directory or index | Schema-backed collection or derived schema-backed projection |
| Dated event that remains operationally meaningful | Structured event/observation record |
| Prior value of current state | Known history |
| Rationale, narrative, strategy, or synthesis | Markdown page |
| Long correspondence or source document | Markdown/evidence reference with appropriate visibility |
| Generated dashboard or table | Derived view; canonical records remain authoritative |

## Applying a skill

A proposal must state, for every planned path:

- whether it is a canonical collection, derived projection, or contextual Markdown page;
- the collection key and schema when structured;
- what owns current state;
- how history is preserved;
- whether any Markdown duplicates structured fields.

Reject or revise a proposal that uses Markdown because schema design is inconvenient. Also reject a proposal that forces nuanced narrative into dozens of weakly typed fields merely to avoid Markdown.
