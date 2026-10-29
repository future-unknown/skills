// The site's one connection to Known: sign-in, calls, the table's schema,
// and live changes. Publishing the code tree in Known writes the site's
// settings into the page (#known-site); site.json says which table to show.
import { discoverHost, createSessionStore, createWatchStore } from 'wiki/session'

export function readSiteSettings () {
  const el = document.getElementById('known-site')
  if (!el) return null
  try { return JSON.parse(el.textContent) } catch { return null }
}

export async function readConfig () {
  try {
    const response = await fetch('site.json', { cache: 'no-store' })
    if (!response.ok) return {}
    return await response.json()
  } catch {
    return {}
  }
}

export class KnownError extends Error {
  constructor (message, { code = null, data = null } = {}) {
    super(message)
    this.code = code
    this.data = data
  }
}

export async function connect (site) {
  const host = String(site.host).replace(/\/+$/, '')
  const { signIn } = await discoverHost({ baseUrl: host })
  const session = createSessionStore({
    clientId: site.clientId,
    redirectUri: site.redirectUri,
    scope: site.scope || '',
    signIn
  })
  await session.getState().start()

  async function call (method, params = {}) {
    const token = await session.getState().getToken()
    if (!token) throw new KnownError('You are signed out.', { code: 'signed_out' })
    const response = await fetch(`${host}/rpc`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
    })
    let body = null
    try { body = await response.json() } catch { /* not JSON */ }
    if (body?.error) throw new KnownError(body.error.message || 'Known refused the request.', { code: body.error.code, data: body.error.data })
    if (!response.ok) throw new KnownError(`Known answered ${response.status}.`, { code: response.status })
    return body.result
  }

  // A wiki's declared pages, each with its key and schema.
  async function describe (wiki) {
    const token = await session.getState().getToken()
    const response = await fetch(`${host}/rpc/${encodeURIComponent(wiki)}`, {
      headers: { accept: 'application/json', authorization: `Bearer ${token}` }
    })
    if (!response.ok) throw new KnownError(response.status === 404 ? `This site can't read the wiki ${wiki}.` : `Reading ${wiki} failed (${response.status}).`, { code: response.status })
    return response.json()
  }

  let watch = null
  function live () {
    if (!watch) {
      watch = createWatchStore({ session, baseUrl: host })
      watch.getState().start()
    }
    return watch
  }

  return { host, session, call, describe, live }
}

// Every record in a table, newest key last, following cursors.
export async function loadRecords (call, path, { since = null } = {}) {
  const all = []
  let cursor = null
  for (let guard = 0; guard < 200; guard++) {
    const params = { path, limit: 200 }
    if (cursor) params.cursor = cursor
    if (since) params.since = since
    const result = await call('wiki.records', params)
    const batch = result?.records ?? []
    all.push(...batch)
    cursor = result?.cursor ?? null
    if (!cursor || batch.length === 0) break
  }
  return all
}

// Where a record opens in Known itself: the app sits on the rpc host's
// parent domain (rpc.known.info → known.info).
export function appUrlFor (host, orgSlug, path, key) {
  const origin = host.replace('://rpc.', '://')
  const [wiki, ...rest] = path.split('.')
  const url = `${origin}/${orgSlug}/${wiki}/${rest.join('/')}`
  return key ? `${url}?record=${encodeURIComponent(key)}` : url
}
