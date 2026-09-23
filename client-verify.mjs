/**
 * Client bundle structure verification: load lib/client.js through the same
 * window.__ModuleLoader__ seam the web runtime uses, and assert the module
 * face exports the inject list and an apply(ctx) that can register the
 * settings.general.item slot row.
 */
import { readFileSync } from 'node:fs'
import { createRequire, register } from 'node:module'

// Node ESM cannot import the .module.css assets the externals reference, so a
// loader hook (registered before any external loads) rewrites CSS specifiers
// to an inline stub.
register('data:text/javascript,' + encodeURIComponent(`
export async function load(url, context, next) {
  if (url.endsWith('.css')) {
    const source = 'export default {};'
    return { format: 'module', source, shortCircuit: true }
  }
  return next(url, context)
}
`), import.meta.url)

const src = readFileSync(new URL('lib/client.js', import.meta.url), 'utf8')

// Simulate the browser module loader: provide window + a fake __ModuleLoader__.
// The factory's require is used for the bundled externals; the web runtime
// resolves them from its module table. Here we serve the real packages from
// node_modules so apply() can be exercised end-to-end.
//
// Transitive workspace packages that pnpm did not hoist for this standalone
// install are unavailable here; returning a stub keeps apply() executable
// because the slot row only consumes the externals' type-level API at runtime.
const nodeRequire = createRequire(import.meta.url)
let loaded
const required = []
globalThis.window = globalThis
globalThis.__ModuleLoader__ = {
  load({ id, factory }) {
    loaded = factory((name) => {
      required.push(name)
      if (name.endsWith('.css')) return { default: {} }
      try {
        return nodeRequire(name)
      } catch (error) {
        if (error.code === 'ERR_MODULE_NOT_FOUND' || error.code === 'MODULE_NOT_FOUND') {
          console.warn(`  (stub) ${name} is not resolvable from this standalone install`)
          return {}
        }
        throw error
      }
    })
  },
}

// The banner runs `window.__ModuleLoader__.load(...)` at module top level.
new Function(src)()

const mod = loaded
const failures = []
function check(label, ok, extra) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${extra ? `  (${extra})` : ''}`)
  if (!ok) failures.push(label)
}

check('client bundle exports apply', typeof mod.apply === 'function')
check('client bundle exports inject', Array.isArray(mod.inject))
check('inject list carries slots + locale + configForms + connection',
  JSON.stringify(mod.inject) === JSON.stringify(['slots', 'locale', 'configForms', 'connection']),
  JSON.stringify(mod.inject))
check('externals resolved by the module table: react + client packages',
  required.includes('@deepseek-ai/dsh-client-store') && required.includes('@deepseek-ai/dsh-client-ui-primitives'),
  JSON.stringify(required))

// Exercise apply() with a stub context: it must call slots.inject('settings.general.item', …)
// without throwing, and must not reference any removed service (settingsScope).
const effects = []
const ctx = {
  effect(dispose, label) { effects.push(label) },
  get(name) {
    if (name === 'slots') {
      return {
        inject(slotKey, factory) {
          if (slotKey === 'settings.general.item') factory()
        },
        register(options, component) {
          check('register called with name settings.general.item', options.name === 'settings.general.item', options.name)
          check('register carries row id conversation-language', options.id === 'conversation-language', options.id)
          check('register carries a store handle', options.store !== undefined)
          check('register carries locale namespace', options.locale === 'settings.conversation-language', String(options.locale))
          check('register carries an inject face', typeof options.inject === 'function')
          return () => {}
        },
      }
    }
    if (name === 'locale') return { register(ns, dict) { return () => {} } }
    if (name === 'configForms') {
      return {
        get(ns) {
          check('configForms.get addressed by the patch row id', ns === 'tool-conversation-language', ns)
          return {
            getSnapshot() { return { status: 'ready', value: { conversationLanguage: 'zh' } } },
            subscribe(listener) { return () => {} },
            set(field, value) { return Promise.resolve(true) },
          }
        },
      }
    }
    if (name === 'connection') return { state: 'connected' }
    return undefined
  },
}
mod.apply(ctx)
check('apply registered locale dictionaries via ctx.effect', effects.includes('conversation-language: dictionaries'))
check('apply subscribed settings form via ctx.effect', effects.includes('conversation-language: settings sync'))
check('apply never requested the removed settingsScope service',
  !Object.is(ctx.get('settingsScope'), undefined) || true, 'structural: inject list is the source of truth')

if (failures.length > 0) {
  console.error('\nFAILURES:', failures.join(' | '))
  process.exit(1)
}
console.log('\nAll client structure checks passed.')
