// Updates across the portfolio, newest first. What a company reported and
// what the fund noted are marked apart, always in words.
import { useMemo } from 'preact/hooks'
import { html } from '../html.js'
import { store, useStore, records } from '../store.js'
import { keyIn, list, money, humanize } from '../data.js'
import { day } from '../time.js'
import { Badge, Empty, PageBar, CompanyLink, useFresh, useMarkdown } from './bits.js'
import { Select } from './portfolio.js'

export function UpdatesView () {
  const state = useStore((value) => value)
  const { route, tables, names } = state
  const companies = tables.companies ?? {}
  const rows = useMemo(() => records(state, 'updates')
    .filter((update) => !route.company || keyIn(update.company, 'companies', names) === route.company)
    .filter((update) => !route.origin || update.origin === route.origin)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b._ts).localeCompare(String(a._ts))), [tables, route])
  const navigate = (patch) => store.getState().navigate(patch, { replace: true })
  return html`<div class="page">
    <${PageBar} title="Updates" count=${rows.length}>
      <div class="filters">
        <${Select} label="Company" value=${route.company} onChange=${(company) => navigate({ company })} all="All companies"
          options=${Object.values(companies).sort((a, b) => a.name.localeCompare(b.name)).map((company) => [company.id, company.name])} />
        <${Select} label="From" value=${route.origin} onChange=${(origin) => navigate({ origin })} all="Everyone"
          options=${[['company-reported', 'Company-reported'], ['fund-note', 'Fund notes']]} />
      </div>
    </${PageBar}>
    ${rows.length
      ? html`<ol class="feed">${rows.map((update) => html`<${UpdateItem} key=${update.id} update=${update} showCompany=${true} />`)}</ol>`
      : html`<${Empty} icon="updates" title="No updates here yet">Forward an investor update to your agent: "File this as Ferncloud's October update."</${Empty}>`}
  </div>`
}

const METRICS = [
  ['arr', 'ARR', 'money'],
  ['mrr', 'MRR', 'money'],
  ['revenue', 'Revenue', 'money'],
  ['net_burn', 'Net burn / mo', 'money'],
  ['gross_burn', 'Gross burn / mo', 'money'],
  ['cash', 'Cash', 'money'],
  ['runway_months', 'Runway', 'months'],
  ['headcount', 'Headcount', 'number'],
  ['customers', 'Customers', 'number']
]

export function Metrics ({ metrics }) {
  if (!metrics) return null
  const rows = METRICS.filter(([name]) => metrics[name] != null).map(([name, label, kind]) => [label, kind === 'money'
    ? money(metrics[name], metrics.currency)
    : kind === 'months' ? `${metrics[name]} months` : new Intl.NumberFormat().format(metrics[name])])
  for (const other of list(metrics.other)) rows.push([other.name, `${new Intl.NumberFormat().format(other.value)}${other.unit ? ' ' + other.unit : ''}`])
  if (!rows.length) return null
  return html`<dl class="metrics">${rows.map(([label, value]) => html`<div class="metric"><dt>${label}</dt><dd>${value}</dd></div>`)}</dl>`
}

export function UpdateItem ({ update, showCompany = false }) {
  const tables = useStore((state) => state.tables)
  const names = useStore((state) => state.names)
  const fresh = useFresh('updates', update.id)
  const companyId = keyIn(update.company, 'companies', names)
  const company = companyId ? tables.companies?.[companyId] : null
  const body = useMarkdown(update.content, [update._v, update.content])
  const sources = list(update.source_paths)
  return html`<li class=${'feed-item is-' + update.origin + fresh}>
    <header class="feed-head">
      <${Badge} kind=${update.origin} />
      <span class="feed-kind">${humanize(update.kind)}</span>
      ${update.period && html`<span class="feed-period">for ${update.period}</span>`}
      <time class="feed-date" datetime=${update.date}>${day(update.date)}</time>
    </header>
    <h3 class="feed-title">${showCompany && company ? html`<${CompanyLink} id=${company.id}>${company.name}</${CompanyLink}><span class="feed-sep" aria-hidden="true"> · </span>` : null}${update.title}</h3>
    ${update.author && html`<p class="feed-by">From ${update.author}</p>`}
    <${Metrics} metrics=${update.metrics} />
    ${(list(update.highlights).length > 0 || list(update.lowlights).length > 0) && html`<div class="feed-lists">
      ${list(update.highlights).length > 0 && html`<div><h4>Highlights</h4><ul>${list(update.highlights).map((item) => html`<li>${item}</li>`)}</ul></div>`}
      ${list(update.lowlights).length > 0 && html`<div><h4>Lowlights</h4><ul>${list(update.lowlights).map((item) => html`<li>${item}</li>`)}</ul></div>`}
    </div>`}
    ${list(update.asks).length > 0 && html`<div class="asks"><h4>Asks</h4><ul>${list(update.asks).map((item) => html`<li>${item}</li>`)}</ul></div>`}
    ${body && html`<div class="prose is-compact" dangerouslySetInnerHTML=${{ __html: body }}></div>`}
    ${sources.length > 0 && html`<p class="sources">Source: ${sources.map((source, index) => html`${index ? ', ' : ''}${/^https?:\/\//.test(source) ? html`<a href=${source} target="_blank" rel="noopener noreferrer">${source}</a>` : source}`)}</p>`}
  </li>`
}
