/**
 * Store for conversation language switcher UI
 */
import { defineStore, type EngineStoreHandle } from '@deepseek-ai/dsh-client-store'
import type { ConversationLanguage } from '../shared.ts'

export interface LanguageOption {
  id: ConversationLanguage
  label: string
}

export interface LanguageSwitcherState {
  active: ConversationLanguage
  options: LanguageOption[]
  revision: number
}

type LanguageSwitcherActions = {
  sync: (draft: LanguageSwitcherState, active: ConversationLanguage, options: LanguageOption[], revision: number) => void
}

export function createLanguageSwitcherStore(): EngineStoreHandle<LanguageSwitcherState, LanguageSwitcherActions> {
  return defineStore({
    init: (): LanguageSwitcherState => ({ active: 'zh', options: [], revision: -1 }),
    actions: {
      sync: (d, active, options, revision) => {
        if (revision <= d.revision) return
        d.active = active
        d.options = options
        d.revision = revision
      },
    },
  })
}
