# dsh-conversation-language

DSH 插件：对话语言切换器

## 功能

允许在中文和英文之间切换对话语言。切换后 AI 将使用对应语言回复。

## 安装

`ash
# 添加到 DSH preset
# 在 agent.cordis.yml 中添加:
- id: tool-conversation-language
  name: '@dsh-plugins/conversation-language'
`

## 配置

在 settings.yaml 中添加:

`yaml
conversation-language:
  conversationLanguage: zh  # 或 en
`

## 设置界面

在 DSH 设置 → 通用设置 中可以看到「对话内容语言」选项。

## 标签

- dsh
- dsh-plugin

## License

MIT
