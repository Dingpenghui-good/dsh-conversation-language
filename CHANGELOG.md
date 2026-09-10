# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
