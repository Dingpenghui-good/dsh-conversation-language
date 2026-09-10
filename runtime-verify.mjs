/**
 * Runtime verification: mount the built host bundle (lib/index.js) against
 * the REAL @deepseek-ai/* 0.1.5-rc.1 services from this plugin's node_modules,
 * then exercise settings registration + system-prompt/assemble interception.
 */
import { Context } from '@deepseek-ai/cordis'
import { SystemPrompt, PERSONA_PREFIX_SECTION, PERSONA_SUFFIX_SECTION } from '@deepseek-ai/dsh-system-prompt'
import ToolRuntime from '@deepseek-ai/dsh-tools'
import { SettingsProvider } from '@deepseek-ai/dsh-settings'
import { createScope } from '@deepseek-ai/dsh-scope'
import * as plugin from './lib/index.js'

class MemorySettings extends SettingsProvider {
  doc = {}
  get writable() { return true }
  load() { return Promise.resolve(structuredClone(this.doc)) }
  persist(ns, section) { this.doc[ns] = structuredClone(section); return Promise.resolve() }
}

const failures = []
function check(label, ok, extra) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${extra ? `  (${extra})` : ''}`)
  if (!ok) failures.push(label)
}

const ctx = new Context()
await ctx.plugin(MemorySettings)
await ctx.plugin(SystemPrompt, { personaPrefix: 'DEPLOYMENT PERSONA BASELINE' })
await ctx.plugin(ToolRuntime, { mode: 'native' })

// A base tool so the assembly has something to prefix.
ctx.tools.register({
  name: 'ping_tool',
  description: 'does ping',
  parameters: {},
  output: {
    schema: { type: 'object', properties: { ok: { type: 'boolean' } }, additionalProperties: false },
    render: (_a, v) => [{ type: 'text', text: `ok=${v.ok}` }],
  },
  execute: async () => ({ ok: true }),
})

// Mount the plugin exactly as the Loader does: name/inject/apply module face.
await ctx.plugin({ name: plugin.name, inject: plugin.inject, apply: plugin.apply })

// 1. settings namespace registered by the plugin
const settings = ctx.get('settings')
check('settings namespace conversation-language registered', settings.get('conversation-language') !== undefined,
  JSON.stringify(settings.get('conversation-language')))

// 2. tool registered by the plugin
const tools = ctx.get('tools')
const langTool = tools.get('get_conversation_language')
check('get_conversation_language tool registered', langTool !== undefined)
if (langTool !== undefined) {
  const executed = await tools.execute({
    signal: new AbortController().signal,
    callId: { kind: 'call', id: 'verify-1' },
    name: 'get_conversation_language',
    arguments: {},
  })
  check('get_conversation_language executes', executed !== undefined && executed.isError === false && executed.value !== undefined,
    JSON.stringify(executed))
}

// 3. global (unscoped) assembly carries the zh language instruction in the persona prefix
let assembly = await ctx.get('systemPrompt').assemble()
let persona = assembly.sections.find(s => s.name === PERSONA_PREFIX_SECTION)
check('persona prefix section found in assembly', persona !== undefined, PERSONA_PREFIX_SECTION)
check('zh instruction appended to persona prefix', persona.text.includes('【语言指令】'), JSON.stringify(persona.text.slice(-60)))
let ping = assembly.tools.find(t => t.name === 'ping_tool')
check('zh tool description prefixed', String(ping.description).startsWith('[中文思考]'), JSON.stringify(ping.description))

// 4. switch language to 'en' through the settings service, re-assemble
await settings.update('conversation-language', { conversationLanguage: 'en' })
assembly = await ctx.get('systemPrompt').assemble()
persona = assembly.sections.find(s => s.name === PERSONA_PREFIX_SECTION)
check('en instruction appended after settings.update', persona.text.includes('[Language Instruction]'), JSON.stringify(persona.text.slice(-80)))
ping = assembly.tools.find(t => t.name === 'ping_tool')
check('en tool description prefixed', String(ping.description).startsWith('[English Thinking]'), JSON.stringify(ping.description))
check('tool description not double-prefixed',
  !String(ping.description).startsWith('[English Thinking] [English Thinking]'))

// 5. idempotence: each assembly re-appends exactly once (sections are rebuilt
// per assembly, so the persisted text must stay stable)
const textBefore = persona.text
assembly = await ctx.get('systemPrompt').assemble()
const personaAgain = assembly.sections.find(s => s.name === PERSONA_PREFIX_SECTION)
check('second assembly does not stack the suffix',
  personaAgain.text === textBefore,
  JSON.stringify(personaAgain.text.slice(-80)))

// 6. scoped assembly (the agent case): an untagged plugin listener still fires
const scopeKey = { agentScopeTest: true }
const scope = createScope(ctx, scopeKey)
const scopedAssembly = await ctx.get('systemPrompt').assemble({ scope: scopeKey })
const scopedPersona = scopedAssembly.sections.find(s => s.name === PERSONA_PREFIX_SECTION)
check('scoped assembly receives the language instruction',
  scopedPersona !== undefined && scopedPersona.text.includes('[Language Instruction]'),
  scopedPersona ? JSON.stringify(scopedPersona.text.slice(-80)) : 'no prefix section')
await scope.dispose()

// 7. suffix fallback sanity (direct constant values match the registry source)
check('persona section names match registry', PERSONA_PREFIX_SECTION === 'deployment:persona-prefix' && PERSONA_SUFFIX_SECTION === 'deployment:persona-suffix')

if (failures.length > 0) {
  console.error('\nFAILURES:', failures.join(' | '))
  process.exit(1)
}
console.log('\nAll runtime checks passed.')
