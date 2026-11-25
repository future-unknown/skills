// The frame: the top bar with the views, and the current view below it.
import { useEffect } from 'preact/hooks'
import { html } from '../html.js'
import { store, useStore, VIEWS } from '../store.js'
import { TopBar } from './topbar.js'
import { PortfolioView } from './portfolio.js'
import { CompanyView } from './company.js'
import { UpdatesView } from './updates.js'
import { TasksView } from './tasks.js'
import { ReviewView } from './review.js'
import { TeamView, MemberView } from './team.js'
import { FundView } from './fund.js'
import { Help } from './help.js'
import { AskPanel } from './ask.js'

const PAGES = {
  portfolio: PortfolioView,
  company: CompanyView,
  updates: UpdatesView,
  tasks: TasksView,
  review: ReviewView,
  team: TeamView,
  member: MemberView,
  fund: FundView
}

export function Shell () {
  const route = useStore((state) => state.route)
  const help = useStore((state) => state.help)
  const asking = useStore((state) => state.chat.open)
  useKeys()
  // A new page starts at the top. Filters typed into the address keep the
  // scroll where it is.
  useEffect(() => {
    document.getElementById('main')?.scrollTo?.({ top: 0 })
  }, [route.view, route.id])
  const Page = PAGES[route.view] ?? PortfolioView
  return html`<div class=${'frame' + (asking ? ' has-ask' : '')}>
    <a class="skip" href="#main" onClick=${skipToMain}>Skip to content</a>
    <${TopBar} />
    <main class="main" id="main" tabindex="-1">
      <${Page} key=${route.view + '/' + (route.id ?? '')} />
    </main>
    <${AskPanel} />
    ${help && html`<${Help} />`}
  </div>`
}

// The address holds the route, so the skip link moves focus instead of
// following its fragment.
function skipToMain (event) {
  event.preventDefault()
  document.getElementById('main')?.focus()
}

// Keyboard: / searches, g then a letter switches view, ? lists the keys,
// Esc closes what is open.
function useKeys () {
  useEffect(() => {
    let g = false
    let timer = null
    const handler = (event) => {
      const state = store.getState()
      const target = event.target
      const typing = target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
      if (event.key === 'Escape') {
        if (state.help) { state.toggle('help', false); return }
        if (state.chat.open && !typing) { state.toggleChat(false); return }
        if (typing) { target.blur(); return }
        if (state.route.view === 'company' || state.route.view === 'member') { history.length > 1 ? history.back() : state.go('portfolio') }
        return
      }
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return
      if (g) {
        g = false
        clearTimeout(timer)
        const view = VIEWS.find((item) => item.key === event.key)
        if (view) { event.preventDefault(); state.go(view.id) }
        return
      }
      if (event.key === '/') {
        const search = document.querySelector('.main [data-search]')
        if (search) { event.preventDefault(); search.focus() }
      } else if (event.key === 'a') {
        event.preventDefault()
        state.toggleChat(true)
      } else if (event.key === '?') {
        state.toggle('help')
      } else if (event.key === 'g') {
        g = true
        timer = setTimeout(() => { g = false }, 900)
      }
    }
    addEventListener('keydown', handler)
    return () => removeEventListener('keydown', handler)
  }, [])
}
