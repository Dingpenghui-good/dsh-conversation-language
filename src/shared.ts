/**
 * Shared constants usable by both the Host bundle and the Client bundle.
 * The client reads the settings namespace through this barrel so it never
 * value-imports a Host-only package such as `@deepseek-ai/dsh-system-prompt`.
 */

/** The settings namespace is the profile entry id of this plugin row. */
export const CONVERSATION_LANGUAGE_NAMESPACE = 'tool-conversation-language'

/** 对话语言: 'zh' (中文) 或 'en' (英文), 默认 'zh' */
export type ConversationLanguage = 'zh' | 'en'

/** npm 包名：`plugins.bundle.config` slot 的 key。 */
export const PLUGIN_PACKAGE_NAME = '@dingpenghui/dsh-conversation-language'

/** `plugins.row.config` slot 的 key：`<package>#<row id>`。 */
export const PLUGIN_ROW_CONFIG_KEY = `${PLUGIN_PACKAGE_NAME}#${CONVERSATION_LANGUAGE_NAMESPACE}`
