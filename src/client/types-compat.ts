/**
 * Type compatibility layer for @deepseek-ai/dsh-client-ui-slots.
 *
 * TypeScript 5.x bundler resolution has a bug where `export *` re-exports
 * from an ESM `.d.ts` package are not visible. These types are declared
 * locally to match the runtime values provided by the package.
 */
import type { ActionsDecl, BakedActions, SnapshotSelectorHook, StoreHandle } from '@deepseek-ai/dsh-client-store'

/** Translate a dictionary key with optional `{name}` template params. */
export type Translate<K extends string = string> = (key: K, params?: Record<string, unknown>) => string

/** Locale namespace share for the `t` prop. */
export type PropsLocale<N extends string> = { t: (key: string, params?: Record<string, unknown>) => string }

/** Runtime props share for a slot key. */
export type PropsRuntime<K extends string, EntryKey extends string = string> = {
  [key: string]: unknown
} & { renderSlot: (key: string, owner: object, opts?: object) => import('react').ReactNode }

/** Store props share. */
export type PropsStore<H extends StoreHandle<any, any>> = H extends StoreHandle<infer T, infer A>
  ? { useStore: SnapshotSelectorHook<T>; actions: BakedActions<T, A> }
  : object

/** Baked actions from a store handle. */
export type BoundActions<H extends StoreHandle<any, any>> = H extends StoreHandle<infer T, infer A>
  ? BakedActions<T, A>
  : never
