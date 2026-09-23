/**
 * Client-side entry for the conversation language switcher plugin.
 * Registers the Language Switcher row into the General Settings section.
 *
 * Architecture (DSH 0.1.7-alpha.2+): the row binds to the Host's settings
 * form through `ctx.configForms.get(CONVERSATION_LANGUAGE_NAMESPACE)` — the
 * settings framework mirrors the Host descriptor into the browser and queues
 * writes against the active profile's Cordis patch. The slot registration
 * follows the standard `slots.inject('settings.general.item', …)` pattern
 * used by ui-theme and ui-conversation.
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
// Type-only: pulls the SlotRegistry service merge (ctx.slots).
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
// Type-only: pulls the ctx.locale merge.
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: the ctx.configForms Context merge and the settings slot types.
// Cross-plugin collaboration goes through the service, never a value import
// (client bundle purity gate).
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
// Type-only: the BoundActions currency lives in ui-slots.
import type { BoundActions } from '@deepseek-ai/dsh-client-ui-slots'

import { LanguageSwitcherRow } from './LanguageSwitcherRow.tsx'
import type { LanguageSwitcherInjected } from './LanguageSwitcherRow.tsx'
import { createLanguageSwitcherStore } from './settings-store.ts'
import { zh as zhDict, en as enDict } from '../locales/index.ts'
// Shared barrel: keeps this bundle free of Host-only package value imports.
import { CONVERSATION_LANGUAGE_NAMESPACE, type ConversationLanguage } from '../shared.ts'

export const inject = ['slots', 'locale', 'configForms', 'connection'] as const

export function apply(ctx: ClientContext): void {
  const slots = ctx.get('slots')
  const locale = ctx.get('locale')

  // Register locale dictionaries
  ctx.effect(() => locale.register('settings.conversation-language', { zh: zhDict, en: enDict }), 'conversation-language: dictionaries')

  // Bind to the Host settings form for this plugin's entry id.
  const form = ctx.get('configForms')!.get<Record<string, unknown>>(CONVERSATION_LANGUAGE_NAMESPACE)

  // Create store
  const store = createLanguageSwitcherStore()
  let bound: BoundActions<typeof store> | undefined
  let revision = 0

  // Sync store state from the Host settings form.
  // Called both on initial render and whenever the Host value changes externally.
  const syncForm = (): void => {
    const snapshot = form.getSnapshot()
    const active = ((snapshot.value?.conversationLanguage ?? 'zh') as ConversationLanguage)
    const options = [
      { id: 'zh' as const, label: '中文' },
      { id: 'en' as const, label: 'English' },
    ]
    bound?.sync(active, options, ++revision)
  }

  // Subscribe to settings form changes at the plugin level using ctx.effect,
  // matching the pattern used by dsh-client-locale and dsh-client-ui-theme.
  // This ensures the UI stays in sync when the setting is changed from other
  // sources (e.g. the settings UI in another tab, a direct patch edit).
  ctx.effect(() => {
    const dispose = form.subscribe(() => syncForm())
    return dispose
  }, 'conversation-language: settings sync')

  slots.inject('settings.general.item', () => slots.register({
    name: 'settings.general.item',
    id: 'conversation-language',
    order: 1,
    store,
    locale: 'settings.conversation-language',
    inject: (actions: BoundActions<typeof store>): LanguageSwitcherInjected => {
      bound = actions
      // Sync immediately after bound is set — matches dsh-client-locale pattern.
      syncForm()
      return {
        setConversationLanguage: (lang: ConversationLanguage) => {
          void form.set('conversationLanguage', lang)
          // Optimistically update the UI; the settings mirror will confirm
          // the write and bump the snapshot on acceptance.
          syncForm()
        },
      }
    },
  }, LanguageSwitcherRow))
}
