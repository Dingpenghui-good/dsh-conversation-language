/**
 * Declaration-merge the `settings.conversation-language` locale namespace into
 * the slots `LocaleNamespaceMap`, so `locale: DICT_NS` is accepted and the
 * framework-injected `t` seat carries the typed dictionary-key domain.
 *
 * The value is the union of this namespace's dictionary keys (0.2.0-rc.1
 * shape — not an object, a string-literal union). It must exactly match the
 * keys present in `zh`/`en` in `src/locales/index.ts`; `LocaleDictOf` checks
 * a typed registration's dictionary against it.
 * `export {}` makes this a module file so the `declare module` block is a
 * module augmentation (merges with the resolved slots module) rather than an
 * ambient module declaration.
 */
export {}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'settings.conversation-language':
      | 'title'
      | 'description'
      | 'page.label'
      | 'page.hint'
      | 'form.unavailable'
      | 'form.readOnly'
      | 'form.saveFailed'
      | 'form.save'
      | 'form.saving'
      | 'form.overridden'
      | 'form.reset'
      | 'form.invalid'
  }
}
