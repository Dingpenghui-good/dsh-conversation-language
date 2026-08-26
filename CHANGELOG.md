# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.3] - 2026-08-26

### Changed
- 升级 `@deepseek-ai` peer 依赖：`dsh-client-runtime`、`dsh-client-ui-primitives`、`dsh-client-ui-slots`、`dsh-settings`、`dsh-tools` 从 `^0.1.0-rc.5` 更新至 `^0.1.1-rc.2`

---

### Changed
- Bumped `@deepseek-ai` peer dependencies (`dsh-client-runtime`, `dsh-client-ui-primitives`, `dsh-client-ui-slots`, `dsh-settings`, `dsh-tools`) from `^0.1.0-rc.5` to `^0.1.1-rc.2`

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
