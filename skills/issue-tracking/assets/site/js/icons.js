// One icon set, drawn at 16px on a 1.5 stroke. Paths follow Lucide (ISC).
import { html } from './html.js'

const PATHS = {
  search: 'M11 11l3 3M7 12A5 5 0 1 0 7 2a5 5 0 0 0 0 10z',
  list: 'M5 4h9M5 8h9M5 12h9M2 4h.01M2 8h.01M2 12h.01',
  board: 'M2.5 2.5h3v11h-3zM6.5 2.5h3v7h-3zM10.5 2.5h3v9h-3z',
  user: 'M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2.5 14a5.5 5.5 0 0 1 11 0',
  open: 'M8 14.5A6.5 6.5 0 1 0 8 1.5a6.5 6.5 0 0 0 0 13z',
  active: 'M8 14.5A6.5 6.5 0 1 0 8 1.5a6.5 6.5 0 0 0 0 13zM8 4v4l2.5 1.5',
  blocked: 'M8 14.5A6.5 6.5 0 1 0 8 1.5a6.5 6.5 0 0 0 0 13zM3.4 3.4l9.2 9.2',
  recent: 'M2 8a6 6 0 1 0 1.8-4.3M2 2v3h3M8 5v3l2 1',
  closed: 'M8 14.5A6.5 6.5 0 1 0 8 1.5a6.5 6.5 0 0 0 0 13zM5.5 8l1.8 1.8L10.8 6.3',
  all: 'M8 1.5l6.5 3.5L8 8.5 1.5 5zM1.5 8L8 11.5 14.5 8M1.5 11L8 14.5 14.5 11',
  tag: 'M2 2h5.5l6.5 6.5-5.5 5.5L2 7.5zM5 5h.01',
  external: 'M9.5 2.5h4v4M13.5 2.5L7 9M11.5 9.5v3a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3',
  copy: 'M5.5 5.5h8v8h-8zM10.5 5.5v-3h-8v8h3',
  close: 'M4 4l8 8M12 4l-8 8',
  back: 'M10 3L5 8l5 5',
  menu: 'M2 4h12M2 8h12M2 12h12',
  pr: 'M4 5.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM4 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM12 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM4 5.5v5M12 10.5V6a2 2 0 0 0-2-2H7.5M9 2.5L7.5 4 9 5.5',
  commit: 'M8 10.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM1.5 8h4M10.5 8h4',
  deploy: 'M8 10.5V2M4.5 5.5L8 2l3.5 3.5M2.5 10.5v2a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-2',
  link: 'M7 9a3 3 0 0 0 4.2.3l2-2a3 3 0 0 0-4.2-4.2l-1 1M9 7a3 3 0 0 0-4.2-.3l-2 2a3 3 0 0 0 4.2 4.2l1-1',
  command: 'M5.5 2.5a1.5 1.5 0 1 0 0 3h5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0-1.5 1.5v8a1.5 1.5 0 1 0 1.5-1.5h-5a1.5 1.5 0 1 0 1.5 1.5V4A1.5 1.5 0 0 0 5.5 2.5z',
  chevron: 'M6 4l4 4-4 4',
  keyboard: 'M1.5 4h13v8h-13zM4 6.5h.01M6.5 6.5h.01M9 6.5h.01M11.5 6.5h.01M5 9.5h6',
  signout: 'M6 14H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h3M10.5 11.5L14 8l-3.5-3.5M14 8H6',
  arrow: 'M3 8h10M9 4l4 4-4 4',
  edit: 'M11 2.5l2.5 2.5L6 12.5H3.5V10z',
  agent: 'M4 6h8v6.5H4zM8 6V3.5M6 9h.01M10 9h.01M2.5 8.5v2M13.5 8.5v2M8 3.5h.01'
}

export function Icon ({ name, size = 16, label = null, class: className = '' }) {
  return html`<svg class=${'icon ' + className} width=${size} height=${size} viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden=${label ? null : 'true'} role=${label ? 'img' : null} aria-label=${label}><path d=${PATHS[name]} /></svg>`
}

// Status as a ring that fills in workflow order; closed statuses check or
// cross, a blocked one is barred. Shape carries the meaning, not colour.
export function StatusGlyph ({ model, status, size = 14 }) {
  const label = String(status ?? 'no status').replace(/_/g, ' ')
  if (!model) return null
  let body
  if (model.closed.has(status)) {
    const done = model.statuses.indexOf(status) === model.statuses.findIndex((item) => model.closed.has(item))
    body = done
      ? html`<circle cx="7" cy="7" r="6.25" class="g-fill" /><path d="M4.4 7.2l1.8 1.8 3.4-3.6" class="g-mark" />`
      : html`<circle cx="7" cy="7" r="6.25" class="g-muted" /><path d="M4.8 9.2l4.4-4.4" class="g-mark" />`
  } else if (model.blocked.has(status)) {
    body = html`<circle cx="7" cy="7" r="6" class="g-ring g-warn" /><path d="M4 7h6" class="g-bar" />`
  } else {
    const open = model.statuses.filter((item) => !model.closed.has(item) && !model.blocked.has(item))
    const step = Math.max(0, open.indexOf(status))
    const fraction = open.length > 1 ? step / (open.length - 1) : 0
    body = html`<circle cx="7" cy="7" r="6" class="g-ring" />${fraction > 0 && html`<circle cx="7" cy="7" r="2.6" class="g-pie" stroke-dasharray=${`${fraction * 2 * Math.PI * 2.6} 100`} transform="rotate(-90 7 7)" />`}`
  }
  return html`<svg class="status-glyph" width=${size} height=${size} viewBox="0 0 14 14" role="img" aria-label=${label}>${body}</svg>`
}

// Priority as stacked bars: the more urgent, the more bars; the most urgent
// is a solid mark. Readable without colour.
export function PriorityGlyph ({ model, priority, size = 14 }) {
  if (!model?.priorities.length || priority == null) return html`<span class="priority-glyph is-none" aria-label="no priority" role="img">–</span>`
  const index = model.priorities.indexOf(priority)
  const levels = model.priorities.length
  if (index === 0) {
    return html`<svg class="priority-glyph is-urgent" width=${size} height=${size} viewBox="0 0 14 14" role="img" aria-label=${'priority ' + priority}><rect x="1" y="1" width="12" height="12" rx="3" /><path d="M7 3.8v4M7 10.2h.01" /></svg>`
  }
  const bars = Math.max(1, Math.round(((levels - index) / (levels - 1)) * 3))
  return html`<svg class="priority-glyph" width=${size} height=${size} viewBox="0 0 14 14" role="img" aria-label=${'priority ' + priority}>
    ${[0, 1, 2].map((i) => html`<rect x=${1.5 + i * 4} y=${9 - i * 3} width="3" height=${3.5 + i * 3} rx="0.75" class=${i < bars ? 'on' : 'off'} />`)}
  </svg>`
}
