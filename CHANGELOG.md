# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
