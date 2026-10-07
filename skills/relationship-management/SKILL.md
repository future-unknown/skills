---
name: relationship-management
description: Create or improve a source-backed relationship workflow in Known for organizations, contacts, interactions, and introductions. Use for investors, customers, partners, advisors, candidates, connectors, or other relationships where current state must remain separate from correspondence and inference.
license: MIT
compatibility: Requires the Known CLI and permission to read and write the selected wiki.
metadata:
  version: "0.3.0"
  category: business-ontology
---

# Relationship management

Build one relationship system that can support many relationship types without turning attendance, affiliation, or conversation into unsupported intent.

## Required reading

Read:

1. `../../references/known-cli.md`
2. `../../references/data-modeling.md`
3. `../../references/ontology-principles.md`
4. `../../references/composition.md`
5. `../../references/skill-run.md`
6. `references/model.md`

Resolve relative paths from this skill directory. Stop if a reference is unavailable.

## Default model

Propose a root such as `relationships` with:

- `relationships.organizations` keyed by `id`
- `relationships.contacts` keyed by `id`
- `relationships.interactions` keyed by `id`
- `relationships.introductions` keyed by `id`

Use the bundled schemas. Search broadly for existing CRM, contact, investor, customer, partner, candidate, and network structures before proposing new canonical collections.

## Boundaries

- Contacts are canonical within the target wiki; do not create a global People abstraction.
- Organizations and contacts own current identity/relationship state.
- Interactions preserve dated communication summaries and channels.
- Introductions have precise workflow states and never imply consent or completion.
- Event attendance, friendship, employment, a question, or an inbound message does not establish investment, customer, partnership, or hiring intent.
- Preserve exact private correspondence only when explicitly requested; otherwise store a faithful summary and source reference.

## Run

Follow the standard skill run. Use stable IDs, nullable affiliations, explicit relationship types, and source paths. Coordinate one canonical contact and organization rather than producing domain-specific duplicates.

## Composition

Works alone. Customer development, fundraising, and hiring may reference contact and organization IDs. Those domain workflows own their assessments and pipelines; relationship records do not absorb them.
