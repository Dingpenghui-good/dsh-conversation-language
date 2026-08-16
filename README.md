# dsh-conversation-language

DSH 插件：对话语言切换器

## 功能

允许在中文和英文之间切换对话语言。切换后 AI 将使用对应语言回复。

## 安装

### 方式一：使用 dsh 命令（推荐）

```bash
# 从 GitHub 克隆安装
dsh plugin --profile web add https://github.com/Dingpenghui-good/dsh-conversation-language

# 或从本地路径安装
dsh plugin --profile web add /path/to/dsh-conversation-language
```

### 方式二：手动添加到 cordis.patch.yml

编辑 `~/.dsh/profiles/web/cordis.patch.yml`，添加：

```yaml
- insert:
    - id: tool-conversation-language
      name: '/path/to/dsh-conversation-language/src/index.ts'
```

## 配置

### 方式一：通过设置界面

重启 DSH 后，打开设置 → 通用设置，找到「对话内容语言」选项进行切换。

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

- **Settings Namespace**: `conversation-language`
- **Schema**: `{ conversationLanguage?: 'zh' | 'en' }`
- **默认值**: `zh` (中文)
- **Persona Override**: 根据语言设置动态更新系统提示

## 开发

```bash
cd dsh-conversation-language
npm install
npm run build
```

## 标签

- dsh
- dsh-plugin

## License

MIT
