/**
 * Runtime verification: mount the built host bundle (lib/index.js) against
 * the REAL @deepseek-ai/* 0.1.7-alpha.2 services from this plugin's node_modules,
 * then exercise tool registration + system-prompt/assemble interception.
 *
 * The settings framework keys descriptors by the profile ENTRY id; the
 * settings service itself is only present in profile-mounted contexts
 * (it needs configEditor + profileContext), so a bare Context falls back
 * to the documented 'zh' default.
 */
import { Context } from '@deepseek-ai/cordis'
import { SystemPrompt, PERSONA_PREFIX_SECTION, PERSONA_SUFFIX_SECTION } from '@deepseek-ai/dsh-system-prompt'
import { ToolRuntime, defineTool } from '@deepseek-ai/dsh-tools'
import * as plugin from './lib/index.js'
import { CONVERSATION_LANGUAGE_NAMESPACE } from './lib/index.js'

const failures = []
function check(label, ok, extra) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${extra ? `  (${extra})` : ''}`)
  if (!ok) failures.push(label)
}

const ctx = new Context()
await ctx.plugin(SystemPrompt, { personaPrefix: 'DEPLOYMENT PERSONA BASELINE' })
await ctx.plugin(ToolRuntime, { mode: 'native' })

// A base tool so the assembly has something to prefix.
ctx.tools.register(defineTool({
  name: 'ping_tool',
  description: 'does ping',
  parameters: {},
  output: {
    schema: { type: 'object', properties: { ok: { type: 'boolean' } }, additionalProperties: false },
    render: (_a, v) => [{ type: 'text', text: `ok=${v.ok}` }],
  },
  execute: async () => ({ ok: true }),
}))

// Mount the plugin exactly as the Loader does: name/inject/apply module face.
try {
  await ctx.plugin({ name: plugin.name, inject: plugin.inject, apply: plugin.apply })
} catch (error) {
  console.error('plugin mount failed:', error)
  process.exit(1)
}

// 1. tool registered by the plugin
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
  check('tool reports default zh when no settings service', executed?.value?.language === 'zh',
    JSON.stringify(executed?.value))
}

// 2. global (unscoped) assembly carries the zh language instruction in the persona prefix
let assembly = await ctx.get('systemPrompt').assemble()
let persona = assembly.sections.find(s => s.name === PERSONA_PREFIX_SECTION)
check('persona prefix section found in assembly', persona !== undefined, PERSONA_PREFIX_SECTION)
check('zh instruction appended to persona prefix', persona.text.includes('【语言指令】'), JSON.stringify(persona.text.slice(-60)))
let ping = assembly.tools.find(t => t.name === 'ping_tool')
check('zh tool description prefixed', String(ping.description).startsWith('[中文思考]'), JSON.stringify(ping.description))

// 3. idempotence: each assembly re-appends exactly once (sections are rebuilt
// per assembly, so the persisted text must stay stable)
const textBefore = persona.text
assembly = await ctx.get('systemPrompt').assemble()
const personaAgain = assembly.sections.find(s => s.name === PERSONA_PREFIX_SECTION)
check('second assembly does not stack the suffix',
  personaAgain.text === textBefore,
  JSON.stringify(personaAgain.text.slice(-80)))

// 4. suffix fallback sanity (direct constant values match the registry source)
check('persona section names match registry', PERSONA_PREFIX_SECTION === 'deployment:persona-prefix' && PERSONA_SUFFIX_SECTION === 'deployment:persona-suffix')

// 5. namespace constant exported by the built bundle matches the patch row id
check('exported namespace matches patch row id', CONVERSATION_LANGUAGE_NAMESPACE === 'tool-conversation-language',
  CONVERSATION_LANGUAGE_NAMESPACE)

if (failures.length > 0) {
  console.error('\nFAILURES:', failures.join(' | '))
  process.exit(1)
}
console.log('\nAll runtime checks passed.')
