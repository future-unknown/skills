import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'

const root = path.resolve(import.meta.dirname, '..')
const skillsRoot = path.join(root, 'skills')
const ajv = new Ajv({ allErrors: true, strict: true })
addFormats(ajv)

const errors = []
const schemas = new Map()

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (error) {
    errors.push(`${path.relative(root, file)}: invalid JSON: ${error.message}`)
    return null
  }
}

function frontmatter(file) {
  const text = fs.readFileSync(file, 'utf8')
  const match = text.match(/^---\n([\s\S]*?)\n---\n/)
  if (!match) return null
  const values = {}
  for (const line of match[1].split('\n')) {
    const item = line.match(/^([a-z][a-z0-9-]*):\s*(.*)$/)
    if (item) values[item[1]] = item[2].replace(/^"|"$/g, '')
  }
  return values
}

for (const entry of fs.readdirSync(skillsRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue
  const skillDir = path.join(skillsRoot, entry.name)
  const skillFile = path.join(skillDir, 'SKILL.md')
  if (!fs.existsSync(skillFile)) {
    errors.push(`skills/${entry.name}: missing SKILL.md`)
    continue
  }
  const fm = frontmatter(skillFile)
  if (!fm) {
    errors.push(`skills/${entry.name}/SKILL.md: missing frontmatter`)
  } else {
    if (fm.name !== entry.name) errors.push(`skills/${entry.name}: frontmatter name must match directory`)
    if (!fm.description || fm.description.length > 1024) errors.push(`skills/${entry.name}: description must be 1-1024 characters`)
    if (fm.license !== 'MIT') errors.push(`skills/${entry.name}: license must be MIT`)
  }

  const text = fs.readFileSync(skillFile, 'utf8')
  for (const required of ['../../references/known-cli.md', '../../references/ontology-principles.md', '../../references/composition.md', '../../references/skill-run.md']) {
    if (!text.includes(required)) errors.push(`skills/${entry.name}/SKILL.md: must reference ${required}`)
  }

  const assets = path.join(skillDir, 'assets')
  const examplesFile = path.join(assets, 'examples.json')
  const examples = readJson(examplesFile) ?? {}
  const schemaFiles = fs.readdirSync(assets).filter(name => name.endsWith('.schema.json')).sort()
  if (schemaFiles.length === 0) errors.push(`skills/${entry.name}: no schemas`)

  for (const name of schemaFiles) {
    const file = path.join(assets, name)
    const schema = readJson(file)
    if (!schema) continue
    try {
      const validate = ajv.compile(schema)
      schemas.set(path.relative(root, file), validate)
      if (!Array.isArray(examples[name]) || examples[name].length === 0) {
        errors.push(`skills/${entry.name}/assets/examples.json: missing examples for ${name}`)
        continue
      }
      for (const [index, record] of examples[name].entries()) {
        if (!validate(record)) errors.push(`${path.relative(root, examplesFile)} ${name}[${index}]: ${ajv.errorsText(validate.errors)}`)
      }
    } catch (error) {
      errors.push(`${path.relative(root, file)}: schema does not compile: ${error.message}`)
    }
  }

  for (const name of Object.keys(examples)) {
    if (!schemaFiles.includes(name)) errors.push(`${path.relative(root, examplesFile)}: example references missing schema ${name}`)
  }
}

const invalidCases = readJson(path.join(root, 'tests', 'invalid-examples.json')) ?? []
for (const [index, item] of invalidCases.entries()) {
  let validate = schemas.get(item.schema)
  if (!validate) {
    const schema = readJson(path.join(root, item.schema))
    if (schema) {
      try { validate = ajv.compile(schema) } catch {}
    }
  }
  if (!validate) errors.push(`tests/invalid-examples.json[${index}]: unknown schema ${item.schema}`)
  else if (validate(item.record)) errors.push(`tests/invalid-examples.json[${index}]: invalid fixture unexpectedly passed (${item.reason})`)
}

const trackedTextExtensions = new Set(['.md', '.json', '.yml', '.yaml', '.mjs'])
function scan(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules'].includes(entry.name)) continue
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) scan(file)
    else if (trackedTextExtensions.has(path.extname(entry.name))) {
      const text = fs.readFileSync(file, 'utf8')
      if (/\/Users\//.test(text) || /-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(text) || /gh[pousr]_[A-Za-z0-9_]{20,}/.test(text)) {
        errors.push(`${path.relative(root, file)}: contains a forbidden private-path or credential pattern`)
      }
    }
  }
}
scan(root)

if (errors.length) {
  console.error(`Validation failed with ${errors.length} problem(s):`)
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(`Validated ${schemas.size} schemas across ${fs.readdirSync(skillsRoot).length} skills.`)
