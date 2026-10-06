# Work management model

## Initiatives

A meaningful outcome requiring coordinated work.

Statuses: `proposed`, `planned`, `active`, `blocked`, `completed`, `cancelled`.

An initiative is not completed merely because its tasks are closed; completion requires evidence against the stated outcome.

## Tasks

A bounded action with an owner or explicit null owner.

Statuses: `backlog`, `ready`, `in-progress`, `blocked`, `in-review`, `done`, `cancelled`.

`blocked_by` and `blocks` are reciprocal task IDs. Do not infer dependencies from prose.

## Decisions

Statuses: `proposed`, `decided`, `superseded`, `reversed`.

A decided record needs `decision`, `decided_at`, and at least one owner. Rationale and alternatives can live on its detail page. `supersedes_id` points backward; do not rewrite the old decision as though it never existed.

## Risks

Statuses: `identified`, `monitoring`, `mitigating`, `accepted`, `closed`.

Probability and impact are controlled qualitative values, not fake precision. Keep current signals separate from hypothetical causes. Closing a risk requires evidence that it no longer needs active treatment or an explicit acceptance decision.
