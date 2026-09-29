/**
 * Simulate the DSH client plugin runtime contract for dsh-conversation-language v3.1.0
 * against the @deepseek-ai/* 0.2.0-rc.1 surface of the web profile.
 *
 * Loads the CJS client bundle through a sandboxed module system, invokes apply(ctx)
 * with a mock cordis Context providing the four injected services (slots, locale,
 * configForms, connection) with 0.2.0-rc.1 semantics, and verifies:
 *   - settings row registration into settings.general.item
 *   - detail-page guarded registration (whileServed): hidden until served,
 *     registers plugins.bundle.config + plugins.row.config after
 *   - locale dictionary registration
 *   - setConversationLanguage writes through the config form
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'

const PROFILE_NPM = 'C:/Users/braindge/.dsh/profiles/web/node_modules'
const clientPath = path.join(PROFILE_NPM, 'dsh-conversation-language', 'lib', 'client.js')
const realClient = readFileSync(clientPath, 'utf8')

let failures = 0
function check(name, fn) {
  try { fn(); console.log('PASS:', name) } catch (e) { failures++; console.error('FAIL:', name, '--', e.message) }
}
function assert(cond, msg) { if (!cond) throw new Error(msg) }

// ---- React stub (platform external provided by the DSH client host) -----------
function h(type, props, ...kids) {
  return { $$typeof: 'react.element', type, props: { ...props, children: kids.length ? kids : undefined } }
}
const reactStub = {
  useState(init) {
    let v = typeof init === 'function' ? init() : init
    return [v, (n) => { v = typeof n === 'function' ? n(v) : n }]
  },
}
const jsxRuntimeStub = { jsx: h, jsxs: h, jsxDEV: h, Fragment: 'fragment' }

// ---- mock cordis Context ------------------------------------------------------
class Observable {
  constructor(initial) { this._v = initial; this._subs = new Set() }
  getSnapshot() { return this._v }
  subscribe(fn) { this._subs.add(fn); return () => this._subs.delete(fn) }
  set(v) { this._v = v; this._subs.forEach((f) => f()) }
}

function makeCtx() {
  const ctx = {
    effects: [],
    _services: {},
    get(name) { return this._services[name] },
    effect(fn, label) {
      const handle = { label, disposed: false }
      ctx.effects.push(handle)
      try { fn() } catch { /* service may not be ready yet */ }
      return handle
    },
    on() { return () => {} },
  }
  return ctx
}

// ---- 0.2.0-rc.1 configForms mock ---------------------------------------------
// The real ConfigForm exposes:
//   getSnapshot() -> { status, value, base, user, writable, revision }
//   subscribe(fn) -> unsub
//   mutate(ops, expectedRevision)
// Our controller adapts it to the SettingsFormScope shape via asFormScope.
function makeConfigForms(initialValue) {
  const forms = new Map()
  const served = new Observable(false)
  function makeForm(ns, value) {
    let rev = 0
    const subs = new Set()
    return {
      getSnapshot() {
        return { status: 'live', value, base: undefined, user: value, writable: true, revision: rev }
      },
      subscribe(fn) { subs.add(fn); return () => subs.delete(fn) },
      mutate(ops, _expected) {
        for (const op of ops) {
          if (op.op === 'set') value[op.path[0]] = op.value
          else if (op.op === 'unset') delete value[op.path[0]]
        }
        rev++
        subs.forEach((f) => f())
      },
    }
  }
  return {
    get(ns) {
      if (!forms.has(ns)) forms.set(ns, makeForm(ns, initialValue ? { ...initialValue } : {}))
      return forms.get(ns)
    },
    whileServed(_nss, fn) {
      const run = () => fn()
      if (served.getSnapshot()) run()
      return served.subscribe(() => { if (served.getSnapshot()) run() })
    },
    _serve() { served.set(true) },
    _setValued(ns, value) {
      const f = forms.get(ns)
      if (f) f.getSnapshot().value = value
    },
  }
}

// ---- 0.2.0-rc.1 slots mock ----------------------------------------------------
// The host's `slots.register(opts, component)` bakes the declared `store`
// into BoundActions and passes them to `opts.inject`. We mirror that: when a
// registrant declares a store, its actions become the `inject` argument.
function makeSlots() {
  const registered = []
  const factories = new Map()
  return {
    registered,
    inject(name, factory) {
      if (!factories.has(name)) factories.set(name, [])
      const list = factories.get(name)
      list.push(factory)
      for (const f of list) f() // host invokes factories lazily; simulate now
      return () => {}
    },
    register(opts, component) {
      const entry = { ...opts, component }
      registered.push(entry)
      if (opts.inject) {
        // The host bakes `opts.store` into BoundActions and hands them to
        // `inject`. Our defineStore mock returns { ...actions } as the
        // handle's actions — pass that so `bound?.sync(...)` resolves.
        const bound = opts.store ? opts.store.actions : entry
        opts.inject(bound) // simulate component mount with bound actions
      }
      return entry
    },
  }
}

function makeLocale() {
  const dicts = {}
  return { register(ns, dict) { dicts[ns] = dict }, _dicts: dicts }
}

// ---- load the bundle in a sandbox -------------------------------------------
function loadBundle() {
  // The bundle is a CJS body wrapped in:
  //   window.__ModuleLoader__.load({ id: "...", factory: (require) => { ... return module.exports; } });
  // The host's __ModuleLoader__.load() invokes `factory(require)` and collects
  // the returned module.exports. We reconstruct that call by locating the
  // `factory: (require) => {` marker, taking everything from its body-start up
  // to the arrow function's closing `}`, and evaluating it as a function body.
  const marker = 'factory: (require) => {'
  const start = realClient.indexOf(marker)
  if (start < 0) throw new Error('factory marker not found')
  const bodyStart = start + marker.length
  // The arrow function's body is everything up to (and including) its closing
  // `}`. That closing brace is the `\t}` on its own line immediately before the
  // final `});` that closes the outer `load({ ... });` call.
  const tail = '\n\t}\n});'
  const end = realClient.lastIndexOf(tail)
  if (end < 0) throw new Error('arrow-body closing brace not found')
  const body = realClient.slice(bodyStart, end + 2) // include the "}"
  const factory = new Function('require', body)

  function mockRequire(id) {
    if (id === 'react') return reactStub
    if (id === 'react/jsx-runtime') return jsxRuntimeStub
    if (id.startsWith('@deepseek-ai/')) {
      if (id === '@deepseek-ai/dsh-client-ui-primitives') {
        class SettingsFormModel {
          constructor(scope, fields) {
            this.scope = scope
            this.fields = fields
            this._drafts = new Map()
            this._subscribers = new Set()
            this._snapshot = this._project()
            this._scopeSub = scope.subscribe(() => { this._snapshot = this._project(); this._subscribers.forEach((f) => f()) })
            for (const f of fields) this._drafts.set(f.field, { text: '' })
          }
          _project() {
            const s = this.scope.getSnapshot()
            const state = {
              status: s.status,
              value: s.value ?? {},
              writable: s.writable !== false,
              revision: s.revision ?? 0,
            }
            for (const f of this.fields) {
              const raw = state.value?.[f.field]
              const draft = this._drafts.get(f.field)
              state[f.field] = {
                text: draft && draft.text !== '' ? draft.text : f.format(raw),
                overridden: draft ? draft.text !== '' : raw !== undefined && raw !== null,
              }
            }
            return state
          }
          getSnapshot() { return this._snapshot }
          subscribe(fn) { this._subscribers.add(fn); return () => this._subscribers.delete(fn) }
          edit(name, text) { this._drafts.set(name, { text }); this._snapshot = this._project(); this._subscribers.forEach((f) => f()) }
          clear(name) { this._drafts.set(name, { text: '' }); this._snapshot = this._project(); this._subscribers.forEach((f) => f()) }
          shell() { return { status: this._snapshot.status, writable: this._snapshot.writable, revision: this._snapshot.revision } }
          field(name) { return this._snapshot[name] }
          actions() {
            return {
              edit: (name, text) => this.edit(name, text),
              clear: (name) => this.clear(name),
              save: () => this.save(),
              discard: () => this.discard(),
            }
          }
          bind(projector) {
            return {
              getSnapshot: () => projector(),
              subscribe: (fn) => this.subscribe(fn),
            }
          }
          save() {
            const ops = []
            for (const f of this.fields) {
              const d = this._drafts.get(f.field)
              if (!d || d.text === '') continue
              const parsed = f.parse(d.text)
              if (parsed?.kind === 'set') ops.push({ op: 'set', path: [f.field], value: parsed.value })
              else if (parsed?.kind === 'clear') ops.push({ op: 'unset', path: [f.field] })
            }
            if (this.scope.mutate) this.scope.mutate(ops, this.scope.getSnapshot().revision)
            for (const k of this._drafts.keys()) this._drafts.set(k, { text: '' })
            this._snapshot = this._project()
            this._subscribers.forEach((f) => f())
          }
          discard() {
            for (const k of this._drafts.keys()) this._drafts.set(k, { text: '' })
            this._snapshot = this._project()
            this._subscribers.forEach((f) => f())
          }
          dispose() {
            if (this._scopeSub) this._scopeSub()
            this._subscribers.clear()
          }
        }
        return {
          Menu: (p) => h('Menu', p),
          IconChevronDownOutlineMedium: (p) => h('icon', p),
          SegmentedControl: (p) => h('seg', p),
          SettingsForm: (p) => h('form', p),
          SettingsFormModel,
        }
      }
      if (id === '@deepseek-ai/dsh-client-store') {
        return {
          defineStore(decl) {
            const state = decl.init()
            const actions = {}
            for (const [k, fn] of Object.entries(decl.actions)) actions[k] = (...a) => fn(state, ...a)
            const instance = { getSnapshot: () => state, subscribe: () => () => {}, actions, create: () => instance }
            return instance
          },
        }
      }
      return new Proxy(function () {}, { get: () => () => {} })
    }
    throw new Error('unexpected require: ' + id)
  }

  // The arrow body declares `var module = { exports: {} }` and `var exports = module.exports`
  // internally, then returns `module.exports`. We call it and get back the exports object.
  const exportsObj = factory(mockRequire)
  return exportsObj
}

// ---- run ----------------------------------------------------------------------
const bundle = loadBundle()
check('bundle exports apply + inject', () => {
  assert(typeof bundle.apply === 'function', 'apply missing')
  assert(Array.isArray(bundle.inject), 'inject missing')
  assert(bundle.inject.includes('slots') && bundle.inject.includes('locale'), 'inject list mismatch: ' + JSON.stringify(bundle.inject))
})

const ctx = makeCtx()
ctx._services.slots = makeSlots()
ctx._services.locale = makeLocale()
ctx._services.connection = new Proxy({}, { get: () => () => {} })
const configForms = makeConfigForms()
ctx._services.configForms = configForms

bundle.apply(ctx)

const slots = ctx._services.slots
check('settings row registered into settings.general.item', () => {
  const row = slots.registered.find((e) => e.name === 'settings.general.item')
  assert(row, 'row entry not registered')
  assert(row.id === 'conversation-language', 'row id mismatch: ' + row.id)
  assert(row.locale === 'settings.conversation-language', 'row locale mismatch: ' + row.locale)
  assert(typeof row.component === 'function', 'row component missing')
})

check('locale dictionaries registered (zh + en)', () => {
  const dict = ctx._services.locale._dicts['settings.conversation-language']
  assert(dict && dict.zh && dict.en, 'dictionary missing')
  assert(dict.zh['conversation-language.title'] === '对话内容语言', 'zh title mismatch')
  assert(dict.en['form.save'] === 'Save', 'en save mismatch')
})

check('detail pages stay hidden while namespace unserved', () => {
  const detail = slots.registered.filter((e) => e.name === 'plugins.bundle.config' || e.name === 'plugins.row.config')
  assert(detail.length === 0, 'detail pages should be hidden, got ' + detail.length)
})

configForms._serve()
check('detail pages register after whileServed fires', () => {
  const bundleCfg = slots.registered.filter((e) => e.name === 'plugins.bundle.config')
  const rowCfg = slots.registered.filter((e) => e.name === 'plugins.row.config')
  assert(bundleCfg.length === 1, 'plugins.bundle.config missing')
  assert(rowCfg.length === 1, 'plugins.row.config missing')
  assert(bundleCfg[0].key === 'dsh-conversation-language', 'bundle key mismatch: ' + bundleCfg[0].key)
  assert(rowCfg[0].key === 'dsh-conversation-language#tool-conversation-language', 'row key mismatch: ' + rowCfg[0].key)
})

check('row setConversationLanguage writes through the config form', () => {
  const form = configForms.get('tool-conversation-language')
  // ConfigForm.mutate is the write path; settingsTextField parse returns
  // { kind: 'set', value: 'en' } for a valid language token.
  form.mutate([{ op: 'set', path: ['conversationLanguage'], value: 'en' }], form.getSnapshot().revision)
  const snap = form.getSnapshot()
  assert(snap.value.conversationLanguage === 'en', 'form value not updated, got ' + JSON.stringify(snap.value))
})

console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURES`)
process.exit(failures === 0 ? 0 : 1)
