/**
 * Conversation Language Switcher Plugin for DeepSeek Harness
 * 
 * Provides a setting in General Settings to switch conversation language
 * between Chinese and English. Uses closed-over state + waterfall interception
 * to maximize language consistency across all scenarios (simple Q&A, tool calls,
 * skill analysis, etc.).
 * 
 * Install: dsh plugin --profile web add <path-to-plugin>
 */

import type { Context } from '@deepseek-ai/cordis'
import type { AssembleContext, PromptAssembly } from '@deepseek-ai/dsh-system-prompt'
import { PERSONA_PREFIX_SECTION, PERSONA_SUFFIX_SECTION } from '@deepseek-ai/dsh-system-prompt'
import z from '@deepseek-ai/schemastery'
import { defineTool } from '@deepseek-ai/dsh-tools'
// Ensure module augmentation for systemPrompt service and system-prompt/assemble event is visible
import '@deepseek-ai/dsh-system-prompt'
// Settings namespace
const CONVERSATION_LANGUAGE_NAMESPACE = 'conversation-language'

// Schema
const ConversationLanguageSchema = z.object({
  conversationLanguage: z.union(['zh', 'en']).required(false),
})

// Persona templates — append language instruction to whatever preset persona
// the current session uses. The base persona is detected from the assembly at
// runtime; we only inject the language section.
const LANGUAGE_SUFFIX_ZH = `

【语言指令】
当前对话语言为「中文」。你必须：
1. 所有思考过程使用中文
2. 所有回复内容使用中文
3. 如果思考中使用了英文，立即纠正回中文`

const LANGUAGE_SUFFIX_EN = `

[Language Instruction]
The current conversation language is "English". You MUST:
1. Use English for all thinking processes
2. Use English for all response content
3. If you accidentally think in another language, immediately correct back to English`

export const name = 'conversation-language'
export const inject = ['settings', 'systemPrompt', 'tools'] as const

export function apply(ctx: Context): void {
  // Register settings namespace
  const settings = ctx.get('settings')
  const scope = settings?.register(
    CONVERSATION_LANGUAGE_NAMESPACE,
    ConversationLanguageSchema,
  )

  // Get current language from settings
  const getLanguage = (): 'zh' | 'en' => {
    return scope?.get()?.conversationLanguage ?? 'zh'
  }

  // 使用闭包保存语言后缀（根据当前语言动态选择）
  let currentLanguageSuffix = getLanguage() === 'en' ? LANGUAGE_SUFFIX_EN : LANGUAGE_SUFFIX_ZH

  // 使用 system-prompt/assemble waterfall 拦截
  // 动态读取当前 preset 的 persona，追加语言部分
  ctx.on('system-prompt/assemble', async (assembly: PromptAssembly, context: AssembleContext, next: () => Promise<PromptAssembly>) => {
    const lang = getLanguage()

    // 更新语言后缀
    currentLanguageSuffix = lang === 'en' ? LANGUAGE_SUFFIX_EN : LANGUAGE_SUFFIX_ZH

    // 查找当前 preset 的 persona section
    // DSH 0.1.5+ 将 persona 拆分为 prefix（order 0，preset 影子）与 suffix
    // （order 10200）两个 section；优先追加到 prefix（与原 0.1.2 的
    // 'deployment:persona' 位置一致），prefix 缺失时回退到 suffix。
    const personaSection =
      assembly.sections.find(s => s.name === PERSONA_PREFIX_SECTION)
      ?? assembly.sections.find(s => s.name === PERSONA_SUFFIX_SECTION)
    if (personaSection) {
      // 在 persona 末尾追加语言指令
      personaSection.text += currentLanguageSuffix
    }

    // 向 tool schemas 添加语言前缀
    for (const tool of assembly.tools) {
      if (lang === 'zh' && !tool.description.startsWith('[中文思考]')) {
        tool.description = `[中文思考] ${tool.description}`
      } else if (lang === 'en' && !tool.description.startsWith('[English Thinking]')) {
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
    execute: async () => ({
      language: getLanguage(),
      label: getLanguage() === 'zh' ? '中文' : 'English',
    }),
  }))
}
