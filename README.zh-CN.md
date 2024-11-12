# 汉语新解

> 一款基于 Gemini AI，从现代视角重新诠释汉语词汇的网络应用。

## 项目概览
汉语新解是一款现代网络应用，致力于为汉语词汇提供全新的现代诠释。通过集成 Gemini AI，本项目能够提供独特的、符合当代语境的解释，将传统含义与现代视角巧妙融合。

## 特性功能
- 🎯 汉语词汇的现代化诠释
- 🤖 采用谷歌 Gemini AI 技术支持
- 💫 流畅的 Framer Motion 动画效果
- 🎨 基于 Tailwind CSS 和 shadcn/ui 的精美界面
- 📱 完全响应式设计
- 💾 SVG 卡片导出功能
- ⚡ 基于 Next.js 构建，性能优异

## 技术栈
- **框架：** Next.js 14
- **样式：** Tailwind CSS
- **UI组件：** shadcn/ui
- **动画：** Framer Motion
- **AI集成：** Google Gemini API
- **开发语言：** TypeScript
- **部署平台：** Vercel

## 快速开始

### 环境要求
- Node.js 18.0 或更高版本
- npm 或 yarn
- Gemini API 密钥

### 安装步骤
1. 克隆仓库
```bash
git clone https://github.com/ChanMeng666/chinese-redefine.git
```

2. 安装依赖
```bash
npm install
# 或
yarn install
```

3. 配置环境变量
创建 `.env.local` 文件并添加：
```
GEMINI_API_KEY=your_gemini_api_key
```

4. 启动开发服务器
```bash
npm run dev
# 或
yarn dev
```

5. 打开 [http://localhost:3000](http://localhost:3000) 查看应用

## 使用示例
1. 在输入框中输入想要重新诠释的汉语词汇
2. 点击"生成新解卡片"按钮
3. 等待 AI 生成现代化诠释
4. 可以预览或下载生成的 SVG 卡片

## 功能限制
- 每个 IP 每分钟最多可以生成 5 次解释
- 输入词汇长度不能超过 10 个字符
- 必须包含汉字

## 参与贡献
我们欢迎所有形式的贡献，包括但不限于：
- 提交问题和建议
- 改进文档
- 提交代码改进

## 开源协议
MIT License - 查看 [LICENSE](LICENSE) 文件了解详情

## 作者

**Chan Meng**
- LinkedIn: [chanmeng666](https://www.linkedin.com/in/chanmeng666/)
- GitHub: [ChanMeng666](https://github.com/ChanMeng666)