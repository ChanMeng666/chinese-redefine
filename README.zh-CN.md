<div align="center">
 <h1>汉语新解</h1>
 <img src="https://img.shields.io/badge/License-MIT-brightgreen?style=flat"/>
 <img src="https://img.shields.io/badge/Next.js-15.0.3-black?style=flat&logo=next.js"/>
 <img src="https://img.shields.io/badge/React-18.2.0-blue?style=flat&logo=react"/>
 <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript"/>
 <img src="https://img.shields.io/badge/TailwindCSS-3.4.1-blue?style=flat&logo=tailwind-css"/>
</div>

[English](README.md) | [简体中文](README.zh-CN.md)

> 一款基于 Gemini AI，从现代视角重新诠释汉语词汇的网络应用。

## 特性功能
- 🎯 以现代视角重新诠释汉语词汇
- 🤖 采用 Google Gemini AI 提供创新解读
- 💫 流畅的 Framer Motion 动画效果
- 🎨 基于 Tailwind CSS 和 shadcn/ui 的精美界面
- 📱 全设备响应式设计
- 💾 支持导出 SVG 格式解释卡片
- ⚡ 基于 Next.js 构建，性能优异
- 🔒 内置 API 访问频率限制

## 技术栈
- **框架：** Next.js 15
- **开发语言：** TypeScript
- **样式：** Tailwind CSS
- **UI 组件：** shadcn/ui
- **动画：** Framer Motion
- **AI 集成：** Google Gemini API
- **部署：** Vercel

## 快速开始

### 环境要求
- Node.js 18.0 或更高版本
- npm 或 yarn
- Gemini API 密钥

### 安装步骤

1. 克隆仓库：
```bash
git clone https://github.com/ChanMeng666/chinese-redefine.git
```

2. 安装依赖：
```bash
npm install
# 或
yarn install
```

3. 配置环境变量：
创建 `.env.local` 文件并添加：
```
GEMINI_API_KEY=your_gemini_api_key
```

4. 启动开发服务器：
```bash
npm run dev
# 或
yarn dev
```

5. 打开 [http://localhost:3000](http://localhost:3000) 访问应用

## 使用说明
1. 在输入框中输入想要重新诠释的汉语词汇
2. 等待 AI 生成现代化诠释
3. 查看格式化后的解释结果
4. 可选择导出为 SVG 卡片格式

## API 限制
- 每个 IP 每分钟最多请求 5 次
- 输入词汇长度不超过 10 个字符
- 必须包含汉字

## 参与贡献
我们欢迎所有形式的贡献！如果您想做出重大更改，请先创建 Issue 进行讨论。

## 开源协议
本项目采用 [Apache-2.0 license](LICENSE) 协议。

## 作者

**Chan Meng**
- GitHub: [ChanMeng666](https://github.com/ChanMeng666)
- LinkedIn: [chanmeng666](https://www.linkedin.com/in/chanmeng666/)

## 致谢
- [Google Gemini](https://deepmind.google/technologies/gemini/) - AI 能力支持
- [shadcn/ui](https://ui.shadcn.com/) - UI 组件库
- [Tailwind CSS](https://tailwindcss.com) - 样式框架
- [Framer Motion](https://www.framer.com/motion/) - 动画效果

---
<div align="center">
由 Chan Meng 用 ❤️ 打造
</div>