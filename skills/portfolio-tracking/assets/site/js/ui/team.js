// The fund's people: a portrait grid in the groups the fund's own site uses,
// and a page for each person with the companies they lead.
import { useMemo } from 'preact/hooks'
import { html } from '../html.js'
import { store, useStore, records, routeHash } from '../store.js'
import { keyIn, list, humanize } from '../data.js'
import { Icon } from '../icons.js'
import { Picture, Empty, PageBar, CompanyLink, KnownLink } from './bits.js'

const ROLES = ['partner', 'venture-partner', 'principal', 'associate', 'operator', 'advisor', 'scout', 'other']
// Seniority within a group: the role, then a few titles the role can't tell
// apart (a managing partner before a partner, a managing director before a
// principal).
const TITLE_RANK = [/managing partner/i, /^partner$/i, /operating partner/i, /managing director/i, /principal/i, /associate/i, /analyst/i]
const titleRank = (member) => { const index = TITLE_RANK.findIndex((pattern) => pattern.test(member.title ?? '')); return index === -1 ? TITLE_RANK.length : index }

function bySeniority (a, b) {
  return (a.status === 'former') - (b.status === 'former') ||
    titleRank(a) - titleRank(b) ||
    ROLES.indexOf(a.role) - ROLES.indexOf(b.role) ||
    a.name.localeCompare(b.name)
}

// Companies by the team member who leads them.
function useLeads () {
  const state = useStore((value) => value)
  return useMemo(() => {
    const by = {}
    for (const company of records(state, 'companies')) {
      const id = keyIn(company.lead_partner, 'team', state.names)
      if (id) (by[id] ??= []).push(company)
    }
    for (const list of Object.values(by)) list.sort((a, b) => a.name.localeCompare(b.name))
    return by
  }, [state.tables])
}

export function TeamView () {
  const state = useStore((value) => value)
  const leads = useLeads()
  // The fund's own groups, in the order its team page uses them; people
  // in no group come last.
  const groups = useMemo(() => {
    const by = new Map()
    for (const member of records(state, 'team')) {
      const names = list(member.groups)
      const key = member.status === 'former' ? 'Former' : (names[0] ?? 'Team')
      if (!by.has(key)) by.set(key, [])
      by.get(key).push(member)
    }
    const order = (name) => (name === 'Former' ? 2 : name === 'Team' ? 1 : 0)
    return [...by.entries()]
      .sort((a, b) => order(a[0]) - order(b[0]) || b[1].length - a[1].length)
      .map(([name, members]) => ({ name, members: members.sort(bySeniority) }))
  }, [state.tables])
  const current = records(state, 'team').filter((member) => member.status === 'current').length
  if (!current) {
    return html`<div class="page"><${PageBar} title="Team" /><${Empty} icon="team" title="No team yet">The import reads the fund's team page.</${Empty}></div>`
  }
  return html`<div class="page is-wide">
    <${PageBar} title="Team" count=${current} />
    ${groups.map((group) => html`<section class="team-group" aria-labelledby=${'group-' + slug(group.name)}>
      <h2 class="section-title" id=${'group-' + slug(group.name)}>${group.name}<span class="view-count">${group.members.length}</span></h2>
      <ul class="portraits">${group.members.map((member) => html`<li key=${member.id}><${Portrait} member=${member} leads=${leads[member.id]} /></li>`)}</ul>
    </section>`)}
  </div>`
}

function Portrait ({ member, leads }) {
  const route = useStore((state) => state.route)
  const href = routeHash({ ...route, view: 'member', id: member.id })
  return html`<a class=${'portrait' + (member.status === 'former' ? ' is-former' : '')} href=${href}
      onClick=${(event) => { if (event.metaKey || event.ctrlKey) return; event.preventDefault(); store.getState().navigate({ view: 'member', id: member.id }) }}>
    <${Picture} value=${member.photo} name=${member.name} kind="portrait" size="portrait" />
    <span class="portrait-name">${member.name}</span>
    <span class="portrait-title">${member.title ?? humanize(member.role)}</span>
    ${leads?.length > 0 && html`<span class="portrait-leads">Leads ${leads.length} ${leads.length === 1 ? 'company' : 'companies'}</span>`}
  </a>`
}

export function MemberView () {
  const state = useStore((value) => value)
  const id = state.route.id
  const member = records(state, 'team').find((item) => item.id === id) ?? null
  const leads = useLeads()[id] ?? []
  if (!member) {
    return html`<div class="page"><${PageBar} crumb=${{ label: 'Team', view: 'team' }} /><${Empty} icon="team" title="Not on the team">No team member has the key ${id}.</${Empty}></div>`
  }
  // The person's page on the fund's own site, when the import kept it.
  const ownPage = list(member.source_paths).find((path) => /^https?:\/\//.test(path) && !/\/team\/?$/.test(path)) ?? null
  return html`<article class="page member-page" aria-labelledby="member-name">
    <${PageBar} crumb=${{ label: 'Team', view: 'team' }}>
      <div class="toolbar-end"><${KnownLink} table="team" recordKey=${member.id} /></div>
    </${PageBar}>
    <header class="member-head">
      <${Picture} value=${member.photo} name=${member.name} kind="portrait" size="portrait-l" />
      <div class="member-id">
        <h1 class="company-name" id="member-name">${member.name}</h1>
        <p class="company-line">${member.title ?? humanize(member.role)}${member.status === 'former' ? ' · former' : ''}</p>
        ${list(member.groups).length > 0 && html`<p class="member-groups">${list(member.groups).map((name) => html`<span class="badge">${name}</span>`)}</p>`}
        ${member.bio && html`<p class="member-bio">${member.bio}</p>`}
        <p class="person-links">
          ${ownPage && html`<a href=${ownPage} target="_blank" rel="noopener noreferrer">On the fund's site<${Icon} name="external" size=${12} /></a>`}
          ${list(member.profiles).map((item) => html`<a href=${item.url} target="_blank" rel="noopener noreferrer">${humanize(item.kind)}<${Icon} name="external" size=${12} /></a>`)}
        </p>
      </div>
    </header>
    <section class="section" aria-labelledby="member-leads">
      <div class="section-head"><h2 class="section-title" id="member-leads">Companies${leads.length ? html`<span class="view-count">${leads.length}</span>` : ''}</h2></div>
      ${leads.length
        ? html`<ul class="lead-list">${leads.map((company) => html`<li><${Picture} value=${company.logo} name=${company.name} size="m" /><${CompanyLink} id=${company.id}>${company.name}</${CompanyLink}><span class="muted">${company.one_liner ?? ''}</span></li>`)}</ul>`
        : html`<p class="muted">No company names ${member.name.split(' ')[0]} as its lead partner yet. The fund's site doesn't say who leads what; set a company's lead partner in Known, or ask an agent to.</p>`}
    </section>
  </article>`
}

const slug = (text) => String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-')
