import { useEffect, useMemo, useState } from 'preact/hooks'
import { html } from '../html.js'
import { store, useStore, groupsOf, openBlockers, routeHash } from '../store.js'
import { get, list, humanize } from '../model.js'
import { Icon, StatusGlyph, PriorityGlyph } from '../icons.js'
import { Avatar, Label, Empty } from './bits.js'
import { ago, full } from '../time.js'

export function ListView ({ rows }) {
  const route = useStore((state) => state.route)
  const model = useStore((state) => state.model)
  const groups = useMemo(() => groupsOf(store.getState(), rows), [rows, route.group, route.view])
  const [folded, setFolded] = useState(() => new Set(model.closed))
  if (!rows.length) return html`<div class="list is-empty"><${EmptyView} /></div>`
  return html`<div class="list" role="list" aria-label="Issues">
    ${groups.map((group) => {
      // Closed statuses start folded, except in the Closed view.
      const foldKey = route.view === 'closed' ? '!' + group.id : group.id
      const isFolded = group.label != null && folded.has(foldKey)
      const showFold = group.label != null
      return html`<section class="group" key=${group.id} aria-label=${group.label ? humanize(group.label) : 'Issues'}>
        ${showFold && html`<h2 class="group-head">
          <button type="button" class="group-toggle" aria-expanded=${!isFolded} onClick=${() => setFolded((set) => { const next = new Set(set); next.has(foldKey) ? next.delete(foldKey) : next.add(foldKey); return next })}>
            <${Icon} name="chevron" size=${12} class=${'fold' + (isFolded ? '' : ' is-open')} />
            ${route.group === 'status' && html`<${StatusGlyph} model=${model} status=${group.id} />`}
            ${route.group === 'priority' && html`<${PriorityGlyph} model=${model} priority=${group.id === '—' ? null : group.id} />`}
            ${route.group === 'assignee' && html`<${Avatar} value=${group.id === '—' ? null : group.id} size="s" />`}
            <span class="group-name">${group.id === '—' ? (route.group === 'assignee' ? 'Unassigned' : 'None') : route.group === 'assignee' ? group.id : humanize(group.id)}</span>
            <span class="group-count">${group.rows.length}</span>
          </button>
        </h2>`}
        ${!isFolded && group.rows.map((record) => html`<${Row} key=${record[model.key]} record=${record} />`)}
      </section>`
    })}
  </div>`
}

function Row ({ record }) {
  const model = useStore((state) => state.model)
  const route = useStore((state) => state.route)
  const issues = useStore((state) => state.issues)
  const arrived = useStore((state) => state.arrived[record[state.model.key]])
  const id = record[model.key]
  const current = route.issue === id
  const blockers = openBlockers(model, issues, record)
  const labels = list(get(model, record, 'labels'))
  const fresh = useFresh(arrived)
  return html`<a role="listitem" href=${routeHash({ ...route, issue: id })} data-key=${id}
      class=${`row${current ? ' is-current' : ''}${fresh ? (arrived.fresh ? ' is-new' : ' is-updated') : ''}`}
      aria-current=${current ? 'true' : null}
      onClick=${(event) => { if (event.metaKey || event.ctrlKey) return; event.preventDefault(); store.getState().navigate({ issue: id }, { replace: Boolean(route.issue) }) }}>
    <span class="row-priority"><${PriorityGlyph} model=${model} priority=${get(model, record, 'priority')} /></span>
    <span class="row-id">${id}</span>
    <span class="row-status"><${StatusGlyph} model=${model} status=${get(model, record, 'status')} /></span>
    <span class="row-title">${get(model, record, 'title')}</span>
    <span class="row-meta">
      ${blockers.length > 0 && html`<span class="flag is-blocked" title=${'Blocked by ' + blockers.join(', ')}><${Icon} name="blocked" size=${12} />${blockers.length > 1 ? blockers.length : blockers[0]}</span>`}
      ${labels.slice(0, 2).map((name) => html`<${Label} name=${name} onClick=${(label) => store.getState().navigate({ label })} />`)}
      ${labels.length > 2 && html`<span class="label is-more">+${labels.length - 2}</span>`}
    </span>
    <span class="row-who"><${Avatar} value=${list(get(model, record, 'assignee'))[0]} size="s" /></span>
    <time class="row-when" datetime=${record._ts} title=${'Changed ' + full(record._ts)}>${ago(record._ts)}</time>
  </a>`
}

// A record that just arrived glows for a moment, then settles.
export function useFresh (arrived) {
  const [fresh, setFresh] = useState(false)
  useEffect(() => {
    if (!arrived) return
    const left = 4000 - (Date.now() - arrived.at)
    if (left <= 0) return
    setFresh(true)
    const timer = setTimeout(() => setFresh(false), left)
    return () => clearTimeout(timer)
  }, [arrived?.at])
  return fresh
}

function EmptyView () {
  const route = useStore((state) => state.route)
  const navigate = store.getState().navigate
  if (route.q || route.label || route.who) {
    return html`<${Empty} icon="search" title="Nothing matches these filters">
      <button type="button" class="button" onClick=${() => navigate({ q: '', label: null, who: null })}>Clear filters</button>
    </${Empty}>`
  }
  const copy = {
    mine: ['Nothing is assigned to you', 'Issues assigned to you that are still open show up here.'],
    blocked: ['Nothing is blocked', 'An issue shows up here when its status says blocked or an issue it waits on is still open.'],
    active: ['Nothing is in progress', 'Issues move here when someone starts on them.'],
    recent: ['Nothing changed this week', ''],
    closed: ['Nothing is closed yet', ''],
    open: ['No open issues', 'Ask your agent to file one: "File a bug: the export drops accents, p1."'],
    all: ['No issues yet', 'Ask your agent to file one: "File a bug: the export drops accents, p1."']
  }[route.view]
  return html`<${Empty} title=${copy[0]}>${copy[1]}</${Empty}>`
}
