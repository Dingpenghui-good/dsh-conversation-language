/**
 * Client-side entry for the conversation language switcher plugin.
 * Registers the Language Switcher row into the General Settings section,
 * and a plugin detail page (the screen opened when clicking the plugin's
 * name in the Plugins list) through the Plugins page's `plugins.bundle.config`
 * and `plugins.row.config` slots.
 *
 * Architecture (DSH 0.2.0-rc.1): the row and the detail page bind to the
 * Host's settings form through `ctx.configForms.get(CONVERSATION_LANGUAGE_NAMESPACE)`
 * — the settings framework mirrors the Host descriptor into the browser and
 * queues writes against the active profile's Cordis patch. Detail-page
 * registration follows the `ui-settings-shell` pattern:
 * `ctx.configForms.whileServed([NS], …)` + `ctx.slots.inject(...)`, so a
 * deployment that never composed the owner shows no trace of the page.
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
// Type-only: pulls the SlotRegistry service merge (ctx.slots).
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
// Type-only: the Plugins page slot contract (plugins.bundle.config /
// plugins.row.config); the owner's SlotMap merge, never a runtime import.
import type {} from '@deepseek-ai/dsh-client-ui-plugin-manager/client'
// Type-only: pulls the ctx.locale merge.
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: the ctx.configForms Context merge and the settings slot types.
// Cross-plugin collaboration goes through the service, never a value import
// (client bundle purity gate).
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
// Type-only: the slot props currency.
import type { PropsLocale, PropsRuntime, InjectFace } from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: BoundActions now lives in the store contract (ui-slots no longer re-exports it).
import type { BoundActions } from '@deepseek-ai/dsh-client-store'

import { LanguageSwitcherRow } from './LanguageSwitcherRow.tsx'
import type { LanguageSwitcherInjected } from './LanguageSwitcherRow.tsx'
import { createLanguageSwitcherStore } from './settings-store.ts'
import { ConversationLanguagePageController } from './plugin-detail-controller.ts'
import type { ConversationLanguageSettings } from './plugin-detail-controller.ts'
import { ConversationLanguageDetailPage } from './plugin-detail-page.tsx'
import { zh as zhDict, en as enDict } from '../locales/index.ts'
// Shared barrel: keeps this bundle free of Host-only package value imports.
import {
  CONVERSATION_LANGUAGE_NAMESPACE,
  PLUGIN_PACKAGE_NAME,
  PLUGIN_ROW_CONFIG_KEY,
  type ConversationLanguage,
} from '../shared.ts'

const DICT_NS = 'settings.conversation-language'

export const inject = ['slots', 'locale', 'configForms', 'connection'] as const

export function apply(ctx: ClientContext): void {
  const slots = ctx.get('slots')!
  const locale = ctx.get('locale')!

  // Register locale dictionaries
  ctx.effect(() => locale.register(DICT_NS, { zh: zhDict, en: enDict }), 'conversation-language: dictionaries')

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
    locale: DICT_NS,
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

  // 详情页：把语言选择表单挂到插件详情页。
  // 参照 ui-settings-shell：whileServed 保证部署从未组合宿主侧的
  // 命名空间时，页面不留任何痕迹；注册随 served 变化自动增删。
  const detailPage = new ConversationLanguagePageController(
    ctx.get('configForms')!.get<ConversationLanguageSettings>(CONVERSATION_LANGUAGE_NAMESPACE)
  )
  ctx.effect(() => () => {
    detailPage.dispose()
  }, 'conversation-language: detail form subscriptions')

  ctx.effect(() => ctx.get('configForms')!.whileServed([CONVERSATION_LANGUAGE_NAMESPACE], () => {
    // Bundle 详情页（点击插件名字打开的画面）：描述与行之间的配置区块。
    const bundleDisposer = slots.inject('plugins.bundle.config', () => slots.register({
      name: 'plugins.bundle.config',
      key: PLUGIN_PACKAGE_NAME,
      locale: DICT_NS,
      inject: () => detailPage.inject(),
    }, ConversationLanguageDetailPage))
    // 行详情页（行上"配置"控件打开的画面）：`<package>#<row id>` key。
    const rowDisposer = slots.inject('plugins.row.config', () => slots.register({
      name: 'plugins.row.config',
      key: PLUGIN_ROW_CONFIG_KEY,
      locale: DICT_NS,
      inject: () => detailPage.inject(),
    }, ConversationLanguageDetailPage))
    return () => {
      rowDisposer()
      bundleDisposer()
    }
  }), 'conversation-language: detail page')
}
