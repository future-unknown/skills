// The site's state: who is signed in, the table's model, its issues, and
// what the person is looking at. What they look at lives in the address
// (#/open?label=auth&issue=ISS-014), so every view can be linked and the
// back button works.
import { createStore } from 'zustand/vanilla'
import { useEffect, useState } from 'preact/hooks'
import { connect, loadRecords, readConfig, readSiteSettings, KnownError } from './known.js'
import { buildModel, looksLikeIssues, get, list, isClosed, priorityRank, statusRank, personName, slugOf, issueKeyOf, strip } from './model.js'

export const VIEWS = [
  { id: 'mine', label: 'Assigned to me', short: 'Mine' },
  { id: 'open', label: 'Open', short: 'Open' },
  { id: 'active', label: 'In progress', short: 'Active' },
  { id: 'blocked', label: 'Blocked', short: 'Blocked' },
  { id: 'recent', label: 'Changed this week', short: 'Recent' },
  { id: 'closed', label: 'Closed', short: 'Closed' },
  { id: 'all', label: 'All issues', short: 'All' }
]

const WEEK = 7 * 24 * 3600 * 1000

export function readRoute () {
  const raw = location.hash.replace(/^#\/?/, '')
  const [view, query = ''] = raw.split('?')
  const params = new URLSearchParams(query)
  return {
    view: VIEWS.some((item) => item.id === view) ? view : 'open',
    label: params.get('label'),
    who: params.get('who'),
    q: params.get('q') ?? '',
    layout: params.get('layout') === 'board' ? 'board' : 'list',
    group: params.get('group') ?? 'status',
    issue: params.get('issue')
  }
}

export function routeHash (route) {
  const params = new URLSearchParams()
  if (route.label) params.set('label', route.label)
  if (route.who) params.set('who', route.who)
  if (route.q) params.set('q', route.q)
  if (route.layout === 'board') params.set('layout', 'board')
  if (route.group && route.group !== 'status') params.set('group', route.group)
  if (route.issue) params.set('issue', route.issue)
  const query = params.toString()
  return `#/${route.view}${query ? '?' + query : ''}`
}

export const store = createStore((set, get_) => ({
  phase: 'boot',
  error: null,
  title: 'Issues',
  conn: null,
  me: null,
  orgSlug: null,
  model: null,
  canWrite: false,
  issues: {},
  arrived: {},
  loadedAt: null,
  route: readRoute(),
  palette: false,
  help: false,
  sidebar: false,

  navigate (patch, { replace = false } = {}) {
    const route = { ...get_().route, ...patch }
    const hash = routeHash(route)
    if (hash === location.hash) return
    if (replace) history.replaceState(null, '', hash)
    else history.pushState(null, '', hash)
    set({ route })
  },

  openIssue (id) { get_().navigate({ issue: id }) },
  closeIssue () { get_().navigate({ issue: null }) },
  toggle (name, value) { set((state) => ({ [name]: value ?? !state[name] })) },

  async signIn () { await get_().conn.session.getState().signIn() },
  async signOut () {
    await get_().conn.session.getState().signOut()
    set({ phase: 'signed-out', issues: {}, me: null })
  },

  async boot () {
    const site = readSiteSettings()
    if (!site?.clientId || !site?.host) {
      set({ phase: 'error', error: { title: 'This page is not published from Known yet', detail: 'Publish the code tree with `known <org> sites publish <site>`; publishing adds the sign-in settings this page needs.' } })
      return
    }
    const config = await readConfig()
    if (config.title) { set({ title: config.title }); document.title = config.title }
    try {
      const conn = await connect(site)
      set({ conn })
      conn.session.subscribe((state, previous) => {
        if (state.status !== previous.status && state.status === 'signed-out' && get_().phase === 'ready') set({ phase: 'signed-out' })
      })
      if (conn.session.getState().status !== 'signed-in') { set({ phase: 'signed-out' }); return }
      await get_().load(site, config)
    } catch (error) {
      set({ phase: 'error', error: explain(error) })
    }
  },

  async load (site, config) {
    const { conn } = get_()
    set({ phase: 'loading' })
    const me = await conn.call('site.whoami', {})
    const table = await findTable(conn, site, config, me)
    const model = buildModel({ ...table, config })
    const records = await loadRecords(conn.call, model.path)
    const issues = {}
    for (const record of records) issues[record[model.key]] = record
    const wiki = me.wikis.find((item) => item.address === table.wiki || item.name === table.wiki)
    set({
      phase: 'ready',
      me,
      orgSlug: me.org?.slug,
      model,
      issues,
      loadedAt: Date.now(),
      canWrite: Boolean(wiki?.capabilities?.includes('set'))
    })
    get_().follow()
  },

  // Live: a change to the table brings the records written since the last
  // look; a resync reloads everything.
  follow () {
    const { conn, model } = get_()
    const watch = conn.live()
    const tablePath = model.path.split('.').slice(1).join('.')
    let latest = Math.max(0, ...Object.values(get_().issues).map((record) => Date.parse(record._ts) || 0))
    let pending = false
    watch.getState().onChange(async (change) => {
      if (change.type === 'change' && (change.path ?? '') !== tablePath) return
      if (pending) return
      pending = true
      try {
        const since = change.type === 'resync' ? null : new Date(latest).toISOString()
        const records = await loadRecords(conn.call, model.path, since ? { since } : {})
        set((state) => {
          const issues = change.type === 'resync' && records.length ? {} : { ...state.issues }
          const arrived = { ...state.arrived }
          const now = Date.now()
          for (const record of records) {
            const id = record[model.key]
            const before = state.issues[id]
            if (!before || before._v !== record._v) arrived[id] = { at: now, fresh: !before }
            issues[id] = record
            latest = Math.max(latest, Date.parse(record._ts) || 0)
          }
          return { issues, arrived }
        })
        const fresh = records.filter((record) => get_().arrived[record[model.key]]?.fresh)
        if (fresh.length) announce(`${fresh.length === 1 ? 'New issue' : fresh.length + ' new issues'}: ${fresh.map((record) => get(model, record, 'title')).join(', ')}`)
      } catch {
        // the next change or resync tries again
      } finally {
        pending = false
      }
    })
  },

  // Writes, when the site may write to the wiki (its capabilities include
  // set). The record goes back whole, with the version it was read at.
  async update (id, patch) {
    const { conn, model, issues } = get_()
    const record = issues[id]
    const value = { ...strip(record), ...patch }
    set((state) => ({ issues: { ...state.issues, [id]: { ...record, ...patch } } }))
    try {
      await conn.call('wiki.set', { path: model.path, value, ifVersion: record._v })
      const fresh = await conn.call('wiki.get', { path: model.path, key: id })
      const saved = fresh?.records?.[0] ?? fresh?.record ?? null
      if (saved) set((state) => ({ issues: { ...state.issues, [id]: saved } }))
      announce(`${id} saved`)
      return { ok: true }
    } catch (error) {
      const fresh = await conn.call('wiki.get', { path: model.path, key: id }).catch(() => null)
      const current = fresh?.records?.[0] ?? record
      set((state) => ({ issues: { ...state.issues, [id]: current } }))
      return { ok: false, error: explain(error) }
    }
  }
}))

async function findTable (conn, site, config, me) {
  const wikis = me.wikis.map((item) => item.address ?? item.name)
  const wanted = config.table ? String(config.table).replace(':', '.') : null
  const candidates = wanted ? [wanted.split('.')[0]] : wikis
  for (const wiki of candidates) {
    const description = await conn.describe(wiki)
    const pages = description?.pages ?? {}
    for (const [fullPath, page] of Object.entries(pages)) {
      const relative = fullPath.split('.').slice(1).join('.')
      const path = `${wiki}.${relative}`
      if (wanted ? path === wanted : (page?.key && looksLikeIssues(page.schema))) {
        if (!page?.schema) throw new KnownError(`${wanted ?? path} has no schema. Attach the issue schema first.`)
        return { wiki, path, key: page.key, schema: page.schema }
      }
    }
  }
  if (!wikis.length) throw new KnownError('This site reads no wiki yet.', { code: 'no_wiki' })
  throw new KnownError(wanted ? `No table at ${wanted} in the wikis this site reads.` : 'None of the wikis this site reads has an issue table.', { code: 'no_table' })
}

export function explain (error) {
  if (error?.code === 'no_wiki') return { title: 'This site reads no wiki yet', detail: 'Attach the wiki that holds the issues: `known <org> sites attach <site> <wiki>`, then publish again.' }
  if (error?.code === 'no_table') return { title: 'No issue table found', detail: error.message }
  if (error?.code === 'signed_out') return { title: 'Signed out', detail: 'Sign in again to keep working.' }
  return { title: 'Something went wrong', detail: error?.message ?? String(error) }
}

export function announce (text) {
  const el = document.getElementById('announcer')
  if (!el) return
  el.textContent = ''
  requestAnimationFrame(() => { el.textContent = text })
}

addEventListener('hashchange', () => store.setState({ route: readRoute() }))
addEventListener('popstate', () => store.setState({ route: readRoute() }))

// Preact hook over the vanilla store.
export function useStore (select) {
  const [value, setValue] = useState(() => select(store.getState()))
  useEffect(() => {
    setValue(() => select(store.getState()))
    return store.subscribe((state) => setValue(() => select(state)))
  }, [])
  return value
}

// ---- deriving what to show --------------------------------------------------

export function isMine (model, record, me) {
  if (!me?.user?.name) return false
  const mine = slugOf(me.user.name)
  return list(get(model, record, 'assignee')).some((who) => slugOf(personName(who)) === mine)
}

export function openBlockers (model, issues, record) {
  return list(get(model, record, 'blockedBy'))
    .map((link) => issueKeyOf(model, link))
    .filter((key) => key && issues[key] && !isClosed(model, issues[key]))
}

export function inView (model, issues, record, view, me) {
  const status = get(model, record, 'status')
  switch (view) {
    case 'mine': return isMine(model, record, me) && !isClosed(model, record)
    case 'open': return !isClosed(model, record)
    case 'active': return model.active.has(status)
    case 'blocked': return !isClosed(model, record) && (model.blocked.has(status) || openBlockers(model, issues, record).length > 0)
    case 'recent': return Date.now() - (Date.parse(record._ts) || 0) < WEEK
    case 'closed': return isClosed(model, record)
    default: return true
  }
}

export function matches (model, record, route) {
  if (route.label && !list(get(model, record, 'labels')).includes(route.label)) return false
  if (route.who) {
    const names = list(get(model, record, 'assignee')).map(personName)
    if (route.who === '—' ? names.length > 0 : !names.includes(route.who)) return false
  }
  if (route.q) {
    const needle = route.q.toLowerCase()
    const hay = [record[model.key], get(model, record, 'title'), ...list(get(model, record, 'labels')), get(model, record, 'content')].filter(Boolean).join(' ').toLowerCase()
    if (!needle.split(/\s+/).every((word) => hay.includes(word))) return false
  }
  return true
}

export function visible (state) {
  const { model, issues, route, me } = state
  if (!model) return []
  const rows = Object.values(issues).filter((record) => inView(model, issues, record, route.view, me) && matches(model, record, route))
  if (route.view === 'recent') return rows.sort((a, b) => (Date.parse(b._ts) || 0) - (Date.parse(a._ts) || 0))
  return rows.sort((a, b) => priorityRank(model, a) - priorityRank(model, b) || (Date.parse(b._ts) || 0) - (Date.parse(a._ts) || 0))
}

export function groupsOf (state, rows) {
  const { model, route } = state
  const group = route.view === 'recent' ? 'none' : route.group
  if (group === 'none') return [{ id: 'all', label: null, rows }]
  const by = new Map()
  const keyOf = (record) => {
    if (group === 'priority') return get(model, record, 'priority') ?? '—'
    if (group === 'assignee') return personName(list(get(model, record, 'assignee'))[0]) ?? '—'
    return get(model, record, 'status') ?? '—'
  }
  for (const record of rows) {
    const key = keyOf(record)
    if (!by.has(key)) by.set(key, [])
    by.get(key).push(record)
  }
  const order = group === 'status' ? (key) => statusRank(model, key) : group === 'priority' ? (key) => (model.priorities.indexOf(key) + 1 || 99) : (key) => (key === '—' ? 'zzz' : key)
  return [...by.entries()].sort((a, b) => (order(a[0]) < order(b[0]) ? -1 : order(a[0]) > order(b[0]) ? 1 : 0)).map(([id, groupRows]) => ({ id, label: id, rows: groupRows }))
}

export function counts (state) {
  const { model, issues, me } = state
  const out = {}
  if (!model) return out
  for (const view of VIEWS) out[view.id] = 0
  const records = Object.values(issues)
  for (const record of records) for (const view of VIEWS) if (inView(model, issues, record, view.id, me)) out[view.id]++
  return out
}

export function facets (state) {
  const { model, issues } = state
  const labels = new Map()
  const people = new Map()
  if (!model) return { labels: [], people: [] }
  for (const record of Object.values(issues)) {
    if (isClosed(model, record)) continue
    for (const label of list(get(model, record, 'labels'))) labels.set(label, (labels.get(label) ?? 0) + 1)
    for (const who of list(get(model, record, 'assignee'))) {
      const name = personName(who)
      people.set(name, (people.get(name) ?? 0) + 1)
    }
  }
  const sorted = (map) => [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  return { labels: sorted(labels), people: sorted(people) }
}
