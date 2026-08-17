/**
 * Client-side entry for the conversation language switcher plugin.
 * Registers the Language Switcher row into the General Settings section.
 */
import type { Context } from '@deepseek-ai/cordis'
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

export const inject = ['slots', 'locale', 'settingsScope'] as const

export function apply(ctx: ClientContext): void {
  // Register locale dictionaries
  if ('register' in ctx.locale) {
    ctx.locale.register('settings.conversation-language', { zh: zhDict, en: enDict })
  }

  // Bind to host settings namespace via settingsScope
  const host = ctx.settingsScope.bind<{ conversationLanguage?: 'zh' | 'en' }>({
    namespace: 'conversation-language',
  })

  // Create store and register settings item
  const store = createLanguageSwitcherStore()
  let bound: BoundActions<typeof store> | undefined

  const syncStore = (active: 'zh' | 'en') => {
    const options = [
      { id: 'zh' as const, label: '中文' },
      { id: 'en' as const, label: 'English' },
    ]
    bound?.sync(active, options, 1)
  }

  ctx.slots.inject('settings.general.item', () => ctx.slots.register({
    name: 'settings.general.item',
    id: 'conversation-language',
    order: 1,
    store,
    locale: 'settings.conversation-language',
    inject: (actions: BoundActions<typeof store>) => {
      bound = actions
      // Read initial language from host settings scope
      const data = host.get()
      const initialLang = data?.conversationLanguage ?? 'zh'
      syncStore(initialLang)

      return {
        setConversationLanguage: (lang: 'zh' | 'en') => {
          host.set({ conversationLanguage: lang })
          syncStore(lang)
        },
      }
    },
  }, LanguageSwitcherRow))
}

export default apply
