import { useEffect, useRef } from 'preact/hooks'
import { html } from '../html.js'
import { store, useStore, VIEWS } from '../store.js'
import { Icon } from '../icons.js'

const KEYS = [
  ['Search or filter this view', ['/']],
  ['Back, or close', ['esc']],
  ...VIEWS.map((view) => [view.label, ['g', view.key]]),
  ['These shortcuts', ['?']]
]

export function Help () {
  const canWrite = useStore((state) => state.canWrite)
  const close = () => store.getState().toggle('help', false)
  const button = useRef(null)
  useEffect(() => {
    const before = document.activeElement
    button.current?.focus()
    return () => before?.focus?.()
  }, [])
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
        ? 'You can add tasks and notes, close tasks, and accept or reject review items here. Everything else changes through your agent or in Known.'
        : 'This site reads the portfolio. Change it through your agent or in Known.'}</p>
    </div>
  </div>`
}
