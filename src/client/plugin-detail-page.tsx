/**
 * 对话语言插件详情页：点击插件列表中的插件名字后打开的画面。
 * 参照 ui-settings-shell 的 ShellCard 模式：一行摘要（`view: 'summary'`）
 * 或语言选择表单（`view: 'page'`），表单带保存控件。
 */
import type { PropsLocale, PropsRuntime, InjectFace, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { SegmentedControl, SettingsForm } from '@deepseek-ai/dsh-client-ui-primitives'
import type { SegmentedControlOption } from '@deepseek-ai/dsh-client-ui-primitives'
import type { ConversationLanguagePageFace } from './plugin-detail-controller.ts'
import type { ConversationLanguage } from '../shared.ts'
import css from './PluginDetailPage.module.css'

/** 渲染器为详情页绑定的 props。 */
export type ConversationLanguageDetailPageProps =
  & PropsRuntime<'plugins.bundle.config'>
  & PropsLocale<'settings.conversation-language'>
  & InjectFace<ConversationLanguagePageFace>

/** 语言选项（与宿主 schema 的枚举一致）。 */
const LANGUAGE_OPTIONS: readonly SegmentedControlOption<ConversationLanguage>[] = [
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' },
]

/** 从 locale 字典派生 SettingsForm 的标签文案。 */
function formLabels(t: TranslateNS<'settings.conversation-language'>) {
  return {
    unavailable: t('form.unavailable'),
    readOnly: t('form.readOnly'),
    saveFailed: t('form.saveFailed'),
    save: t('form.save'),
    saving: t('form.saving'),
  }
}

/**
 * 渲染详情页：一行摘要（`view: 'summary'`）或语言选择表单（`view: 'page'`）。
 * @param props - 视图、locale 文案、表单快照与动作。
 * @returns 摘要文字，或带保存控件的语言表单。
 */
export function ConversationLanguageDetailPage(props: ConversationLanguageDetailPageProps) {
  const { t } = props
  const state = props.useConversationLanguagePage((snapshot) => snapshot)

  if (props.view === 'summary') {
    return t('description')
  }

  const disabled = !state.writable
  const language = state.conversationLanguage
  // 文本稿映射到分段控件：'zh'/'en' 显示选中；空稿（清除/默认）回落到 'zh' 显示。
  const selectedValue = language.text === 'en' ? 'en' : 'zh'

  return (
    <SettingsForm labels={formLabels(t)} state={state} onSave={props.save} onDiscard={props.discard}>
      <div className={css.page}>
        <div className={css.field}>
          <div className={css.fieldText}>
            <div className={css.title}>{t('page.label')}</div>
            <div className={css.hint}>{t('page.hint')}</div>
          </div>
          <SegmentedControl
            id="conversation-language"
            value={selectedValue}
            options={LANGUAGE_OPTIONS}
            onChange={(next) => {
              props.edit('conversationLanguage', next)
            }}
            label={t('page.label')}
            disabled={disabled}
            className={css.control}
          />
        </div>
      </div>
    </SettingsForm>
  )
}
