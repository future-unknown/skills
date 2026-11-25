// What the records mean once they are loaded: links between tables, money,
// reporting cadence. Everything here is derived on the fly from canonical
// records; nothing derived is ever written back.

// The tables the site knows, by their default page names in the wiki.
// site.json may rename any of them ("tables": { "companies": "portfolio-companies" }).
export const TABLES = ['fund', 'team', 'companies', 'rounds', 'people', 'media', 'updates', 'tasks', 'signals', 'runs']

// [[table/key|label]] → { target, table, key, label }. A link may name its
// wiki ([[portfolio:companies/ferncloud]]); the wiki part is dropped.
const LINK = /^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/
export function parseLink (value) {
  const match = LINK.exec(String(value ?? '').trim())
  if (!match) return null
  const target = match[1].includes(':') ? match[1].split(':').slice(1).join(':') : match[1]
  const slash = target.lastIndexOf('/')
  return {
    target,
    table: slash === -1 ? target : target.slice(0, slash),
    key: slash === -1 ? null : target.slice(slash + 1),
    label: match[2] ?? null
  }
}

// The key a link points at, when it points into the given table.
export function keyIn (value, table, names) {
  const link = parseLink(value)
  if (!link?.key) return null
  const page = names?.[table] ?? table
  return link.table === page || link.table === table || link.table.endsWith('.' + page) ? link.key : null
}

export function linkTo (table, key, names) {
  return `[[${names?.[table] ?? table}/${key}]]`
}

export function list (value) {
  if (value == null) return []
  return Array.isArray(value) ? value.filter((item) => item != null && item !== '') : [value]
}

export function humanize (value) {
  if (value == null) return ''
  const text = String(value).replace(/[_-]+/g, ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// Stage slugs read better with their usual capitals.
const STAGE_NAMES = { 'pre-seed': 'Pre-seed', seed: 'Seed', 'series-a': 'Series A', 'series-b': 'Series B', 'series-c': 'Series C', 'series-d-plus': 'Series D+', growth: 'Growth', public: 'Public', bridge: 'Bridge' }
export const stageName = (stage) => (stage ? STAGE_NAMES[stage] ?? humanize(stage) : null)

export function initials (name) {
  if (!name) return ''
  const parts = String(name).trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

export function strip (record) {
  const value = {}
  for (const [name, field] of Object.entries(record)) if (!name.startsWith('_')) value[name] = field
  return value
}

// ---- money -----------------------------------------------------------------

export function money (amount, currency, { compact = true } = {}) {
  if (amount == null) return null
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, notation: compact ? 'compact' : 'standard', maximumFractionDigits: compact ? 1 : 0 }).format(amount)
  } catch {
    // A missing or unknown code still shows the number, with the code as written.
    return `${new Intl.NumberFormat(undefined, { notation: compact ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(amount)}${currency ? ' ' + currency : ''}`
  }
}

// Rounds with a stated amount, summed per currency. Public sources miss
// rounds, so this is a floor ("at least"), never the total raised.
export function reportedRaised (rounds) {
  const sums = new Map()
  for (const round of rounds) {
    if (round.amount == null || !round.currency) continue
    // Debt and grants are money in, not equity raised.
    if (round.instrument === 'debt' || round.instrument === 'grant') continue
    sums.set(round.currency, (sums.get(round.currency) ?? 0) + round.amount)
  }
  return [...sums.entries()].map(([currency, amount]) => ({ currency, amount }))
}

export function raisedText (sums) {
  if (!sums.length) return null
  return '≥ ' + sums.map(({ amount, currency }) => money(amount, currency)).join(' + ')
}

// ---- dates -----------------------------------------------------------------

const DAY = 24 * 3600 * 1000
export function daysSince (date, now = Date.now()) {
  const t = Date.parse(String(date).length === 10 ? date + 'T12:00:00Z' : date)
  return t ? Math.floor((now - t) / DAY) : null
}

export function todayUtc () {
  return new Date().toISOString().slice(0, 10)
}

export function nowUtc () {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
}

// The newest round date we know: closed, else announced.
// A round's date for sorting and showing: the exact date when known, else
// its year alone ("2019"), never a made-up day.
export const roundDate = (round) => round.closed_on ?? round.announced_on ?? (round.year ? String(round.year) : null)

// ---- reporting -------------------------------------------------------------

// How long a company may go quiet before its update is overdue: a little
// slack past the cadence, since updates land a few days after month end.
export const GRACE_DAYS = { monthly: 45, quarterly: 120 }

export function reporting (company, updates) {
  const reported = updates
    .filter((update) => update.origin === 'company-reported')
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
  const latest = reported[0] ?? null
  const limit = GRACE_DAYS[company.reporting_cadence] ?? null
  const age = latest ? daysSince(latest.date) : null
  const overdue = limit != null && (age == null || age > limit)
  return { latest, age, overdue, never: limit != null && !latest }
}

// ---- lookups over the loaded tables ----------------------------------------

export function byLink (tables, table, value, names) {
  const key = keyIn(value, table, names)
  return key ? tables[table]?.[key] ?? null : null
}

export function forCompany (tables, table, companyId, names) {
  return Object.values(tables[table] ?? {}).filter((record) => keyIn(record.company, 'companies', names) === companyId)
}

// The image a record points at, when the reference still answers.
export function imageOf (tables, value, names) {
  const media = byLink(tables, 'media', value, names)
  if (!media || media.status === 'broken' || !/^https?:\/\//.test(media.url ?? '')) return null
  return media
}

export function personNameOf (tables, value, names) {
  if (!value) return null
  const record = byLink(tables, 'team', value, names) ?? byLink(tables, 'people', value, names)
  if (record?.name) return record.name
  const link = parseLink(value)
  if (!link) return String(value)
  if (link.label) return link.label
  return (link.key ?? link.target).split(/[-_]/).filter(Boolean).map((part) => part[0].toUpperCase() + part.slice(1)).join(' ')
}

export function shortUrl (url) {
  try {
    const parsed = new URL(url)
    return parsed.host.replace(/^www\./, '') + parsed.pathname.replace(/\/$/, '')
  } catch { return url }
}

export const isUrl = (value) => /^https?:\/\//.test(String(value ?? ''))
