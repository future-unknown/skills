// One icon set, drawn at 16px on a 1.5 stroke. Paths follow Lucide (ISC).
import { html } from './html.js'
import { humanize } from './data.js'

const PATHS = {
  search: 'M11 11l3 3M7 12A5 5 0 1 0 7 2a5 5 0 0 0 0 10z',
  grid: 'M2.5 2.5h4.5v4.5H2.5zM9 2.5h4.5v4.5H9zM2.5 9h4.5v4.5H2.5zM9 9h4.5v4.5H9z',
  list: 'M5 4h9M5 8h9M5 12h9M2 4h.01M2 8h.01M2 12h.01',
  portfolio: 'M2 5h12v8.5H2zM5.5 5V3h5v2M2 8.5h12',
  updates: 'M3 2.5h10v11H3zM5.5 5.5h5M5.5 8h5M5.5 10.5h3',
  tasks: 'M2.5 4l1.2 1.2L6 3M2.5 8.5l1.2 1.2L6 7.5M8 4.2h5.5M8 8.7h5.5M8 13h5.5M2.5 13h3',
  review: 'M8 14.5A6.5 6.5 0 1 0 8 1.5a6.5 6.5 0 0 0 0 13zM8 4.5V8M8 10.8h.01',
  team: 'M6 7.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM1.5 13.5a4.5 4.5 0 0 1 9 0M11 2.7a2.5 2.5 0 0 1 0 4.6M12.5 9.6a4.5 4.5 0 0 1 2 3.9',
  fund: 'M2 13.5h12M3.5 13.5V7M6.5 13.5V7M9.5 13.5V7M12.5 13.5V7M1.5 6L8 2.5 14.5 6z',
  external: 'M9.5 2.5h4v4M13.5 2.5L7 9M11.5 9.5v3a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3',
  close: 'M4 4l8 8M12 4l-8 8',
  back: 'M10 3L5 8l5 5',
  menu: 'M2 4h12M2 8h12M2 12h12',
  link: 'M7 9a3 3 0 0 0 4.2.3l2-2a3 3 0 0 0-4.2-4.2l-1 1M9 7a3 3 0 0 0-4.2-.3l-2 2a3 3 0 0 0 4.2 4.2l1-1',
  chevron: 'M6 4l4 4-4 4',
  keyboard: 'M1.5 4h13v8h-13zM4 6.5h.01M6.5 6.5h.01M9 6.5h.01M11.5 6.5h.01M5 9.5h6',
  signout: 'M6 14H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h3M10.5 11.5L14 8l-3.5-3.5M14 8H6',
  arrow: 'M3 8h10M9 4l4 4-4 4',
  plus: 'M8 3v10M3 8h10',
  check: 'M3 8.5l3 3 7-7',
  agent: 'M4 6h8v6.5H4zM8 6V3.5M6 9h.01M10 9h.01M2.5 8.5v2M13.5 8.5v2M8 3.5h.01',
  image: 'M2 2.5h12v11H2zM2 11l3.5-3.5L9 11M8.5 9l2-2 3.5 3.5M10.5 5.5h.01',
  doc: 'M4 1.5h5.5L12.5 4.5v10h-8.5zM9.5 1.5v3h3',
  flag: 'M3 14V2.5M3 2.5h8l-1.5 3 1.5 3H3',
  note: 'M3 2.5h7.5L13 5v8.5H3zM5.5 7h5M5.5 9.5h3'
}

export function Icon ({ name, size = 16, label = null, class: className = '' }) {
  return html`<svg class=${'icon ' + className} width=${size} height=${size} viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden=${label ? null : 'true'} role=${label ? 'img' : null} aria-label=${label}><path d=${PATHS[name] ?? PATHS.doc} /></svg>`
}

// A company's status as a shape, always next to its word: active is a solid
// dot, an exit a check, a shutdown a cross, dormant a dashed ring.
export function StatusMark ({ status, showText = true }) {
  const shapes = {
    active: html`<circle cx="6" cy="6" r="4" class="s-fill" />`,
    acquired: html`<circle cx="6" cy="6" r="5.25" class="s-ring" /><path d="M3.6 6.2l1.6 1.6 3.2-3.4" class="s-line" />`,
    ipo: html`<circle cx="6" cy="6" r="5.25" class="s-ring" /><path d="M3.6 6.2l1.6 1.6 3.2-3.4" class="s-line" />`,
    'shut-down': html`<circle cx="6" cy="6" r="5.25" class="s-ring is-muted" /><path d="M4 4l4 4M8 4L4 8" class="s-line is-muted" />`,
    dormant: html`<circle cx="6" cy="6" r="5" class="s-ring is-dashed" />`
  }
  const label = status === 'ipo' ? 'IPO' : humanize(status ?? 'unknown')
  return html`<span class=${'status is-' + (status ?? 'unknown')}>
    <svg class="status-mark" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">${shapes[status] ?? html`<circle cx="6" cy="6" r="5" class="s-ring" />`}</svg>
    ${showText ? html`<span>${label}</span>` : html`<span class="visually-hidden">${label}</span>`}
  </span>`
}
