// One issue, whole: what it is now, what it waits on, what it says, and how
// it got here.
import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { html } from '../html.js'
import { store, useStore, announce, routeHash } from '../store.js'
import { get, list, humanize, personName, parseLink, issueKeyOf, isClosed } from '../model.js'
import { appUrlFor } from '../known.js'
import { renderMarkdown } from '../markdown.js'
import { timeline, actorOf } from '../history.js'
import { Icon, StatusGlyph, PriorityGlyph } from '../icons.js'
import { Avatar, Label, Empty } from './bits.js'
import { ago, full, day } from '../time.js'

export function IssuePane () {
  const route = useStore((state) => state.route)
  const record = useStore((state) => (state.route.issue ? state.issues[state.route.issue] : null))
  const model = useStore((state) => state.model)
  const pane = useRef(null)
  useEffect(() => { pane.current?.scrollTo?.({ top: 0 }) }, [route.issue])
  if (!record) {
    return html`<aside class="pane is-idle" aria-label="Issue">
      <${Empty} icon="open" title="No issue open">
        Pick one from the list, or move with <kbd>j</kbd> and <kbd>k</kbd>.
      </${Empty}>
    </aside>`
  }
  return html`<aside class="pane" aria-label=${record[model.key]} ref=${pane} tabindex="-1">
    <${Issue} record=${record} key=${record[model.key]} />
  </aside>`
}

function Issue ({ record }) {
  const model = useStore((state) => state.model)
  const conn = useStore((state) => state.conn)
  const orgSlug = useStore((state) => state.orgSlug)
  const issues = useStore((state) => state.issues)
  const route = useStore((state) => state.route)
  const id = record[model.key]
  const knownUrl = appUrlFor(conn.host, orgSlug, model.path, id)
  const reference = `${model.path.replace('.', ':')}/${id}`
  const [copied, setCopied] = useState(null)

  const copy = async (what) => {
    const text = what === 'link' ? location.href : `${reference} — ${get(model, record, 'title')}`
    try { await navigator.clipboard.writeText(text) } catch { return }
    setCopied(what)
    announce(what === 'link' ? 'Link copied' : 'Reference copied')
    setTimeout(() => setCopied(null), 1600)
  }
  useEffect(() => {
    const open = () => window.open(knownUrl, '_blank', 'noopener')
    const prompt = () => copy('prompt')
    const link = () => copy('link')
    addEventListener('issues:open-in-known', open)
    addEventListener('issues:copy-prompt', prompt)
    addEventListener('issues:copy-link', link)
    return () => { removeEventListener('issues:open-in-known', open); removeEventListener('issues:copy-prompt', prompt); removeEventListener('issues:copy-link', link) }
  }, [id])

  const issueHref = (value) => {
    const key = issueKeyOf(model, value)
    return key && issues[key] ? routeHash({ ...route, issue: key }) : null
  }
  const knownHref = (link) => {
    const [wikiPart, pagePart] = link.path.includes(':') ? link.path.split(':') : [model.path.split('.')[0], link.path]
    return appUrlFor(conn.host, orgSlug, `${wikiPart}.${pagePart}`, link.key)
  }
  const body = useMemo(() => renderMarkdown(get(model, record, 'content') ?? '', { issueHref, knownHref }), [record._v, issues])

  return html`<article class="issue">
    <header class="issue-bar">
      <button type="button" class="icon-button only-narrow" aria-label="Back to the list" onClick=${() => store.getState().closeIssue()}><${Icon} name="back" /></button>
      <span class="issue-id">${id}</span>
      <span class="issue-bar-end">
        <button type="button" class="icon-button" aria-label="Copy a reference for an agent (c)" title="Copy reference for an agent (c)" onClick=${() => copy('prompt')}><${Icon} name=${copied === 'prompt' ? 'closed' : 'agent'} /></button>
        <button type="button" class="icon-button" aria-label="Copy link (y)" title="Copy link (y)" onClick=${() => copy('link')}><${Icon} name=${copied === 'link' ? 'closed' : 'link'} /></button>
        <a class="button is-small" href=${knownUrl} target="_blank" rel="noopener" title="Open in Known (o)">Open in Known<${Icon} name="external" size=${12} /></a>
        <button type="button" class="icon-button only-wide" aria-label="Close (Esc)" title="Close (Esc)" onClick=${() => store.getState().closeIssue()}><${Icon} name="close" /></button>
      </span>
    </header>

    <h2 class="issue-title">${get(model, record, 'title')}</h2>
    <p class="issue-sub">
      ${get(model, record, 'type') && html`<span>${humanize(get(model, record, 'type'))}</span>`}
      ${get(model, record, 'created') && html`<span>Filed <time datetime=${get(model, record, 'created')} title=${full(get(model, record, 'created'))}>${ago(get(model, record, 'created'))}</time>${get(model, record, 'reporter') && html` by ${personName(get(model, record, 'reporter'))}`}</span>`}
      <span>Changed <time datetime=${record._ts} title=${full(record._ts)}>${ago(record._ts)}</time></span>
    </p>

    <${Properties} record=${record} />
    <${Relations} record=${record} />
    <${WorkLinks} record=${record} />

    ${body ? html`<div class="prose" dangerouslySetInnerHTML=${{ __html: body }}></div>` : html`<p class="prose is-empty">No description yet.</p>`}

    <${Activity} record=${record} />
  </article>`
}

function Properties ({ record }) {
  const model = useStore((state) => state.model)
  const canWrite = useStore((state) => state.canWrite)
  const rows = []
  const status = get(model, record, 'status')
  const set = async (field, value) => {
    const result = await store.getState().update(record[model.key], { [field]: value })
    if (!result.ok) announce(`Not saved: ${result.error.detail}`)
  }
  if (model.fields.status) {
    rows.push(['Status', canWrite
      ? html`<${Choice} value=${status} options=${model.statuses} onChange=${(value) => set(model.fields.status, value)} render=${(value) => html`<${StatusGlyph} model=${model} status=${value} />${humanize(value)}`} label="Status" />`
      : html`<span class="prop-value"><${StatusGlyph} model=${model} status=${status} />${humanize(status)}</span>`])
  }
  if (model.fields.priority) {
    const priority = get(model, record, 'priority')
    rows.push(['Priority', canWrite
      ? html`<${Choice} value=${priority} options=${model.priorities} onChange=${(value) => set(model.fields.priority, value)} render=${(value) => html`<${PriorityGlyph} model=${model} priority=${value} />${value}`} label="Priority" />`
      : html`<span class="prop-value"><${PriorityGlyph} model=${model} priority=${priority} />${priority ?? 'None'}${model.describe(model.fields.priority) && priority && html`<span class="prop-hint">${priorityWord(model, priority)}</span>`}</span>`])
  }
  if (model.fields.severity && get(model, record, 'severity')) rows.push(['Severity', html`<span class="prop-value">${humanize(get(model, record, 'severity'))}</span>`])
  if (model.fields.assignee) {
    const people = list(get(model, record, 'assignee'))
    rows.push(['Assignee', html`<span class="prop-value is-people">${people.length ? people.map((who) => html`<span class="person"><${Avatar} value=${who} size="s" showName=${true} /></span>`) : html`<span class="person"><${Avatar} value=${null} size="s" showName=${true} /></span>`}</span>`])
  }
  const labels = list(get(model, record, 'labels'))
  if (model.fields.labels) rows.push(['Labels', labels.length ? html`<span class="prop-value is-wrap">${labels.map((name) => html`<${Label} name=${name} onClick=${(label) => store.getState().navigate({ label })} />`)}</span>` : html`<span class="prop-value is-muted">None</span>`])
  const due = get(model, record, 'due')
  if (due) {
    const late = !isClosed(model, record) && Date.parse(due) < Date.now()
    rows.push(['Due', html`<span class=${'prop-value' + (late ? ' is-late' : '')}>${day(due)}${late && html`<span class="prop-hint">overdue</span>`}</span>`])
  }
  return html`<dl class="props">${rows.map(([name, value]) => html`<div class="prop"><dt>${name}</dt><dd>${value}</dd></div>`)}</dl>`
}

function priorityWord (model, priority) {
  const text = model.describe(model.fields.priority) ?? ''
  const match = new RegExp(`${priority}\\s+([a-z]+)`, 'i').exec(text)
  return match ? match[1] : null
}

// A choice among the schema's values, written when the site may write.
function Choice ({ value, options, onChange, render, label }) {
  return html`<label class="choice">
    <span class="choice-face">${render(value)}<${Icon} name="chevron" size=${10} class="choice-caret" /></span>
    <select aria-label=${label} value=${value} onChange=${(event) => onChange(event.currentTarget.value)}>
      ${options.map((option) => html`<option value=${option}>${humanize(option)}</option>`)}
    </select>
  </label>`
}

function Relations ({ record }) {
  const model = useStore((state) => state.model)
  const issues = useStore((state) => state.issues)
  const conn = useStore((state) => state.conn)
  const [backlinks, setBacklinks] = useState(null)
  const id = record[model.key]
  useEffect(() => {
    let live = true
    conn.call('wiki.links', { path: model.path, key: id }).then((result) => { if (live) setBacklinks(result?.links ?? []) }).catch(() => { if (live) setBacklinks([]) })
    return () => { live = false }
  }, [id, record._v])

  const keysOf = (role) => list(get(model, record, role)).map((value) => ({ value, key: issueKeyOf(model, value) }))
  const children = Object.values(issues).filter((other) => issueKeyOf(model, get(model, other, 'parent')) === id).map((other) => ({ key: other[model.key] }))
  const groups = [
    ['Part of', model.fields.parent ? keysOf('parent') : []],
    ['Blocked by', keysOf('blockedBy')],
    ['Blocks', keysOf('blocks')],
    ['Sub-issues', children],
    ['Related', keysOf('related')]
  ].filter(([, items]) => items.length)
  const named = new Set(groups.flatMap(([, items]) => items.map((item) => item.key)))
  const elsewhere = (backlinks ?? []).filter((link) => !(link.key && named.has(link.key)) && !(link.key === id))
  if (!groups.length && !elsewhere.length) return null
  return html`<section class="relations" aria-label="Linked issues">
    ${groups.map(([name, items]) => html`<div class="relation">
      <h3 class="relation-name">${name}</h3>
      <ul class="relation-list">${items.map((item) => html`<li><${IssueRef} item=${item} /></li>`)}</ul>
    </div>`)}
    ${elsewhere.length > 0 && html`<div class="relation">
      <h3 class="relation-name">Referenced by</h3>
      <ul class="relation-list">${elsewhere.slice(0, 12).map((link) => html`<li>${link.key && link.path === model.path.split('.').slice(1).join('.') && issues[link.key]
        ? html`<${IssueRef} item=${{ key: link.key }} />`
        : html`<a class="ref is-page" href=${appUrlFor(conn.host, store.getState().orgSlug, link.fullPath?.includes('.') ? model.path.split('.')[0] + '.' + link.path : model.path, link.key)} target="_blank" rel="noopener"><${Icon} name="external" size=${12} /><span class="ref-title">${link.title ?? link.key ?? link.path}</span></a>`}</li>`)}</ul>
    </div>`}
  </section>`
}

function IssueRef ({ item }) {
  const model = useStore((state) => state.model)
  const issues = useStore((state) => state.issues)
  const route = useStore((state) => state.route)
  const other = item.key ? issues[item.key] : null
  if (!other) {
    const link = parseLink(item.value)
    return html`<span class="ref is-missing" title="Not in this table, or removed">${link?.label ?? link?.key ?? item.value}</span>`
  }
  return html`<a class=${'ref' + (isClosed(model, other) ? ' is-closed' : '')} href=${routeHash({ ...route, issue: item.key })}
      onClick=${(event) => { event.preventDefault(); store.getState().navigate({ issue: item.key }) }}>
    <${StatusGlyph} model=${model} status=${get(model, other, 'status')} size=${12} />
    <span class="ref-id">${item.key}</span>
    <span class="ref-title">${get(model, other, 'title')}</span>
  </a>`
}

const LINK_ICONS = { pull_request: 'pr', commit: 'commit', deploy: 'deploy', release: 'deploy' }
function WorkLinks ({ record }) {
  const model = useStore((state) => state.model)
  const links = list(get(model, record, 'links')).filter((link) => link && typeof link === 'object' && link.url)
  if (!links.length) return null
  return html`<section class="work" aria-label="Work">
    <h3 class="relation-name">Work</h3>
    <ul class="work-list">${links.map((link) => html`<li><a class="work-link" href=${link.url} target="_blank" rel="noopener">
      <${Icon} name=${LINK_ICONS[link.kind] ?? 'link'} size=${14} />
      <span class="work-kind">${humanize(link.kind)}</span>
      <span class="work-title">${link.title ?? shortUrl(link.url)}</span>
    </a></li>`)}</ul>
  </section>`
}

function shortUrl (url) {
  try {
    const parsed = new URL(url)
    return parsed.host + parsed.pathname.replace(/\/$/, '')
  } catch { return url }
}

function Activity ({ record }) {
  const model = useStore((state) => state.model)
  const conn = useStore((state) => state.conn)
  const me = useStore((state) => state.me)
  const [versions, setVersions] = useState(null)
  const [error, setError] = useState(null)
  const id = record[model.key]
  useEffect(() => {
    let live = true
    conn.call('wiki.history', { path: model.path, key: id, limit: 50 })
      .then((result) => { if (live) setVersions(result?.versions ?? []) })
      .catch((reason) => { if (live) setError(reason.message) })
    return () => { live = false }
  }, [id, record._v])
  const entries = useMemo(() => (versions ? timeline(versions, model) : []), [versions])
  return html`<section class="activity" aria-label="History">
    <h3 class="activity-title">History</h3>
    ${error && html`<p class="activity-note">History isn't available: ${error}</p>`}
    ${!versions && !error && html`<ol class="timeline is-loading" aria-busy="true"><li class="skeleton"></li><li class="skeleton"></li></ol>`}
    ${versions && html`<ol class="timeline">
      ${entries.map(({ version, created, changes }) => {
        const actor = actorOf(version, me)
        return html`<li class="event">
          <span class=${'event-mark' + (actor.agent ? ' is-agent' : '')} aria-hidden="true">${actor.agent ? html`<${Icon} name="agent" size=${12} />` : null}</span>
          <div class="event-body">
            <p class="event-line"><strong>${actor.who}</strong> ${created ? 'filed this issue' : changes.length ? describeChanges(model, changes) : 'saved it again'}
              <time class="event-when" datetime=${version._ts} title=${full(version._ts)}>${ago(version._ts)}</time></p>
            ${!created && changes.some((change) => change.field !== model.fields.content) && html`<ul class="changes">
              ${changes.filter((change) => change.field !== model.fields.content).map((change) => html`<li class="change"><span class="change-field">${humanize(change.field)}</span>${showValue(model, change.field, change.from, true)}<${Icon} name="arrow" size=${12} class="change-arrow" />${showValue(model, change.field, change.to)}</li>`)}
            </ul>`}
          </div>
        </li>`
      })}
      ${versions.length >= 50 && html`<li class="event is-more"><span class="event-mark" aria-hidden="true"></span><p class="event-line">Older versions are in Known.</p></li>`}
    </ol>`}
  </section>`
}

function describeChanges (model, changes) {
  const content = changes.some((change) => change.field === model.fields.content)
  const rest = changes.length - (content ? 1 : 0)
  if (content && !rest) return 'edited the description'
  if (content) return `changed ${rest === 1 ? '1 field' : rest + ' fields'} and the description`
  return rest === 1 ? `changed ${humanize(changes[0].field).toLowerCase()}` : `changed ${rest} fields`
}

function showValue (model, field, value, before = false) {
  const cls = 'change-value' + (before ? ' is-before' : '')
  if (value == null || (Array.isArray(value) && !value.length)) return html`<span class=${cls + ' is-empty'}>none</span>`
  if (field === model.fields.status) return html`<span class=${cls}><${StatusGlyph} model=${model} status=${value} size=${12} />${humanize(value)}</span>`
  if (field === model.fields.priority) return html`<span class=${cls}><${PriorityGlyph} model=${model} priority=${value} size=${12} />${value}</span>`
  if (Array.isArray(value)) return html`<span class=${cls}>${value.map((item) => (typeof item === 'object' ? item.title ?? item.url : parseLink(item)?.key ?? personName(item))).join(', ')}</span>`
  if (typeof value === 'object') return html`<span class=${cls}>…</span>`
  if (parseLink(value)) return html`<span class=${cls}>${parseLink(value).key ?? personName(value)}</span>`
  const text = String(value)
  return html`<span class=${cls}>${text.length > 60 ? text.slice(0, 57) + '…' : humanize(text) === text ? text : (/^[a-z_]+$/.test(text) ? humanize(text) : text)}</span>`
}
