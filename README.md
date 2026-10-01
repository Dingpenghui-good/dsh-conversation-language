# dsh-conversation-language

DSH 插件：对话语言切换器

## 功能

允许在中文和英文之间切换对话语言。切换后 AI 将使用对应语言进行思考和回复。

### 特性

- 🖱️ 点击插件名即可打开**详情页**（含语言选择表单与保存/恢复默认按钮），通用设置不再出现重复入口
- 🔄 动态更新 Persona（系统提示），无需重启即可生效
- 💾 设置通过 profile 的 Cordis patch 持久化（当前 profile 的 `cordis.patch.yml`）
- 🎨 匹配 DSH 原生界面样式

## 安装

> ⚠️ **安装完成后必须重启 DeepSeek Harness**，插件才能生效。

### 方式一：使用 dsh 命令（推荐）

```bash
# 先 cd 到插件目录
cd /path/to/dsh-conversation-language
dsh plugin --profile web add .
```

### 方式二：手动安装

1. 克隆插件到 plugins 目录：
```bash
git clone https://github.com/Dingpenghui-good/dsh-conversation-language.git ~/.dsh/plugins/dsh-conversation-language
# Windows: git clone https://github.com/Dingpenghui-good/dsh-conversation-language.git %USERPROFILE%\.dsh\plugins\dsh-conversation-language
```

2. 添加到 `~/.dsh/profiles/web/package.json`：
```json
{
  "dependencies": {
    "@dingpenghui/dsh-conversation-language": "link:C:/Users/<你的用户名>/.dsh/plugins/dsh-conversation-language"
  },
  "dsh": {
    "profile": {
      "bundles": [
        // ... 其他 bundles
        "@dingpenghui/dsh-conversation-language"
      ]
    }
  }
}
```

3. 运行安装：
```bash
cd ~/.dsh/profiles/web
pnpm install
```

4. **重启 DeepSeek Harness**。

## 配置

### 方式一：通过插件详情页

重启 DSH 后，打开 **插件 → @dingpenghui/dsh-conversation-language**，在详情页的语言选择表单中切换并保存。

### 方式二：直接修改 profile patch

编辑当前 profile 的 `cordis.patch.yml`（Windows：`%USERPROFILE%\.dsh\profiles\web\cordis.patch.yml`）：

```yaml
- id: tool-conversation-language
  config:
    conversationLanguage: en   # 或 zh
```

然后重启 DSH。

> 2.0.0 起设置不再写入 `~/.dsh/settings.yaml`：新架构中每个插件 entry 的
> `Config` schema 由 settings 框架投影，写入目标是当前 profile 的 Cordis patch。

## 使用

切换语言后，AI 将自动以对应语言进行思考和回复，并让所有面向用户可见的文本保持同一语言——
包括工具调用的参数值（`pwsh`/`bash` 卡片上显示的 `description`、`todo_write` 的 `content`、
`subagent` 的 `description`、任务与作业名称等）。也可通过 `get_conversation_language` Tool
查询当前设置。

## 技术说明

| 项目 | 值 |
|------|-----|
| Settings Namespace | `tool-conversation-language`（= profile entry id） |
| Schema | `{ conversationLanguage: 'zh' \| 'en' }`（volatile，默认 `zh`） |
| 默认值 | `zh` (中文) |
| Persona Override | `system-prompt/assemble` waterfall 拦截，按语言在 persona section 追加指令 |
| Tool 注册 | `get_conversation_language` — 查询当前语言设置 |

### 架构（DSH 0.2.0-rc.1+，v3.2.0）

- **宿主侧**（`src/index.ts`）：声明 `Config` schema（`z.union(['zh','en']).volatile().default('zh')`），
  settings 框架按 entry id 自动注册命名空间；`system-prompt/assemble` 拦截器在每次组装时
  通过 `ctx.settings.describe()` 读取实时值，语言切换无需重启。`apply` 注入
  `['systemPrompt', 'tools']`——settings 服务缺失时回退默认 `zh`。
- **客户端侧**（`src/client/`）：
  - **详情页**（唯一入口）：`configForms.whileServed([NS], …)` 守卫注册
    `plugins.bundle.config`（key = 包名）与 `plugins.row.config`（key = `<包名>#<row-id>`）
    两个 slot，渲染 `PluginDetailPage`（摘要行 / 语言表单 + 保存 / 恢复默认）。
    表单走 `SettingsFormModel`（staged form）+ `SettingsForm`，
    在 0.1.7 表面下这两个 slot 名不存在时 `slots.inject` 静默 no-op，不抛异常。
  - v3.2.0 起移除了通用设置行（`settings.general.item`），语言设置仅在插件详情页提供，
    避免同一功能在两个入口重复出现。
  - 共享常量（namespace、语言类型）位于 `src/shared.ts`，保证客户端 bundle 不 value-import
    任何宿主侧包（客户端 bundle purity gate）。

### 插件结构

```
dsh-conversation-language/
├── src/
│   ├── index.ts                    # Host 层：Config schema + persona 拦截 + tool
│   ├── shared.ts                   # 共享常量（namespace / 语言类型）
│   ├── client/
│   │   ├── index.ts                # Client 层：UI 注册（configForms + slots）
│   │   ├── PluginDetailPage.tsx    # React 组件（详情页：表单 + 保存/恢复）
│   │   ├── PluginDetailPage.module.css
│   │   └── plugin-detail-controller.ts # 详情页 staged-form 控制器（SettingsFormModel 桥接）
│   └── locales/
│       └── index.ts                # 国际化字典（zh / en）
├── lib/                            # 构建产物（tsdown 生成，安装时必须存在）
├── cordis.patch.yml                # Cordis bundle patch（entry id = settings namespace）
├── build-and-verify.mjs            # 一键构建 + 全量验证流水线
├── runtime-verify.mjs              # 宿主侧运行时回归
├── client-verify-0.1.7.mjs        # 0.1.7-alpha.2 回归验证
├── contract-test.mjs               # 0.2.0-rc.1 客户端契约模拟验证
├── package.json
└── README.md
```

## 兼容性

| DSH 版本 | 插件版本 | 说明 |
|----------|---------|------|
| 0.1.2-rc.1 | ≤ 1.4.0 | 旧的单一 `deployment:persona` section（`PERSONA_SECTION`） |
| 0.1.5-rc.1 | ≥ 1.5.0 | persona 拆分为 prefix/suffix；宿主侧 settings 采用旧的 `settings.register()` 命名空间模式 |
| 0.1.7-alpha.2+ | ≥ 2.0.0 | settings 框架重构为 plugin entry `Config` schema + `describe()/update()/mutate()`；客户端 `settingsScope` 服务移除，改用 `configForms` |
| **0.2.0-rc.1** | **≥ 3.1.0** | 宿主侧改用 `settings` service（`describe()` + `mutate()`）；客户端注册 `plugins.bundle.config` / `plugins.row.config` slot 实现详情页；`SettingsFormModel`（staged form）+ `SettingsForm` 渲染保存/恢复默认；0.1.7 表面下 slot 降级静默 no-op |
| **0.2.0-rc.1** | **≥ 3.2.0** | 移除通用设置行（`settings.general.item`），语言设置仅在插件详情页提供（唯一入口） |

## 开发

```bash
cd dsh-conversation-language
pnpm install
pnpm run build   # 构建产物到 lib/；安装前必须执行此步
```

升级 DSH 大版本后，可对当前 node_modules 中的 `@deepseek-ai/*` 版本做回归：

```bash
node runtime-verify.mjs        # 宿主侧：tool 注册/执行、system-prompt/assemble 拦截
node client-verify-0.1.7.mjs   # 0.1.7 回归：CJS 包装 / purity gate / slot 降级
node contract-test.mjs         # 0.2.0-rc.1 契约：apply(ctx) 注册行 + whileServed 详情页 + 词典 + 写回
node build-and-verify.mjs      # 一键流水线：tsdown build + tsc + 上述全部验证
```

> ⚠️ **必须执行构建**，插件运行时依赖 `lib/` 下的构建产物，不能直接使用源码。
>
> 请使用 **pnpm** 安装依赖：`@deepseek-ai/dsh-*@0.1.7-alpha.2` 等预发布版本在 npm 注册表中
> 处于「已发布但不可被 npm 解析」状态，`npm install` 会以 `ETARGET` 失败；pnpm 可以正常
> 解析并安装这些版本。

## License

MIT
