import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { html } from '../html.js'
import { useStore, store } from '../store.js'
import { initials, imageOf, humanize } from '../data.js'
import { appUrlFor, fullPath } from '../known.js'
import { renderMarkdown } from '../markdown.js'
import { Icon } from '../icons.js'

// A tone picked from the name, so the same company or person always reads
// the same when there is no image.
const TONES = 6
function toneOf (name) {
  let hash = 0
  for (const char of String(name)) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return hash % TONES
}

// An image by reference: Known keeps the address, not the file, so the
// image may have moved. On error, or with none, the initials stand in. The
// name always sits beside it, so the image itself is decorative (alt="").
// no-referrer: a viewer's visit tells the image host nothing about the site.
export function Picture ({ value, name, kind = 'logo', size = 'm' }) {
  const tables = useStore((state) => state.tables)
  const names = useStore((state) => state.names)
  const media = imageOf(tables, value, names)
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [media?.url])
  const shape = kind === 'headshot' ? ' is-round' : ''
  if (!media || failed) {
    return html`<span class=${`picture is-initials tone-${toneOf(name)} size-${size}${shape}`} aria-hidden="true">${initials(name)}</span>`
  }
  return html`<span class=${`picture size-${size}${shape}${kind === 'logo' ? ' is-logo' : ''}`} aria-hidden="true">
    <img src=${media.url} alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onError=${() => setFailed(true)} />
  </span>`
}

export function Empty ({ icon = 'portfolio', title, children }) {
  return html`<div class="empty"><${Icon} name=${icon} size=${20} /><p class="empty-title">${title}</p>${children && html`<div class="empty-text">${children}</div>`}</div>`
}

// Where a claim comes from, as words, never colour alone.
const BASIS = {
  public: 'Public',
  'company-reported': 'Company-reported',
  confirmed: 'Confirmed',
  'fund-note': 'Fund note',
  press: 'Press'
}
export function Badge ({ kind, children }) {
  return html`<span class=${'badge is-' + kind}>${children ?? BASIS[kind] ?? humanize(kind)}</span>`
}

export function KnownLink ({ table, recordKey, children = 'Open in Known' }) {
  const conn = useStore((state) => state.conn)
  const orgSlug = useStore((state) => state.orgSlug)
  const wiki = useStore((state) => state.wiki)
  const names = useStore((state) => state.names)
  if (!conn) return null
  return html`<a class="button is-small" href=${appUrlFor(conn.host, orgSlug, fullPath(wiki, names[table]), recordKey)} target="_blank" rel="noopener">${children}<${Icon} name="external" size=${12} /></a>`
}

export function CompanyLink ({ id, children }) {
  return html`<a href=${'#/company/' + encodeURIComponent(id)} onClick=${(event) => { if (event.metaKey || event.ctrlKey) return; event.preventDefault(); store.getState().openCompany(id) }}>${children}</a>`
}

// A record that just arrived warms for a moment, then settles.
export function useFresh (table, key) {
  const arrived = useStore((state) => state.arrived[`${table}/${key}`])
  const [fresh, setFresh] = useState(false)
  useEffect(() => {
    if (!arrived) return
    const left = 4000 - (Date.now() - arrived.at)
    if (left <= 0) return
    setFresh(true)
    const timer = setTimeout(() => setFresh(false), left)
    return () => clearTimeout(timer)
  }, [arrived?.at])
  return fresh ? (arrived.fresh ? ' is-new' : ' is-updated') : ''
}

// A short message after a write: saved, or why not.
export function useResult () {
  const [result, setResult] = useState(null)
  const show = (value) => {
    setResult(value)
    if (value?.ok) setTimeout(() => setResult(null), 2400)
  }
  const view = result && !result.ok
    ? html`<p class="form-error" role="alert">Not saved: ${result.error?.detail ?? result.error?.title}</p>`
    : null
  return [view, show]
}

// A page's bar: a title, and
// whatever the page puts at its end.
// A page with its own h1 (a company) passes a crumb back instead of a title.
export function PageBar ({ title, count = null, crumb = null, children }) {
  return html`<header class="toolbar">
    ${crumb
      ? html`<nav class="crumb" aria-label="Breadcrumb"><a href=${'#/' + crumb.view} onClick=${(event) => { event.preventDefault(); store.getState().go(crumb.view) }}><${Icon} name="back" size=${14} />${crumb.label}</a></nav>`
      : html`<h1 class="view-title">${title}${count != null && html`<span class="view-count">${count}</span>`}</h1>`}
    ${children}
  </header>`
}

// Record writing as safe HTML: links to a company open its page here,
// links to anything else open in Known.
export function useMarkdown (text, deps) {
  const conn = useStore((state) => state.conn)
  const orgSlug = useStore((state) => state.orgSlug)
  const wiki = useStore((state) => state.wiki)
  const names = useStore((state) => state.names)
  const tables = useStore((state) => state.tables)
  return useMemo(() => (text
    ? renderMarkdown(text, {
        siteHref: (link) => ((!link.wiki || link.wiki === wiki) && link.table === names.companies && tables.companies?.[link.key] ? '#/company/' + encodeURIComponent(link.key) : null),
        knownHref: (link) => appUrlFor(conn.host, orgSlug, fullPath(link.wiki ?? wiki, link.table), link.key)
      })
    : null), deps)
}

// A button that opens a form in its place. Opening puts focus in the form's
// first field; closing it (saved or cancelled) puts focus back on the button,
// so the keyboard never falls back to the top of the page.
export function useOpener (initial = false) {
  const [open, setOpen] = useState(initial)
  const trigger = useRef(null)
  const field = useRef(null)
  const was = useRef(open)
  useEffect(() => {
    if (open) field.current?.focus()
    else if (was.current) trigger.current?.focus()
    was.current = open
  }, [open])
  return { open, setOpen, trigger, field }
}
