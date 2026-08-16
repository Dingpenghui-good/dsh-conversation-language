/**
 * Conversation Language Switcher Row for General Settings
 */
import { useState } from 'react'
import type { PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots'
import { IconChevronDownOutline14, Menu } from '@deepseek-ai/dsh-client-ui-primitives'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type { createLanguageSwitcherStore } from './settings-store.ts'
import css from './LanguageSwitcherRow.module.css'

export interface LanguageSwitcherInjected {
  setConversationLanguage: (id: 'zh' | 'en') => void
}

export type LanguageSwitcherComponentProps =
  PropsRuntime<'settings.general.item'> & PropsStore<ReturnType<typeof createLanguageSwitcherStore>>
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
          setConversationLanguage(id as 'zh' | 'en')
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
            <IconChevronDownOutline14 className={css.chevron} />
          </button>
        )}
      />
    </div>
  )
}
