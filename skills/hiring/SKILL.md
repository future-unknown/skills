---
name: hiring
description: Create or improve a privacy-conscious hiring workflow in Known for roles, candidates, interviews, and decisions. Use when planning headcount or running a candidate process while separating sourced evidence, evaluation, workflow state, and sensitive personal information.
license: MIT
compatibility: Requires the Known CLI and permission to use a restricted wiki appropriate for candidate data.
metadata:
  version: "0.2.0"
  category: business-ontology
---

# Hiring

Build a fair, auditable hiring workflow without turning informal relationships or conversations into candidacy.

## Required reading

Read:

1. `../../references/known-cli.md`
2. `../../references/data-modeling.md`
3. `../../references/ontology-principles.md`
4. `../../references/composition.md`
5. `../../references/skill-run.md`
6. `references/model.md`

## Default model

Use a restricted wiki and propose a root such as `hiring` with:

- `hiring.roles` keyed by `id`
- `hiring.candidates` keyed by `id`
- `hiring.interviews` keyed by `id`
- `hiring.decisions` keyed by `id`

Use bundled schemas. Inspect existing team, recruiting, candidate, interview, and budget structures first.

## Boundaries

- A role owns approved need, scope, level, location, compensation range, and status.
- A candidate owns recruiting workflow state and minimal necessary identity.
- Interviews preserve structured evidence against role criteria.
- Decisions own outcome, approvers, rationale, and evidence references.
- Friendship, employment history, event attendance, or exploratory discussion does not establish candidacy or intent.
- Do not store protected traits, health information, identity documents, background-check reports, salary history, banking data, or private correspondence beyond what is necessary and lawful.
- Record compensation currency explicitly.

## Standalone behavior

Candidate names and contact details may be stored minimally in the restricted hiring wiki. If relationship management exists, `contact_id` remains optional; never move restricted evaluation into a broader contacts wiki.

## Composition

Optionally references company objectives, work initiatives, and finance budgets. Privacy boundaries override backlink convenience.
