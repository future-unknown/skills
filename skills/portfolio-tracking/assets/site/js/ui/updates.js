// Updates across the portfolio, newest first. What a company reported and
// what the fund noted are marked apart, always in words.
import { useMemo } from 'preact/hooks'
import { html } from '../html.js'
import { store, useStore, records } from '../store.js'
import { keyIn, list, money, humanize, shortUrl } from '../data.js'
import { day } from '../time.js'
import { Badge, Empty, PageBar, CompanyLink, Picture, useFresh, useMarkdown } from './bits.js'
import { Icon } from '../icons.js'
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
        <${Select} label="From" value=${route.origin} onChange=${(origin) => navigate({ origin })} all="All sources"
          options=${[['press', 'Press'], ['company-reported', 'From companies'], ['fund-note', 'From the fund']]} />
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
  // One shape for every update: who and when on the first line, what
  // happened as the title, then the writing, then where it came from.
  return html`<li class=${'feed-item is-' + update.origin + fresh}>
    <header class="feed-head">
      ${showCompany && company && html`<span class="feed-company"><${Picture} value=${company.logo} name=${company.name} size="s" /><${CompanyLink} id=${company.id}>${company.name}</${CompanyLink}></span>`}
      <span class="feed-meta"><time datetime=${update.date}>${day(update.date)}</time>${update.kind !== 'news' && html`<span> · ${humanize(update.kind)}</span>`}${update.period && html`<span> · for ${update.period}</span>`}</span>
      <span class="feed-origin">${update.origin === 'press' && update.publisher ? html`<${Badge} kind="press">${update.publisher}</${Badge}>` : html`<${Badge} kind=${update.origin} />`}</span>
    </header>
    <h3 class="feed-title">${update.title}</h3>
    ${update.author && update.origin !== 'fund-note' && html`<p class="feed-by">From ${update.author}</p>`}
    <${Metrics} metrics=${update.metrics} />
    ${(list(update.highlights).length > 0 || list(update.lowlights).length > 0) && html`<div class="feed-lists">
      ${list(update.highlights).length > 0 && html`<div><h4>Highlights</h4><ul>${list(update.highlights).map((item) => html`<li>${item}</li>`)}</ul></div>`}
      ${list(update.lowlights).length > 0 && html`<div><h4>Lowlights</h4><ul>${list(update.lowlights).map((item) => html`<li>${item}</li>`)}</ul></div>`}
    </div>`}
    ${list(update.asks).length > 0 && html`<div class="asks"><h4>Asks</h4><ul>${list(update.asks).map((item) => html`<li>${item}</li>`)}</ul></div>`}
    ${body && !(update.origin === 'press' && echoes(update.content, update.title)) && html`<div class="prose is-compact" dangerouslySetInnerHTML=${{ __html: body }}></div>`}
    ${update.origin === 'press' && sources[0]
      ? html`<p class="feed-source"><a href=${sources[0]} target="_blank" rel="noopener noreferrer">Read on ${update.publisher ?? 'the publisher'}<${Icon} name="external" size=${11} /></a></p>`
      : sources.length > 0 && html`<p class="feed-source">${sources.map((source, index) => html`${index ? ' · ' : ''}${/^https?:\/\//.test(source) ? html`<a href=${source} target="_blank" rel="noopener noreferrer" title=${source}>${shortUrl(source)}<${Icon} name="external" size=${11} /></a>` : source}`)}</p>`}
  </li>`
}

// Whether a summary only repeats its headline: most of its words are the
// headline's, so showing both says the same thing twice.
function echoes (summary, title) {
  const words = (text) => String(text ?? '').toLowerCase().match(/[a-z0-9]+/g) ?? []
  const said = new Set(words(title))
  const own = words(summary).filter((word) => word.length > 3)
  if (!own.length) return true
  return own.filter((word) => said.has(word)).length / own.length >= 0.7
}
