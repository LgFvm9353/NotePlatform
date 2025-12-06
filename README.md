# 笔记管理平台

一个功能完整的在线笔记管理平台，支持 Markdown 编辑、分类标签、搜索筛选、离线编辑、AI 摘要等功能。

## ✨ 功能特性

### 核心功能
- ✅ 用户注册与登录
- ✅ 笔记的创建、编辑、删除、查看
- ✅ Markdown 编辑器与实时预览（分屏/编辑/预览模式）
- ✅ 分类与标签管理
- ✅ 搜索与筛选（标题、内容、标签等）
- ✅ 列表展示与分页（网格/列表视图切换）
- ✅ 响应式布局（移动端与桌面端）
- ✅ 自动保存（2秒延迟）
- ✅ 快捷键支持（Ctrl+S 保存，Ctrl+E 切换视图）
- ✅ 暗色/亮色主题切换

### 高级功能
- ✅ **离线编辑与本地缓存**：使用 IndexedDB 实现离线优先策略
- ✅ **自动同步**：网络恢复后自动同步离线更改
- ✅ **AI 自动摘要**：基于 OpenAI 生成笔记摘要
- ✅ **向量搜索**：支持语义搜索（需配置向量数据库）

### 技术栈
- **前端**: Next.js 14+ (App Router), React 18, TypeScript
- **UI**: shadcn/ui, TailwindCSS, Radix UI
- **后端**: Next.js API Routes
- **数据库**: PostgreSQL (Prisma ORM)
- **本地存储**: IndexedDB (idb)
- **认证**: NextAuth.js
- **AI**: OpenAI API (Embeddings & Chat Completions)
- **部署**: Vercel

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

# OpenAI API (用于 AI 摘要和向量搜索)
OPENAI_API_KEY="sk-your-openai-api-key"
OPENAI_BASE_URL="https://api.openai.com/v1"  # 可选，用于兼容其他 API
OPENAI_MODEL_CHAT="gpt-4o-mini"              # 可选，默认 gpt-4o-mini
OPENAI_MODEL_EMBEDDING="text-embedding-3-small"  # 可选，默认 text-embedding-3-small

# 环境
NODE_ENV="development"
```

生成 NextAuth Secret:
```bash
openssl rand -base64 32
```

> **注意**: 如果不需要 AI 功能，可以不配置 `OPENAI_API_KEY`，但 AI 摘要功能将不可用。

4. **初始化数据库**
```bash
# 生成 Prisma Client
npm run db:generate

# 运行迁移
npm run db:migrate

# (可选) 打开 Prisma Studio 查看数据
npm run db:studio
```

5. **启动开发服务器**
```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 📁 项目结构

```
NotePlatform/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 认证路由组
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/       # 需要认证的路由组
│   │   ├── notes/        # 笔记相关页面
│   │   │   ├── [id]/     # 编辑页面
│   │   │   ├── [id]/view # 查看页面
│   │   │   └── new/      # 新建页面
│   │   ├── categories/    # 分类管理
│   │   ├── tags/         # 标签管理
│   │   └── search/       # 搜索页面
│   ├── api/               # API 路由
│   │   ├── auth/         # 认证 API
│   │   ├── notes/        # 笔记 CRUD API
│   │   ├── categories/   # 分类 API
│   │   ├── tags/         # 标签 API
│   │   ├── search/       # 搜索 API
│   │   └── ai/           # AI 功能 API
│   │       └── summary/  # AI 摘要
│   └── layout.tsx        # 根布局
├── components/            # React 组件
│   ├── ui/               # shadcn/ui 基础组件
│   ├── notes/            # 笔记相关组件
│   │   ├── SplitMarkdownEditor.tsx  # Markdown 编辑器
│   │   └── CategoryTagSelector.tsx   # 分类标签选择器
│   └── layout/           # 布局组件
│       └── Header.tsx    # 顶部导航栏
├── hooks/                 # React Hooks
│   ├── useAutoSave.ts    # 自动保存
│   ├── useKeyboardShortcuts.ts  # 快捷键
│   ├── useOfflineSync.ts # 离线同步
│   └── useDebounce.ts    # 防抖
├── lib/                   # 工具函数
│   ├── db.ts             # IndexedDB 封装
│   ├── openai.ts         # OpenAI API 封装
│   ├── prisma.ts         # Prisma 客户端
│   └── utils.ts          # 通用工具
├── services/              # 业务服务层
│   └── noteService.ts    # 笔记服务（离线优先）
├── prisma/                # 数据库 Schema
└── types/                 # TypeScript 类型定义
```

## 🛠️ 开发命令

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

# 格式化代码
npm run format

# 数据库相关
npm run db:generate    # 生成 Prisma Client
npm run db:migrate     # 运行迁移
npm run db:studio      # 打开 Prisma Studio
npm run db:push        # 推送 Schema 到数据库
```

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

- `GET /api/search?q=keyword` - 搜索笔记
- `POST /api/search/semantic` - 语义搜索（向量搜索）

### AI API

- `POST /api/ai/summary` - 生成笔记摘要
  ```json
  Request Body: { "content": "笔记内容..." }
  Response: { "summary": "生成的摘要..." }
  ```

## 🌐 部署

详细部署步骤请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)

### Vercel 快速部署

1. 将代码推送到 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 配置环境变量
4. 部署完成

## 🎯 核心特性详解

### 离线编辑与同步

项目实现了完整的 **离线优先（Offline-First）** 策略：

- **本地存储**: 使用 IndexedDB 存储笔记数据，支持离线访问
- **自动同步**: 网络恢复后自动同步离线更改到服务器
- **ID 一致性**: 智能处理离线创建笔记的临时 ID，确保同步后数据一致性
- **队列管理**: 使用同步队列管理离线操作，按顺序执行

**工作原理**:
1. 在线时：优先从服务器获取数据，同时更新本地缓存
2. 离线时：从本地 IndexedDB 读取数据，编辑操作加入同步队列
3. 网络恢复：自动检测并同步队列中的操作

### AI 摘要功能

- **智能摘要**: 基于 OpenAI GPT 模型生成 50-100 字简洁摘要
- **自动去重**: 如果笔记已有摘要，重新生成时会替换而非追加
- **内容提取**: 生成摘要前自动去除已有摘要部分，确保基于实际内容生成

### 编辑器特性

- **分屏编辑**: 支持编辑/预览/分屏三种模式
- **实时预览**: Markdown 实时渲染，支持代码高亮
- **快捷键**: 
  - `Ctrl/Cmd + S`: 保存笔记
  - `Ctrl/Cmd + E`: 切换编辑器视图模式
  - `Ctrl/Cmd + B`: 加粗选中文本（在编辑器中）
- **自动保存**: 2 秒延迟自动保存，避免频繁请求

## 📝 开发计划

### 已完成 ✅
- [x] 项目初始化
- [x] 数据库设计
- [x] 用户认证
- [x] 笔记 CRUD
- [x] Markdown 编辑器（分屏/编辑/预览）
- [x] 搜索功能
- [x] 响应式布局
- [x] 自动保存功能
- [x] 主题切换（暗色/亮色）
- [x] 快捷键支持
- [x] 离线编辑与本地缓存
- [x] 数据自动同步
- [x] AI 自动摘要
- [x] 向量搜索基础架构

### 待优化 (P0)
- [ ] 同步队列错误处理优化（死信队列）
- [ ] 编辑器性能优化（预览防抖）
- [ ] 错误处理优化（优雅降级）

### 拓展功能 (P1)
- [ ] 协同编辑
- [ ] 笔记导出（PDF/Markdown）
- [ ] 笔记导入
- [ ] 版本历史

### AI 功能 (P2)
- [ ] AI 主题聚合
- [ ] AI 内容建议
- [ ] AI 标签推荐

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🔧 故障排除

### 离线功能不工作
- 确保浏览器支持 IndexedDB
- 检查浏览器控制台是否有错误信息
- 清除浏览器缓存后重试

### AI 摘要功能不可用
- 检查 `OPENAI_API_KEY` 环境变量是否正确配置
- 确认 API Key 有足够的余额
- 查看服务器日志了解详细错误

### 同步失败
- 检查网络连接
- 查看浏览器控制台的错误信息
- 确认服务器 API 正常运行

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React 全栈框架
- [shadcn/ui](https://ui.shadcn.com/) - 高质量 UI 组件
- [Prisma](https://www.prisma.io/) - 现代化 ORM
- [TailwindCSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [OpenAI](https://openai.com/) - AI 能力支持
- [idb](https://github.com/jakearchibald/idb) - IndexedDB 封装库
- [Vercel](https://vercel.com) - 部署平台
