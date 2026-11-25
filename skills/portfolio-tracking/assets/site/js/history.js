// What each version of a record changed, read from the versions Known keeps.
import { strip } from './data.js'

const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)

export function changesBetween (before, after, key) {
  const a = before ? strip(before) : {}
  const b = strip(after)
  const names = new Set([...Object.keys(a), ...Object.keys(b)])
  const changes = []
  for (const name of names) {
    if (name === key || same(a[name], b[name])) continue
    changes.push({ field: name, from: a[name] ?? null, to: b[name] ?? null })
  }
  // The writing last, after the fields it explains.
  return changes.sort((x, y) => (x.field === 'content') - (y.field === 'content'))
}

// Newest first: each version with what it changed from the one before.
export function timeline (versions, key) {
  const ordered = [...versions].sort((a, b) => (a._v ?? 0) - (b._v ?? 0))
  return ordered.map((version, index) => ({
    version,
    created: index === 0 && (version._v ?? 1) === 1,
    changes: index === 0 ? [] : changesBetween(ordered[index - 1], version, key)
  })).reverse()
}

export function actorOf (version, me) {
  const actor = version._actor ?? null
  if (!actor) return { who: 'Someone', agent: false }
  const agent = actor.type === 'agent'
  const mine = me?.user?.id && (actor.id === me.user.id || actor.onBehalfOf === me.user.id)
  if (agent) return { who: mine ? 'Your agent' : 'An agent', agent: true }
  return { who: mine ? 'You' : 'A teammate', agent: false }
}
