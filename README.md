# dsh-tool-language

DSH 插件：对话语言切换器

## 功能

允许在中文和英文之间切换对话语言。

## 安装

```bash
cd dsh-tool-language
npm install
```

## 在 DSH 中使用

添加到 `agent.cordis.yml`：

```yaml
- id: tool-language-switcher
  name: '@dsh-plugins/language-switcher'
```

## 设置

在 settings.yaml 中添加：

```yaml
conversation-language:
  conversationLanguage: zh  # 或 en
```

或通过 UI 设置（待实现）。

## API

### 工具

- `get_conversation_language` - 获取当前对话语言

## License

MIT
