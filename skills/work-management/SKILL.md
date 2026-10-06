---
name: work-management
description: Create or improve a practical operating workflow in Known for initiatives, tasks, decisions, and risks. Use when a team needs accountable execution, decision memory, dependencies, or risk tracking without adopting a heavyweight project-management system.
license: MIT
compatibility: Requires the Known CLI and permission to read and write the selected wiki.
metadata:
  version: "0.2.0"
  category: business-ontology
---

# Work management

Create a calm, source-backed operating system for deciding and doing work.

## Required reading

Read, relative to this directory:

1. `../../references/known-cli.md`
2. `../../references/data-modeling.md`
3. `../../references/ontology-principles.md`
4. `../../references/composition.md`
5. `../../references/skill-run.md`
6. `references/model.md`

Stop if a required reference is unavailable.

## Default model

Propose a root such as `work` with:

- `work.initiatives` keyed by `id`
- `work.tasks` keyed by `id`
- `work.decisions` keyed by `id`
- `work.risks` keyed by `id`

Use the schemas in `assets/`. Existing roadmap, project, task, decision, or risk collections take precedence until the user approves consolidation.

## Boundaries

- Initiatives own outcome, status, owners, horizon, and optional objective links.
- Tasks own bounded next actions and dependencies.
- Decisions own a decision's current disposition and link to authored rationale/evidence.
- Risks own current risk state, signals, impact, response, and review date.
- Discussion, meeting notes, and changing evidence remain on pages or in source records.
- A blocked task is not cancelled. A proposed decision is not decided. A risk is not an incident.

## Run

Follow the standard skill run. Inspect existing work vocabularies and preserve their meaning. When adding reciprocal task dependencies, update both records in one reviewed plan. Do not infer status from age, comments, or lack of activity.

## Composition

Works alone. If company objectives exist, initiatives may set `objective_id`. Other skills may optionally reference task, initiative, decision, or risk IDs without transferring ownership.
