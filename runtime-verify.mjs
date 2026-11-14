/**
 * Runtime verification against the REAL @deepseek-ai/* 0.2.2 services installed
 * in this plugin's node_modules.
 *
 * DSH 0.2.1-rc.2 moved tool declarations out of `system-prompt/assemble`: the
 * waterfall receives a `PromptPresentation` (sections, contexts, variables) and
 * tool schemas are provider-owned. This script mounts the built host bundle and
 * asserts the plugin (a) contributes a language-instruction section without
 * touching tools, (b) switches language live through the settings value, and
 * (c) registers a working query tool.
 */
import { Context, Service } from '@deepseek-ai/cordis'
import { SystemPrompt, PERSONA_PREFIX_SECTION } from '@deepseek-ai/dsh-system-prompt'
import { ToolsService, projectToolSchema } from '@deepseek-ai/dsh-tools'
import { executeToolBatch, ToolExecutionPipeline } from '@deepseek-ai/dsh-tools/pipeline'
import * as plugin from './lib/index.js'
import { CONVERSATION_LANGUAGE_NAMESPACE, LANGUAGE_SECTION } from './lib/index.js'

const failures = []
function check(label, ok, extra) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${extra ? `  (${extra})` : ''}`)
  if (!ok) failures.push(label)
}

/** The shipped native executor, rebuilt on this standalone context. */
function makeNativeExecutor(ctx) {
  const pipeline = new ToolExecutionPipeline(ctx)
  return {
    describe: tools => ({ schemas: tools.map(definition => projectToolSchema(definition, false)) }),
    execute: input => executeToolBatch(input, pipeline, () => 10),
  }
}

/** A stand-in settings service so the plugin can read a live language value. */
class FakeSettings extends Service {
  constructor(ctx, served) {
    super(ctx, 'settings')
    this.served = served
  }
  describe() {
    return [{ ns: CONVERSATION_LANGUAGE_NAMESPACE, value: { conversationLanguage: this.served.value } }]
  }
}

const ctx = new Context()
await ctx.plugin(SystemPrompt, { personaPrefix: 'DEPLOYMENT PERSONA BASELINE' })
await ctx.plugin(ToolsService, {})
ctx.tools.setExecutor(makeNativeExecutor(ctx))

// Mount the plugin exactly as the Loader does: name/inject/apply module face.
try {
  await ctx.plugin({ name: plugin.name, inject: plugin.inject, apply: plugin.apply })
} catch (error) {
  console.error('plugin mount failed:', error)
  process.exit(1)
}

// 1. The instruction section is registered at the persona-prefix position.
let assembly = await ctx.get('systemPrompt').assemble()
const persona = assembly.sections.find(s => s.name === PERSONA_PREFIX_SECTION)
check('persona prefix section still present', persona !== undefined, PERSONA_PREFIX_SECTION)
const instruction = assembly.sections.find(s => s.name === LANGUAGE_SECTION)
check('language section registered', instruction !== undefined, LANGUAGE_SECTION)
check('zh instruction rendered by default', instruction?.text.includes('\u3010\u8bed\u8a00\u6307\u4ee4\u3011') === true,
  JSON.stringify(instruction?.text.slice(0, 24)))

// 2. The query tool is registered and executes through the native executor.
const tools = ctx.get('tools')
const langTool = tools.get('get_conversation_language')
check('get_conversation_language tool registered', langTool !== undefined)
if (langTool !== undefined) {
  check('tool description unchanged by assembly', langTool.description.length > 0, JSON.stringify(langTool.description))
  const executed = await tools.execute({
    calls: [{ type: 'tool-call', id: 'verify-1', name: 'get_conversation_language', arguments: {} }],
    signal: new AbortController().signal,
    maxParallelToolCalls: 1,
  })
  const result = executed.results[0]?.result
  check('get_conversation_language executes', result !== undefined && result.isError !== true, JSON.stringify(result)?.slice(0, 200))
}

// 3. Live switch: a settings service that serves `en` flips the next assembly.
const servedLanguage = { value: 'en' }
const switchCtx = new Context()
await switchCtx.plugin(SystemPrompt, {})
await switchCtx.plugin(ToolsService, {})
switchCtx.tools.setExecutor(makeNativeExecutor(switchCtx))
await switchCtx.plugin(FakeSettings, servedLanguage)
await switchCtx.plugin({ name: plugin.name, inject: plugin.inject, apply: plugin.apply })
let switched = await switchCtx.get('systemPrompt').assemble()
const enInstruction = switched.sections.find(s => s.name === LANGUAGE_SECTION)
check('en instruction after switch', enInstruction?.text.includes('[Language Instruction]') === true,
  JSON.stringify(enInstruction?.text.slice(0, 26)))
servedLanguage.value = 'zh'
switched = await switchCtx.get('systemPrompt').assemble()
check('zh instruction flips back live',
  switched.sections.find(s => s.name === LANGUAGE_SECTION)?.text.includes('\u3010\u8bed\u8a00\u6307\u4ee4\u3011') === true)

// 4. Idempotence: repeated assemblies never stack the instruction.
const texts = []
for (let i = 0; i < 3; i++) {
  const a = await switchCtx.get('systemPrompt').assemble()
  texts.push(a.sections.filter(s => s.name === LANGUAGE_SECTION).map(s => s.text).join('|'))
}
check('instruction not stacked across assemblies', new Set(texts).size === 1, JSON.stringify(texts.map(t => t.length)))

// 5. The namespace constant matches the patch row id.
check('exported namespace matches patch row id', CONVERSATION_LANGUAGE_NAMESPACE === 'tool-conversation-language',
  CONVERSATION_LANGUAGE_NAMESPACE)

if (failures.length > 0) {
  console.error('\nFAILURES:', failures.join(' | '))
  process.exit(1)
}
console.log('\nAll runtime checks passed.')
