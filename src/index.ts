/**
 * Conversation Language Switcher Plugin for DeepSeek Harness
 *
 * Provides a setting in General Settings to switch conversation language
 * between Chinese and English. Uses closed-over state + waterfall interception
 * to maximize language consistency across all scenarios (simple Q&A, tool calls,
 * skill analysis, etc.).
 *
 * Install: dsh plugin --profile web add <path-to-plugin>
 *
 * Architecture (DSH 0.1.7-alpha.2+):
 * - Host half declares a `Config` schema with a volatile `conversationLanguage`
 *   field; the settings framework projects it to the browser and persists it
 *   through the active profile's Cordis patch.
 * - The `system-prompt/assemble` waterfall reads the live settings value on
 *   every assembly, so language switches take effect without a restart.
 */

import type { Context } from '@deepseek-ai/cordis'
import type { AssembleContext, PromptAssembly } from '@deepseek-ai/dsh-system-prompt'
import { PERSONA_PREFIX_SECTION, PERSONA_SUFFIX_SECTION } from '@deepseek-ai/dsh-system-prompt'
import z from '@deepseek-ai/schemastery'
import { defineTool } from '@deepseek-ai/dsh-tools'
// Ensure module augmentation for systemPrompt service and system-prompt/assemble event is visible
import type {} from '@deepseek-ai/dsh-system-prompt'
// Pull the SettingsForms Context merge (ctx.settings) into this program.
import type {} from '@deepseek-ai/dsh-settings'
import { CONVERSATION_LANGUAGE_NAMESPACE, type ConversationLanguage } from './shared.ts'

export { CONVERSATION_LANGUAGE_NAMESPACE }
export type { ConversationLanguage }

/** Plugin config: the language the conversation runs in. */
export interface Config {
  /**
   * Conversation language the model thinks and replies in. Volatile: the
   * settings UI writes it through the active profile's Cordis patch.
   */
  conversationLanguage: 'zh' | 'en'
}

/** Runtime schema for the conversation-language row. */
export const Config: z<Config> = z.object({
  conversationLanguage: z.union(['zh', 'en']).volatile().default('zh'),
})

// Persona templates — append language instruction to whatever preset persona
// the current session uses. The base persona is detected from the assembly at
// runtime; we only inject the language section.
const LANGUAGE_SUFFIX_ZH = `

【语言指令】
当前对话语言为「中文」。你必须：
1. 所有思考过程使用中文
2. 所有回复内容使用中文
3. 所有面向用户可见的文本都必须使用中文，包括工具调用的参数值：pwsh/bash 的 description、todo_write 的 content、subagent 的 description、任务与作业的名称等，都要用中文书写；不要沿用工具 schema 里的英文示例措辞（例如 "List files in current directory"）
4. 如果思考中使用了英文，立即纠正回中文`

const LANGUAGE_SUFFIX_EN = `

[Language Instruction]
The current conversation language is "English". You MUST:
1. Use English for all thinking processes
2. Use English for all response content
3. Use English for every user-visible string, including tool-call argument values: the description argument of pwsh/bash, todo_write content, subagent descriptions, and job or task titles. Do not reuse the English wording of a tool schema's examples.
4. If you accidentally think in another language, immediately correct back to English`

export const name = 'conversation-language'
export const inject = ['systemPrompt', 'tools'] as const

/**
 * Register the tool and the `system-prompt/assemble` waterfall interception.
 * The language is read from the settings framework on every assembly so a
 * switch takes effect on the very next model step without a remount.
 * @param ctx - the plugin context carrying the settings, systemPrompt, and tools services.
 */
export function apply(ctx: Context): void {
  const settings = ctx.get('settings')

  /** Read the live conversation language from the settings framework. */
  const getLanguage = (): ConversationLanguage => {
    if (settings === undefined) return 'zh'
    const descriptor = settings.describe().find(row => row.ns === CONVERSATION_LANGUAGE_NAMESPACE)
    const value = descriptor?.value as { conversationLanguage?: ConversationLanguage } | undefined
    return value?.conversationLanguage ?? 'zh'
  }

  // 使用 system-prompt/assemble waterfall 拦截
  // 动态读取当前 preset 的 persona，追加语言部分
  ctx.on('system-prompt/assemble', async (assembly: PromptAssembly, context: AssembleContext, next: () => Promise<PromptAssembly>) => {
    const lang = getLanguage()

    // 查找当前 preset 的 persona section
    // DSH 0.1.5+ 将 persona 拆分为 prefix（order 0，preset 影子）与 suffix
    // （order 10200）两个 section；优先追加到 prefix（与原 0.1.2 的
    // 'deployment:persona' 位置一致），prefix 缺失时回退到 suffix。
    const personaSection =
      assembly.sections.find(s => s.name === PERSONA_PREFIX_SECTION)
      ?? assembly.sections.find(s => s.name === PERSONA_SUFFIX_SECTION)
    if (personaSection) {
      // 在 persona 末尾追加语言指令
      personaSection.text += lang === 'en' ? LANGUAGE_SUFFIX_EN : LANGUAGE_SUFFIX_ZH
    }

    // 向 tool schemas 添加语言前缀
    for (const tool of assembly.tools) {
      if (lang === 'zh' && !String(tool.description).startsWith('[中文思考]')) {
        tool.description = `[中文思考] ${tool.description}`
      } else if (lang === 'en' && !String(tool.description).startsWith('[English Thinking]')) {
        tool.description = `[English Thinking] ${tool.description}`
      }
    }

    return next()
  })

  // Register tool to query the current language
  ctx.tools.register(defineTool({
    name: 'get_conversation_language',
    description: '获取当前对话语言设置',
    parameters: {},
    output: {
      schema: {
        type: 'object',
        properties: {
          language: { type: 'string', enum: ['zh', 'en'] },
          label: { type: 'string' },
        },
        additionalProperties: false,
      },
      render: (_args, value) => [{
        type: 'text',
        text: `当前对话语言：${value.label} (${value.language})`,
      }],
    },
    execute: async () => {
      const lang = getLanguage()
      return {
        language: lang,
        label: lang === 'zh' ? '中文' : 'English',
      }
    },
  }))
}
