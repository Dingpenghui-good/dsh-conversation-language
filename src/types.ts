/**
 * Language settings type definition
 */
export interface ConversationLanguageSettings {
  /** 对话语言: 'zh' (中文) 或 'en' (英文), 默认 'zh' */
  conversationLanguage?: 'zh' | 'en'
}

/** The settings namespace is the profile entry id of the plugin row. */
export const LANGUAGE_SETTINGS_NAMESPACE = 'tool-conversation-language' as const

/** Default language */
export const DEFAULT_LANGUAGE: 'zh' | 'en' = 'zh'
