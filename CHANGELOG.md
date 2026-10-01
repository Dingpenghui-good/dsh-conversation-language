# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.2.3] - 2026-10-01

### Fixed
- **宿主包出现在 `dependencies` 会导致任何工具调用崩溃**：`@deepseek-ai/dsh-tools`（以及 `cordis`、`dsh-settings`、`dsh-system-prompt`、`dsh-client-*` 等 9 个宿主包）原先声明在 `dependencies`，pnpm 会在 profile 内装出第二份模块副本。DSH 通过模块级 Symbol（`TOOL_RUNTIME_SCHEDULER = Symbol(...)`）定位工具调度器，而 `Symbol()` 跨模块副本不共享身份，于是 `ctx.tools[TOOL_RUNTIME_SCHEDULER].prepare(...)` 取到 `undefined`，抛出 `Cannot read properties of undefined (reading 'prepare')`。现按官方插件的做法，把这些宿主包全部移入 `peerDependencies`（并保留在 `devDependencies` 供本地构建），`dependencies` 只留下 `@deepseek-ai/schemastery` 与 `react`。
- 升级后需**完全重启 DSH**：旧版本已污染当前进程的服务实例，仅卸载插件不会恢复。

---

### Fixed
- **Host packages declared under `dependencies` crashed every tool call**: `@deepseek-ai/dsh-tools` (plus `cordis`, `dsh-settings`, `dsh-system-prompt`, `dsh-client-*` — 9 host packages in total) were listed as `dependencies`, so pnpm installed a second module copy inside the profile. DSH locates the tool scheduler through a module-level symbol (`TOOL_RUNTIME_SCHEDULER = Symbol(...)`), and `Symbol()` has no shared identity across module copies, so `ctx.tools[TOOL_RUNTIME_SCHEDULER].prepare(...)` evaluated to `undefined` and threw `Cannot read properties of undefined (reading 'prepare')`. Following the official plugins' convention, all host packages now live in `peerDependencies` (and stay in `devDependencies` for local builds); `dependencies` keeps only `@deepseek-ai/schemastery` and `react`.
- A **full DSH restart** is required after upgrading: previous versions already poisoned the running process's service instance, and uninstalling alone will not recover it.

## [3.2.2] - 2026-10-01

### Changed
- 包名由 `dsh-conversation-language` 变更为 `@dingpenghui/dsh-conversation-language`，插件 id、`plugins.bundle.config` / `plugins.row.config` slot key、`cordis.patch.yml`、README 与契约测试断言同步更新。
- 补充 `publishConfig.access = public`，确保 scoped 包以公开方式发布。

---

### Changed
- Package renamed from `dsh-conversation-language` to `@dingpenghui/dsh-conversation-language`; the plugin id, `plugins.bundle.config` / `plugins.row.config` slot keys, `cordis.patch.yml`, README and contract-test assertions were updated accordingly.
- Added `publishConfig.access = public` so the scoped package publishes publicly.

## [3.2.1] - 2026-10-01

### Fixed
- `contract-test.mjs` 不再硬编码作者机器上的 profile 路径（`C:/Users/braindge/.dsh/profiles/web/...`），改为按优先级解析客户端 bundle：`DSH_CONVERSATION_LANGUAGE_CLIENT` 环境变量 → 本地构建产物 `lib/client.js` → DSH web profile 中的安装副本。断言逻辑完全未变，契约测试现在可在任意机器上复现。
- 补记 `3.2.0` 的 CHANGELOG 条目（此前 tag/release 已发但 changelog 缺失）。

---

### Fixed
- `contract-test.mjs` no longer hardcodes the author's profile path (`C:/Users/braindge/.dsh/profiles/web/...`). The client bundle is now resolved in priority order: `DSH_CONVERSATION_LANGUAGE_CLIENT` → locally built `lib/client.js` → installed copy in a DSH web profile. Assertions are unchanged; the contract test now runs on any machine.
- Backfilled the missing `3.2.0` CHANGELOG entry.

## [3.2.0] - 2026-09-29

### Changed
- 移除通用设置行（`settings.general.item`）；语言设置仅通过插件详情页入口提供，避免同一功能出现两个入口

---

### Changed
- Removed the general-settings row (`settings.general.item`); the plugin detail page is now the single entry point for the language setting

## [3.1.0] - 2026-09-29

### Breaking
- 适配 DSH `0.2.0-rc.1` 的 breaking changes（client 侧全部 6 个 `@deepseek-ai/*` 依赖升级到 `0.2.0-rc.1`），同时保持 0.1.7 兼容基线
- schemastery 的 `Config` schema 由 `z.union(['zh','en']).volatile().default('zh')`（旧版推断为 `Schema<any,any>`）改为 `z.union([z.const('zh'), z.const('en')]).volatile().default('zh')`，以匹配 0.2.0-rc.1 更严格的 `TypeS`/`TypeT` 推断

### Changed
- `IconChevronDownOutline14` → `IconChevronDownOutlineMedium`（0.2.0 primitives 图标命名变更）
- 移除旧 `src/types.ts`（`CONVERSATION_LANGUAGE_NAMESPACE`、`ConversationLanguage`、`ConversationLanguageSettings` 等已移入 `src/shared.ts` / `src/client/plugin-detail-controller.ts`）
- 详情页注册改为 `whileServed` + `slots.inject` 守卫模式（参照 `ui-settings-shell`）：
  - `plugins.bundle.config`（点击插件名字打开的画面）
  - `plugins.row.config`（行上"配置"控件打开的画面）
  - 部署从未组合宿主侧命名空间时，页面不留任何痕迹
- 新增 `src/client/plugin-detail-controller.ts`：详情表单状态管理（草稿编辑、保存、复位）
- 新增 `src/client/plugin-detail-page.tsx`：详情页 UI（`SettingsFormModel` + `SegmentedControl`）
- 新增 `src/client/PluginDetailPage.module.css`
- `src/client/LanguageSwitcherRow.tsx`：`Menu` 改为受控 `open`/`onClose` + 自定义 `anchor`（button + chevron），替代原生 `<select>`
- `src/client/index.ts`：`locale.register` 改由 `ctx.effect` 包裹；`BoundActions` 改从 `@deepseek-ai/dsh-client-store` 导入（ui-slots 0.2.0 不再 re-export）
- 新增 devDependencies：`@deepseek-ai/dsh-client-locale`、`@deepseek-ai/dsh-client-ui-renderer`（type-only，0.2.0-rc.1）

---

### Breaking
- DSH `0.2.0-rc.1` compatibility: all six client-side `@deepseek-ai/*` deps bumped to `0.2.0-rc.1`; schemastery `Config` schema now uses `z.const` literals (`z.union([z.const('zh'), z.const('en')])`) to match the stricter `TypeS`/`TypeT` inference
### Changed
- `IconChevronDownOutline14` → `IconChevronDownOutlineMedium` (0.2.0 primitives icon rename)
- Removed stale `src/types.ts` (namespace/language/settings types now live in `src/shared.ts` / `src/client/plugin-detail-controller.ts`)
- Detail-page registration now uses `whileServed` + `slots.inject` guard (per `ui-settings-shell`): `plugins.bundle.config` (click plugin name) and `plugins.row.config` (row "Configure" control); a deployment that never composed the owner shows no trace of the page
- Added `src/client/plugin-detail-controller.ts` (form draft edit/save/reset state) and `src/client/plugin-detail-page.tsx` (`SettingsFormModel` + `SegmentedControl`)
- `LanguageSwitcherRow.tsx`: `Menu` is now a controlled `open`/`onClose` with a custom `anchor` (button + chevron) instead of a native `<select>`
- `index.ts`: `locale.register` wrapped in `ctx.effect`; `BoundActions` now imported from `@deepseek-ai/dsh-client-store` (ui-slots 0.2.0 no longer re-exports it)
- New devDependencies: `@deepseek-ai/dsh-client-locale`, `@deepseek-ai/dsh-client-ui-renderer` (type-only, 0.2.0-rc.1)

## [2.0.0] - 2026-XX-XX

### Breaking
- 适配 DSH `0.1.7-alpha.2+` 的 settings 框架重构：旧宿主侧 `settings.register(namespace, schema)` 命名空间模式已移除
- 全部 `@deepseek-ai/dsh-*` 依赖区间 `^0.1.5-rc.1` → `^0.1.7-alpha.2`；`@deepseek-ai/schemastery` 升至 `^3.18.4`（`.volatile()` 元数据 API）

### Changed
- **宿主侧**：改为声明 plugin entry `Config` schema（`z.union(['zh','en']).volatile().default('zh')`），settings 框架按 profile entry id 自动投影命名空间；`system-prompt/assemble` 拦截器在每次组装时通过 `ctx.settings.describe()` 读取实时值
- **宿主侧 inject**：`['settings', 'systemPrompt', 'tools']` → `['systemPrompt', 'tools']`。Cordis 要求 inject 列表中的服务全部已挂载，settings 服务仅在 profile 上下文（configEditor + profileContext）中可用；缺失时 `getLanguage()` 回退默认 `zh`
- **客户端侧**：移除已废弃的 `settingsScope` 服务通道，改用 `ctx.configForms.get('tool-conversation-language')` 的 `getSnapshot()/subscribe()/set()`；写入经 `remote.settings.mutate` 落到当前 profile 的 Cordis patch
- 共享常量（namespace、语言类型）抽到 `src/shared.ts`，客户端 bundle 不再 value-import 任何宿主侧包（purity gate）
- Settings 持久化目标由 `~/.dsh/settings.yaml` 改为当前 profile 的 `cordis.patch.yml`；`settings.yaml` 旧 section 走 legacy 迁移且不在映射表内
- 新增 `client-verify.mjs`（客户端 bundle 结构回归）与 `runtime-verify.mjs`（宿主侧 0.1.7 服务回归）

---

### Breaking
- DSH `0.1.7-alpha.2+` settings framework rework: the old Host `settings.register(namespace, schema)` seam no longer exists
- Every `@deepseek-ai/dsh-*` range `^0.1.5-rc.1` → `^0.1.7-alpha.2`; `@deepseek-ai/schemastery` bumped to `^3.18.4` (the `.volatile()` metadata API)

### Changed
- **Host half**: now declares a plugin entry `Config` schema (`z.union(['zh','en']).volatile().default('zh')`); the settings framework projects the namespace by profile entry id, and the `system-prompt/assemble` interceptor reads the live value through `ctx.settings.describe()` on every assembly
- **Host inject list**: `['settings', 'systemPrompt', 'tools']` → `['systemPrompt', 'tools']`. Cordis requires every injected service to be mounted; the settings service only exists in profile contexts (configEditor + profileContext), so `getLanguage()` falls back to the `zh` default when it is absent
- **Client half**: the removed `settingsScope` service is replaced by `ctx.configForms.get('tool-conversation-language')` — `getSnapshot()/subscribe()/set()`, with writes flowing through `remote.settings.mutate` into the active profile's Cordis patch
- Shared constants (namespace, language type) moved to `src/shared.ts` so the client bundle no longer value-imports any Host-only package (purity gate)
- Settings now persist to the active profile's `cordis.patch.yml` instead of `~/.dsh/settings.yaml`; legacy `settings.yaml` sections migrate via the legacy import mapping (this namespace is not in that table)
- Added `client-verify.mjs` (client bundle structure regression) and reworked `runtime-verify.mjs` for the 0.1.7 service surface
## [1.5.1] - 2026-09-12

### Changed
- 语言指令的作用域从「思考过程 + 回复内容」扩展到**所有面向用户可见的文本**，明确
  要求工具调用的参数值使用当前语言：`pwsh`/`bash` 的 `description`、`todo_write` 的
  `content`、`subagent` 的 `description`、任务与作业名称等，并禁止沿用工具 schema 中
  的英文示例措辞。此前 `pwsh` 卡片上显示的描述始终是英文——该文案取自调用的
  `description` 参数，而旧指令只约束「思考」与「回复内容」，工具参数被模型视为第三类
  文本，加上 `dsh-tool-pwsh` 的参数 schema 自带英文示例（`"ls" → "List files in
  current directory"`），于是稳定输出英文 active voice

---

### Changed
- The language instruction now covers **every user-visible string**, not just
  "thinking" and "response content": tool-call argument values must use the
  current language (`pwsh`/`bash` `description`, `todo_write` `content`,
  `subagent` `description`, job and task titles), and must not reuse the English
  wording of a tool schema's examples. Previously the `pwsh` card always showed an
  English description, because that text is the call's `description` argument —
  outside the old instruction's scope — and `dsh-tool-pwsh` ships English examples
  in its parameter schema (`"ls" → "List files in current directory"`)

## [1.5.0] - 2026-07-17

### Fixed
- 适配 DSH `0.1.5-rc.1`：`@deepseek-ai/dsh-system-prompt` 已移除 `PERSONA_SECTION`，
  persona section 拆分为 `PERSONA_PREFIX_SECTION`（`deployment:persona-prefix`，order 0）
  与 `PERSONA_SUFFIX_SECTION`（`deployment:persona-suffix`，order 10200）。
  宿主侧改为优先向 prefix section 追加语言指令，prefix 缺失时回退 suffix；
  旧版本中 `PERSONA_SECTION` 的 ESM 具名导入会在 0.1.5+ 运行时抛链接错误，导致宿主半
  （settings 注册 / tool / waterfall 拦截）整体失效
- 全部 `@deepseek-ai/dsh-*` 依赖区间 `^0.1.2-rc.1` → `^0.1.5-rc.1`
  （npm/pnpm 的预发布版本 semver 规则下，旧区间永远解析不到 `0.1.5-rc.1`，
  会固定回旧包并静默失效）
- `tsdown.config.ts` 中失效的 external 名 `@deepseek-ai/dsh-client-web-react`
  → `@deepseek-ai/dsh-client-web`

---

### Fixed
- DSH `0.1.5-rc.1` compatibility: `@deepseek-ai/dsh-system-prompt` dropped
  `PERSONA_SECTION`; the persona is now split into `PERSONA_PREFIX_SECTION`
  (`deployment:persona-prefix`, order 0) and `PERSONA_SUFFIX_SECTION`
  (`deployment:persona-suffix`, order 10200). The Host half now appends the
  language instruction to the prefix section (falling back to the suffix); the
  old named ESM import of `PERSONA_SECTION` throws a link error on 0.1.5+ and
  disables the entire Host half (settings namespace, tool, waterfall listener)
- Bumped every `@deepseek-ai/dsh-*` range `^0.1.2-rc.1` → `^0.1.5-rc.1`
  (npm/pnpm prerelease semver rules mean the old range can never resolve to
  `0.1.5-rc.1` and silently pins the stale package)
- `tsdown.config.ts`: stale external `@deepseek-ai/dsh-client-web-react`
  renamed to `@deepseek-ai/dsh-client-web`

## [1.4.0] - 2026-09-06

### Changed
- 重构 persona 注入逻辑：不再硬编码完整 persona，改为动态检测当前 preset 的 persona 并只追加语言指令部分
- 精简语言指令内容，移除冗余的行为准则、身份、限制等描述
- 使用 `PERSONA_SECTION` 常量替代硬编码字符串
---

### Changed
- Refactored persona injection logic: no longer hardcodes full persona, dynamically detects current preset's persona and only appends language instruction section
- Simplified language instruction content, removed redundant behavior guidelines, identity, and restrictions
- Uses `PERSONA_SECTION` constant instead of hardcoded string

## [1.3.0] - 2026-09-04

### Fixed
- 将 `@deepseek-ai/dsh-client-runtime/client` 替换为 `@deepseek-ai/dsh-client-store`，修复模块表解析问题
- `ClientContext` 类型改为从 `@deepseek-ai/cordis` 导入
- `tsdown.config.ts` 构建配置同步更新，移除对 `dsh-client-runtime` 的特殊处理

---

### Fixed
- Replaced `@deepseek-ai/dsh-client-runtime/client` with `@deepseek-ai/dsh-client-store` to fix module table resolution
- `ClientContext` type now imported from `@deepseek-ai/cordis`
- Updated `tsdown.config.ts` build config, removed special handling for `dsh-client-runtime`

## [1.2.4] - 2026-09-03

### Changed
- 升级 DSH 依赖到 `alpha.4`（兼容 DSH 0.1.2-alpha.4）：
  - `@deepseek-ai/cordis` ^4.0.1 → ^4.0.2
  - `@deepseek-ai/dsh-client-ui-primitives` ^0.1.1-rc.2 → ^0.1.2-alpha.4
  - 新增 `@deepseek-ai/dsh-client-ui-settings` ^0.1.2-alpha.4
  - `@deepseek-ai/dsh-client-ui-slots` ^0.1.1-rc.2 → ^0.1.2-alpha.4
  - `@deepseek-ai/dsh-settings` ^0.1.1-rc.2 → ^0.1.2-alpha.4
  - `@deepseek-ai/dsh-tools` ^0.1.1-rc.2 → ^0.1.2-alpha.4
  - `@deepseek-ai/schemastery` ^3.18.1 → ^3.18.2
  - 新增 `typescript` devDependency ^7.0.2
  - `@deepseek-ai/dsh-client-runtime` 保持 ^0.1.1-rc.2（未发布 alpha.4）

---

### Changed
- Bumped DSH deps to alpha.4 for DSH 0.1.2-alpha.4 compatibility (see list above)

## [1.2.3] - 2026-09-03

### Fixed
- 移除 `settingsNamespace` 依赖以兼容 dsh-settings 0.1.2-alpha；namespace 字符串现在直接传给 `register()`

---

### Fixed
- Removed `settingsNamespace` dependency for dsh-settings 0.1.2-alpha compatibility; namespace string is now passed directly to `register()`

## [1.2.2] - 2026-08-20

### Fixed
- 修复插件安装时出现重复 loader entry id 错误（移除 `cordis.yml` 中的静态 entry 定义，改为仅通过 bundle patch 机制安装）

---

### Fixed
- Resolved duplicate loader entry id error on plugin install (removed static entry definition from `cordis.yml`, now installs via bundle patch mechanism only)

## [1.2.1] - 2026-08-XX

## [1.2.0] - 2026-08-XX

### Added
- 实现方案 A：基于闭包 persona 状态 + waterfall 拦截的语言切换，确保语言一致性

---

### Added
- Implemented scheme A with closed-over persona state + waterfall interception for consistent language switching
