// Open work across the portfolio, by company. Closed tasks stay in the
// table; Known keeps how each got there.
import { useMemo, useState } from 'preact/hooks'
import { html } from '../html.js'
import { store, useStore, records } from '../store.js'
import { keyIn, humanize, personNameOf, daysSince } from '../data.js'
import { day } from '../time.js'
import { Icon } from '../icons.js'
import { Empty, PageBar, CompanyLink, useFresh, useResult } from './bits.js'

const KINDS = ['follow-up', 'intro', 'help-request', 'board-prep', 'reporting', 'other']

export function TasksView () {
  const state = useStore((value) => value)
  const { tables, names, canWrite } = state
  const groups = useMemo(() => {
    const by = new Map()
    for (const task of records(state, 'tasks').filter((item) => item.status === 'open')) {
      const company = keyIn(task.company, 'companies', names) ?? ''
      if (!by.has(company)) by.set(company, [])
      by.get(company).push(task)
    }
    const nameOf = (id) => (id ? tables.companies?.[id]?.name ?? id : 'Across the fund')
    return [...by.entries()]
      .map(([id, tasks]) => ({ id, name: nameOf(id), tasks: tasks.sort(byDue) }))
      .sort((a, b) => (!a.id) - (!b.id) || a.name.localeCompare(b.name))
  }, [tables])
  const count = groups.reduce((sum, group) => sum + group.tasks.length, 0)
  return html`<div class="page">
    <${PageBar} title="Open tasks" count=${count} />
    ${canWrite && html`<${NewTask} />`}
    ${groups.length
      ? groups.map((group) => html`<section class="section" aria-labelledby=${'tasks-' + (group.id || 'fund')}>
          <h2 class="section-title" id=${'tasks-' + (group.id || 'fund')}>${group.id ? html`<${CompanyLink} id=${group.id}>${group.name}</${CompanyLink}>` : group.name}</h2>
          <ul class="tasks">${group.tasks.map((task) => html`<${TaskRow} key=${task.id} task=${task} />`)}</ul>
        </section>`)
      : html`<${Empty} icon="tasks" title="No open tasks">Asks in company updates become tasks when your agent files them.</${Empty}>`}
  </div>`
}

const byDue = (a, b) => String(a.due_on ?? '9999').localeCompare(String(b.due_on ?? '9999')) || a.id.localeCompare(b.id, undefined, { numeric: true })

export function TaskRow ({ task }) {
  const tables = useStore((state) => state.tables)
  const names = useStore((state) => state.names)
  const canWrite = useStore((state) => state.canWrite)
  const fresh = useFresh('tasks', task.id)
  const [error, show] = useResult()
  const [busy, setBusy] = useState(false)
  const late = task.status === 'open' && task.due_on && daysSince(task.due_on) > 0
  const setStatus = async (status) => {
    setBusy(true)
    show(await store.getState().save('tasks', task.id, { status }))
    setBusy(false)
  }
  return html`<li class=${'task is-' + task.status + fresh}>
    ${canWrite
      ? html`<button type="button" class="tick" aria-label=${task.status === 'done' ? `Reopen ${task.title}` : `Mark done: ${task.title}`} aria-pressed=${task.status === 'done'} disabled=${busy}
          onClick=${() => setStatus(task.status === 'done' ? 'open' : 'done')}>${task.status === 'done' && html`<${Icon} name="check" size=${12} />`}</button>`
      : html`<span class=${'tick is-static' + (task.status === 'done' ? ' is-done' : '')} role="img" aria-label=${task.status}></span>`}
    <div class="task-body">
      <p class="task-title"><span class="task-id">${task.id}</span>${task.title}</p>
      <p class="task-meta">
        <span>${humanize(task.kind)}</span>
        ${task.owner && html`<span>${personNameOf(tables, task.owner, names)}</span>`}
        ${task.due_on && html`<span class=${late ? 'is-late' : ''}>Due ${day(task.due_on)}${late ? ' · overdue' : ''}</span>`}
        ${task.status !== 'open' && html`<span>${humanize(task.status)}</span>`}
      </p>
      ${error}
    </div>
    ${canWrite && task.status === 'open' && html`<button type="button" class="button is-small is-quiet" disabled=${busy} onClick=${() => setStatus('cancelled')}>Cancel task</button>`}
  </li>`
}

// A new task: the next free T- number, open, created now.
export function NewTask ({ company = null }) {
  const tables = useStore((state) => state.tables)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, show] = useResult()
  if (!open) return html`<div class="form-open"><button type="button" class="button" onClick=${() => setOpen(true)}><${Icon} name="plus" size=${14} />New task</button></div>`
  const submit = async (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const title = String(form.get('title') ?? '').trim()
    if (!title) return
    setBusy(true)
    const result = await store.getState().addTask({
      title,
      company: company ?? (form.get('company') || null),
      kind: form.get('kind'),
      owner: form.get('owner') || null,
      due: form.get('due') || null
    })
    setBusy(false)
    show(result)
    if (result.ok) setOpen(false)
  }
  const team = Object.values(tables.team ?? {}).filter((member) => member.status === 'current').sort((a, b) => a.name.localeCompare(b.name))
  return html`<form class="form" onSubmit=${submit} aria-label="New task">
    <label class="field is-wide"><span>Task</span><input name="title" required maxlength="200" autofocus /></label>
    ${!company && html`<label class="field"><span>Company</span><select name="company"><option value="">Across the fund</option>
      ${Object.values(tables.companies ?? {}).sort((a, b) => a.name.localeCompare(b.name)).map((item) => html`<option value=${item.id}>${item.name}</option>`)}</select></label>`}
    <label class="field"><span>Kind</span><select name="kind">${KINDS.map((kind) => html`<option value=${kind}>${humanize(kind)}</option>`)}</select></label>
    ${team.length > 0 && html`<label class="field"><span>Owner</span><select name="owner"><option value="">No one yet</option>${team.map((member) => html`<option value=${member.id}>${member.name}</option>`)}</select></label>`}
    <label class="field"><span>Due</span><input name="due" type="date" /></label>
    <div class="form-actions">
      <button type="submit" class="button is-primary" disabled=${busy}>${busy ? 'Saving…' : 'Add task'}</button>
      <button type="button" class="button" onClick=${() => setOpen(false)}>Cancel</button>
    </div>
    ${error}
  </form>`
}
