// Record content as Markdown, made safe, with [[wiki links]] turned into
// links: an issue in this table opens here, anything else opens in Known.
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { parseLink } from './model.js'

marked.setOptions({ gfm: true, breaks: false })

export function renderMarkdown (text, { issueHref, knownHref }) {
  const withLinks = String(text ?? '').replace(/\[\[[^\]\n]+\]\]/g, (raw) => {
    const link = parseLink(raw)
    if (!link) return raw
    const label = link.label ?? link.key ?? link.target
    const issue = issueHref(raw)
    const href = issue ?? knownHref(link)
    return `[${label.replace(/[[\]]/g, '')}](${href}${issue ? '' : ' "Opens in Known"'})`
  })
  const html = marked.parse(withLinks)
  const clean = DOMPurify.sanitize(html, { ADD_ATTR: ['target'] })
  // Task lists read as checklists, not as controls that do nothing.
  return clean.replace(/<input\b[^>]*type="checkbox"[^>]*>/g, (tag) => {
    const checked = /\bchecked\b/.test(tag)
    return `<span class="check${checked ? ' is-done' : ''}" role="img" aria-label="${checked ? 'done' : 'not done'}"></span>`
  })
}
