# dsh-conversation-language

DSH 插件：对话语言切换器

## 功能

允许在中文和英文之间切换对话语言。切换后 AI 将使用对应语言回复。

### 特性

- 🌐 在设置界面中直接切换语言
- 🔄 动态更新 Persona（系统提示）
- 💾 设置持久化到 `settings.yaml`
- 🎨 匹配 DSH 原生设置界面样式

## 安装

### 方式一：使用 dsh 命令（推荐）

```bash
# 从 GitHub 克隆安装
dsh plugin --profile web add https://github.com/Dingpenghui-good/dsh-conversation-language

# 或从本地路径安装（需要先 cd 到插件目录）
cd /path/to/dsh-conversation-language
dsh plugin --profile web add .
```

### 方式二：手动安装

1. 克隆插件到 plugins 目录：
```bash
git clone https://github.com/Dingpenghui-good/dsh-conversation-language.git ~/.dsh/plugins/dsh-conversation-language
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

## 配置

### 方式一：通过设置界面

重启 DSH 后，打开 **设置 → 通用设置**，找到「对话内容语言」选项进行切换。

### 方式二：直接修改 settings.yaml

编辑 `~/.dsh/settings.yaml`：

```yaml
conversation-language:
  conversationLanguage: zh  # 或 en
```

然后重启 DSH。

## 使用

### 通过命令

```
切换到英文模式
```

或直接修改 `settings.yaml` 中的 `conversationLanguage` 值。

## 技术说明

| 项目 | 值 |
|------|-----|
| Settings Namespace | `conversation-language` |
| Schema | `{ conversationLanguage?: 'zh' \| 'en' }` |
| 默认值 | `zh` (中文) |
| Persona Override | 根据语言设置动态更新系统提示 |

### 插件结构

```
dsh-conversation-language/
├── src/
│   ├── index.ts                    # Host 层：settings + persona
│   ├── client/
│   │   ├── index.ts                # Client 层：UI 注册
│   │   ├── LanguageSwitcherRow.tsx # React 组件
│   │   ├── LanguageSwitcherRow.module.css
│   │   └── settings-store.ts       # 状态管理
│   └── locales/
│       └── index.ts                # 国际化字典
├── cordis.patch.yml                # Cordis 配置
├── package.json
└── README.md
```

## 开发

```bash
cd dsh-conversation-language
npm install
npm run build
```

## 相关项目

- [dsh-tool-agnes](https://github.com/Dingpenghui-good/dsh-tool-agnes) - Agnes AI 媒体生成插件
- [dsh-plugin-manager](https://github.com/Dingpenghui-good/dsh-plugin-manager) - 插件管理 UI

## 标签

- dsh
- dsh-plugin

## License

MIT
