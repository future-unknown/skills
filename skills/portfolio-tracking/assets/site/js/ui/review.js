// What monitoring found, waiting for a person. Accepting does not change
// the portfolio here: the next monitoring run applies accepted signals and
// marks them applied, so every change to the records goes through the same
// agent with the same checks.
import { useMemo, useState } from 'preact/hooks'
import { html } from '../html.js'
import { store, useStore, records } from '../store.js'
import { keyIn, list, humanize, shortUrl, isUrl, parseLink } from '../data.js'
import { ago, full } from '../time.js'
import { Icon } from '../icons.js'
import { Empty, PageBar, CompanyLink, useFresh, useResult } from './bits.js'

const ORDER = { proposed: 0, accepted: 1 }

export function ReviewView () {
  const state = useStore((value) => value)
  const { tables } = state
  const rows = useMemo(() => records(state, 'signals')
    .filter((signal) => signal.status in ORDER)
    .sort((a, b) => ORDER[a.status] - ORDER[b.status] || String(b.detected_at).localeCompare(String(a.detected_at))), [tables])
  const lastRun = useMemo(() => records(state, 'runs').sort((a, b) => String(b.started_at).localeCompare(String(a.started_at)))[0] ?? null, [tables])
  const proposed = rows.filter((signal) => signal.status === 'proposed').length
  return html`<div class="page">
    <${PageBar} title="Review" count=${proposed} />
    <p class="lede">What monitoring found on the fund's and companies' own pages. Accept what is right; the next monitoring run writes it into the portfolio. Nothing changes until then.</p>
    ${lastRun && html`<p class="run-line">Last run <time datetime=${lastRun.started_at} title=${full(lastRun.started_at)}>${ago(lastRun.started_at)}</time> · ${humanize(lastRun.status)}${lastRun.pages_checked != null ? ` · ${lastRun.pages_checked} pages checked` : ''}${list(lastRun.problems).length ? ` · ${list(lastRun.problems).length} could not be read` : ''}</p>`}
    ${rows.length
      ? html`<ol class="signals">${rows.map((signal) => html`<${Signal} key=${signal.id} signal=${signal} />`)}</ol>`
      : html`<${Empty} icon="review" title="Nothing to review">New rounds, exits, people changes and logo changes show up here after a monitoring run.</${Empty}>`}
  </div>`
}

function Signal ({ signal }) {
  const tables = useStore((state) => state.tables)
  const names = useStore((state) => state.names)
  const canWrite = useStore((state) => state.canWrite)
  const fresh = useFresh('signals', signal.id)
  const [busy, setBusy] = useState(false)
  const [error, show] = useResult()
  const companyId = keyIn(signal.company, 'companies', names)
  const company = companyId ? tables.companies?.[companyId] : null
  const decide = async (status) => {
    setBusy(true)
    show(await store.getState().decide(signal.id, status))
    setBusy(false)
  }
  return html`<li class=${'signal is-' + signal.status + fresh}>
    <header class="signal-head">
      <span class="signal-id">${signal.id}</span>
      <span class="signal-kind">${humanize(signal.kind)}</span>
      ${company ? html`<${CompanyLink} id=${company.id}>${company.name}</${CompanyLink}>` : signal.company ? html`<span>${parseLink(signal.company)?.key}</span>` : html`<span class="muted">Not in the portfolio yet</span>`}
      <time class="signal-when" datetime=${signal.detected_at} title=${full(signal.detected_at)}>${ago(signal.detected_at)}</time>
    </header>
    <p class="signal-summary">${signal.summary}</p>
    ${signal.proposed && html`<div class="proposal">
      <p class="proposal-target">Would write <code>${signal.proposed.table}/${signal.proposed.key}</code>${tables[signal.proposed.table]?.[signal.proposed.key] ? ' (updates the existing record)' : ' (a new record)'}</p>
      <dl class="proposal-fields">${Object.entries(signal.proposed.set ?? {}).map(([field, value]) => html`<div><dt>${humanize(field)}</dt><dd>${showValue(value)}</dd></div>`)}</dl>
    </div>`}
    ${list(signal.source_paths).length > 0 && html`<p class="sources">Source: ${list(signal.source_paths).map((source, index) => html`${index ? ', ' : ''}${isUrl(source) ? html`<a href=${source} target="_blank" rel="noopener noreferrer">${shortUrl(source)}</a>` : source}`)}</p>`}
    <footer class="signal-foot">
      ${signal.status === 'accepted'
        ? html`<span class="badge is-accepted"><${Icon} name="check" size=${12} />Accepted${signal.decided_by ? ` by ${signal.decided_by}` : ''} · applies on the next run</span>
          ${canWrite && html`<button type="button" class="button is-small is-quiet" disabled=${busy} onClick=${() => decide('proposed')}>Undo</button>`}`
        : canWrite
          ? html`<button type="button" class="button is-small is-primary" disabled=${busy} onClick=${() => decide('accepted')}>Accept</button>
            <button type="button" class="button is-small" disabled=${busy} onClick=${() => decide('rejected')}>Reject</button>
            <button type="button" class="button is-small is-quiet" disabled=${busy} onClick=${() => decide('duplicate')}>Duplicate</button>`
          : html`<span class="muted">Waiting for someone who can write to the portfolio.</span>`}
    </footer>
    ${error}
  </li>`
}

function showValue (value) {
  if (value == null) return html`<span class="muted">none</span>`
  if (Array.isArray(value)) return value.length ? value.map((item) => (typeof item === 'object' ? item.url ?? JSON.stringify(item) : item)).join(', ') : html`<span class="muted">none</span>`
  if (typeof value === 'object') return html`<code>${JSON.stringify(value)}</code>`
  if (isUrl(value)) return html`<a href=${value} target="_blank" rel="noopener noreferrer">${shortUrl(value)}</a>`
  return String(value)
}
