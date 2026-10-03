# 发布说明 v3.2.4

**日期：** 2026-10-03

## 修复 / Fixes

- **依赖模型重构**：`@deepseek-ai/schemastery` 和 `react` 从运行时 `dependencies` 移到 `peerDependencies`（`schemastery` 标 `optional`），仅保留 `@deepseek-ai/cordis` 作为必选 peer。
  - 根因：本插件是 DSH 宿主扩展，运行时在宿主进程内执行。宿主已经把 `schemastery` 加载进同一进程作为宿主模块。本插件若再以 `dependencies` 携带同版本包，pnpm 会在插件树里**再实例化一份**，与宿主单实例不一致。
  - 影响：插件自身代码行为不变，只改变了"谁提供这些包"——现在统一由 DSH 宿主提供，单实例。
- **`react` 保持为 devDependency**：客户端 bundle 在构建时内嵌 `react` 代码（`tsdown.config.ts` 的 `CLIENT_EXTERNALS` 不含 `react`），不需要宿主提供 `react` 实例，因此不移到 peer。

## 不变 / Unchanged

- `dsh-tools` / `dsh-system-prompt` / `dsh-settings` 等宿主模块仍是 `peerDependencies`（`^0.2.0-rc.1` 匹配宿主 0.2.0-rc.2，宿主提供单实例）。
- 斜杠命令 `/language`、详情页开关、宿主轮询同步全部保持不变。

## 升级指引 / Upgrade

- 从 3.2.3 升到 3.2.4 无 breaking change，直接 `pnpm update @dingpenghui/dsh-conversation-language` 即可。
