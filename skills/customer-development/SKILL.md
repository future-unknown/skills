---
name: customer-development
description: Create or improve a customer-development workflow in Known for customer hypotheses, opportunities, discovery evidence, and pilots. Use when testing who has a problem, qualifying demand, coordinating design partners, or moving from conversations to bounded customer proof.
license: MIT
compatibility: Requires the Known CLI and permission to read and write the selected wiki.
metadata:
  version: "0.1.0"
  category: business-ontology
---

# Customer development

Model evidence from problem discovery through a bounded pilot without treating enthusiasm as purchase intent.

## Required reading

Read:

1. `../../references/known-cli.md`
2. `../../references/ontology-principles.md`
3. `../../references/composition.md`
4. `../../references/skill-run.md`
5. `references/model.md`

## Default model

Propose a root such as `customers` with:

- `customers.hypotheses` keyed by `id`
- `customers.opportunities` keyed by `id`
- `customers.discovery` keyed by `id`
- `customers.pilots` keyed by `id`

Use the schemas in `assets/`. Search for sales, CRM, design-partner, pilot, interview, and feedback structures first.

## Boundaries

- A hypothesis is a testable claim about a segment, problem, buyer, or workflow.
- An opportunity owns qualification and commercial workflow state, not the canonical person or organization.
- Discovery records preserve what was actually learned, including disconfirming evidence and non-signals.
- A pilot requires scope, owner, success criteria, access/approval boundaries, and commercial form before it is confirmed.
- Attendance, friendliness, product feedback, or a meeting does not establish customer intent.

## Standalone behavior

When relationship management is absent, opportunities retain `organization_name` and `contact_name` as source claims while canonical IDs remain null. If relationship management is added later, link verified IDs without deleting the original claims.

## Composition

Optionally reference relationship contacts/organizations and work tasks. Product development may consume source-backed feedback or link product initiatives to customer evidence. It must not rewrite discovery as roadmap commitment.
