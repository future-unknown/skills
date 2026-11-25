// One company, whole: what it is now, how it was funded, who runs it, what
// it has reported, what the fund owes it, and how its record got here.
import { useEffect, useMemo, useState } from 'preact/hooks'
import { html } from '../html.js'
import { fullPath } from '../known.js'
import { store, useStore, companyView } from '../store.js'
import { list, stageName, raisedText, money, humanize, roundDate, keyIn, forCompany, shortUrl, isUrl, GRACE_DAYS, todayUtc } from '../data.js'
import { ago, day, full } from '../time.js'
import { timeline, actorOf } from '../history.js'
import { Icon, StatusMark } from '../icons.js'
import { Picture, Empty, Badge, KnownLink, PageBar, useResult, useMarkdown } from './bits.js'
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
  return html`<article class="page company" aria-labelledby="company-name">
    <${PageBar} crumb=${{ label: 'Portfolio', view: 'portfolio' }}>
      <div class="toolbar-end"><${KnownLink} table="companies" recordKey=${company.id} /></div>
    </${PageBar}>
    <${Head} view=${view} />
    <${Facts} view=${view} />
    <${Writing} text=${company.content} />
    ${company.exit_note && html`<p class="note">${company.status && company.status !== 'active' ? html`<strong>${humanize(company.status)}.</strong> ` : ''}${company.exit_note}</p>`}
    <${Rounds} view=${view} />
    <${People} id=${company.id} />
    <${Tasks} id=${company.id} />
    <${Updates} view=${view} />
    <${Media} id=${company.id} />
    <${History} record=${company} />
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
        <${StatusMark} status=${company.status} />
        ${company.website && html`<a href=${company.website} target="_blank" rel="noopener noreferrer">${shortUrl(company.website)}<${Icon} name="external" size=${12} /></a>`}
        ${list(company.profiles).filter((item) => item.kind !== 'website').map((item) => html`<a href=${item.url} target="_blank" rel="noopener noreferrer">${humanize(item.kind)}</a>`)}
      </p>
    </div>
  </header>`
}

function Facts ({ view }) {
  const { company, raised, report, lead } = view
  const rows = [
    ['Our position', company.fund_position ? (company.fund_position === 'held' ? 'Held' : 'Exited') : null],
    ['Entry', [company.entry_round, company.first_invested_year].filter(Boolean).join(', ') || null],
    ['Stage', stageName(company.stage)],
    ['Sectors', list(company.sectors).join(', ') || null],
    ['HQ', company.hq],
    ['Founded', company.founded_year],
    ['Lead partner', lead?.name ?? null],
    ['Board', company.board_role ? humanize(company.board_role) : null],
    ['First invested', company.first_invested_on ? day(company.first_invested_on) : null],
    ['Ownership', company.ownership_percent != null ? `${company.ownership_percent}%${company.ownership_as_of ? ` as of ${day(company.ownership_as_of)}` : ''}` : null],
    ['Reported raised', raisedText(raised) ? html`<span title="Sum of rounds with a stated amount. Rounds may be missing, so this is a floor, not the total raised.">${raisedText(raised)} <span class="muted">at least</span></span>` : null],
    ['Reporting', company.reporting_cadence ? html`${humanize(company.reporting_cadence)}${report.overdue
      ? html` · <span class="flag is-overdue"><${Icon} name="flag" size=${12} />${report.never ? 'no update yet' : `overdue, last ${ago(report.latest.date)}`}</span>`
      : report.latest ? html` · <span class="muted">last ${day(report.latest.date)}</span>` : ''}` : null]
  ].filter(([, value]) => value != null && value !== '')
  if (!rows.length) return null
  return html`<dl class="facts">${rows.map(([name, value]) => html`<div class="fact"><dt>${name}</dt><dd>${value}</dd></div>`)}</dl>`
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
    ? `Fund in${round.fund_amount != null ? ': ' + money(round.fund_amount, round.currency, { compact: false }) : ''}`
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
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, show] = useResult()
  if (!open) return html`<div class="form-open"><button type="button" class="button" onClick=${() => setOpen(true)}><${Icon} name="note" size=${14} />Add a fund note</button></div>`
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
    <label class="field is-wide"><span>Title</span><input name="title" required maxlength="200" autofocus placeholder="Call with the CEO" /></label>
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
