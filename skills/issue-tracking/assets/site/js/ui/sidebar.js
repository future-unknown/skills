import { useEffect, useMemo, useState } from 'preact/hooks'
import { html } from '../html.js'
import { store, useStore, VIEWS, counts, facets } from '../store.js'
import { Icon } from '../icons.js'
import { Avatar } from './bits.js'

const VIEW_ICONS = { mine: 'user', open: 'open', active: 'active', blocked: 'blocked', recent: 'recent', closed: 'closed', all: 'all' }
const VIEW_KEYS = { mine: 'm', open: 'o', active: 'a', blocked: 'b', recent: 'r', closed: 'c', all: 'e' }

export function Sidebar () {
  const route = useStore((state) => state.route)
  const issues = useStore((state) => state.issues)
  const title = useStore((state) => state.title)
  const me = useStore((state) => state.me)
  const model = useStore((state) => state.model)
  const tally = useMemo(() => counts(store.getState()), [issues, me, model])
  const { labels, people } = useMemo(() => facets(store.getState()), [issues, model])
  const go = (patch) => { store.getState().navigate({ issue: null, ...patch }); store.getState().toggle('sidebar', false) }
  return html`<nav class="sidebar" aria-label="Views">
    <div class="sidebar-head">
      <span class="brand-mark" aria-hidden="true"></span>
      <span class="sidebar-title">${title}</span>
    </div>
    <ul class="nav">
      ${VIEWS.map((view) => html`<li><a href=${'#/' + view.id} class=${'nav-item' + (route.view === view.id ? ' is-current' : '')} aria-current=${route.view === view.id ? 'page' : null}
        onClick=${(event) => { event.preventDefault(); go({ view: view.id }) }} title=${`${view.label} (g ${VIEW_KEYS[view.id]})`}>
        <${Icon} name=${VIEW_ICONS[view.id]} /><span class="nav-label">${view.label}</span><span class="nav-count">${tally[view.id] || ''}</span></a></li>`)}
    </ul>
    ${labels.length > 0 && html`<section class="facet" aria-labelledby="facet-labels">
      <h2 class="facet-title" id="facet-labels">Labels</h2>
      <ul class="nav is-compact">
        ${labels.slice(0, 14).map(([name, count]) => html`<li><button type="button" class=${'nav-item' + (route.label === name ? ' is-current' : '')} aria-pressed=${route.label === name}
          onClick=${() => go({ label: route.label === name ? null : name, view: route.view === 'closed' ? 'open' : route.view })}>
          <span class="label-dot" aria-hidden="true"></span><span class="nav-label">${name}</span><span class="nav-count">${count}</span></button></li>`)}
      </ul>
    </section>`}
    ${people.length > 0 && html`<section class="facet" aria-labelledby="facet-people">
      <h2 class="facet-title" id="facet-people">People</h2>
      <ul class="nav is-compact">
        ${people.slice(0, 10).map(([name, count]) => html`<li><button type="button" class=${'nav-item' + (route.who === name ? ' is-current' : '')} aria-pressed=${route.who === name}
          onClick=${() => go({ who: route.who === name ? null : name })}>
          <${Avatar} value=${name} size="s" /><span class="nav-label">${name}</span><span class="nav-count">${count}</span></button></li>`)}
      </ul>
    </section>`}
    <${Footer} />
  </nav>`
}

function Footer () {
  const me = useStore((state) => state.me)
  const conn = useStore((state) => state.conn)
  const watch = useMemo(() => conn?.live(), [conn])
  const live = useWatch(watch)
  const label = live === 'live' ? 'Live' : live === 'polling' ? 'Checking every minute' : live === 'connecting' ? 'Connecting' : 'Offline'
  return html`<footer class="sidebar-foot">
    <span class=${'live is-' + live} title=${label}><span class="live-dot" aria-hidden="true"></span>${label}</span>
    <div class="me">
      <${Avatar} value=${me?.user?.name} size="s" />
      <span class="me-name">${me?.user?.name ?? ''}</span>
      <button type="button" class="icon-button is-quiet" aria-label="Sign out" title="Sign out" onClick=${() => store.getState().signOut()}><${Icon} name="signout" size=${14} /></button>
    </div>
    <button type="button" class="hint" onClick=${() => store.getState().toggle('help', true)}><${Icon} name="keyboard" size=${14} />Shortcuts <kbd>?</kbd></button>
  </footer>`
}

function useWatch (watch) {
  const [status, setStatus] = useState(() => watch?.getState().status ?? 'idle')
  useEffect(() => {
    if (!watch) return
    setStatus(watch.getState().status)
    return watch.subscribe((state) => setStatus(state.status))
  }, [watch])
  return status
}
