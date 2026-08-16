/**
 * Store for conversation language switcher UI
 */
import { defineStore, type EngineStoreHandle } from '@deepseek-ai/dsh-client-runtime/client'

export interface LanguageOption {
  id: 'zh' | 'en'
  label: string
}

export interface LanguageSwitcherState {
  active: 'zh' | 'en'
  options: LanguageOption[]
  revision: number
}

type LanguageSwitcherActions = {
  sync: (draft: LanguageSwitcherState, active: 'zh' | 'en', options: LanguageOption[], revision: number) => void
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
