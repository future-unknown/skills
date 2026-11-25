// Ask: Known's assistant beside the portfolio. It answers from the same
// wiki the site shows, as the signed-in person, and says what it is doing
// while it reads. Every record it wrote is listed under its answer.
import { useEffect, useRef, useState } from 'preact/hooks'
import { html } from '../html.js'
import { store, useStore } from '../store.js'
import { Icon } from '../icons.js'
import { useMarkdown } from './bits.js'

// Questions that work on a fresh import, before anyone has added rounds.
const STARTERS = [
  'Which companies have we exited since 2023, and to whom?',
  'Which fintech companies do we still hold?',
  'What did we invest in at seed in 2025 and 2026?',
  'Which companies are in Germany, and what do they do?'
]

export function AskPanel () {
  const chat = useStore((state) => state.chat)
  const assistant = useStore((state) => state.assistant)
  const title = useStore((state) => state.title)
  const [draft, setDraft] = useState('')
  const input = useRef(null)
  const log = useRef(null)
  useEffect(() => { if (chat.open) input.current?.focus() }, [chat.open])
  // Keep the newest words in view while an answer streams in.
  useEffect(() => { log.current?.scrollTo?.({ top: log.current.scrollHeight }) }, [chat.turns])
  if (!chat.open) return null
  const send = (text) => {
    const question = (text ?? draft).trim()
    if (!question || chat.asking) return
    setDraft('')
    store.getState().ask(question)
  }
  return html`<aside class="ask" aria-label="Ask Known" role="complementary">
    <header class="ask-head">
      <h2 class="ask-title">Ask</h2>
      <span class="ask-sub">Answers from ${title}, with your access</span>
      <span class="ask-tools">
        ${chat.turns.length > 0 && html`<button type="button" class="icon-button" aria-label="New conversation" title="New conversation" onClick=${() => store.getState().clearChat()} disabled=${chat.asking}><${Icon} name="plus" /></button>`}
        <button type="button" class="icon-button" aria-label="Close (Esc)" title="Close (Esc)" onClick=${() => store.getState().toggleChat(false)}><${Icon} name="close" /></button>
      </span>
    </header>
    <div class="ask-log" ref=${log} aria-live="polite" aria-busy=${chat.asking}>
      ${chat.turns.length === 0
        ? html`<div class="ask-empty">
            <p>Ask about any company, round, person or update in the portfolio. The assistant reads the same records you see here, and nothing you can't.</p>
            ${!assistant && html`<p class="ask-note">Asking needs Known's assistant, which comes with the Advanced plan.</p>`}
            <ul class="ask-starters">${STARTERS.map((text) => html`<li><button type="button" class="ask-starter" onClick=${() => send(text)} disabled=${!assistant}>${text}</button></li>`)}</ul>
          </div>`
        : chat.turns.map((turn, index) => html`<${Turn} key=${index} turn=${turn} />`)}
    </div>
    <form class="ask-form" onSubmit=${(event) => { event.preventDefault(); send() }}>
      <label class="visually-hidden" for="ask-input">Question</label>
      <textarea id="ask-input" ref=${input} rows="1" placeholder="Ask about the portfolio…" value=${draft} disabled=${!assistant}
        onInput=${(event) => { setDraft(event.currentTarget.value); grow(event.currentTarget) }}
        onKeyDown=${(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send() } if (event.key === 'Escape') { event.stopPropagation(); store.getState().toggleChat(false) } }}></textarea>
      <button type="submit" class="ask-send" aria-label="Ask" disabled=${!assistant || chat.asking || !draft.trim()}><${Icon} name="arrow" size=${16} /></button>
    </form>
  </aside>`
}

function Turn ({ turn }) {
  const body = useMarkdown(turn.role === 'assistant' ? turn.text : '', [turn.text])
  if (turn.role === 'user') return html`<div class="turn is-user"><p>${turn.text}</p></div>`
  return html`<div class="turn is-assistant">
    ${turn.doing && html`<p class="turn-doing"><span class="loader is-small" aria-hidden="true"></span>${turn.doing}…</p>`}
    ${body && html`<div class="prose" dangerouslySetInnerHTML=${{ __html: body }}></div>`}
    ${turn.error && html`<p class="turn-error">${turn.error}</p>`}
    ${turn.writes?.length > 0 && html`<p class="turn-writes"><${Icon} name="note" size=${12} />Changed ${turn.writes.length === 1 ? '1 record' : `${turn.writes.length} records`}: ${turn.writes.map((write) => write.path ?? write.key ?? '').filter(Boolean).join(', ')}</p>`}
  </div>`
}

function grow (area) {
  area.style.height = 'auto'
  area.style.height = Math.min(area.scrollHeight, 160) + 'px'
}

// The button in the top bar that opens it; `a` does the same.
export function AskButton () {
  const open = useStore((state) => state.chat.open)
  return html`<button type="button" class=${'ask-open' + (open ? ' is-open' : '')} aria-expanded=${open} onClick=${() => store.getState().toggleChat()} title="Ask (a)">
    <${Icon} name="agent" size=${14} />Ask
  </button>`
}
