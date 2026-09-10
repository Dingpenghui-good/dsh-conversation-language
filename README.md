# dsh-conversation-language

DSH 插件：对话语言切换器

## 功能

允许在中文和英文之间切换对话语言。切换后 AI 将使用对应语言进行思考和回复。

### 特性

- 🌐 在设置界面中直接切换语言
- 🔄 动态更新 Persona（系统提示），无需重启即可生效
- 💾 设置持久化到 `settings.yaml`
- 🎨 匹配 DSH 原生设置界面样式

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
    "dsh-conversation-language": "link:C:/Users/<你的用户名>/.dsh/plugins/dsh-conversation-language"
  },
  "dsh": {
    "profile": {
      "bundles": [
        // ... 其他 bundles
        "dsh-conversation-language"
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

### 方式一：通过设置界面

重启 DSH 后，打开 **设置 → 通用设置**，找到「对话内容语言」选项进行切换。

### 方式二：直接修改 settings.yaml

编辑 `~/.dsh/settings.yaml`（Windows：`%USERPROFILE%\.dsh\settings.yaml`）：

```yaml
conversation-language:
  conversationLanguage: zh  # 或 en
```

然后重启 DSH。

## 使用

切换语言后，AI 将自动以对应语言进行思考和回复。也可通过 `get_conversation_language` Tool 查询当前设置。

## 技术说明

| 项目 | 值 |
|------|-----|
| Settings Namespace | `conversation-language` |
| Schema | `{ conversationLanguage?: 'zh' \| 'en' }` |
| 默认值 | `zh` (中文) |
| Persona Override | 根据语言设置动态更新系统提示 |
| Tool 注册 | `get_conversation_language` — 查询当前语言设置 |

### 插件结构

```
dsh-conversation-language/
├── src/
│   ├── index.ts                    # Host 层：settings + persona + tool
│   ├── client/
│   │   ├── index.ts                # Client 层：UI 注册
│   │   ├── LanguageSwitcherRow.tsx # React 组件
│   │   ├── LanguageSwitcherRow.module.css
│   │   └── settings-store.ts       # 状态管理
│   └── locales/
│       └── index.ts                # 国际化字典
├── lib/                            # 构建产物（npm run build 生成，安装时必须存在）
├── cordis.patch.yml                # Cordis 静态插件配置
├── package.json
└── README.md
```

## 兼容性

| DSH 版本 | 插件版本 | 说明 |
|----------|---------|------|
| 0.1.2-rc.1 | ≤ 1.4.0 | 旧的单一 `deployment:persona` section（`PERSONA_SECTION`） |
| 0.1.5-rc.1 | ≥ 1.5.0 | persona 拆分为 `deployment:persona-prefix` / `deployment:persona-suffix`，宿主侧改用 `PERSONA_PREFIX_SECTION`（缺失时回退 `PERSONA_SUFFIX_SECTION`）；全部 `@deepseek-ai/dsh-*` 依赖区间升至 `^0.1.5-rc.1` |

## 开发

```bash
cd dsh-conversation-language
pnpm install
pnpm run build   # 构建产物到 lib/；安装前必须执行此步
```

升级 DSH 大版本后，可用 `node runtime-verify.mjs` 对当前 node_modules 中的
`@deepseek-ai/*` 版本做一次宿主侧运行时回归（settings 注册、tool 注册/执行、
`system-prompt/assemble` 拦截在 global 与 scoped assembly 下的行为）：

```bash
node runtime-verify.mjs   # 全部 PASS 且 exit 0 即表示兼容
```

> ⚠️ **必须执行构建**，插件运行时依赖 `lib/` 下的构建产物，不能直接使用源码。
>
> 请使用 **pnpm** 安装依赖：`@deepseek-ai/dsh-*@0.1.5-rc.1` 等预发布版本在 npm 注册表中
> 处于「已发布但不可被 npm 解析」状态，`npm install` 会以 `ETARGET` 失败；pnpm 可以正常
> 解析并安装这些版本。

## License

MIT
