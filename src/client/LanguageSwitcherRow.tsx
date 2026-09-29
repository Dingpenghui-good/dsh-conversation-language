/**
 * Conversation Language Switcher Row for General Settings
 */
import { useState } from 'react'
import { IconChevronDownOutlineMedium, Menu } from '@deepseek-ai/dsh-client-ui-primitives'
// Type-only: the settings slot types the `settings.general.item` slot is declared with.
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
// Type-only: the slot props currency.
import type {
  PropsLocale, PropsRuntime,
} from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: the store currency for the snapshot hook.
import type { createLanguageSwitcherStore } from './settings-store.ts'
import type { LanguageSwitcherState } from './settings-store.ts'
import type { SnapshotSelectorHook } from '@deepseek-ai/dsh-client-store'
import type { ConversationLanguage } from '../shared.ts'
import css from './LanguageSwitcherRow.module.css'

export interface LanguageSwitcherInjected {
  setConversationLanguage: (id: ConversationLanguage) => void
}

export type LanguageSwitcherComponentProps =
  PropsRuntime<'settings.general.item'>
  & { useStore: SnapshotSelectorHook<LanguageSwitcherState> }
  & PropsLocale<'settings.conversation-language'> & LanguageSwitcherInjected

export function LanguageSwitcherRow({ t, setConversationLanguage, useStore }: LanguageSwitcherComponentProps) {
  const active = useStore(s => s.active)
  const options = useStore(s => s.options)
  const [open, setOpen] = useState(false)
  const activeLabel = options.find(o => o.id === active)?.label ?? active

  return (
    <div className={css.row}>
      <div className={css.rowText}>
        <div className={css.title}>{t('conversation-language.title')}</div>
        <div className={css.hint}>{t('conversation-language.hint')}</div>
      </div>
      <Menu
        open={open}
        onClose={() => { setOpen(false) }}
        items={options.map(o => ({ id: o.id, label: o.label }))}
        selectedId={active}
        onSelect={(id) => {
          setConversationLanguage(id as ConversationLanguage)
          setOpen(false)
        }}
        align="end"
        portal
        anchor={(
          <button
            type="button"
            className={css.selector}
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={() => { setOpen(v => !v) }}
          >
            {activeLabel}
            <IconChevronDownOutlineMedium className={css.chevron} />
          </button>
        )}
      />
    </div>
  )
}
