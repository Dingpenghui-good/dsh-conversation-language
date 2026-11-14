/**
 * Conversation Language Switcher Plugin for DeepSeek Harness
 *
 * Switches the conversation language between Chinese and English. The language
 * instruction is contributed as its own system-prompt section (evaluated on
 * every assembly, so a switch applies to the next model step without a
 * restart) and the current value is exposed through a small Tool.
 *
 * Architecture (DSH 0.2.2+):
 * - Host half declares a `Config` schema with a volatile `conversationLanguage`
 *   field; the settings framework projects it to the browser and persists it
 *   through the active profile's Cordis patch.
 * - `ctx.systemPrompt.section()` registers the instruction; its `text` callback
 *   reads the live settings value per assembly.
 * - DSH 0.2.1-rc.2 moved tool declarations out of `system-prompt/assemble`
 *   (`PromptPresentation` carries only sections, contexts, and variables), so
 *   this plugin no longer edits tool schemas: the instruction itself covers
 *   every user-visible string, including tool-call argument values.
 */

import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { defineTool } from '@deepseek-ai/dsh-tools'
// Type-only: pulls the ctx.settings Context merge and the settings descriptors.
import type {} from '@deepseek-ai/dsh-settings'
// Type-only: pulls the ctx.systemPrompt service merge.
import type {} from '@deepseek-ai/dsh-system-prompt'
import { CONVERSATION_LANGUAGE_NAMESPACE, type ConversationLanguage } from './shared.ts'

export { CONVERSATION_LANGUAGE_NAMESPACE }
export type { ConversationLanguage }

/** Name of the system-prompt section this plugin contributes. */
export const LANGUAGE_SECTION = 'conversation-language:instruction'

/** Plugin config: the language the conversation runs in. */
export interface Config {
  /**
   * Conversation language the model thinks and replies in. Volatile: the
   * settings UI writes it through the active profile's Cordis patch.
   */
  conversationLanguage: 'zh' | 'en'
}

/** Runtime schema for the conversation-language row. */
export const Config = z.object({
  conversationLanguage: z.union([z.const('zh'), z.const('en')]).volatile().default('zh'),
})

// Persona templates — the instruction spells out the language of every
// user-visible string, including tool-call argument values, because DSH 0.2.2
// no longer lets a plugin rewrite tool schemas during assembly.
const LANGUAGE_INSTRUCTION_ZH = `【语言指令】
当前对话语言为「中文」。你必须：
1. 所有思考过程使用中文
2. 所有回复内容使用中文
3. 所有面向用户可见的文本都必须使用中文，包括工具调用的参数值：pwsh/bash 的 description、todo_write 的 content、subagent 的 description、任务与作业的名称等，都要用中文书写；不要沿用工具 schema 里的英文示例措辞（例如 "List files in current directory"）
4. 如果思考中使用了英文，立即纠正回中文`

const LANGUAGE_INSTRUCTION_EN = `[Language Instruction]
The current conversation language is "English". You MUST:
1. Use English for all thinking processes
2. Use English for all response content
3. Use English for every user-visible string, including tool-call argument values: the description argument of pwsh/bash, todo_write content, subagent descriptions, and job or task titles. Do not reuse the English wording of a tool schema's examples.
4. If you accidentally think in another language, immediately correct back to English`

export const name = 'conversation-language'
export const inject = ['systemPrompt', 'tools'] as const

/**
 * Register the language-instruction section and the settings query tool.
 *
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

  // The section callback runs for every assembly, so the text always reflects
  // the value the settings framework currently serves.
  ctx.effect(() => ctx.systemPrompt.section({
    name: LANGUAGE_SECTION,
    // Right after the deployment persona prefix (order 0): the instruction reads
    // as a persona-level directive rather than trailing guidance.
    order: ctx.systemPrompt.getSectionOrder('DEPLOYMENT_PERSONA_PREFIX') + 1,
    text: () => (getLanguage() === 'en' ? LANGUAGE_INSTRUCTION_EN : LANGUAGE_INSTRUCTION_ZH),
  }), 'conversation-language: instruction section')

  // Register the tool that reports the current language.
  ctx.effect(() => ctx.tools.register(defineTool({
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
  })), 'conversation-language: query tool')
}
