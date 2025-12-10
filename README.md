# 📝 笔记管理平台

一个功能完善的在线笔记管理平台，支持 Markdown 编辑、分类标签管理、搜索筛选、离线编辑、AI 摘要等高级功能。

## 项目地址
https://noteplatform.orime.xyz/notes

## 📋 目录

- [项目介绍](#项目介绍)
- [功能特性](#功能特性)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [项目结构](#项目结构)
- [开发规范](#开发规范)
- [API 文档](#api-文档)
- [部署指南](#部署指南)
- [常见问题](#常见问题)

---

## 📖 项目介绍

笔记管理平台是一个基于 Next.js 14 构建的全栈 Web 应用，采用离线优先（Offline-First）架构，提供流畅的笔记编辑和管理体验。

### 核心优势

- ✨ **现代化技术栈**：Next.js 14 App Router + TypeScript + TailwindCSS
- 🔒 **安全可靠**：NextAuth.js 认证，Prisma ORM 数据访问
- 📱 **响应式设计**：完美支持桌面端和移动端
- 💾 **离线优先**：基于 IndexedDB 实现离线编辑和自动同步
- 🤖 **AI 增强**：集成 OpenAI API，支持自动摘要和语义搜索
- ⚡ **高性能**：自动保存、虚拟滚动、防抖优化

---

## ✨ 功能特性

### 核心功能

- ✅ 用户注册与登录
- ✅ 笔记的创建、编辑、删除、查看
- ✅ Markdown 编辑器与实时预览（分屏编辑/预览模式）
- ✅ 分类与标签管理
- ✅ 搜索与筛选（标题、内容、标签等）
- ✅ 列表展示与分页（网格/列表视图切换）
- ✅ 响应式布局（移动端与桌面端）
- ✅ 自动保存（2 秒延迟）
- ✅ 快捷键支持（Ctrl+S 保存，Ctrl+E 切换视图）
- ✅ 暗色/亮色主题切换

### 高级功能

- ✅ **离线编辑与本地缓存**：使用 IndexedDB 实现离线优先策略
- ✅ **自动同步**：网络恢复后自动同步离线更改
- ✅ **AI 自动摘要**：基于 OpenAI 生成 50-100 字简洁摘要
- ✅ **向量搜索**：支持语义搜索（需配置向量数据库）

---

## 🛠 技术栈

### 前端

- **框架**：Next.js 14+ (App Router)
- **语言**：TypeScript
- **UI 库**：React 18
- **样式**：TailwindCSS + shadcn/ui + Radix UI
- **状态管理**：Zustand
- **表单处理**：React Hook Form + Zod
- **Markdown**：react-markdown + uiw/react-md-editor

### 后端

- **运行时**：Next.js API Routes
- **数据库**：PostgreSQL
- **ORM**：Prisma
- **认证**：NextAuth.js
- **本地存储**：IndexedDB (idb)

### AI 能力

- **服务商**：OpenAI API
- **模型**：GPT-4o-mini (Chat) + text-embedding-3-small (Embeddings)

### 部署

- **平台**：Vercel
- **数据库**：Supabase / 自托管 PostgreSQL

---

## 🚀 快速开始

### 前置要求

- Node.js 18+
- PostgreSQL 数据库
- npm / yarn / pnpm

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd NotePlatform
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**

创建 `.env.local` 文件：

```env
# 数据库
DATABASE_URL="postgresql://user:password@localhost:5432/note_platform?schema=public"

# NextAuth 认证
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# OpenAI API（可选，用于 AI 功能）
OPENAI_API_KEY="sk-your-openai-api-key"
OPENAI_BASE_URL="https://api.openai.com/v1"
OPENAI_MODEL_CHAT="gpt-4o-mini"
OPENAI_MODEL_EMBEDDING="text-embedding-3-small"

# 环境
NODE_ENV="development"
```

生成 NextAuth Secret：
```bash
openssl rand -base64 32
```

> **注意**：如果不使用 AI 功能，可以不配置 `OPENAI_API_KEY`，但 AI 摘要功能将不可用。

4. **初始化数据库**
```bash
# 生成 Prisma Client
npm run db:generate

# 运行迁移
npm run db:migrate

# （可选）打开 Prisma Studio 查看数据
npm run db:studio
```

5. **启动开发服务器**
```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

---

## 📁 项目结构

```
NotePlatform/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 认证路由组
│   │   ├── login/         # 登录页
│   │   └── register/      # 注册页
│   ├── (dashboard)/       # 需要认证的路由组
│   │   ├── notes/         # 笔记相关页面
│   │   │   ├── [id]/      # 编辑页
│   │   │   │   └── view/  # 查看页
│   │   │   └── new/       # 新建页
│   │   ├── categories/    # 分类管理
│   │   ├── tags/          # 标签管理
│   │   └── search/        # 搜索页
│   ├── api/               # API 路由
│   │   ├── auth/          # 认证 API
│   │   ├── notes/         # 笔记 CRUD API
│   │   ├── categories/    # 分类 API
│   │   ├── tags/          # 标签 API
│   │   ├── search/        # 搜索 API
│   │   └── ai/            # AI 功能 API
│   │       └── summary/   # AI 摘要
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 首页
├── components/            # React 组件
│   ├── ui/               # shadcn/ui 基础组件
│   ├── notes/            # 笔记相关组件
│   │   ├── SplitMarkdownEditor.tsx  # Markdown 编辑器
│   │   └── CategoryTagSelector.tsx  # 分类标签选择器
│   └── layout/           # 布局组件
│       └── Header.tsx    # 顶部导航栏
├── hooks/                # React Hooks
│   ├── useAutoSave.ts    # 自动保存
│   ├── useKeyboardShortcuts.ts  # 快捷键
│   ├── useOfflineSync.ts # 离线同步
│   └── useDebounce.ts    # 防抖
├── lib/                  # 工具函数
│   ├── db.ts             # IndexedDB 封装
│   ├── openai.ts         # OpenAI API 封装
│   ├── prisma.ts         # Prisma 客户端
│   └── utils.ts          # 通用工具
├── services/             # 业务服务层
│   └── noteService.ts    # 笔记服务（离线优先）
├── prisma/               # 数据库 Schema
│   └── schema.prisma     # Prisma 数据模型
├── types/                # TypeScript 类型定义
├── public/               # 静态资源
└── styles/               # 全局样式
```

---

## 📐 开发规范

### 代码规范

#### TypeScript 规范

- **严格模式**：启用 `strict: true`，所有代码必须通过类型检查
- **类型定义**：
  - 优先使用 `interface` 定义对象类型
  - 使用 `type` 定义联合类型、工具类型
  - 类型定义统一放在 `types/` 目录或文件顶部
- **命名规范**：
  - 组件名：PascalCase（如 `NoteEditor`）
  - 函数/变量：camelCase（如 `getNotes`）
  - 常量：UPPER_SNAKE_CASE（如 `API_BASE_URL`）
  - 类型/接口：PascalCase（如 `Note`, `NoteService`）

#### React 组件规范

- **函数组件**：统一使用函数组件 + Hooks
- **组件拆分**：
  - 单个组件不超过 200 行
  - 复杂逻辑提取到自定义 Hooks
  - 可复用 UI 组件放在 `components/ui/`
- **Props 类型**：使用 TypeScript 定义 Props 接口
- **状态管理**：
  - 组件内部状态使用 `useState`
  - 跨组件状态使用 Zustand
  - 服务端状态优先使用 Server Components

#### 文件组织规范

- **目录结构**：按功能模块组织，使用路由组 `(group)` 区分页面类型
- **文件命名**：
  - 组件文件：PascalCase（如 `NoteEditor.tsx`）
  - 工具文件：camelCase（如 `noteService.ts`）
  - API 路由：使用 Next.js 约定（如 `route.ts`）
- **导入顺序**：
  1. 外部库（React, Next.js 等）
  2. 内部组件
  3. 工具函数
  4. 类型定义
  5. 样式文件

```typescript
// 示例：正确的导入顺序
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAutoSave } from '@/hooks/useAutoSave'
import { Note } from '@/types'
import './styles.css'
```

#### API 规范

- **RESTful 设计**：遵循 REST 约定
- **错误处理**：统一返回格式
```typescript
// 成功响应
{ data: T, message?: string }

// 错误响应
{ error: string, code?: number }
```
- **认证**：使用 NextAuth.js，API 路由通过 `getServerSession` 验证
- **数据验证**：使用 Zod 进行请求参数验证

#### 数据库规范

- **Schema 定义**：统一在 `prisma/schema.prisma` 管理
- **迁移管理**：使用 Prisma Migrate，禁止直接修改数据库
- **查询优化**：使用 `select` 指定返回字段，避免查询不必要的数据
- **事务处理**：涉及多表操作时使用事务

#### 样式规范

- **TailwindCSS**：优先使用 Tailwind 工具类
- **响应式**：使用 `sm:`, `md:`, `lg:` 断点
- **主题**：支持暗色/亮色主题，使用 CSS 变量
- **组件样式**：复杂样式使用 CSS Modules 或 styled-components

### Git 提交规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型（type）**：
- `feat`: 新功能
- `fix`: 修复 Bug
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具相关

**示例**：
```
feat(notes): 添加笔记自动保存功能

- 实现 2 秒延迟自动保存
- 添加保存状态提示
- 优化网络请求频率

Closes #123
```

### 开发流程

1. **创建分支**：从 `main` 分支创建功能分支
   ```bash
   git checkout -b feat/note-autosave
   ```

2. **开发与测试**：
   - 编写代码
   - 运行 `npm run lint` 检查代码规范
   - 运行 `npm run type-check` 检查类型
   - 本地测试功能

3. **提交代码**：
   ```bash
   git add .
   git commit -m "feat(notes): 添加自动保存功能"
   git push origin feat/note-autosave
   ```

4. **创建 Pull Request**：
   - 在 GitHub/GitLab 创建 PR
   - 填写清晰的 PR 描述
   - 等待代码审查

5. **代码审查**：
   - 至少一位团队成员审查
   - 通过后合并到 `main` 分支

### 代码审查检查清单

- [ ] 代码符合 TypeScript 类型检查
- [ ] 通过 ESLint 检查
- [ ] 功能测试通过
- [ ] 无控制台错误
- [ ] 响应式布局正常
- [ ] 性能无明显问题
- [ ] 错误处理完善
- [ ] 代码注释清晰（复杂逻辑需注释）

### 性能优化规范

- **代码分割**：使用动态导入 `dynamic import` 延迟加载大型组件
- **图片优化**：使用 Next.js `Image` 组件
- **防抖节流**：频繁触发的操作使用防抖（如搜索、自动保存）
- **虚拟滚动**：长列表使用虚拟滚动（react-window）
- **缓存策略**：合理使用 React Query 或 SWR 缓存数据

### 错误处理规范

- **前端错误**：使用 Error Boundary 捕获组件错误
- **API 错误**：统一错误响应格式，前端友好提示
- **离线错误**：离线操作失败时提示用户，并加入同步队列
- **日志记录**：生产环境记录错误日志，便于排查

---

## 📚 API 文档

### 认证 API

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录（通过 NextAuth）
- `GET /api/auth/session` - 获取当前会话

### 笔记 API

- `GET /api/notes` - 获取笔记列表（支持分页、筛选）
- `GET /api/notes/[id]` - 获取单篇笔记
- `POST /api/notes` - 创建笔记
- `PUT /api/notes/[id]` - 更新笔记
- `DELETE /api/notes/[id]` - 删除笔记

### 分类 API

- `GET /api/categories` - 获取分类列表
- `POST /api/categories` - 创建分类
- `PUT /api/categories/[id]` - 更新分类
- `DELETE /api/categories/[id]` - 删除分类

### 标签 API

- `GET /api/tags` - 获取标签列表
- `POST /api/tags` - 创建标签
- `PUT /api/tags/[id]` - 更新标签
- `DELETE /api/tags/[id]` - 删除标签

### 搜索 API

- `GET /api/search?q=keyword` - 全文搜索笔记
- `POST /api/search/semantic` - 语义搜索（向量搜索）

### AI API

- `POST /api/ai/summary` - 生成笔记摘要
  ```json
  Request: { "content": "笔记内容..." }
  Response: { "summary": "生成的摘要..." }
  ```

---

## 🚢 部署指南

### Vercel 部署（推荐）

1. 将代码推送到 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 配置环境变量（参考 `.env.local`）
4. 配置数据库连接字符串
5. 部署完成

### 手动部署

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

---

## 🔧 开发命令

```bash
# 开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint

# 类型检查
npm run type-check

# 代码格式化
npm run format

# 数据库相关
npm run db:generate    # 生成 Prisma Client
npm run db:migrate     # 运行迁移
npm run db:studio      # 打开 Prisma Studio
npm run db:push        # 推送 Schema 到数据库
```

---

## ❓ 常见问题

### 离线功能不工作？

- 确保浏览器支持 IndexedDB
- 检查浏览器控制台是否有错误信息
- 清除浏览器缓存后重试

### AI 摘要功能不可用？

- 检查 `OPENAI_API_KEY` 环境变量是否正确配置
- 确认 API Key 有足够的余额
- 查看服务器日志了解详细错误

### 同步失败？

- 检查网络连接
- 查看浏览器控制台的错误信息
- 确认服务器 API 正常运行

---

## 📄 许可证

MIT License

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React 全栈框架
- [shadcn/ui](https://ui.shadcn.com/) - 高质量 UI 组件
- [Prisma](https://www.prisma.io/) - 现代 ORM
- [TailwindCSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [OpenAI](https://openai.com/) - AI 能力支持
- [Vercel](https://vercel.com) - 部署平台
