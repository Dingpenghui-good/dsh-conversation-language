/// <reference types="vite/client" />

declare module '*.module.css' {
  const classes: Readonly<Record<string, string>>
  export default classes
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'settings.conversation-language': {
      'conversation-language.title': string
      'conversation-language.hint': string
    }
  }
}
