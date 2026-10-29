import { render } from 'preact'
import { html } from './js/html.js'
import { App } from './js/ui/app.js'

render(html`<${App} />`, document.getElementById('app'))
