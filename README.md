# CCNA - NEW-API Claude Code 配置启动器

专门为对接 NEW-API 设计的 Claude Code API 配置与启动工具。通过 NEW-API 平台提供的 Claude 模型，自动配置环境变量并启动 Claude Code。

## 📦 安装

### 全局安装（推荐）
```bash
npm install -g ccna
```

### 本地测试
```bash
npm install ccna
npx ccna
```

## 🚀 使用

### 基础命令
```bash
ccna              # 启动配置向导并启动 Claude Code
ccna help         # 查看全部功能与用法
ccna clear        # 清空配置并重新配置
ccna [参数]       # 启动时传递参数给 Claude Code
```

### 示例
```bash
ccna --version    # 显示 Claude Code 版本
ccna my-project   # 启动并打开项目目录
ccna clear        # 清空配置重新设置
ccna help         # 查看帮助
```

## 🎯 核心功能

### 1. NEW-API 集成
- **自动对接**：无缝连接 NEW-API 提供的 Claude 模型
- **模型自动发现**：获取并展示 NEW-API 上所有可用 Claude 模型
- **智能分类**：按模型类型（Opus/Sonnet/Haiku）自动分类

### 2. 四层模型配置
- **Opus 模型**：高精度推理，用于复杂计划模式
- **Sonnet 模型**：平衡性能，默认计划与非计划模式
- **Haiku 模型**：快速响应，后台功能和日常任务
- **子代理模型**：专用后端推理，优化性能

### 3. 交互式配置向导
```text
1. 输入 NEW-API 地址 → 2. 输入 API 密钥 → 3. 选择四个模型 → 4. 自动生成环境变量 → 5. 启动 Claude Code
```

### 4. 跨平台环境管理
- **Windows**：自动生成 PowerShell/cmd 环境变量
- **macOS/Linux**：自动生成 bash/zsh 环境变量
- **路径智能适配**：根据操作系统自动调整配置路径

## 🛠 技术特点

### API 标准化处理
- 自动处理地址格式：`/v1/` 和 `/v1` 结尾自动规范化
- URL 容错机制：支持带或不含协议前缀的地址
- 智能路径拼接：确保 `/v1/models` 访问路径正确

### 模型智能筛选
- **自动识别**：通过模型名称关键词识别 Claude 系列
- **分类匹配**：按 `opus/sonnet/haiku` 关键字自动分类
- **备用方案**：未匹配到 Claude 时提供全部模型列表

### 环境变量映射
| 环境变量 | 用途 | 示例值 |
|----------|------|--------|
| `ANTHROPIC_BASE_URL` | NEW-API 基础地址 | `https://xxx.com/v1` |
| `ANTHROPIC_AUTH_TOKEN` | 访问令牌 | `sk-xxx...` |
| `ANTHROPIC_DEFAULT_OPUS_MODEL` | 高精度模型 | `claude-3-opus-20240229` |
| `ANTHROPIC_DEFAULT_SONNET_MODEL` | 主要模型 | `claude-3-5-sonnet-20241022` |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL` | 快速模型 | `claude-3-haiku-20240307` |
| `CLAUDE_CODE_SUBAGENT_MODEL` | 子代理模型 | `claude-3-5-sonnet-20241022` |

## 📁 配置文件

### 存储位置
- **Windows**：`%USERPROFILE%\.claude-config\config.json`
- **macOS/Linux**：`~/.claude-config/config.json`

### 配置格式
```json
{
  "baseUrl": "https://your-new-api.com/v1",
  "authToken": "your-api-key",
  "opusModel": "claude-3-opus-20240229",
  "sonnetModel": "claude-3-5-sonnet-20241022",
  "haikuModel": "claude-3-haiku-20240307",
  "subagentModel": "claude-3-5-sonnet-20241022"
}
```

## 🔍 故障排查

### 连接问题
1. **检查 NEW-API 地址**：确保地址格式正确，如 `https://api.xxx.com/v1`
2. **验证 API 密钥**：确认密钥在 NEW-API 平台有效且未过期
3. **查看模型列表**：工具会显示获取到的所有模型

### 启动问题
1. **检查 Claude Code 安装**：`claude --version` 验证安装
2. **环境变量验证**：工具会输出完整环境变量配置
3. **手动启动方案**：支持手动 copy 环境变量启动

### 常用命令
```bash
# 重新配置
ccna clear && ccna

# 验证配置正确性
ccna help  # 查看完整配置路径和环境变量

# 调试模式
# 检查 ~/.claude-config/config.json 文件
```

## 🚀 NEW-API 适配优势

### 平台兼容性
- ✅ 完美适配 NEW-API 响应格式
- ✅ 自动处理模型分类和筛选
- ✅ 支持 NEW-API 的多模型同时配置
- ✅ 专业针对 Claude 模型优化

### 持续更新
- 🔄 跟随 NEW-API 模型更新
- 📝 保持配置向导最新体验
- 🔧 优化连接稳定性和错误提示

## 📋 系统需求

- **Node.js**：≥ 16.0.0
- **npm**：≥ 6.0.0
- **Claude Code**：已安装并配置在 PATH
- **NEW-API**：有效访问地址和 API 密钥

## 📞 支持

### 使用帮助
- **`ccna help`**：内置完整使用指南
- **GitHub Issues**：功能增强和问题反馈
- **配置重置**：`ccna clear` 快速重置配置

### 贡献方式
包含新建功能的 PR，或提交 NEW-API 适配建议。

---

**专为 NEW-API 优化设计的 Claude Code 启动器**