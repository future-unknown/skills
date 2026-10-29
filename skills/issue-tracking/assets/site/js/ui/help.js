import { useEffect, useRef } from 'preact/hooks'
import { html } from '../html.js'
import { store, useStore } from '../store.js'
import { Icon } from '../icons.js'

const KEYS = [
  ['Move through issues', ['j', 'k']],
  ['Close the issue', ['esc']],
  ['Filter', ['/']],
  ['Commands and search', ['⌘', 'K']],
  ['List or board', ['v']],
  ['Open in Known', ['o']],
  ['Copy a reference for an agent', ['c']],
  ['Copy link', ['y']],
  ['Assigned to me', ['g', 'm']],
  ['Open', ['g', 'o']],
  ['In progress', ['g', 'a']],
  ['Blocked', ['g', 'b']],
  ['Changed this week', ['g', 'r']],
  ['Closed', ['g', 'c']],
  ['All issues', ['g', 'e']]
]

export function Help () {
  const canWrite = useStore((state) => state.canWrite)
  const close = () => store.getState().toggle('help', false)
  const button = useRef(null)
  useEffect(() => { button.current?.focus() }, [])
  return html`<div class="overlay" onMouseDown=${(event) => { if (event.target === event.currentTarget) close() }}>
    <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="help-title">
      <header class="sheet-head">
        <h2 id="help-title">Keyboard shortcuts</h2>
        <button type="button" class="icon-button" aria-label="Close" ref=${button} onClick=${close}><${Icon} name="close" /></button>
      </header>
      <dl class="keys">
        ${KEYS.map(([what, keys]) => html`<div class="key-row"><dt>${what}</dt><dd>${keys.map((key) => html`<kbd>${key}</kbd>`)}</dd></div>`)}
      </dl>
      <p class="sheet-note">${canWrite
        ? 'You can change status and priority here, and drag cards between columns.'
        : 'This site reads issues. Change them through your agent or in Known: c copies a reference your agent understands.'}</p>
    </div>
  </div>`
}
