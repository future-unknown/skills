// The workflow as columns, one per status in the schema's order. Closed
// columns stay narrow until opened. When the site may write, a card can be
// dragged to another column.
import { useMemo, useState } from 'preact/hooks'
import { html } from '../html.js'
import { store, useStore, openBlockers, routeHash, announce } from '../store.js'
import { get, list, humanize } from '../model.js'
import { Icon, StatusGlyph, PriorityGlyph } from '../icons.js'
import { Avatar, Label } from './bits.js'
import { useFresh } from './list.js'

export function BoardView ({ rows }) {
  const model = useStore((state) => state.model)
  const canWrite = useStore((state) => state.canWrite)
  const [opened, setOpened] = useState(() => new Set())
  const [over, setOver] = useState(null)
  const columns = useMemo(() => {
    const by = new Map(model.statuses.map((status) => [status, []]))
    for (const record of rows) {
      const status = get(model, record, 'status')
      if (!by.has(status)) by.set(status, [])
      by.get(status).push(record)
    }
    return [...by.entries()]
  }, [rows, model])

  const drop = async (event, status) => {
    event.preventDefault()
    setOver(null)
    const id = event.dataTransfer.getData('text/issue')
    if (!id) return
    const record = store.getState().issues[id]
    if (!record || get(model, record, 'status') === status) return
    const result = await store.getState().update(id, { [model.fields.status]: status })
    if (!result.ok) announce(`${id} was not moved: ${result.error.detail}`)
  }

  return html`<div class="board" aria-label="Board">
    ${columns.map(([status, records]) => {
      const narrow = model.closed.has(status) && !opened.has(status)
      return html`<section key=${status} class=${`column${narrow ? ' is-narrow' : ''}${over === status ? ' is-over' : ''}`} aria-label=${`${humanize(status)}, ${records.length}`}
          onDragOver=${canWrite ? (event) => { event.preventDefault(); setOver(status) } : null}
          onDragLeave=${canWrite ? () => setOver((current) => (current === status ? null : current)) : null}
          onDrop=${canWrite ? (event) => drop(event, status) : null}>
        <h2 class="column-head">
          <button type="button" class="column-toggle" disabled=${!model.closed.has(status)} aria-expanded=${model.closed.has(status) ? !narrow : null}
            onClick=${() => setOpened((set) => { const next = new Set(set); next.has(status) ? next.delete(status) : next.add(status); return next })}>
            <${StatusGlyph} model=${model} status=${status} />
            <span class="column-name">${humanize(status)}</span>
            <span class="column-count">${records.length}</span>
          </button>
        </h2>
        ${!narrow && html`<div class="column-body">
          ${records.map((record) => html`<${Card} key=${record[model.key]} record=${record} canWrite=${canWrite} />`)}
          ${records.length === 0 && html`<p class="column-empty">None</p>`}
        </div>`}
      </section>`
    })}
  </div>`
}

function Card ({ record, canWrite }) {
  const model = useStore((state) => state.model)
  const route = useStore((state) => state.route)
  const issues = useStore((state) => state.issues)
  const arrived = useStore((state) => state.arrived[record[state.model.key]])
  const fresh = useFresh(arrived)
  const id = record[model.key]
  const blockers = openBlockers(model, issues, record)
  const labels = list(get(model, record, 'labels'))
  return html`<a href=${routeHash({ ...route, issue: id })} data-key=${id} draggable=${canWrite ? 'true' : null}
      class=${`card${route.issue === id ? ' is-current' : ''}${fresh ? (arrived.fresh ? ' is-new' : ' is-updated') : ''}`}
      aria-current=${route.issue === id ? 'true' : null}
      onDragStart=${canWrite ? (event) => { event.dataTransfer.setData('text/issue', id); event.dataTransfer.effectAllowed = 'move' } : null}
      onClick=${(event) => { if (event.metaKey || event.ctrlKey) return; event.preventDefault(); store.getState().navigate({ issue: id }, { replace: Boolean(route.issue) }) }}>
    <span class="card-top">
      <span class="card-id">${id}</span>
      <${PriorityGlyph} model=${model} priority=${get(model, record, 'priority')} />
    </span>
    <span class="card-title">${get(model, record, 'title')}</span>
    <span class="card-foot">
      ${blockers.length > 0 && html`<span class="flag is-blocked" title=${'Blocked by ' + blockers.join(', ')}><${Icon} name="blocked" size=${12} />${blockers[0]}</span>`}
      ${labels.slice(0, 2).map((name) => html`<${Label} name=${name} />`)}
      <span class="card-who"><${Avatar} value=${list(get(model, record, 'assignee'))[0]} size="s" /></span>
    </span>
  </a>`
}
