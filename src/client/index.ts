/**
 * Client-side entry for the conversation language switcher plugin.
 * Registers a plugin detail page (the screen opened when clicking the plugin's
 * name in the Plugins list) through the Plugins page's `plugins.bundle.config`
 * and `plugins.row.config` slots.
 *
 * Architecture (DSH 0.2.0-rc.1): the detail page binds to the
 * Host's settings form through `ctx.configForms.get(CONVERSATION_LANGUAGE_NAMESPACE)`
 * — the settings framework mirrors the Host descriptor into the browser and
 * queues writes against the active profile's Cordis patch. Detail-page
 * registration follows the `ui-settings-shell` pattern:
 * `ctx.configForms.whileServed([NS], …)` + `ctx.slots.inject(...)`, so a
 * deployment that never composed the owner shows no trace of the page.
 *
 * The language switcher is reachable only from the plugin detail page —
 * we no longer register a row into the General Settings section
 * (`settings.general.item`); the plugin list page is the single entry point.
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

import { ConversationLanguagePageController } from './plugin-detail-controller.ts'
import type { ConversationLanguageSettings } from './plugin-detail-controller.ts'
import { ConversationLanguageDetailPage } from './plugin-detail-page.tsx'
import { zh as zhDict, en as enDict } from '../locales/index.ts'
// Shared barrel: keeps this bundle free of Host-only package value imports.
import {
  CONVERSATION_LANGUAGE_NAMESPACE,
  PLUGIN_PACKAGE_NAME,
  PLUGIN_ROW_CONFIG_KEY,
} from '../shared.ts'

const DICT_NS = 'settings.conversation-language'

export const inject = ['slots', 'locale', 'configForms', 'connection'] as const

export function apply(ctx: ClientContext): void {
  const slots = ctx.get('slots')!
  const locale = ctx.get('locale')!

  // Register locale dictionaries
  ctx.effect(() => locale.register(DICT_NS, { zh: zhDict, en: enDict }), 'conversation-language: dictionaries')

  // 详情页:把语言选择表单挂到插件详情页。
  // 参照 ui-settings-shell:whileServed 保证部署从未组合宿主侧的
  // 命名空间时,页面不留任何痕迹;注册随 served 变化自动增删。
  const detailPage = new ConversationLanguagePageController(
    ctx.get('configForms')!.get<ConversationLanguageSettings>(CONVERSATION_LANGUAGE_NAMESPACE)
  )
  ctx.effect(() => () => {
    detailPage.dispose()
  }, 'conversation-language: detail form subscriptions')

  ctx.effect(() => ctx.get('configForms')!.whileServed([CONVERSATION_LANGUAGE_NAMESPACE], () => {
    // Bundle 详情页(点击插件名字打开的画面):描述与行之间的配置区块。
    const bundleDisposer = slots.inject('plugins.bundle.config', () => slots.register({
      name: 'plugins.bundle.config',
      key: PLUGIN_PACKAGE_NAME,
      locale: DICT_NS,
      inject: () => detailPage.inject(),
    }, ConversationLanguageDetailPage))
    // 行详情页(行上"配置"控件打开的画面):`<package>#<row id>` key。
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
