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
  const title = useStore((state) => state.title)
  return html`<div class="splash" aria-busy="true" aria-live="polite">
    <div class="splash-inner splash-loading">
      <p class="splash-title is-small">${title}</p>
      <span class="loader" aria-hidden="true"></span>
      <p class="splash-note">${phase === 'loading' ? 'Reading the portfolio…' : 'Connecting to Known…'}</p>
    </div>
  </div>`
}

function SignedOut () {
  const title = useStore((state) => state.title)
  return html`<main class="splash">
    <div class="splash-inner">
      <h1 class="splash-title">${title}</h1>
      <p class="splash-text">Your portfolio companies, their rounds, people and updates, kept in Known by your team and your agents.</p>
      <button type="button" class="button is-primary is-large" onClick=${() => store.getState().signIn()}>Sign in with Known</button>
      <p class="splash-foot">You sign in on Known. This site only reads the wikis your organization attached to it, with your own access.</p>
    </div>
  </main>`
}

function Failure () {
  const error = useStore((state) => state.error)
  return html`<main class="splash">
    <div class="splash-inner">
      <span class="splash-icon"><${Icon} name="review" size=${20} /></span>
      <h1 class="splash-title is-small">${error?.title ?? 'Something went wrong'}</h1>
      <p class="splash-text">${renderCode(error?.detail ?? '')}</p>
      <button type="button" class="button" onClick=${() => location.reload()}>Try again</button>
    </div>
  </main>`
}

function renderCode (text) {
  return String(text).split('`').map((part, index) => (index % 2 ? html`<code>${part}</code>` : part))
}
