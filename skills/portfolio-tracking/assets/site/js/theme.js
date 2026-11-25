// The fund's look, from site.json's "theme": its paper, ink and accent
// colours, fonts, corner radius and density, laid over the default tokens in
// style.css. Layout, structure and accessibility stay the site's own: every
// colour pair is checked for contrast here, and a pair that fails falls back
// to the default tokens. Without a theme nothing changes.

// The defaults in style.css, which a failing pair falls back to.
const DEFAULTS = {
  light: { paper: '#FAF8F1', ink: '#2A2A22', accent: '#527D68', accentInk: '#3E6553', hair: '#DCD6C3' },
  dark: { paper: '#1E1E19', ink: '#ECE8DA', accent: '#8DB5A1', accentInk: '#A6CBB8', hair: '#38372D' }
}
const STACKS = {
  sans: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, monospace'
}
const TEXT = 4.5 // WCAG AA for body text
const MARK = 3 // WCAG AA for marks and large text

// ---- colour arithmetic, in sRGB hex so every result can be checked -----------

function parse (hex) {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex ?? '').trim())
  if (!match) return null
  const h = match[1].length === 3 ? match[1].split('').map((c) => c + c).join('') : match[1]
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
}

const hex = (rgb) => '#' + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('').toUpperCase()

// a weighted towards b: weight 1 is a, 0 is b.
export function mix (a, b, weight) {
  const x = parse(a)
  const y = parse(b)
  return hex(x.map((v, i) => v * weight + y[i] * (1 - weight)))
}

function luminance (color) {
  const [r, g, b] = parse(color).map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrast (a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}

// Move `color` towards `toward` until it reads on `paper`, or give up.
function readable (color, paper, toward, ratio) {
  for (let weight = 1; weight >= 0; weight -= 0.05) {
    const candidate = mix(color, toward, weight)
    if (contrast(candidate, paper) >= ratio) return candidate
  }
  return null
}

// ---- one scheme ------------------------------------------------------------------

// The colours a scheme ends up with: the theme's where they pass, the
// defaults where they don't.
function settle (given, defaults, scheme) {
  const pick = (name) => (given?.[name] != null ? (parse(given[name]) ? hex(parse(given[name])) : warn(scheme, `${name} "${given[name]}" is not a hex colour`)) : null)
  let paper = pick('paper') ?? defaults.paper
  let ink = pick('ink') ?? defaults.ink
  if (contrast(ink, paper) < TEXT) {
    warn(scheme, `ink on paper is ${contrast(ink, paper).toFixed(2)}:1, under ${TEXT}:1; keeping the default paper and ink`)
    paper = defaults.paper
    ink = defaults.ink
  }
  const ownAccent = pick('accent')
  let accent = ownAccent ?? defaults.accent
  if (contrast(accent, paper) < MARK) {
    warn(scheme, `accent on paper is ${contrast(accent, paper).toFixed(2)}:1, under ${MARK}:1; keeping the default accent`)
    accent = defaults.accent
  }
  // Without its own accentInk, a kept accent darkens (or lightens) until
  // it reads as text.
  const kept = ownAccent != null && accent === ownAccent
  let accentInk = pick('accentInk') ?? (kept ? readable(accent, paper, ink, TEXT) : null) ?? defaults.accentInk
  if (contrast(accentInk, paper) < TEXT) {
    warn(scheme, `accentInk on paper is ${contrast(accentInk, paper).toFixed(2)}:1, under ${TEXT}:1; keeping the default`)
    accentInk = contrast(defaults.accentInk, paper) >= TEXT ? defaults.accentInk : ink
  }
  const hair = pick('hair') ?? (given?.paper ? mix(ink, paper, 0.16) : defaults.hair)
  // Cards and panels on their own surface, when the fund's site sets them
  // apart from the page (stone cards on a white page).
  let surface = pick('surface')
  if (surface && contrast(ink, surface) < TEXT) {
    warn(scheme, `ink on surface is ${contrast(ink, surface).toFixed(2)}:1, under ${TEXT}:1; cards keep the pane colour`)
    surface = null
  }
  return { paper, ink, accent, accentInk, hair, surface }
}

function warn (scheme, message) {
  console.warn(`[theme] ${scheme}: ${message}`)
  return null
}

// The tokens style.css uses, from a settled scheme. Surfaces step a little
// lighter (pane) and darker (side) than the paper, as the defaults do.
function tokens ({ paper, ink, accent, accentInk, hair, surface }, dark) {
  const white = '#FFFFFF'
  const deep = dark ? '#000000' : ink
  const pane = dark ? mix(paper, white, 0.96) : mix(paper, white, 0.4)
  const side = dark ? mix(paper, deep, 0.85) : mix(paper, deep, 0.95)
  // Secondary text must read on every surface it sits on; the hardest is
  // the sidebar in light mode and the raised pane in dark mode.
  const hardest = surface && !dark && contrast(mix(ink, paper, 0.58), surface) < contrast(mix(ink, paper, 0.58), side) ? surface : (dark ? pane : side)
  const soft = readable(mix(ink, paper, 0.72), hardest, ink, TEXT) ?? ink
  const faint = readable(mix(ink, paper, 0.58), hardest, ink, TEXT) ?? soft
  return {
    '--main': paper,
    '--pane': pane,
    '--side': side,
    '--raised': dark ? mix(paper, white, 0.92) : white,
    '--ink': ink,
    '--ink-soft': soft,
    '--ink-faint': faint,
    '--hair': hair,
    '--hair-soft': mix(hair, paper, 0.55),
    '--field': accent,
    '--field-ink': accentInk,
    '--field-wash': mix(accent, paper, dark ? 0.14 : 0.16),
    '--current': mix(accent, paper, dark ? 0.18 : 0.2),
    '--ring': ink,
    ...(surface ? { '--surface': surface } : {})
  }
}

// ---- fonts -----------------------------------------------------------------------

// A family name as a safe CSS string; anything else is dropped.
function family (name) {
  const clean = String(name ?? '').trim()
  return /^[A-Za-z0-9 _-]{1,60}$/.test(clean) ? `"${clean}"` : null
}

// Font stylesheets only from Google Fonts, over https.
function fontHref (href) {
  if (!href) return null
  try {
    const url = new URL(href)
    if (url.protocol === 'https:' && url.hostname === 'fonts.googleapis.com') return url.href
  } catch { /* not a URL */ }
  console.warn(`[theme] ignored font stylesheet ${href}: only https://fonts.googleapis.com is loaded`)
  return null
}

function loadFont (href) {
  if (!href || document.querySelector(`link[data-theme-font][href="${CSS.escape(href)}"]`)) return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  link.dataset.themeFont = ''
  document.head.append(link)
}

// ---- applying it --------------------------------------------------------------------

const block = (selector, values) => `${selector} {\n${Object.entries(values).map(([name, value]) => `  ${name}: ${value};`).join('\n')}\n}`

export function applyTheme (theme) {
  if (!theme || typeof theme !== 'object') return null
  const rules = []
  const root = {}
  let light = null

  // Colours go in per scheme, so the light colours never reach dark mode.
  if (theme.light && typeof theme.light === 'object') {
    const settled = settle(theme.light, DEFAULTS.light, 'light')
    light = tokens(settled, false)
    setThemeColor('light', settled.paper)
  }
  // Dark: the theme's own dark colours; else the default dark surfaces with
  // the light accent carried over, only when it reads there; else the
  // defaults untouched.
  let dark = null
  if (theme.dark && typeof theme.dark === 'object') {
    dark = tokens(settle(theme.dark, DEFAULTS.dark, 'dark'), true)
  } else if (parse(theme.light?.accent) && contrast(hex(parse(theme.light.accent)), DEFAULTS.dark.paper) >= MARK) {
    dark = tokens(settle({ accent: theme.light.accent }, DEFAULTS.dark, 'dark'), true)
  }

  const fonts = theme.fonts ?? {}
  for (const [role, token] of [['body', '--sans'], ['heading', '--heading'], ['mono', '--mono']]) {
    const font = fonts[role]
    if (!font) continue
    loadFont(fontHref(font.href))
    const name = family(font.family)
    if (name) root[token] = `${name}, ${role === 'mono' ? STACKS.mono : STACKS.sans}`
    else if (font.family) console.warn(`[theme] ignored font family "${font.family}"`)
  }
  if (Number.isFinite(Number(theme.radius)) && theme.radius !== null) root['--r'] = `${Math.max(0, Math.min(16, Number(theme.radius)))}px`
  if (theme.controls === 'pill') root['--r-control'] = '999px'
  if (theme.cardBorder === false) root['--card-line'] = 'transparent'
  // How headings are set: weight, line height and tracking, each bounded.
  const heading = fonts.heading ?? {}
  const bounded = (value, min, max) => (Number.isFinite(Number(value)) && value !== null ? Math.max(min, Math.min(max, Number(value))) : null)
  const headingWeight = bounded(heading.weight, 100, 900)
  if (headingWeight) root['--heading-weight'] = String(Math.round(headingWeight / 100) * 100)
  const leading = bounded(heading.leading, 0.85, 1.6)
  if (leading) root['--heading-leading'] = String(leading)
  const tracking = bounded(heading.tracking, -0.06, 0.12)
  if (tracking !== null) root['--heading-tracking'] = `${tracking}em`
  const bodyWeight = bounded(fonts.body?.weight, 200, 600)
  if (bodyWeight) root['--body-weight'] = String(Math.round(bodyWeight / 100) * 100)
  if (theme.labels === 'uppercase') Object.assign(root, { '--label-transform': 'uppercase', '--label-tracking': '0.06em', '--nav-size': '12px' })
  if (theme.cards === 'logo') document.documentElement.classList.add('has-logo-cards')

  if (Object.keys(root).length) rules.push(block(':root', root))
  if (light) rules.push(`@media not all and (prefers-color-scheme: dark) {\n${block(':root', light)}\n}`)
  if (dark) {
    rules.push(`@media (prefers-color-scheme: dark) {\n${block(':root', dark)}\n}`)
    setThemeColor('dark', dark['--main'])
  }
  if (theme.density === 'compact') document.documentElement.classList.add('is-compact')

  if (rules.length) {
    const style = document.createElement('style')
    style.id = 'site-theme'
    style.textContent = rules.join('\n\n')
    // After style.css, so the theme's tokens win.
    document.head.append(style)
  }
  return { logo: typeof theme.logo === 'string' ? theme.logo : null }
}

function setThemeColor (scheme, color) {
  const meta = document.querySelector(`meta[name="theme-color"][media*="${scheme}"]`)
  if (meta) meta.content = color
}
