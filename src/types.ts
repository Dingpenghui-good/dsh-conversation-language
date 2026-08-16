/**
 * Language settings type definition
 */
export interface ConversationLanguageSettings {
  /** 对话语言: 'zh' (中文) 或 'en' (英文), 默认 'zh' */
  conversationLanguage?: 'zh' | 'en'
}

/** Schema key for the language settings namespace */
export const LANGUAGE_SETTINGS_NAMESPACE = 'conversation-language' as const

/** Default language */
export const DEFAULT_LANGUAGE: 'zh' | 'en' = 'zh'
