// What the table's schema says the issues are. The site shows whatever the
// schema declares: its statuses in their order become the workflow and the
// board, its enums become the choices, and link fields become references.
// site.json may name fields when a table uses other names.

const CLOSED_NAMES = new Set(['done', 'cancelled', 'canceled', 'closed', 'resolved', 'wontfix', 'won\'t fix', 'duplicate', 'archived'])
const ACTIVE_NAMES = new Set(['in_progress', 'in-progress', 'doing', 'started', 'in_review', 'in-review', 'review', 'active'])
const BLOCKED_NAMES = new Set(['blocked', 'on_hold', 'on-hold', 'waiting'])

const ROLE_GUESSES = {
  title: ['title', 'name', 'summary'],
  status: ['status', 'state'],
  priority: ['priority'],
  severity: ['severity'],
  type: ['type', 'kind'],
  assignee: ['assignee', 'owner', 'owners', 'assignees'],
  reporter: ['reporter', 'requested_by'],
  labels: ['labels', 'tags'],
  parent: ['parent'],
  related: ['related_to', 'related'],
  blockedBy: ['blocked_by'],
  blocks: ['blocks'],
  links: ['links'],
  due: ['due_at', 'due', 'due_date'],
  created: ['created_at', 'created'],
  content: ['content', 'body', 'description']
}

function typesOf (prop) {
  return Array.isArray(prop?.type) ? prop.type : prop?.type ? [prop.type] : []
}

function enumOf (prop) {
  const values = prop?.enum ?? prop?.items?.enum ?? null
  return values ? values.filter((value) => value !== null) : null
}

export function buildModel ({ schema, key, path, config = {} }) {
  const props = schema?.properties ?? {}
  const fields = {}
  for (const [role, names] of Object.entries(ROLE_GUESSES)) {
    const chosen = config.fields?.[role]
    if (chosen && props[chosen]) { fields[role] = chosen; continue }
    fields[role] = names.find((name) => props[name]) ?? null
  }
  const statuses = enumOf(props[fields.status]) ?? []
  const closed = new Set(config.closed ?? statuses.filter((status) => CLOSED_NAMES.has(status)))
  const active = new Set(statuses.filter((status) => ACTIVE_NAMES.has(status)))
  const blocked = new Set(statuses.filter((status) => BLOCKED_NAMES.has(status)))
  const priorities = enumOf(props[fields.priority]) ?? []
  const required = new Set(schema?.required ?? [])
  return {
    path,
    key: key ?? 'id',
    schema,
    fields,
    props,
    required,
    statuses,
    closed,
    active,
    blocked,
    priorities,
    severities: enumOf(props[fields.severity]) ?? [],
    types: enumOf(props[fields.type]) ?? [],
    many: (role) => typesOf(props[fields[role]]).includes('array'),
    describe: (field) => props[field]?.description ?? null
  }
}

// Whether a page's schema looks like an issue table.
export function looksLikeIssues (schema) {
  const props = schema?.properties ?? {}
  return Boolean((props.title || props.name || props.summary) && (props.status || props.state))
}

export const get = (model, record, role) => (model.fields[role] ? record[model.fields[role]] : undefined)

export function list (value) {
  if (value == null) return []
  return Array.isArray(value) ? value.filter((item) => item != null && item !== '') : [value]
}

export function isClosed (model, record) {
  return model.closed.has(get(model, record, 'status'))
}

export function priorityRank (model, record) {
  const index = model.priorities.indexOf(get(model, record, 'priority'))
  return index === -1 ? model.priorities.length : index
}

export function statusRank (model, status) {
  const index = model.statuses.indexOf(status)
  return index === -1 ? model.statuses.length : index
}

// [[path/KEY|label]] → { target, path, key, label }
const LINK = /^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/
export function parseLink (value) {
  const match = LINK.exec(String(value ?? '').trim())
  if (!match) return null
  const target = match[1]
  const slash = target.lastIndexOf('/')
  return {
    target,
    path: slash === -1 ? target : target.slice(0, slash),
    key: slash === -1 ? null : target.slice(slash + 1),
    label: match[2] ?? null
  }
}

// A person as written: a link to their record, or a name.
export function personName (value) {
  if (value == null || value === '') return null
  const link = parseLink(value)
  if (!link) return String(value)
  if (link.label) return link.label
  const slug = (link.key ?? link.target.split(/[/.:]/).pop())
  return slug.split(/[-_]/).filter(Boolean).map((part) => part[0].toUpperCase() + part.slice(1)).join(' ')
}

export function initials (name) {
  if (!name) return ''
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

export function slugOf (name) {
  return String(name ?? '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// The key an issue link points at, when it points into this table.
export function issueKeyOf (model, value) {
  const link = parseLink(value)
  if (!link?.key) return null
  const tail = model.path.split('.').slice(1).join('.')
  const linkPath = link.path.includes(':') ? link.path.split(':')[1] : link.path
  return linkPath === tail || linkPath === model.path || linkPath.endsWith('.' + tail) || tail.endsWith(linkPath) ? link.key : null
}

export function humanize (value) {
  if (value == null) return ''
  const text = String(value).replace(/[_-]+/g, ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function strip (record) {
  const value = {}
  for (const [name, field] of Object.entries(record)) if (!name.startsWith('_')) value[name] = field
  return value
}
