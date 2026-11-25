// The site's state: who is signed in, the portfolio's tables, and what the
// person is looking at. What they look at lives in the address
// (#/company/ferncloud, #/portfolio?status=active&layout=table), so every
// view can be linked and the back button works.
import { createStore } from 'zustand/vanilla'
import { useEffect, useState } from 'preact/hooks'
import { connect, loadRecords, readConfig, readSiteSettings, KnownError, fullPath, splitPath } from './known.js'
import { applyTheme } from './theme.js'
import { TABLES, strip, linkTo, keyIn, forCompany, reportedRaised, reporting, roundDate, nowUtc, todayUtc } from './data.js'

export const VIEWS = [
  { id: 'portfolio', label: 'Portfolio', icon: 'portfolio', key: 'p' },
  { id: 'updates', label: 'Updates', icon: 'updates', key: 'u', table: 'updates' },
  { id: 'tasks', label: 'Tasks', icon: 'tasks', key: 't', table: 'tasks' },
  { id: 'review', label: 'Review', icon: 'review', key: 'r', table: 'signals' },
  { id: 'team', label: 'Team', icon: 'team', key: 'm', table: 'team' },
  { id: 'fund', label: 'Fund', icon: 'fund', key: 'f', table: 'fund' }
]

const FILTERS = ['q', 'status', 'position', 'vehicle', 'sector', 'partner', 'layout', 'company', 'origin']

export function readRoute () {
  const raw = location.hash.replace(/^#\/?/, '')
  const [path, query = ''] = raw.split('?')
  const [view, id] = path.split('/').map((part) => (part ? decodeURIComponent(part) : part))
  const params = new URLSearchParams(query)
  const route = { view: 'portfolio', id: null }
  if ((view === 'company' || view === 'member') && id) Object.assign(route, { view, id })
  else if (VIEWS.some((item) => item.id === view)) route.view = view
  for (const name of FILTERS) route[name] = params.get(name) ?? (name === 'q' ? '' : null)
  return route
}

export function routeHash (route) {
  const params = new URLSearchParams()
  for (const name of FILTERS) if (route[name]) params.set(name, route[name])
  const query = params.toString()
  const path = route.view === 'company' || route.view === 'member' ? `${route.view}/${encodeURIComponent(route.id)}` : route.view
  return `#/${path}${query ? '?' + query : ''}`
}

export const store = createStore((set, get) => ({
  phase: 'boot',
  error: null,
  title: 'Portfolio',
  logo: null,
  conn: null,
  me: null,
  orgSlug: null,
  wiki: null,
  names: {},
  keys: {},
  tables: {},
  canWrite: false,
  assistant: false,
  chat: { turns: [], asking: false, open: false },
  arrived: {},
  route: readRoute(),
  help: false,

  navigate (patch, { replace = false } = {}) {
    const route = { ...get().route, ...patch }
    const hash = routeHash(route)
    if (hash === location.hash) return
    // Entries the site made are marked, so going back never leaves the site.
    if (replace) history.replaceState(history.state, '', hash)
    else history.pushState({ site: true }, '', hash)
    set({ route })
  },

  // A new view starts with no filters, except those it is opened with.
  go (view, params = {}) {
    const route = { view, id: null, q: '' }
    for (const name of FILTERS) if (name !== 'q') route[name] = null
    get().navigate({ ...route, ...params })
  },

  openCompany (id) { get().go('company', { id }) },
  toggle (name, value) { set((state) => ({ [name]: value ?? !state[name] })) },

  async signIn () { await get().conn.session.getState().signIn() },
  async signOut () {
    await get().conn.session.getState().signOut()
    set({ phase: 'signed-out', tables: {}, me: null })
  },

  async boot () {
    const site = readSiteSettings()
    if (!site?.clientId || !site?.host) {
      set({ phase: 'error', error: { title: 'This page is not published from Known yet', detail: 'Publish the site from Known; publishing adds the sign-in settings this page needs.' } })
      return
    }
    const config = await readConfig()
    if (config.title) { set({ title: config.title }); document.title = config.title }
    // The fund's look goes on before anything renders, so nothing flashes.
    try {
      const theme = applyTheme(config.theme)
      if (theme?.logo) set({ logo: theme.logo })
    } catch (error) {
      console.warn('[theme] not applied:', error)
    }
    try {
      const conn = await connect(site)
      set({ conn })
      conn.session.subscribe((state, previous) => {
        if (state.status !== previous.status && state.status === 'signed-out' && get().phase === 'ready') set({ phase: 'signed-out' })
      })
      // Inside Known the page asks Known for a token, and is signed in
      // without a click; when Known can't answer, say so instead of
      // offering a sign-in that would not help.
      const status = conn.session.getState().status
      if (status === 'unreachable') { set({ phase: 'error', error: { title: 'Known could not be reached', detail: 'Try again in a moment.' } }); return }
      if (status !== 'signed-in') { set({ phase: 'signed-out' }); return }
      await get().load(config)
    } catch (error) {
      set({ phase: 'error', error: explain(error) })
    }
  },

  async load (config) {
    const { conn } = get()
    set({ phase: 'loading' })
    const me = await conn.call('site.whoami', {})
    const names = Object.fromEntries(TABLES.map((table) => [table, config.tables?.[table] ?? table]))
    const { wiki, pages } = await findWiki(conn, me, config, names)
    const keys = {}
    const tables = {}
    // Every table the wiki has, read at once; a table it lacks is simply
    // absent, and the views that need it stay hidden.
    await Promise.all(TABLES.map(async (table) => {
      const page = pages[names[table]]
      if (!page?.key) return
      keys[table] = page.key
      const records = await loadRecords(conn.call, fullPath(wiki, names[table]))
      tables[table] = Object.fromEntries(records.map((record) => [record[page.key], record]))
    }))
    const entry = me.wikis.find((item) => item.address === wiki || item.name === wiki)
    set({
      phase: 'ready',
      me,
      orgSlug: me.org?.slug,
      wiki,
      names,
      keys,
      tables,
      canWrite: Boolean(entry?.capabilities?.includes('set')),
      // Known's assistant comes with the org's plan (site.whoami says).
      assistant: me.assistant?.available !== false
    })
    get().follow()
  },

  // ---- asking Known's assistant -------------------------------------------
  // The conversation lives in this page; Known keeps none, so every question
  // carries the turns before it. The assistant reads and writes only what
  // this site may, as the signed-in person.
  async ask (question) {
    const text = String(question ?? '').trim()
    const { conn, chat } = get()
    if (!text || chat.asking) return
    const history = chat.turns.filter((turn) => turn.text && !turn.error).map((turn) => ({ role: turn.role, text: turn.text }))
    const answer = { role: 'assistant', text: '', doing: 'Thinking', writes: [] }
    const turns = [...chat.turns, { role: 'user', text }, answer]
    const update = (patch) => set((state) => {
      const next = [...state.chat.turns]
      next[next.length - 1] = { ...next[next.length - 1], ...patch }
      return { chat: { ...state.chat, turns: next } }
    })
    set({ chat: { ...chat, turns, asking: true, open: true } })
    if (!get().assistant) {
      update({ doing: null, error: 'Asking needs Known\'s assistant, which comes with the Advanced plan. This organization isn\'t on it yet.' })
      set((state) => ({ chat: { ...state.chat, asking: false } }))
      return
    }
    try {
      for await (const event of conn.stream('site.ask', { question: text, ...(history.length ? { history } : {}) })) {
        if (event?.type === 'activity' && event.activity?.state === 'running') update({ doing: doingOf(event.activity) })
        else if (event?.type === 'draft') update({ text: event.text ?? '', doing: null })
        else if (event?.type === 'result') update({ text: event.answer ?? get().chat.turns.at(-1).text, doing: null, writes: event.writes ?? [] })
        else if (event?.type === 'revoked') update({ doing: null, error: 'Known stopped this answer: the assistant is no longer available here.' })
      }
    } catch (error) {
      update({ doing: null, error: error?.data?.reason === 'busy' ? 'Another answer of yours is still running. Try again when it finishes.' : (error?.message ?? 'Known could not answer.') })
    } finally {
      update({ doing: null })
      set((state) => ({ chat: { ...state.chat, asking: false } }))
      announce('Answer ready')
    }
  },

  clearChat () { set((state) => ({ chat: { ...state.chat, turns: [] } })) },
  toggleChat (open) { set((state) => ({ chat: { ...state.chat, open: open ?? !state.chat.open } })) },

  // Live: a change to one of the tables brings that table's records written
  // since the last look; a resync reloads everything.
  follow () {
    const { conn } = get()
    const watch = conn.live()
    const pending = new Set()
    const again = new Set()
    const latest = (table) => Math.max(0, ...Object.values(get().tables[table] ?? {}).map((record) => Date.parse(record._ts) || 0))
    const refresh = async (table, since) => {
      // A change that lands while this table loads is not dropped: the
      // load runs once more when it finishes.
      if (pending.has(table)) { again.add(table); return }
      pending.add(table)
      try {
        const { wiki, names, keys } = get()
        const records = await loadRecords(conn.call, fullPath(wiki, names[table]), since ? { since: new Date(since).toISOString() } : {})
        set((state) => {
          const rows = since ? { ...(state.tables[table] ?? {}) } : {}
          const arrived = { ...state.arrived }
          for (const record of records) {
            const key = record[keys[table]]
            const before = state.tables[table]?.[key]
            if (!before || before._v !== record._v) arrived[`${table}/${key}`] = { at: Date.now(), fresh: !before }
            rows[key] = record
          }
          return { tables: { ...state.tables, [table]: rows }, arrived }
        })
        const fresh = records.filter((record) => get().arrived[`${table}/${record[keys[table]]}`]?.fresh)
        if (fresh.length && ['updates', 'signals', 'companies', 'tasks'].includes(table)) announce(`${fresh.length} new in ${table}`)
      } catch {
        // the next change or resync tries again
      } finally {
        pending.delete(table)
        if (again.delete(table)) refresh(table, latest(table))
      }
    }
    watch.getState().onChange((change) => {
      const { names, keys, wiki } = get()
      if (change.wiki && change.wiki !== wiki) return
      if (change.type === 'resync') {
        for (const table of Object.keys(keys)) refresh(table, null)
        return
      }
      const table = Object.keys(keys).find((name) => names[name] === (change.path ?? ''))
      if (table) refresh(table, latest(table))
    })
  },

  // ---- writes ----------------------------------------------------------------
  // Only when the site may write to the wiki (its capabilities include set).
  // A record goes back whole, with the version it was read at.

  async save (table, key, patch) {
    const { conn, wiki, names, tables } = get()
    const record = tables[table]?.[key]
    if (!record) return { ok: false, error: { title: 'Not found', detail: `${key} is not loaded.` } }
    const path = fullPath(wiki, names[table])
    const value = { ...strip(record), ...patch }
    put(set, table, key, { ...record, ...patch })
    try {
      await conn.call('wiki.set', { path, value, ifVersion: record._v })
      const saved = await readOne(conn, path, key)
      if (saved) put(set, table, key, saved)
      announce(`${key} saved`)
      return { ok: true }
    } catch (error) {
      // Someone changed it first, or the write was refused: show what is
      // true now and say so.
      const current = await readOne(conn, path, key).catch(() => null)
      put(set, table, key, current ?? record)
      return { ok: false, error: explain(error) }
    }
  },

  async create (table, value) {
    const { conn, wiki, names, keys } = get()
    const path = fullPath(wiki, names[table])
    const key = value[keys[table] ?? 'id']
    try {
      // Writing a record replaces any record with the same key: check first.
      const taken = await readOne(conn, path, key)
      if (taken) {
        // Keep what is there, so the next try picks the next free key.
        put(set, table, key, taken)
        return { ok: false, error: { title: 'Taken', detail: `${key} was just used by someone else. Try again.` } }
      }
      await conn.call('wiki.set', { path, value })
      const saved = await readOne(conn, path, key)
      put(set, table, key, saved ?? value)
      announce(`${key} saved`)
      return { ok: true, key }
    } catch (error) {
      return { ok: false, error: explain(error) }
    }
  },

  async addTask ({ title, company = null, kind = 'follow-up', owner = null, due = null }) {
    const { names, tables } = get()
    const numbers = Object.keys(tables.tasks ?? {}).map((key) => Number(/^T-(\d+)$/.exec(key)?.[1])).filter(Number.isFinite)
    const next = Math.max(0, ...numbers) + 1
    return get().create('tasks', {
      id: `T-${String(next).padStart(3, '0')}`,
      title,
      company: company ? linkTo('companies', company, names) : null,
      status: 'open',
      kind,
      owner: owner ? linkTo('team', owner, names) : null,
      due_on: due || null,
      from_update: null,
      created_at: nowUtc(),
      content: null
    })
  },

  async addNote (company, { title, content, date = todayUtc() }) {
    const { names, tables, me } = get()
    const base = `${company}-${date}-note`
    let id = base
    for (let n = 2; tables.updates?.[id]; n++) id = `${base}-${n}`
    return get().create('updates', {
      id,
      company: linkTo('companies', company, names),
      date,
      period: null,
      origin: 'fund-note',
      kind: 'call',
      title,
      metrics: {},
      highlights: [],
      lowlights: [],
      asks: [],
      author: me?.user?.name ?? null,
      source_paths: [],
      content: content || null
    })
  },

  async decide (signal, status) {
    // Undo puts a signal back as monitoring left it: undecided.
    const decided = status === 'proposed' ? { decided_by: null, decided_at: null } : { decided_by: get().me?.user?.name ?? null, decided_at: nowUtc() }
    return get().save('signals', signal, { status, ...decided })
  }
}))

function put (set, table, key, record) {
  set((state) => ({ tables: { ...state.tables, [table]: { ...(state.tables[table] ?? {}), [key]: record } } }))
}

async function readOne (conn, path, key) {
  try {
    const result = await conn.call('wiki.get', { path, key })
    return result?.records?.[0] ?? result?.record ?? null
  } catch (error) {
    if (error?.code === -32004 || /not found|no record/i.test(error?.message ?? '')) return null
    throw error
  }
}

// The wiki named in site.json, or the first the site reads that has a
// companies table.
async function findWiki (conn, me, config, names) {
  const wikis = me.wikis.map((item) => item.address ?? item.name)
  if (!wikis.length) throw new KnownError('This site reads no wiki yet.', { code: 'no_wiki' })
  const candidates = config.wiki ? [config.wiki] : wikis
  for (const wiki of candidates) {
    let description
    try {
      description = await conn.describe(wiki)
    } catch (error) {
      // The named wiki must answer; while searching, try the next one.
      if (config.wiki) throw error
      continue
    }
    const pages = {}
    for (const [address, page] of Object.entries(description?.pages ?? {})) pages[splitPath(address).page] = page
    const companies = pages[names.companies]
    if (companies?.key && !companies.schema) throw new KnownError(`${fullPath(wiki, names.companies)} has no schema. Attach the company schema first.`)
    if (companies?.key) return { wiki, pages }
  }
  throw new KnownError(config.wiki ? `No companies table in ${config.wiki}.` : 'None of the wikis this site reads has a companies table.', { code: 'no_table' })
}

export function explain (error) {
  if (error?.code === 'no_wiki') return { title: 'This site reads no wiki yet', detail: 'Let the site read the portfolio wiki in Known, then publish it again.' }
  if (error?.code === 'no_table') return { title: 'No portfolio found', detail: error.message }
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

// ---- deriving what to show ----------------------------------------------------

export const records = (state, table) => Object.values(state.tables[table] ?? {})
export const has = (state, table) => Boolean(state.tables[table])

// One company with what the other tables say about it.
export function companyView (state, company) {
  const { tables, names } = state
  const id = company.id
  const rounds = forCompany(tables, 'rounds', id, names).sort((a, b) => String(roundDate(a) ?? '').localeCompare(String(roundDate(b) ?? '')))
  const updates = forCompany(tables, 'updates', id, names).sort((a, b) => String(b.date).localeCompare(String(a.date)))
  return {
    company,
    rounds,
    raised: reportedRaised(rounds),
    updates,
    report: reporting(company, updates),
    lead: company.lead_partner ? tables.team?.[keyIn(company.lead_partner, 'team', names)] ?? null : null,
    ...fundPeople(state, id)
  }
}

// The fund's people on a company, as the fund's own site lists them: who
// sits on its board, and who lists it among their related investments.
export function fundPeople (state, id) {
  const { tables, names } = state
  const on = (member, field) => (member[field] ?? []).some((link) => keyIn(link, 'companies', names) === id)
  const team = Object.values(tables.team ?? {}).filter((member) => member.status !== 'former')
  return { board: team.filter((member) => on(member, 'board_positions')), linked: team.filter((member) => on(member, 'related_investments')) }
}

export function openTasks (state) {
  return records(state, 'tasks').filter((task) => task.status === 'open')
}

// Signals waiting for a person; accepted ones wait for the next run.
export function pendingSignals (state) {
  return records(state, 'signals').filter((signal) => signal.status === 'proposed')
}

// What the assistant is doing, in words, from the method it is calling.
const DOING = {
  thinking: 'Thinking',
  'wiki.records': 'Reading the records',
  'wiki.get': 'Reading a record',
  'wiki.read': 'Reading a page',
  'wiki.search': 'Searching the portfolio',
  'wiki.history': 'Reading the history',
  'wiki.links': 'Following links',
  'wiki.set': 'Saving a record',
  'wiki.write': 'Writing a page',
  'wiki.edit': 'Editing a page'
}
function doingOf (activity) {
  return DOING[activity.method ?? activity.kind] ?? 'Working'
}
