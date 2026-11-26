// One company, whole: what it is now, how it was funded, who runs it, what
// it has reported, what the fund owes it, and how its record got here.
import { useEffect, useMemo, useState } from 'preact/hooks'
import { html } from '../html.js'
import { fullPath } from '../known.js'
import { store, useStore, companyView, routeHash } from '../store.js'
import { list, stageName, raisedText, money, humanize, roundDate, keyIn, forCompany, shortUrl, isUrl, GRACE_DAYS, todayUtc } from '../data.js'
import { ago, day, full } from '../time.js'
import { timeline, actorOf } from '../history.js'
import { Icon, StatusMark } from '../icons.js'
import { Picture, Empty, Badge, KnownLink, PageBar, useResult, useMarkdown, useOpener } from './bits.js'
import { UpdateItem } from './updates.js'
import { TaskRow, NewTask } from './tasks.js'

export function CompanyView () {
  const state = useStore((value) => value)
  const { route, tables } = state
  const company = tables.companies?.[route.id]
  const view = useMemo(() => (company ? companyView(state, company) : null), [tables, route.id])
  if (!company) {
    return html`<div class="page"><${PageBar} title="Company" />
      <${Empty} title="No company with this key">
        <button type="button" class="button" onClick=${() => store.getState().go('portfolio')}>Back to the portfolio</button>
      </${Empty}></div>`
  }
  // The company's story on the left (what it is, how it was funded, what it
  // says); who runs it and what the fund owes it on the right.
  return html`<article class="page company" aria-labelledby="company-name">
    <${PageBar} crumb=${{ label: 'Portfolio', view: 'portfolio' }}>
      <div class="toolbar-end"><${KnownLink} table="companies" recordKey=${company.id} /></div>
    </${PageBar}>
    <${Head} view=${view} />
    <${Facts} view=${view} />
    <div class="company-body">
      <div class="company-main">
        <${Writing} text=${company.content} />
        ${company.exit_note && html`<p class="note">${company.status && company.status !== 'active' ? html`<strong>${humanize(company.status)}.</strong> ` : ''}${company.exit_note}</p>`}
        <${Rounds} view=${view} />
        <${Updates} view=${view} />
      </div>
      <aside class="company-side" aria-label="People, tasks and records">
        <${FundTeam} view=${view} />
        <${People} id=${company.id} />
        <${Tasks} id=${company.id} />
        <${Media} id=${company.id} />
        <${History} record=${company} />
      </aside>
    </div>
  </article>`
}

function Head ({ view }) {
  const { company } = view
  return html`<header class="company-head">
    <${Picture} value=${company.logo} name=${company.name} size="xl" />
    <div class="company-id">
      <h1 class="company-name" id="company-name">${company.name}</h1>
      ${company.one_liner && html`<p class="company-line">${company.one_liner}</p>`}
      <p class="company-sub">
        ${company.status && html`<${StatusMark} status=${company.status} />`}
        ${company.website && html`<a href=${company.website} target="_blank" rel="noopener noreferrer">${shortUrl(company.website)}<${Icon} name="external" size=${12} /></a>`}
        ${list(company.profiles).filter((item) => item.kind !== 'website').map((item) => html`<a href=${item.url} target="_blank" rel="noopener noreferrer">${humanize(item.kind)}</a>`)}
      </p>
    </div>
  </header>`
}

// The company at a glance: four headline figures, then the details in one
// quiet line (sectors, where and when, and the fund's people on it).
function Facts ({ view }) {
  const { company, raised, report, lead } = view
  const route = useStore((state) => state.route)
  const raisedValue = raisedText(raised)?.replace(/^≥\s*/, '') ?? null
  const latest = view.rounds?.length ? view.rounds[view.rounds.length - 1] : null
  const latestWhen = latest ? (latest.announced_on ?? latest.closed_on ?? latest.year) : null
  const stats = [
    ['Raised', raisedValue ? html`<span class="stat-floor" aria-hidden="true">≥</span>${raisedValue}` : null, 'Publicly reported, at least', 'Sum of rounds with a stated amount. Rounds may be missing, so this is a floor, not the total raised.'],
    // The stage as the latest round names it ("Series E"), where the stage
    // alone is a bucket ("Series D+").
    ['Stage', (latest && /^series [d-z]\b/i.test(latest.name ?? '') && company.stage === 'series-d-plus') ? latest.name.match(/^series [d-z]/i)[0].replace(/^series/i, 'Series') : (stageName(company.stage ?? latest?.stage ?? null) ?? company.fund_stage ?? null), latestWhen ? `Latest round ${String(latestWhen).slice(0, 4)}` : 'Latest known round'],
    ['Entry', company.entry_round ?? (company.first_invested_year ? String(company.first_invested_year) : null), company.entry_round && company.first_invested_year ? `Fund's first round, ${company.first_invested_year}` : "Fund's first round"],
    ['Position', company.fund_position ? (company.fund_position === 'held' ? 'Held' : 'Exited') : null, company.ownership_percent != null ? `${company.ownership_percent}% owned${company.ownership_as_of ? ', ' + day(company.ownership_as_of) : ''}` : list(company.vehicles).length ? `In ${list(company.vehicles).join(', ')}` : (company.status && company.status !== 'active' ? humanize(company.status) : 'Fund\'s stake')]
  ]
  const people = [...(lead ? [[lead, 'Lead']] : []), ...(view.board ?? []).filter((member) => member.id !== lead?.id).map((member) => [member, 'Board'])]
  const where = [company.hq, company.founded_year ? `Founded ${company.founded_year}` : null].filter(Boolean)
  const reportingLine = company.reporting_cadence ? html`${humanize(company.reporting_cadence)} reporting${report.overdue
    ? html` · <span class="flag is-overdue"><${Icon} name="flag" size=${12} />${report.never ? 'no update yet' : `overdue, last ${ago(report.latest.date)}`}</span>`
    : report.latest ? html` · <span class="muted">last ${day(report.latest.date)}</span>` : ''}` : null
  return html`<section class="glance" aria-label="At a glance">
    ${stats.some(([, value]) => value != null) && html`<dl class="stats">${stats.map(([label, value, caption, title]) => html`<div class="stat" title=${title ?? null}>
      <dt>${label}</dt>
      <dd class=${'stat-value' + (value == null ? ' is-empty' : '')}>${value ?? '—'}</dd>
      <dd class="stat-caption">${caption}</dd>
    </div>`)}</dl>`}
    ${(list(company.sectors).length || where.length || people.length || reportingLine) && html`<div class="glance-meta">
      ${list(company.sectors).length > 0 && html`<span class="glance-item"><span class="visually-hidden">Sectors: </span>${list(company.sectors).map((sector) => html`<span class="chip-tag">${sector}</span>`)}</span>`}
      ${where.length > 0 && html`<span class="glance-item"><${Icon} name="fund" size=${14} />${where.join(' · ')}</span>`}
      ${reportingLine && html`<span class="glance-item">${reportingLine}</span>`}
      ${people.length > 0 && html`<span class="glance-item glance-people"><span class="glance-label">Fund on the board</span>${people.map(([member, role]) => html`<a class="glance-person" href=${routeHash({ ...route, view: 'member', id: member.id })}
          onClick=${(event) => { if (event.metaKey || event.ctrlKey) return; event.preventDefault(); store.getState().navigate({ view: 'member', id: member.id }) }} title=${role}>
          <${Picture} value=${member.photo} name=${member.name} kind="headshot" size="s" />${member.name}</a>`)}</span>`}
    </div>`}
  </section>`
}

function Writing ({ text }) {
  const body = useMarkdown(text, [text])
  return body ? html`<div class="prose" dangerouslySetInnerHTML=${{ __html: body }}></div>` : null
}

function Section ({ id, title, count = null, children, action = null }) {
  return html`<section class="section" aria-labelledby=${id}>
    <div class="section-head"><h2 class="section-title" id=${id}>${title}${count != null && html`<span class="view-count">${count}</span>`}</h2>${action}</div>
    ${children}
  </section>`
}

function Rounds ({ view }) {
  const { rounds } = view
  return html`<${Section} id="rounds" title="Funding" count=${rounds.length || null}>
    ${rounds.length
      ? html`<ol class="rounds">${rounds.map((round) => html`<${Round} key=${round.id} round=${round} />`)}</ol>`
      : html`<p class="muted">No rounds on record.</p>`}
    ${rounds.some((round) => round.amount == null) && html`<p class="hint-text">Rounds without a stated amount are listed but not counted.</p>`}
  </${Section}>`
}

function Round ({ round }) {
  const when = roundDate(round)
  const fund = round.fund_participated === true
    ? `Fund in${round.fund_amount != null ? ': ' + money(round.fund_amount, round.currency, { compact: false }) : ''}${round.vehicle ? ` from ${round.vehicle}` : ''}`
    : round.fund_participated === false ? 'Fund not in' : null
  const terms = [
    round.instrument && humanize(round.instrument),
    round.pre_money != null && `${money(round.pre_money, round.currency)} pre`,
    round.post_money != null && `${money(round.post_money, round.currency)} post`,
    round.valuation_cap != null && `${money(round.valuation_cap, round.currency)} cap`
  ].filter(Boolean)
  return html`<li class="round">
    <span class="round-mark" aria-hidden="true"></span>
    <div class="round-body">
      <p class="round-line">
        <strong>${round.name}</strong>
        <span class="round-amount">${round.amount != null ? money(round.amount, round.currency) : html`<span class="muted">amount not stated</span>`}</span>
        ${when ? html`<time datetime=${when}>${when.length === 4 ? when : day(when)}</time>` : html`<span class="muted">date unknown</span>`}
        <${Badge} kind=${round.basis} />
      </p>
      ${terms.length > 0 && html`<p class="round-meta">${terms.join(' · ')}</p>`}
      ${(list(round.lead_investors).length > 0 || list(round.investors).length > 0) && html`<p class="round-meta">
        ${list(round.lead_investors).length > 0 && html`Led by ${list(round.lead_investors).join(', ')}`}
        ${list(round.investors).length > 0 && html`${list(round.lead_investors).length ? ' · with ' : 'With '}${list(round.investors).join(', ')}`}
      </p>`}
      ${fund && html`<p class="round-meta">${fund}</p>`}
      <${Sources} paths=${round.source_paths} />
    </div>
  </li>`
}

function Sources ({ paths }) {
  const items = list(paths)
  if (!items.length) return null
  return html`<p class="sources">Source: ${items.map((source, index) => html`${index ? ', ' : ''}${isUrl(source) ? html`<a href=${source} target="_blank" rel="noopener noreferrer">${shortUrl(source)}</a>` : source}`)}</p>`
}

function People ({ id }) {
  const tables = useStore((state) => state.tables)
  const names = useStore((state) => state.names)
  if (!tables.people) return null
  const people = forCompany(tables, 'people', id, names)
    .sort((a, b) => (a.status === 'former') - (b.status === 'former') || ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role) || a.name.localeCompare(b.name))
  return html`<${Section} id="people" title="People" count=${people.length || null}>
    ${people.length
      ? html`<ul class="people">${people.map((person) => html`<li class=${'person-card' + (person.status === 'former' ? ' is-former' : '')}>
          <${Picture} value=${person.photo} name=${person.name} kind="headshot" size="m" />
          <div class="person-text">
            <p class="person-name">${person.name}${person.status === 'former' && html` <span class="badge is-former">Former</span>`}</p>
            <p class="person-title">${person.title ?? humanize(person.role)}</p>
            ${list(person.profiles).length > 0 && html`<p class="person-links">${list(person.profiles).map((item) => html`<a href=${item.url} target="_blank" rel="noopener noreferrer">${humanize(item.kind)}</a>`)}</p>`}
          </div>
        </li>`)}</ul>`
      : html`<p class="muted">No people on record.</p>`}
  </${Section}>`
}

const ROLE_ORDER = ['founder', 'executive', 'board', 'advisor', 'other']

// The fund's people on this company, as the fund's own site lists them:
// board seats first, then those who list it as a related investment.
function FundTeam ({ view }) {
  const route = useStore((state) => state.route)
  const seen = new Set()
  const rows = [
    ...(view.lead ? [[view.lead, 'Lead partner']] : []),
    ...(view.board ?? []).map((member) => [member, 'Board']),
    ...(view.linked ?? []).map((member) => [member, 'Related investment'])
  ].filter(([member]) => !seen.has(member.id) && seen.add(member.id))
  if (!rows.length) return null
  return html`<${Section} id="fund-team" title="Fund team" count=${rows.length}>
    <ul class="people">${rows.map(([member, role]) => html`<li>
      <a class="person-card is-link" href=${routeHash({ ...route, view: 'member', id: member.id })}
        onClick=${(event) => { if (event.metaKey || event.ctrlKey) return; event.preventDefault(); store.getState().navigate({ view: 'member', id: member.id }) }}>
        <${Picture} value=${member.photo} name=${member.name} kind="headshot" size="m" />
        <span class="person-text"><span class="person-name">${member.name}</span><span class="person-title">${role} · ${member.title ?? humanize(member.role)}</span></span>
      </a>
    </li>`)}</ul>
  </${Section}>`
}

function Tasks ({ id }) {
  const tables = useStore((state) => state.tables)
  const names = useStore((state) => state.names)
  const canWrite = useStore((state) => state.canWrite)
  if (!tables.tasks) return null
  const tasks = forCompany(tables, 'tasks', id, names).filter((task) => task.status === 'open')
  return html`<${Section} id="tasks" title="Open tasks" count=${tasks.length || null}>
    ${tasks.length ? html`<ul class="tasks">${tasks.map((task) => html`<${TaskRow} key=${task.id} task=${task} />`)}</ul>` : html`<p class="muted">Nothing open.</p>`}
    ${canWrite && html`<${NewTask} company=${id} />`}
  </${Section}>`
}

function Updates ({ view }) {
  const tables = useStore((state) => state.tables)
  const canWrite = useStore((state) => state.canWrite)
  if (!tables.updates) return null
  const { company, updates } = view
  return html`<${Section} id="updates" title="Updates" count=${updates.length || null}>
    ${canWrite && html`<${NewNote} company=${company.id} />`}
    ${updates.length
      ? html`<ol class="feed">${updates.map((update) => html`<${UpdateItem} key=${update.id} update=${update} />`)}</ol>`
      : html`<p class="muted">${company.reporting_cadence && GRACE_DAYS[company.reporting_cadence] ? `Expected ${company.reporting_cadence}. ` : ''}No updates yet. Forward one to your agent to file it.</p>`}
  </${Section}>`
}

// A fund note: the team's own call note or view, never the company's claim.
function NewNote ({ company }) {
  const { open, setOpen, trigger, field } = useOpener()
  const [busy, setBusy] = useState(false)
  const [error, show] = useResult()
  if (!open) return html`<div class="form-open"><button type="button" class="button" ref=${trigger} onClick=${() => setOpen(true)}><${Icon} name="note" size=${14} />Add a fund note</button></div>`
  const submit = async (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const title = String(form.get('title') ?? '').trim()
    if (!title) return
    setBusy(true)
    const result = await store.getState().addNote(company, { title, content: String(form.get('content') ?? '').trim(), date: form.get('date') || todayUtc() })
    setBusy(false)
    show(result)
    if (result.ok) setOpen(false)
  }
  return html`<form class="form" onSubmit=${submit} aria-label="New fund note">
    <label class="field is-wide"><span>Title</span><input name="title" ref=${field} required maxlength="200" placeholder="Call with the CEO" /></label>
    <label class="field"><span>Date</span><input name="date" type="date" value=${todayUtc()} /></label>
    <label class="field is-wide"><span>Note</span><textarea name="content" rows="5" placeholder="What was said, and the fund's view. Markdown works."></textarea></label>
    <p class="hint-text is-wide">Saved as a fund note, kept apart from what the company reports.</p>
    <div class="form-actions">
      <button type="submit" class="button is-primary" disabled=${busy}>${busy ? 'Saving…' : 'Save note'}</button>
      <button type="button" class="button" onClick=${() => setOpen(false)}>Cancel</button>
    </div>
    ${error}
  </form>`
}

function Media ({ id }) {
  const tables = useStore((state) => state.tables)
  const names = useStore((state) => state.names)
  if (!tables.media) return null
  const items = Object.values(tables.media).filter((media) => keyIn(media.subject, 'companies', names) === id ||
    forCompany(tables, 'people', id, names).some((person) => keyIn(media.subject, 'people', names) === person.id))
  if (!items.length) return null
  return html`<${Section} id="media" title="Media references" count=${items.length}>
    <p class="hint-text">Known keeps where each file lives, not the file.</p>
    <ul class="media-list">${items.map((media) => html`<li class="media-item">
      <${Icon} name=${media.kind === 'document' ? 'doc' : 'image'} size=${14} />
      <span class="media-kind">${humanize(media.kind)}</span>
      <a class="media-url" href=${media.url} target="_blank" rel="noopener noreferrer">${media.alt ?? shortUrl(media.url)}</a>
      ${media.status !== 'current' && html`<span class=${'badge is-' + media.status}>${humanize(media.status)}</span>`}
      ${media.fetched_at && html`<span class="muted">checked ${ago(media.fetched_at)}</span>`}
    </li>`)}</ul>
  </${Section}>`
}

// The company record's versions, read from Known: who changed what, when.
function History ({ record }) {
  const conn = useStore((state) => state.conn)
  const me = useStore((state) => state.me)
  const wiki = useStore((state) => state.wiki)
  const names = useStore((state) => state.names)
  const key = useStore((state) => state.keys.companies ?? 'id')
  const [versions, setVersions] = useState(null)
  const [error, setError] = useState(null)
  const id = record[key]
  useEffect(() => {
    let live = true
    conn.call('wiki.history', { path: fullPath(wiki, names.companies), key: id, limit: 50 })
      .then((result) => { if (live) setVersions(result?.versions ?? []) })
      .catch((reason) => { if (live) setError(reason.message) })
    return () => { live = false }
  }, [id, record._v])
  const entries = useMemo(() => (versions ? timeline(versions, key) : []), [versions])
  return html`<section class="activity" aria-labelledby="history">
    <h2 class="activity-title" id="history">History</h2>
    ${error && html`<p class="activity-note">History isn't available: ${error}</p>`}
    ${!versions && !error && html`<ol class="timeline is-loading" aria-busy="true"><li class="skeleton"></li><li class="skeleton"></li></ol>`}
    ${versions && html`<ol class="timeline">
      ${entries.map(({ version, created, changes }) => {
        const actor = actorOf(version, me)
        const fields = changes.filter((change) => change.field !== 'content')
        return html`<li class="event">
          <span class=${'event-mark' + (actor.agent ? ' is-agent' : '')} aria-hidden="true">${actor.agent ? html`<${Icon} name="agent" size=${12} />` : null}</span>
          <div class="event-body">
            <p class="event-line"><strong>${actor.who}</strong> ${created ? 'added this company' : describe(changes)}
              <time class="event-when" datetime=${version._ts} title=${full(version._ts)}>${ago(version._ts)}</time></p>
            ${!created && fields.length > 0 && html`<ul class="changes">
              ${fields.map((change) => html`<li class="change"><span class="change-field">${humanize(change.field)}</span>${show(change.from, true)}<${Icon} name="arrow" size=${12} class="change-arrow" />${show(change.to)}</li>`)}
            </ul>`}
          </div>
        </li>`
      })}
      ${versions.length >= 50 && html`<li class="event is-more"><span class="event-mark" aria-hidden="true"></span><p class="event-line">Older versions are in Known.</p></li>`}
    </ol>`}
  </section>`
}

function describe (changes) {
  const content = changes.some((change) => change.field === 'content')
  const rest = changes.length - (content ? 1 : 0)
  if (!changes.length) return 'saved it again'
  if (content && !rest) return 'edited the notes'
  if (content) return `changed ${rest === 1 ? '1 field' : rest + ' fields'} and the notes`
  return rest === 1 ? `changed ${humanize(changes[0].field).toLowerCase()}` : `changed ${rest} fields`
}

function show (value, before = false) {
  const cls = 'change-value' + (before ? ' is-before' : '')
  if (value == null || (Array.isArray(value) && !value.length)) return html`<span class=${cls + ' is-empty'}>none</span>`
  if (Array.isArray(value)) return html`<span class=${cls}>${value.map((item) => (typeof item === 'object' ? item.url ?? '…' : item)).join(', ')}</span>`
  if (typeof value === 'object') return html`<span class=${cls}>…</span>`
  const text = String(value)
  return html`<span class=${cls}>${text.length > 60 ? text.slice(0, 57) + '…' : text}</span>`
}
