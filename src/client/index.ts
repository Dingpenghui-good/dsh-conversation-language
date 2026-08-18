/**
 * Client-side entry for the conversation language switcher plugin.
 * Registers the Language Switcher row into the General Settings section.
 */
import type { BoundActions, LocaleNamespaceMap } from '@deepseek-ai/dsh-client-ui-slots'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'

import { LanguageSwitcherRow } from './LanguageSwitcherRow.tsx'
import { createLanguageSwitcherStore } from './settings-store.ts'
import { zh as zhDict, en as enDict } from '../locales/index.ts'

// Declare locale namespace for this plugin
declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'settings.conversation-language': {
      'conversation-language.title': string
      'conversation-language.hint': string
    }
  }
}

export const inject = ['slots', 'locale', 'connection', 'remote', 'settingsScope'] as const

export function apply(ctx: ClientContext): void {
  const slots = ctx.get('slots')
  const locale = ctx.get('locale')
  const settingsScope = ctx.get('settingsScope')

  // Register locale dictionaries
  if (locale && 'register' in locale) {
    locale.register('settings.conversation-language', { zh: zhDict, en: enDict })
  }

  // Bind to host settings namespace via settingsScope
  const host = settingsScope?.bind<{ conversationLanguage?: 'zh' | 'en' }>({
    namespace: 'conversation-language',
  })

  // Create store
  const store = createLanguageSwitcherStore()
  let bound: BoundActions<typeof store> | undefined
  let revision = 0

  // Sync store state from the host snapshot.
  // Called both on initial render and whenever the host value changes externally.
  const syncStore = () => {
    const data = host?.getSnapshot().value
    const active = (data?.conversationLanguage ?? 'zh') as 'zh' | 'en'
    const options = [
      { id: 'zh' as const, label: '中文' },
      { id: 'en' as const, label: 'English' },
    ]
    bound?.sync(active, options, ++revision)
  }

  // Subscribe to host setting changes at the plugin level using ctx.effect,
  // matching the pattern used by dsh-client-locale and dsh-client-ui-theme.
  // This ensures the UI stays in sync when the setting is changed from other
  // sources (e.g. direct settings.yaml edit, another plugin).
  ctx.effect(() => {
    const dispose = host?.subscribe(syncStore) ?? (() => {})
    syncStore() // initial sync
    return dispose
  }, 'conversation-language: settings sync')

  slots.inject('settings.general.item', () => slots.register({
    name: 'settings.general.item',
    id: 'conversation-language',
    order: 1,
    store,
    locale: 'settings.conversation-language',
    inject: (actions: BoundActions<typeof store>) => {
      bound = actions
      return {
        setConversationLanguage: (lang: 'zh' | 'en') => {
          host?.set('conversationLanguage', lang)
          // Optimistically update the UI immediately; the host subscribe will
          // confirm the write and bump the revision if it succeeds.
          syncStore()
        },
      }
    },
  }, LanguageSwitcherRow))
}
