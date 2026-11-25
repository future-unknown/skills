// The fund as its own site describes it, with where each claim came from.
import { html } from '../html.js'
import { useStore, records } from '../store.js'
import { list, humanize, money, shortUrl, isUrl } from '../data.js'
import { ago, full } from '../time.js'
import { Picture, Empty, PageBar, KnownLink, useMarkdown } from './bits.js'

export function FundView () {
  const state = useStore((value) => value)
  const fund = records(state, 'fund')[0] ?? null
  const body = useMarkdown(fund?.content, [fund?._v])
  if (!fund) return html`<div class="page"><${PageBar} title="Fund" /><${Empty} icon="fund" title="No fund profile yet">The import fills it from the fund's website.</${Empty}></div>`
  const rows = [
    ['Stages', list(fund.stages).map(humanize).join(', ')],
    ['Sectors', list(fund.sectors).join(', ')],
    ['Geographies', list(fund.geographies).join(', ')],
    ['Offices', list(fund.locations).join(', ')],
    ['Check size', fund.check_size]
  ].filter(([, value]) => value)
  const vehicles = list(fund.vehicles)
  return html`<article class="page" aria-labelledby="fund-name">
    <${PageBar} title="Fund"><div class="toolbar-end"><${KnownLink} table="fund" recordKey=${fund.id} /></div></${PageBar}>
    <header class="company-head">
      <${Picture} value=${fund.logo} name=${fund.name} size="xl" />
      <div class="company-id">
        <h2 class="company-name" id="fund-name">${fund.name}</h2>
        ${fund.one_liner && html`<p class="company-line">${fund.one_liner}</p>`}
        <p class="company-sub">
          <a href=${fund.website} target="_blank" rel="noopener noreferrer">${shortUrl(fund.website)}</a>
          ${list(fund.profiles).map((item) => html`<a href=${item.url} target="_blank" rel="noopener noreferrer">${humanize(item.kind)}</a>`)}
        </p>
      </div>
    </header>
    ${fund.thesis && html`<section class="section" aria-labelledby="thesis"><h3 class="section-title" id="thesis">Thesis</h3><p class="thesis">${fund.thesis}</p></section>`}
    ${rows.length > 0 && html`<dl class="facts">${rows.map(([name, value]) => html`<div class="fact"><dt>${name}</dt><dd>${value}</dd></div>`)}</dl>`}
    ${vehicles.length > 0 && html`<section class="section" aria-labelledby="vehicles">
      <h3 class="section-title" id="vehicles">Funds</h3>
      <div class="table-wrap"><table class="ptable">
        <thead><tr><th scope="col">Name</th><th scope="col">Vintage</th><th scope="col" class="is-num">Size</th></tr></thead>
        <tbody>${vehicles.map((vehicle) => html`<tr>
          <th scope="row">${vehicle.name}</th>
          <td>${vehicle.vintage ?? html`<span class="muted">—</span>`}</td>
          <td class="is-num">${vehicle.size != null ? money(vehicle.size, vehicle.currency) : html`<span class="muted">not stated</span>`}</td>
        </tr>`)}</tbody>
      </table></div>
    </section>`}
    ${body && html`<div class="prose" dangerouslySetInnerHTML=${{ __html: body }}></div>`}
    <p class="sources">Source: ${list(fund.source_paths).map((source, index) => html`${index ? ', ' : ''}${isUrl(source) ? html`<a href=${source} target="_blank" rel="noopener noreferrer">${shortUrl(source)}</a>` : source}`)}${fund.checked_at && html` · read <time datetime=${fund.checked_at} title=${full(fund.checked_at)}>${ago(fund.checked_at)}</time>`}</p>
  </article>`
}
