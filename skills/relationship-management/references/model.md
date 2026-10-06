# Relationship management model

## Organizations

Canonical current identity for a company, fund, community, institution, or other organization. Preserve source-stated names separately when they differ. A website or email domain is evidence, not a guaranteed identity match.

## Contacts

Canonical current identity within this wiki. `organization_id` is nullable until verified. `relationship_types` can include several honest contexts, such as customer, investor, advisor, partner, candidate, connector, or personal.

Engagement statuses are intentionally modest: `uncontacted`, `contacted`, `engaged`, `inactive`, `closed`. Domain qualification belongs in the domain skill.

## Interactions

Dated evidence that communication occurred. Record direction, channel, participants, summary, explicit signals, explicit non-signals, and source paths. Do not reinterpret a historical interaction when current state changes.

## Introductions

Statuses:

```text
offered → requested → accepted → sent → meeting-scheduled → completed
                         ↘ declined
```

Not every introduction follows every step. Advance only to the state evidenced by a message or event. A request is not acceptance; acceptance is not a sent introduction; a sent introduction is not a meeting.
