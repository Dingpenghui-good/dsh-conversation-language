/**
 * 对话语言插件详情页的 staged form：把宿主 settings 命名空间桥接到
 * 插件详情页（plugins.bundle.config / plugins.row.config）的保存控件。
 * 参照 ui-settings-shell 的 ShellCardController 模式。
 */
import type { SnapshotStore } from '@deepseek-ai/dsh-client-store'
import {
  SettingsFormModel,
  type SettingsFieldState,
  type SettingsFormActions,
  type SettingsFormScope,
  type SettingsFormShell,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { ConfigForm } from '@deepseek-ai/dsh-client-ui-settings/client'
import type { ConversationLanguage } from '../shared.ts'

/** 详情页编辑的字段 —— 命名空间 schema 的子集。 */
export interface ConversationLanguageSettings {
  /** 对话语言。 */
  conversationLanguage?: ConversationLanguage
}

/** 详情页渲染的表单状态。 */
export interface ConversationLanguagePageState extends SettingsFormShell {
  conversationLanguage: SettingsFieldState
}

/** 注册侧注入给详情页组件的面。 */
export interface ConversationLanguagePageFace extends SettingsFormActions {
  hooks: {
    /** 页面快照，渲染器绑定为 useConversationLanguagePage。 */
    conversationLanguagePage: SnapshotStore<ConversationLanguagePageState>
  }
}

/** 语言字段的 format/parse 规范：只接受 'zh' / 'en'，空串清除回继承层。 */
function languageFieldSpec() {
  const accepted: readonly string[] = ['zh', 'en']
  return {
    field: 'conversationLanguage',
    format: (value: unknown) => (typeof value === 'string' ? value : ''),
    parse: (text: string) => {
      const trimmed = text.trim()
      if (accepted.includes(trimmed)) return { kind: 'set' as const, value: trimmed }
      if (trimmed === '') return { kind: 'clear' as const }
      return undefined
    },
  }
}

/**
 * 把命名空间的 `ConfigForm` 适配为 `SettingsFormModel` 需要的
 * `SettingsFormScope`：两者读快照形状一致，只有 `mutate` 操作类型不同
 * （`SettingsFormPathOp` vs `SettingsPathOpView`），页面只做读与原子写，
 * 故按结构复用。
 */
function asFormScope(
  scope: ConfigForm<ConversationLanguageSettings>
): SettingsFormScope<ConversationLanguageSettings> {
  return {
    getSnapshot: () => {
      const s = scope.getSnapshot()
      return {
        status: s.status,
        value: s.value,
        base: s.base,
        user: s.user,
        writable: s.writable,
        revision: s.revision,
      }
    },
    subscribe: (listener) => scope.subscribe(listener),
    mutate: (ops, expectedRevision) => scope.mutate(ops as never, expectedRevision),
  }
}

/** 把一个宿主 settings 命名空间桥接到详情页的 staged form。 */
export class ConversationLanguagePageController {
  private readonly form: SettingsFormModel<ConversationLanguageSettings>
  private readonly store: SnapshotStore<ConversationLanguagePageState>

  /** @param scope - 共享配置表单（命名空间的 ConfigForm）。 */
  constructor(scope: ConfigForm<ConversationLanguageSettings>) {
    this.form = new SettingsFormModel(asFormScope(scope), [languageFieldSpec()])
    this.store = this.form.bind(() => this.projection())
  }

  private projection(): ConversationLanguagePageState {
    return {
      ...this.form.shell(),
      conversationLanguage: this.form.field('conversationLanguage'),
    }
  }

  /**
   * 构建详情页 slot 注册注入的面。
   * @returns 页面快照与表单动作。
   */
  inject(): ConversationLanguagePageFace {
    return { hooks: { conversationLanguagePage: this.store }, ...this.form.actions() }
  }

  /** 释放表单订阅。 */
  dispose(): void {
    this.form.dispose()
  }
}
