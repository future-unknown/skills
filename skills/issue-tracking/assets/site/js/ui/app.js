import { useEffect } from 'preact/hooks'
import { html } from '../html.js'
import { store, useStore } from '../store.js'
import { Shell } from './shell.js'
import { Icon } from '../icons.js'

export function App () {
  const phase = useStore((state) => state.phase)
  useEffect(() => { store.getState().boot() }, [])
  if (phase === 'ready') return html`<${Shell} />`
  if (phase === 'signed-out') return html`<${SignedOut} />`
  if (phase === 'error') return html`<${Failure} />`
  return html`<${Loading} phase=${phase} />`
}

function Loading ({ phase }) {
  return html`<div class="splash" aria-busy="true" aria-live="polite">
    <div class="splash-inner">
      <span class="boot-mark"></span>
      <p class="splash-note">${phase === 'loading' ? 'Reading the issues…' : 'Connecting to Known…'}</p>
    </div>
  </div>`
}

function SignedOut () {
  const title = useStore((state) => state.title)
  return html`<main class="splash">
    <div class="splash-inner">
      <h1 class="splash-title">${title}</h1>
      <p class="splash-text">Every issue your team and your agents keep in Known, as a board and a list you can work through.</p>
      <button type="button" class="button is-primary is-large" onClick=${() => store.getState().signIn()}>Sign in with Known</button>
      <p class="splash-foot">You sign in on Known. This site only reads the wikis your organization attached to it.</p>
    </div>
  </main>`
}

function Failure () {
  const error = useStore((state) => state.error)
  return html`<main class="splash">
    <div class="splash-inner">
      <span class="splash-icon"><${Icon} name="blocked" size=${20} /></span>
      <h1 class="splash-title is-small">${error?.title ?? 'Something went wrong'}</h1>
      <p class="splash-text">${renderCode(error?.detail ?? '')}</p>
      <button type="button" class="button" onClick=${() => location.reload()}>Try again</button>
    </div>
  </main>`
}

function renderCode (text) {
  return String(text).split('`').map((part, index) => (index % 2 ? html`<code>${part}</code>` : part))
}
