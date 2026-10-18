# v3.2.5 — 补上 engines.dsh 兼容声明

> `@dingpenghui/dsh-conversation-language@3.2.5`

本批更新为以下插件加入 `engines.dsh`，并附回归检查脚本：

| 包 | 旧版本 | 新版本 | engines.dsh |
|---|---|---|---|
| `@dingpenghui/dsh-conversation-language` | 3.2.4 | 3.2.5 | `>=0.2.0-rc.1 <0.3.0-0` |
| `@dingpenghui/dsh-obsidian-sync` | 3.4.7 | 3.4.8 | `>=0.2.0-rc.1 <0.3.0-0` |
| `@dingpenghui/dsh-supply-chain-switch` | 1.1.1 | 1.1.2 | `>=0.2.0-rc.1 <0.3.0-0` |
| `@dingpenghui/agnes` | 1.6.2 | 1.6.3 | `>=0.2.0-rc.2 <0.3.0-0` |
| `@dingpenghui/agnes-image` | 1.6.1 | 1.6.2 | `>=0.2.0-rc.2 <0.3.0-0` |
| `@dingpenghui/agnes-video` | 1.6.1 | 1.6.2 | `>=0.2.0-rc.2 <0.3.0-0` |
| `@dingpenghui/agnes-img2vid` | 1.6.1 | 1.6.2 | `>=0.2.0-rc.2 <0.3.0-0` |

**行为不变**：本批只增加元数据声明与检查脚本，不涉及任何运行时代码改动。

## 为什么要加

DSH 的安装门禁（`@deepseek-ai/dsh-app-boot` 的 `unmetRequirements`）按以下顺序判定插件与运行时的兼容性：

1. 清单里有 `engines.dsh` → **只依据它**，`peerDependencies` 全部忽略；
2. 没有 `engines.dsh` → 退回逐个检查 `@deepseek-ai/dsh` / `@deepseek-ai/dsh-*` 的 peer，
   判定式为 `semver.satisfies(runtime, range, { includePrerelease: true })`。

第 2 条分支容易出问题。参考实例：`dsh-web-search-serper` 曾在 peer 里把
`@deepseek-ai/dsh-web` 钉成精确版本 `0.2.0-rc.2`，而运行时是 `0.2.1-rc.2`——
在该判定规则下 `0.2.1-rc.2` **不满足** `0.2.0-rc.2`，安装被直接拒绝：

```
Plugin ...@1.1.1 is incompatible with dsh 0.2.1-rc.2:
requirements {"@deepseek-ai/dsh-web":"0.2.0-rc.2"}
```

声明 `engines.dsh` 后，兼容范围由一个显式区间单独表达，不再受 peer 声明的意外改动影响。

同时它也提供**未来的保护**：这些插件此前没有任何版本约束，一旦 DSH 升到未验证的
`0.3.x`，它们会静默通过安装门禁，而不是被明确拦下——问题会推迟到运行时才暴露。

## 回归检查

每个包新增 `engines-check.mjs`（无外部依赖）：

- 断言清单声明了 `engines.dsh`；
- 断言区间排除 `0.3.x`（契约未验证的版本线）；
- 断言放行实测过的运行时 `0.2.0-rc.2` / `0.2.1-rc.2`；
- 断言拒绝 `0.3.0`。

已接入 `test` 与 `prepublishOnly`，因此漏声明不会再被发布出去：

```bash
node engines-check.mjs
# OK compatibility declaration checks passed (engines.dsh = >=0.2.0-rc.x <0.3.0-0)
```

## 下界取值依据

区间下界不是统一套用的，而是取自各包**实际验证过的**运行时：

- `conversation-language` / `obsidian-sync` / `supply-chain-switch` 的 DSH peer 声明下界为 `0.2.0-rc.1`，故定为 `>=0.2.0-rc.1`；
- `agnes` 系列三个组件的 peer 声明为 `^0.2.0-rc.2`，故定为 `>=0.2.0-rc.2`。

## 验证

针对每个包用 DSH 自身的判定规则（同版本 semver `7.8.5`、`includePrerelease: true`）运行：

| 运行时 | 期望 | 结果 |
|---|---|---|
| 0.2.0-rc.2 | 放行 | PASS |
| 0.2.1-rc.2 | 放行 | PASS |
| 0.3.0 | 拒绝 | PASS |

也已在当前 DSH Desktop `0.2.1-rc.2` 上实测：全部插件正常加载、客户端 slot 注册为 active。

