---
name: fundraising
description: Create or improve a source-backed fundraising workflow in Known for financing rounds, investor prospects, materials, and introduction routes. Use when designing or running a raise while keeping investor research, fit assessment, engagement, legal readiness, and commitment state distinct.
license: MIT
compatibility: Requires the Known CLI and permission to read and write an appropriately visible wiki.
metadata:
  version: "0.3.0"
  category: business-ontology
---

# Fundraising

Build a credible financing workflow without turning research, attendance, introductions, or friendly conversations into investment interest.

## Required reading

Read:

1. `../../references/known-cli.md`
2. `../../references/data-modeling.md`
3. `../../references/ontology-principles.md`
4. `../../references/composition.md`
5. `../../references/skill-run.md`
6. `references/model.md`

## Default model

Propose a root such as `capital` with:

- `capital.rounds` keyed by `id`
- `capital.prospects` keyed by `id`
- `capital.materials` keyed by `id`
- `capital.routes` keyed by `id`

Use bundled schemas. Search for existing fundraising, investor, CRM, legal, task, memo, and financial models before proposing paths.

## Boundaries

- Round records own approved current economics and process state.
- Prospects own fit and pipeline assessment, not canonical people or organizations.
- Materials own document readiness and circulation approval. Concise material context can live in record `content`; a long memo, deck narrative, or financial model remains a separate document linked from the record.
- Routes own a specific introduction/outreach path and precise state.
- Investor claims and check ranges remain attributed and unverified until confirmed.
- Never infer qualification, interest, commitment, or partner authority from attendance, role, introduction, friendship, or an inbound message.
- Counsel must confirm legal implementation before money is accepted; do not present skill output as legal advice.

## Standalone behavior

Store `contact_name` and `organization_name` claims while canonical relationship IDs remain null. If relationship management is added later, link only verified matches. Every round, check, cap, budget, or commitment amount uses an explicit currency.

## Composition

Optionally references relationship contacts/organizations, finance budgets and assumptions, and work tasks. It never installs those skills automatically.
