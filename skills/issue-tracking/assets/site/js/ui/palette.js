// ⌘K: jump to any issue, view, label or person by typing.
import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { html } from '../html.js'
import { store, useStore, VIEWS, facets } from '../store.js'
import { get, list, priorityRank, isClosed } from '../model.js'
import { Icon, StatusGlyph } from '../icons.js'
import { Avatar } from './bits.js'

export function Palette () {
  const model = useStore((state) => state.model)
  const issues = useStore((state) => state.issues)
  const route = useStore((state) => state.route)
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const input = useRef(null)
  const listRef = useRef(null)
  const close = () => store.getState().toggle('palette', false)
  const navigate = (patch) => { store.getState().navigate(patch); close() }

  useEffect(() => {
    const previous = document.activeElement
    input.current?.focus()
    return () => previous?.focus?.()
  }, [])

  const items = useMemo(() => {
    const q = query.trim().toLowerCase()
    const hit = (text) => !q || String(text).toLowerCase().includes(q)
    const out = []
    const { labels, people } = facets(store.getState())
    const records = Object.values(issues)
      .filter((record) => !q || `${record[model.key]} ${get(model, record, 'title')} ${list(get(model, record, 'labels')).join(' ')}`.toLowerCase().includes(q))
      .sort((a, b) => Number(isClosed(model, a)) - Number(isClosed(model, b)) || priorityRank(model, a) - priorityRank(model, b))
      .slice(0, q ? 12 : 6)
    for (const record of records) out.push({ kind: 'Issue', id: 'i:' + record[model.key], record, run: () => navigate({ issue: record[model.key] }) })
    for (const view of VIEWS) if (hit(view.label)) out.push({ kind: 'View', id: 'v:' + view.id, label: view.label, icon: 'open', run: () => navigate({ view: view.id, issue: null }) })
    if (hit('board')) out.push({ kind: 'Layout', id: 'l:board', label: 'Show as board', icon: 'board', run: () => navigate({ layout: 'board' }) })
    if (hit('list')) out.push({ kind: 'Layout', id: 'l:list', label: 'Show as list', icon: 'list', run: () => navigate({ layout: 'list' }) })
    for (const [name] of labels) if (q && hit(name)) out.push({ kind: 'Label', id: 'g:' + name, label: name, icon: 'tag', run: () => navigate({ label: name, issue: null }) })
    for (const [name] of people) if (q && hit(name)) out.push({ kind: 'Person', id: 'p:' + name, label: name, person: true, run: () => navigate({ who: name, issue: null }) })
    if (hit('shortcuts keyboard help')) out.push({ kind: 'Help', id: 'h', label: 'Keyboard shortcuts', icon: 'keyboard', run: () => { close(); store.getState().toggle('help', true) } })
    return out
  }, [query, issues, route])

  useEffect(() => { setIndex(0) }, [query])
  useEffect(() => { listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' }) }, [index])

  const onKey = (event) => {
    if (event.key === 'Escape') { event.preventDefault(); close() }
    if (event.key === 'ArrowDown') { event.preventDefault(); setIndex((i) => Math.min(items.length - 1, i + 1)) }
    if (event.key === 'ArrowUp') { event.preventDefault(); setIndex((i) => Math.max(0, i - 1)) }
    if (event.key === 'Enter') { event.preventDefault(); items[index]?.run() }
    if (event.key === 'Tab') event.preventDefault()
  }

  return html`<div class="overlay" onMouseDown=${(event) => { if (event.target === event.currentTarget) close() }}>
    <div class="palette" role="dialog" aria-modal="true" aria-label="Commands">
      <div class="palette-input">
        <${Icon} name="search" />
        <input ref=${input} type="text" role="combobox" aria-expanded="true" aria-controls="palette-list" aria-activedescendant=${items[index] ? 'pal-' + index : null}
          placeholder="Find an issue, view, label or person" value=${query} onInput=${(event) => setQuery(event.currentTarget.value)} onKeyDown=${onKey} autocomplete="off" spellcheck=${false} />
        <kbd>esc</kbd>
      </div>
      <ul class="palette-list" id="palette-list" role="listbox" ref=${listRef}>
        ${items.map((item, i) => html`<li id=${'pal-' + i} role="option" aria-selected=${i === index} class=${'palette-item' + (i === index ? ' is-active' : '')}
            onMouseMove=${() => setIndex(i)} onClick=${() => item.run()}>
          ${item.record
            ? html`<${StatusGlyph} model=${model} status=${get(model, item.record, 'status')} /><span class="palette-id">${item.record[model.key]}</span><span class="palette-label">${get(model, item.record, 'title')}</span>`
            : item.person
              ? html`<${Avatar} value=${item.label} size="s" /><span class="palette-label">${item.label}</span>`
              : html`<${Icon} name=${item.icon} /><span class="palette-label">${item.label}</span>`}
          <span class="palette-kind">${item.kind}</span>
        </li>`)}
        ${items.length === 0 && html`<li class="palette-empty">Nothing matches “${query}”.</li>`}
      </ul>
    </div>
  </div>`
}
