// The triage desk: views on the left, the issues in the middle, the open
// issue on the right. On a phone the three become one column at a time.
import { useEffect, useMemo, useRef } from 'preact/hooks'
import { html } from '../html.js'
import { store, useStore, visible, VIEWS } from '../store.js'
import { Icon } from '../icons.js'
import { Sidebar } from './sidebar.js'
import { ListView } from './list.js'
import { BoardView } from './board.js'
import { IssuePane } from './issue.js'
import { Palette } from './palette.js'
import { Help } from './help.js'
import { Kbd } from './bits.js'

export function Shell () {
  const route = useStore((state) => state.route)
  const issues = useStore((state) => state.issues)
  const model = useStore((state) => state.model)
  const me = useStore((state) => state.me)
  const palette = useStore((state) => state.palette)
  const help = useStore((state) => state.help)
  const sidebar = useStore((state) => state.sidebar)
  const rows = useMemo(() => visible(store.getState()), [route, issues, model, me])
  useKeys()
  const board = route.layout === 'board'
  const hasIssue = Boolean(route.issue && issues[route.issue])
  return html`<div class=${`desk${board ? ' is-board' : ''}${hasIssue ? ' has-issue' : ''}${sidebar ? ' has-drawer' : ''}`}>
    <a class="skip" href="#issues">Skip to issues</a>
    <${Sidebar} />
    <div class="drawer-scrim" onClick=${() => store.getState().toggle('sidebar', false)} aria-hidden="true"></div>
    <main class="main" id="issues" aria-label="Issues">
      <${Toolbar} rows=${rows} />
      ${board ? html`<${BoardView} rows=${rows} />` : html`<${ListView} rows=${rows} />`}
    </main>
    <${IssuePane} />
    ${palette && html`<${Palette} />`}
    ${help && html`<${Help} />`}
  </div>`
}

function Toolbar ({ rows }) {
  const route = useStore((state) => state.route)
  const navigate = (patch, options) => store.getState().navigate(patch, options)
  const view = VIEWS.find((item) => item.id === route.view)
  const input = useRef(null)
  useEffect(() => {
    const focus = () => input.current?.focus()
    addEventListener('issues:filter', focus)
    return () => removeEventListener('issues:filter', focus)
  }, [])
  return html`<header class="toolbar">
    <button type="button" class="icon-button only-narrow" aria-label="Views" onClick=${() => store.getState().toggle('sidebar', true)}><${Icon} name="menu" /></button>
    <h1 class="view-title">${view?.label}<span class="view-count" aria-label=${rows.length + ' issues'}>${rows.length}</span></h1>
    <div class="filter">
      <${Icon} name="search" class="filter-icon" />
      <input ref=${input} type="search" class="filter-input" placeholder="Filter" aria-label="Filter issues" value=${route.q}
        onInput=${(event) => navigate({ q: event.currentTarget.value }, { replace: true })}
        onKeyDown=${(event) => { if (event.key === 'Escape') { event.currentTarget.blur(); if (route.q) navigate({ q: '' }, { replace: true }) } if (event.key === 'Enter' || event.key === 'ArrowDown') { event.preventDefault(); event.currentTarget.blur(); dispatchEvent(new CustomEvent('issues:first')) } }} />
      ${!route.q && html`<${Kbd}>/</${Kbd}>`}
    </div>
    ${(route.label || route.who) && html`<div class="chips" role="list" aria-label="Active filters">
      ${route.label && html`<button type="button" role="listitem" class="chip" onClick=${() => navigate({ label: null })} aria-label=${'Remove label filter ' + route.label}><${Icon} name="tag" size=${12} />${route.label}<${Icon} name="close" size=${12} /></button>`}
      ${route.who && html`<button type="button" role="listitem" class="chip" onClick=${() => navigate({ who: null })} aria-label=${'Remove person filter ' + route.who}>${route.who === '—' ? 'Unassigned' : route.who}<${Icon} name="close" size=${12} /></button>`}
    </div>`}
    <div class="toolbar-end">
      ${route.view !== 'recent' && html`<label class="select-wrap"><span class="visually-hidden">Group by</span>
        <select class="select" value=${route.group} onChange=${(event) => navigate({ group: event.currentTarget.value }, { replace: true })}>
          <option value="status">By status</option>
          <option value="priority">By priority</option>
          <option value="assignee">By assignee</option>
          <option value="none">No grouping</option>
        </select></label>`}
      <div class="segmented" role="group" aria-label="Layout">
        <button type="button" aria-pressed=${route.layout !== 'board'} onClick=${() => navigate({ layout: 'list' }, { replace: true })} title="List (v)"><${Icon} name="list" /><span class="visually-hidden">List</span></button>
        <button type="button" aria-pressed=${route.layout === 'board'} onClick=${() => navigate({ layout: 'board' }, { replace: true })} title="Board (v)"><${Icon} name="board" /><span class="visually-hidden">Board</span></button>
      </div>
      <button type="button" class="icon-button" aria-label="Commands (⌘K)" title="Commands ⌘K" onClick=${() => store.getState().toggle('palette', true)}><${Icon} name="command" /></button>
    </div>
  </header>`
}

// Keyboard: j/k move, Enter or o opens, Esc closes, / filters, ⌘K commands,
// g then a letter switches view, v switches list and board, ? shows all.
function useKeys () {
  useEffect(() => {
    let g = false
    let gTimer = null
    const handler = (event) => {
      const state = store.getState()
      const target = event.target
      const typing = target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); state.toggle('palette'); return }
      if (typing || state.palette) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const key = event.key
      if (state.help && key === 'Escape') { state.toggle('help', false); return }
      if (g) {
        g = false
        clearTimeout(gTimer)
        const map = { m: 'mine', o: 'open', a: 'active', b: 'blocked', r: 'recent', c: 'closed', e: 'all' }
        if (map[key]) { event.preventDefault(); state.navigate({ view: map[key], issue: null }) }
        return
      }
      // Move in the order the issues are shown: by group, column, or list.
      const keys = [...document.querySelectorAll('.main [data-key]')].map((el) => el.dataset.key)
      const index = keys.indexOf(state.route.issue)
      const move = (delta) => {
        if (!keys.length) return
        const next = keys[Math.max(0, Math.min(keys.length - 1, index === -1 ? 0 : index + delta))]
        state.navigate({ issue: next }, { replace: true })
        requestAnimationFrame(() => document.querySelector(`[data-key="${CSS.escape(next)}"]`)?.scrollIntoView({ block: 'nearest' }))
      }
      switch (key) {
        case 'j': case 'ArrowDown': event.preventDefault(); move(1); break
        case 'k': case 'ArrowUp': event.preventDefault(); move(-1); break
        case 'Escape': if (state.route.issue) state.closeIssue(); else if (state.sidebar) state.toggle('sidebar', false); break
        case '/': event.preventDefault(); dispatchEvent(new CustomEvent('issues:filter')); break
        case 'v': state.navigate({ layout: state.route.layout === 'board' ? 'list' : 'board' }, { replace: true }); break
        case '?': state.toggle('help'); break
        case 'g': g = true; gTimer = setTimeout(() => { g = false }, 900); break
        case 'o': if (state.route.issue) dispatchEvent(new CustomEvent('issues:open-in-known')); break
        case 'c': if (state.route.issue) dispatchEvent(new CustomEvent('issues:copy-prompt')); break
        case 'y': if (state.route.issue) dispatchEvent(new CustomEvent('issues:copy-link')); break
      }
    }
    const first = () => {
      const key = document.querySelector('.main [data-key]')?.dataset.key
      if (key) store.getState().navigate({ issue: key }, { replace: true })
    }
    addEventListener('keydown', handler)
    addEventListener('issues:first', first)
    return () => { removeEventListener('keydown', handler); removeEventListener('issues:first', first) }
  }, [])
}
