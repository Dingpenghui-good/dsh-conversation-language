# v4.0.0 — 适配 DSH 0.2.2：修复 `assembly.tools is not iterable`

> `@dingpenghui/dsh-conversation-language@4.0.0`

## 症状

在 DSH `0.2.2-rc.3` 上安装本插件后，**每一轮对话都直接失败**：

```
本轮运行失败: assembly.tools is not iterable
```

插件装得上（门禁通过、Loader 行 active），但模型步骤全部报错，等于整机不可用。

## 根因

DSH `0.2.1-rc.2` 起（升级指南 *Declare conditional tools through step admission*）把工具声明
从 `system-prompt/assemble` 里移走了：

```ts
// 0.2.0 及更早：waterfall 收到带 tools 的装配结果
'system-prompt/assemble'(
  assembly: PromptPresentation & { tools: ToolSchema[] },
  context: AssembleContext,
  next,
)

// 0.2.1-rc.2+：只收到 sections / contexts / variables
'system-prompt/assemble'(
  assembly: PromptPresentation,   // { sections, contexts, variables }
  context: AssembleContext,
  next,
)
```

工具声明改由 **step 准入的 provider** 拥有（`ctx.tools.register(def, { when })` +
`systemPrompt.tools(provider)`），waterfall 返回的 `tools` 字段被忽略。

旧版本插件在 waterfall 里逐条给工具描述加语言前缀：

```ts
for (const tool of assembly.tools) { … }   // 0.2.2 上 assembly.tools === undefined
```

于是 `for…of undefined` 直接抛 `TypeError`，异常从瀑布冒泡，整个模型步骤失败。
这不是「装不上」，而是「装上了但每次运行都崩」——`engines.dsh` 区间
（`>=0.2.0-rc.1 <0.3.0-0`）同时放行了 0.2.0 与 0.2.2，两个版本的 `assemble` 契约却不同。

## 修复

**不再改写工具 schema**，语言指令改为独立注册的 prompt section：

```ts
ctx.effect(() => ctx.systemPrompt.section({
  name: 'conversation-language:instruction',
  order: ctx.systemPrompt.getSectionOrder('DEPLOYMENT_PERSONA_PREFIX') + 1,
  text: () => (getLanguage() === 'en' ? LANGUAGE_INSTRUCTION_EN : LANGUAGE_INSTRUCTION_ZH),
}), 'conversation-language: instruction section')
```

- `text` 是回调，每次装配求值，因此**切换语言仍然即时生效**（无需重启、无需重新装配 fiber）；
- 位置紧随 `deployment:persona-prefix`（order 0），语义上仍是「persona 级指令」；
- 删除对 `assembly.tools` 的全部读写，插件不再依赖已移除的字段；
- 语言指令文本保留 v1.5.1 起对**工具调用参数值**的约束（`pwsh`/`bash` 的 `description`、
  `todo_write` 的 `content`、`subagent` 的 `description` 等），这条规则不依赖改写 schema。

工具注册本身不变，仍是 `ctx.tools.register(defineTool(...))`。

## 兼容性

| 项目 | 旧 | 新 |
|---|---|---|
| `engines.dsh` | `>=0.2.0-rc.1 <0.3.0-0` | `>=0.2.2-rc.1 <0.3.0-0` |
| `@deepseek-ai/cordis` | `^4.0.2` | `^4.1.0` |
| `@deepseek-ai/dsh-*`（peer） | `^0.2.0-rc.1` | `^0.2.2-rc.1` |
| `@deepseek-ai/schemastery`（peer） | `^3.18.4` | `^3.19.0` |
| devDependencies | `0.2.0-rc.1` | `0.2.2-rc.3` |

**断代说明**：`0.2.0` / `0.2.1` 不再在支持范围内。它们的 `assemble` 契约与 0.2.2 不同，
同一份代码无法同时满足；继续放行只会把运行时崩溃留给用户。需要旧运行时的用户请留在 `3.2.5`。

## `dsh.client.inject` 收敛

旧清单把 `@deepseek-ai/dsh-client-ui-primitives`、`@deepseek-ai/dsh-client-ui-slots`、
`@deepseek-ai/dsh-client-store` 也列为 inject。0.2.2 中这三者是**静态平台模块**
（由 Web shell 的 `PLATFORM_MODULES` 直接提供，不是可加载的 Loader 行），
列进 `dsh.client.inject` 属于无效声明。现仅保留真实存在的动态包行：

```
@deepseek-ai/dsh-client-locale
@deepseek-ai/dsh-client-ui-renderer
@deepseek-ai/dsh-client-ui-settings
@deepseek-ai/dsh-client-ui-plugin-manager
```

## 验证

新增/重写两个验证脚本，全部针对 0.2.2 真实包表面运行：

`runtime-verify.mjs`（宿主侧，装真实 `SystemPrompt` / `ToolsService` / native executor）：

| 检查 | 结果 |
|---|---|
| 语言 section 已注册在 persona-prefix 之后 | PASS |
| 默认渲染中文指令 | PASS |
| 工具注册且经 native executor 执行成功 | PASS |
| settings 服务返回 `en` → 下一次装配为英文指令 | PASS |
| 改回 `zh` → 立即切回中文指令 | PASS |
| 连续三次装配不叠加指令 | PASS |

`build-and-verify.mjs` 一键流水线（tsdown build + tsc --noEmit + 上述回归）全绿。

## 升级步骤

```bash
# 移除旧版并安装新版
dsh plugin --profile <profile> remove @dingpenghui/dsh-conversation-language
dsh plugin --profile <profile> add @dingpenghui/dsh-conversation-language@4.0.0
```

安装后**需重启 DeepSeek Harness**：旧版已污染的进程内装配上下文不会因热更新恢复。
