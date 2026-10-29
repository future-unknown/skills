import { html } from '../html.js'
import { initials, personName, humanize } from '../model.js'
import { Icon } from '../icons.js'

// A person's initials on a tone picked from their name, so the same person
// always reads the same.
const TONES = 6
function toneOf (name) {
  let hash = 0
  for (const char of String(name)) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return hash % TONES
}

export function Avatar ({ value, size = 'm', showName = false }) {
  const name = personName(value)
  if (!name) return html`<span class=${'avatar is-empty size-' + size} title="Unassigned" aria-label="Unassigned"></span>${showName && html`<span class="person-name is-muted">Unassigned</span>`}`
  return html`<span class=${`avatar tone-${toneOf(name)} size-${size}`} title=${name} aria-hidden=${showName ? 'true' : null} aria-label=${showName ? null : name}>${initials(name)}</span>${showName && html`<span class="person-name">${name}</span>`}`
}

export function Label ({ name, onClick = null }) {
  return onClick
    ? html`<button type="button" class="label" onClick=${(event) => { event.stopPropagation(); onClick(name) }}>${name}</button>`
    : html`<span class="label">${name}</span>`
}

export function Kbd ({ children }) {
  return html`<kbd>${children}</kbd>`
}

export function Empty ({ icon = 'open', title, children }) {
  return html`<div class="empty"><${Icon} name=${icon} size=${20} /><p class="empty-title">${title}</p>${children && html`<div class="empty-text">${children}</div>`}</div>`
}

export function statusLabel (status) {
  return humanize(status)
}
