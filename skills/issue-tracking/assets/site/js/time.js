// Times as people say them: "now", "4m", "3h", "Tue", "12 Oct", "12 Oct 2025".
const MINUTE = 60e3
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export function ago (iso, now = Date.now()) {
  const t = Date.parse(iso)
  if (!t) return ''
  const d = now - t
  if (d < MINUTE) return 'now'
  if (d < HOUR) return `${Math.floor(d / MINUTE)}m`
  if (d < DAY) return `${Math.floor(d / HOUR)}h`
  if (d < 7 * DAY) return new Date(t).toLocaleDateString(undefined, { weekday: 'short' })
  const date = new Date(t)
  const sameYear = date.getFullYear() === new Date(now).getFullYear()
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) })
}

export function full (iso) {
  const t = Date.parse(iso)
  if (!t) return ''
  return new Date(t).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export function day (iso) {
  if (!iso) return ''
  const t = Date.parse(iso.length === 10 ? iso + 'T12:00:00Z' : iso)
  if (!t) return iso
  return new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}
