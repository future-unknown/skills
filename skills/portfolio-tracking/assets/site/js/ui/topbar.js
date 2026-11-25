// The frame's one bar: the fund's mark, the views, and who is signed in.
// Fund sites lead with a slim top bar, so the portfolio does too; on a
// phone the views scroll sideways under the mark.
import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { html } from '../html.js'
import { store, useStore, VIEWS, records, has, openTasks, pendingSignals } from '../store.js'
import { imageOf, keyIn } from '../data.js'
import { Icon } from '../icons.js'
import { AskButton } from './ask.js'

export function TopBar () {
  const state = useStore((value) => value)
  const { route, title, tables } = state
  const fund = records(state, 'fund')[0] ?? null
  const views = VIEWS.filter((view) => !view.table || has(state, view.table))
  const current = route.view === 'company' ? 'portfolio' : route.view === 'member' ? 'team' : route.view
  // Only counts that ask for attention: open tasks and signals to review.
  const tally = useMemo(() => ({ tasks: openTasks(state).length, review: pendingSignals(state).length }), [tables])
  return html`<header class="topbar">
    <a class="topbar-brand" href="#/portfolio" onClick=${(event) => { event.preventDefault(); store.getState().go('portfolio') }} aria-label=${(fund?.name ?? title) + ', portfolio'}>
      <${Mark} fund=${fund} title=${title} />
    </a>
    <nav class="topnav" aria-label="Views">
      <ul>
        ${views.map((view) => html`<li><a href=${'#/' + view.id} class=${'topnav-item' + (current === view.id ? ' is-current' : '')} aria-current=${current === view.id ? 'page' : null}
          onClick=${(event) => { event.preventDefault(); if (event.detail) event.currentTarget.blur(); store.getState().go(view.id) }} title=${`${view.label} (g ${view.key})`}>
          ${view.label}${tally[view.id] ? html`<span class=${'topnav-count' + (view.id === 'review' ? ' is-attention' : '')} aria-label=${`, ${tally[view.id]} ${view.id === 'review' ? 'waiting' : 'open'}`}>${tally[view.id]}</span>` : null}
        </a></li>`)}
      </ul>
    </nav>
    <${AskButton} />
    <${Me} />
  </header>`
}

// The fund's logo as the site shows it, at its own width; the name in the
// heading face when there is no logo.
function Mark ({ fund, title }) {
  const state = useStore((value) => value)
  const logo = state.logo ?? fund?.logo ?? null
  const media = imageOf(state.tables, logo, state.names)
  const [failed, setFailed] = useState(false)
  // The fund's mark for dark backgrounds, used when the page is dark.
  const dark = fund ? Object.values(state.tables.media ?? {}).find((item) => item.kind === 'logo-dark' && item.status !== 'broken' && keyIn(item.subject, 'fund', state.names) === fund.id) : null
  const lightOnly = document.documentElement.classList.contains('is-light-only')
  if (media && !failed) {
    return html`<picture>
      ${dark && !lightOnly && html`<source srcset=${dark.url} media="(prefers-color-scheme: dark)" />`}
      <img class="topbar-logo" src=${media.url} alt="" referrerpolicy="no-referrer" onError=${() => setFailed(true)} />
    </picture>`
  }
  return html`<span class="topbar-name">${fund?.name ?? title}</span>`
}

// Live status, shortcuts and sign-out, folded behind the person's initials.
function Me () {
  const me = useStore((state) => state.me)
  const conn = useStore((state) => state.conn)
  const canWrite = useStore((state) => state.canWrite)
  const watch = useMemo(() => conn?.live(), [conn])
  const live = useWatch(watch)
  const [open, setOpen] = useState(false)
  const box = useRef(null)
  const button = useRef(null)
  useEffect(() => {
    if (!open) return
    const close = (event) => { if (!box.current?.contains(event.target)) setOpen(false) }
    // Captured first, so Esc closes the menu and nothing else.
    const key = (event) => { if (event.key === 'Escape') { event.stopPropagation(); setOpen(false); button.current?.focus() } }
    addEventListener('pointerdown', close)
    addEventListener('keydown', key, true)
    return () => { removeEventListener('pointerdown', close); removeEventListener('keydown', key, true) }
  }, [open])
  const label = live === 'live' ? 'Live' : live === 'polling' ? 'Checking every minute' : live === 'connecting' ? 'Connecting' : 'Offline'
  const name = me?.user?.name ?? ''
  const initials = name.split(/\s+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase()
  return html`<div class="me" ref=${box}>
    <span class=${'live is-' + live} title=${label}><span class="live-dot" aria-hidden="true"></span><span class="visually-hidden">${label}</span></span>
    <button type="button" class="me-button" ref=${button} aria-expanded=${open} aria-haspopup="true" aria-label=${'Account: ' + name} onClick=${() => setOpen(!open)}>${initials || html`<${Icon} name="team" size=${14} />`}</button>
    ${open && html`<div class="me-menu" role="menu">
      <p class="me-who">${name}<span>${label}${canWrite ? '' : ' · read only'}</span></p>
      <button type="button" role="menuitem" class="me-item" onClick=${() => { setOpen(false); store.getState().toggle('help', true) }}><${Icon} name="keyboard" size=${14} />Keyboard shortcuts<kbd>?</kbd></button>
      <button type="button" role="menuitem" class="me-item" onClick=${() => store.getState().signOut()}><${Icon} name="signout" size=${14} />Sign out</button>
    </div>`}
  </div>`
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
