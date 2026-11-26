// Every company at a glance, as cards or as a table, filtered from the
// address so a filtered view can be shared.
import { useMemo } from 'preact/hooks'
import { html } from '../html.js'
import { store, useStore, records, companyView } from '../store.js'
import { list, stageName, raisedText, keyIn } from '../data.js'
import { ago, day } from '../time.js'
import { Icon, StatusMark } from '../icons.js'
import { Picture, Empty, PageBar, CompanyLink, useFresh } from './bits.js'

const STATUS_ORDER = ['active', 'dormant', 'acquired', 'ipo', 'shut-down']

export function PortfolioView () {
  const state = useStore((value) => value)
  const { route, tables } = state
  const rows = useMemo(() => {
    const all = records(state, 'companies').map((company) => companyView(state, company))
    return all
      .filter((row) => matches(row, route, state))
      .sort((a, b) => (positionRank(a.company) - positionRank(b.company)) || (STATUS_ORDER.indexOf(a.company.status) - STATUS_ORDER.indexOf(b.company.status)) || a.company.name.localeCompare(b.company.name))
  }, [tables, route])
  const table = route.layout === 'table'
  // A fact the portfolio holds for no company is left off every card, so a
  // fund whose site states no stages shows no rows of dashes; one that any
  // company has shows on all of them, so the cards stay aligned.
  const facts = cardFacts(rows)
  return html`<div class="page is-wide">
    <${PageBar} title="Portfolio" count=${rows.length}>
      <${Filters} />
      <div class="toolbar-end">
        <div class="segmented" role="group" aria-label="Layout">
          <button type="button" aria-pressed=${!table} onClick=${() => store.getState().navigate({ layout: null }, { replace: true })} title="Cards"><${Icon} name="grid" /><span class="visually-hidden">Cards</span></button>
          <button type="button" aria-pressed=${table} onClick=${() => store.getState().navigate({ layout: 'table' }, { replace: true })} title="Table"><${Icon} name="list" /><span class="visually-hidden">Table</span></button>
        </div>
      </div>
    </${PageBar}>
    ${rows.length === 0
      ? html`<${EmptyPortfolio} />`
      : table ? html`<${CompanyTable} rows=${rows} />` : html`<ul class="cards" aria-label="Companies">${rows.map((row) => html`<${CompanyCard} key=${row.company.id} row=${row} facts=${facts} />`)}</ul>`}
  </div>`
}

// Held first, then exited, then unknown: what the fund still owns leads.
const positionRank = (company) => ({ held: 0, exited: 1 }[company.fund_position] ?? 2)

function matches (row, route, state) {
  const { company, lead } = row
  if (route.position && (company.fund_position ?? 'unknown') !== route.position) return false
  if (route.vehicle && !list(company.vehicles).includes(route.vehicle)) return false
  if (route.status && company.status !== route.status) return false
  if (route.sector && !list(company.sectors).includes(route.sector)) return false
  if (route.partner && ![lead, ...(row.board ?? []), ...(row.linked ?? [])].some((member) => member?.id === route.partner)) return false
  if (route.q) {
    const hay = [company.name, company.one_liner, company.hq, company.domain, ...list(company.sectors), lead?.name].filter(Boolean).join(' ').toLowerCase()
    if (!route.q.toLowerCase().split(/\s+/).every((word) => hay.includes(word))) return false
  }
  return true
}

function Filters () {
  const state = useStore((value) => value)
  const { route, tables } = state
  const navigate = (patch) => store.getState().navigate(patch, { replace: true })
  const options = useMemo(() => {
    const companies = records(state, 'companies')
    const statuses = STATUS_ORDER.filter((status) => companies.some((company) => company.status === status))
    const sectors = [...new Set(companies.flatMap((company) => list(company.sectors)))].sort()
    // Everyone the fund's site ties to a company: lead, board seat or related investment.
    const tied = (member) => member.board_positions?.length || member.related_investments?.length || companies.some((company) => keyIn(company.lead_partner, 'team', state.names) === member.id)
    const partners = records(state, 'team').filter((member) => member.status !== 'former' && tied(member)).sort((a, b) => a.name.localeCompare(b.name))
    const positions = ['held', 'exited', 'unknown'].filter((position) => companies.some((company) => (company.fund_position ?? 'unknown') === position))
    // The fund's vehicles, in the order its record lists them, then any
    // other name a company carries.
    const named = list(records(state, 'fund')[0]?.vehicles).map((vehicle) => vehicle.name)
    const used = new Set(companies.flatMap((company) => list(company.vehicles)))
    const vehicles = [...named.filter((name) => used.has(name)), ...[...used].filter((name) => !named.includes(name)).sort()]
    return { statuses, sectors, partners, positions, vehicles }
  }, [tables])
  return html`<div class="filters">
    <label class="filter">
      <span class="visually-hidden">Search companies</span>
      <${Icon} name="search" class="filter-icon" />
      <input type="search" class="filter-input" placeholder="Search" data-search value=${route.q}
        onInput=${(event) => navigate({ q: event.currentTarget.value })} />
      ${!route.q && html`<kbd>/</kbd>`}
    </label>
    ${options.positions.length > 1 && html`<${Select} label="Position" value=${route.position} onChange=${(position) => navigate({ position })} options=${options.positions.map((position) => [position, { held: 'Held', exited: 'Exited', unknown: 'Position unknown' }[position]])} all="Held and exited" />`}
    ${options.vehicles.length > 1 && html`<${Select} label="Vehicle" value=${route.vehicle} onChange=${(vehicle) => navigate({ vehicle })} options=${options.vehicles.map((name) => [name, name])} all="All vehicles" />`}
    <${Select} label="Status" value=${route.status} onChange=${(status) => navigate({ status })} options=${options.statuses.map((status) => [status, status === 'ipo' ? 'IPO' : status.replace('-', ' ')])} all="All statuses" />
    ${options.sectors.length > 0 && html`<${Select} label="Sector" value=${route.sector} onChange=${(sector) => navigate({ sector })} options=${options.sectors.map((sector) => [sector, sector])} all="All sectors" />`}
    ${options.partners.length > 0 && html`<${Select} label="Person" value=${route.partner} onChange=${(partner) => navigate({ partner })} options=${options.partners.map((member) => [member.id, member.name])} all="Anyone at the fund" />`}
  </div>`
}

// The round and year the fund came in, as its own site states them.
export function entryText (company) {
  const parts = [company.entry_round, company.first_invested_year].filter(Boolean)
  return parts.length ? parts.join(', ') : null
}

export function Select ({ label, value, onChange, options, all }) {
  return html`<label class="select-wrap"><span class="visually-hidden">${label}</span>
    <select class="select" value=${value ?? ''} onChange=${(event) => onChange(event.currentTarget.value || null)}>
      <option value="">${all}</option>
      ${options.map(([id, text]) => html`<option value=${id}>${text}</option>`)}
    </select>
  </label>`
}

// The facts that say how a company is doing, shared by card and table.
function Reporting ({ report, company }) {
  if (report.overdue) {
    return html`<span class="flag is-overdue" title=${`Expected ${company.reporting_cadence}`}><${Icon} name="flag" size=${12} />${report.never ? 'No update yet' : `Update overdue · ${ago(report.latest.date)}`}</span>`
  }
  if (report.latest) return html`<span class="muted">Update <time datetime=${report.latest.date} title=${day(report.latest.date)}>${ago(report.latest.date)}</time></span>`
  return null
}

// The company's stage, or the stage its latest round names.
// …or, when neither says, the stage the fund's own site files it under, in its words.
const stageOf = ({ company, rounds = [] }) => stageName(company.stage ?? rounds[rounds.length - 1]?.stage ?? null) ?? company.fund_stage ?? null

function cardFacts (rows) {
  return {
    stage: rows.some((row) => stageOf(row)),
    entry: rows.some(({ company }) => entryText(company)),
    raised: rows.some(({ raised }) => raisedText(raised)),
    board: rows.some(({ board }) => board?.length)
  }
}

function CompanyCard ({ row, facts }) {
  const { company, raised, report, lead, board = [] } = row
  const fresh = useFresh('companies', company.id)
  const raisedLabel = raisedText(raised)
  return html`<li class=${'card' + fresh}>
    <div class="card-top">
      <${Picture} value=${company.logo} name=${company.name} size="l" />
      <span class="card-marks">${company.fund_position === 'exited' && html`<span class="badge is-exited">Exited</span>`}${company.status && html`<${StatusMark} status=${company.status} />`}</span>
    </div>
    <h2 class="card-name"><${CompanyLink} id=${company.id}>${company.name}</${CompanyLink}></h2>
    ${company.one_liner && html`<p class="card-line">${company.one_liner}</p>`}
    ${(facts.stage || facts.entry || facts.raised || facts.board || lead) && html`<dl class="card-facts">
      ${facts.stage && html`<div><dt>Stage</dt><dd>${stageOf(row) ?? html`<span class="muted">—</span>`}</dd></div>`}
      ${facts.entry && html`<div><dt>Entry</dt><dd>${entryText(company) ?? html`<span class="muted">—</span>`}</dd></div>`}
      ${facts.raised && html`<div><dt>Raised</dt><dd title="Sum of rounds with a stated amount. Rounds may be missing, so this is a floor, not the total raised.">${raisedLabel ?? html`<span class="muted">—</span>`}</dd></div>`}
      ${facts.board && html`<div><dt>Board</dt><dd>${board.length ? board.map((member) => member.name).join(', ') : html`<span class="muted">—</span>`}</dd></div>`}
      ${lead && html`<div><dt>Lead</dt><dd>${lead.name}</dd></div>`}
    </dl>`}
    <div class="card-foot"><${Reporting} report=${report} company=${company} />${!report.latest && !report.overdue && html`<span class="muted">No updates yet</span>`}</div>
  </li>`
}

function CompanyTable ({ rows }) {
  return html`<div class="table-wrap">
    <table class="ptable">
      <caption class="visually-hidden">Portfolio companies</caption>
      <thead><tr>
        <th scope="col">Company</th>
        <th scope="col">Status</th>
        <th scope="col">Position</th>
        <th scope="col">Entry</th>
        <th scope="col">Sectors</th>
        <th scope="col" class="is-num" title="Sum of rounds with a stated amount; a floor, not the total raised">Reported raised</th>
        <th scope="col">Board</th>
        <th scope="col">Latest update</th>
      </tr></thead>
      <tbody>
        ${rows.map(({ company, raised, report, lead, board = [] }) => html`<tr key=${company.id}>
          <th scope="row"><span class="cell-company"><${Picture} value=${company.logo} name=${company.name} size="s" /><${CompanyLink} id=${company.id}>${company.name}</${CompanyLink}></span></th>
          <td><${StatusMark} status=${company.status} /></td>
          <td>${company.fund_position ? (company.fund_position === 'held' ? 'Held' : 'Exited') : html`<span class="muted">—</span>`}</td>
          <td>${entryText(company) ?? html`<span class="muted">—</span>`}</td>
          <td>${list(company.sectors).join(', ') || html`<span class="muted">—</span>`}</td>
          <td class="is-num">${raisedText(raised) ?? html`<span class="muted">—</span>`}</td>
          <td>${[lead, ...board.filter((member) => member.id !== lead?.id)].filter(Boolean).map((member) => member.name).join(', ') || html`<span class="muted">—</span>`}</td>
          <td><${Reporting} report=${report} company=${company} /></td>
        </tr>`)}
      </tbody>
    </table>
  </div>`
}

function EmptyPortfolio () {
  const route = useStore((state) => state.route)
  const any = route.q || route.status || route.sector || route.partner || route.position || route.vehicle
  if (any) {
    return html`<${Empty} icon="search" title="No company matches these filters">
      <button type="button" class="button" onClick=${() => store.getState().go('portfolio')}>Clear filters</button>
    </${Empty}>`
  }
  return html`<${Empty} title="No companies yet">Ask your agent to import them from the fund's website: "Set up our portfolio from examplevc.example."</${Empty}>`
}
