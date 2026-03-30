# 汉语新解 — 后端、用户验证与卡片画廊设计规格

## Context

汉语新解目前是一个纯前端 Next.js 15 项目，部署在 Cloudflare Workers 上。用户输入中文词语，通过 OpenAI API 生成"新解"，并渲染为 Mondrian 风格 SVG 卡片。当前无数据库、无用户系统、无持久化。

**本次改造目标：** 增加后端持久化、用户认证（邮箱验证）、使用限额控制、以及公开卡片画廊功能。只有登录且验证过邮箱的用户才能使用生成器。

---

## 技术栈

| 层 | 技术 |
|---|---|
| 框架 | Next.js 15 (App Router)，部署在 Cloudflare Workers |
| 数据库 | Neon Database (serverless PostgreSQL) |
| ORM | Drizzle ORM |
| 认证 | Better Auth（集成 Neon），WebSocket 驱动连接 |
| 登录方式 | 邮箱密码 + GitHub OAuth + Google OAuth |
| 邮件 | Resend（邮箱验证、密码重置） |
| AI | OpenAI API (GPT-4o-mini) |

---

## 数据库 Schema

### Better Auth 管理的表（4 张）

```
users
  id            TEXT PK
  name          TEXT
  email         TEXT UNIQUE
  emailVerified BOOLEAN
  image         TEXT?
  tier          TEXT DEFAULT 'free'     -- 预留: 'free' | 'pro'
  isFlagged     BOOLEAN DEFAULT false   -- 异常标记
  signupIp      TEXT                    -- 注册时 IP
  createdAt     TIMESTAMP
  updatedAt     TIMESTAMP

sessions
  id            TEXT PK
  userId        TEXT FK → users.id
  token         TEXT UNIQUE
  expiresAt     TIMESTAMP
  ipAddress     TEXT?
  userAgent     TEXT?

accounts
  id            TEXT PK
  userId        TEXT FK → users.id
  accountId     TEXT
  providerId    TEXT        -- 'email' | 'github' | 'google'
  accessToken   TEXT?
  refreshToken  TEXT?

verification
  id            TEXT PK
  identifier    TEXT
  value         TEXT
  expiresAt     TIMESTAMP
```

### 业务表（3 张）

```
cards
  id            TEXT PK (cuid)
  userId        TEXT FK → users.id
  word          TEXT NOT NULL
  explanation   TEXT NOT NULL
  pinyin        TEXT
  english       TEXT?
  japanese      TEXT?
  svgContent    TEXT            -- 完整 SVG 字符串（~1-3KB）
  isPublic      BOOLEAN DEFAULT true
  createdAt     TIMESTAMP
  updatedAt     TIMESTAMP

user_usage
  id            SERIAL PK
  userId        TEXT FK → users.id
  date          DATE               -- YYYY-MM-DD
  dailyCount    INTEGER DEFAULT 0
  UNIQUE(userId, date)

global_usage
  id            SERIAL PK
  date          DATE UNIQUE
  dailyCount    INTEGER DEFAULT 0
  monthlyCount  INTEGER DEFAULT 0
```

---

## 用户使用限制（三层防护）

### 第一层：用户级别配额

| 维度 | 免费用户 | 未来付费用户 |
|------|---------|------------|
| 短期限流 | 1 次/分钟 | 5 次/分钟 |
| 每日配额 | 3 次/天 | 30 次/天 |
| 每月配额 | 30 次/月 | 300 次/月 |

实现方式：`user_usage` 表按 `(userId, date)` 记录每日用量。月用量通过 `SUM(dailyCount) WHERE date >= 月初` 计算。短期限流通过 `cards` 表的 `createdAt` 判断最近 1 分钟内的记录数。

### 第二层：全局熔断器

| 维度 | 上限 |
|------|------|
| 全局日上限 | 150 次/天 |
| 全局月上限 | 1500 次/月（≈$4.5） |

实现方式：`global_usage` 表记录当日/当月总调用量。每次请求前检查，超限返回 503 + 友好中文提示。

### 第三层：异常行为检测

1. **重复词缓存** — 同一用户 24h 内对同一词语重复生成，直接返回 `cards` 表中的缓存结果，不消耗 API 调用也不消耗配额。
2. **自动化请求识别** — 10 秒内 3+ 次请求，触发 5 分钟冷却期。
3. **多账号检测** — 同一 IP（`signupIp`）注册超过 3 个账号时，新账号 `isFlagged = true`，不可使用生成器直到人工审核。

---

## 路由结构

```
app/
  (auth)/                         -- 未登录用户可访问
    login/page.tsx                -- 登录页
    register/page.tsx             -- 注册页
    verify-email/page.tsx         -- 邮箱验证提示/回调
    forgot-password/page.tsx      -- 忘记密码
  (protected)/                    -- 需要登录 + 邮箱验证
    page.tsx                      -- 卡片生成器（首页）
    account/page.tsx              -- 账户设置（改密码、邮箱）
    account/cards/page.tsx        -- 我的卡片（切换公开/隐藏）
  gallery/                        -- 公开可访问（无需登录）
    page.tsx                      -- 卡片画廊（瀑布流 + 搜索）
  api/
    auth/[...all]/route.ts        -- Better Auth catch-all handler
    generate/route.ts             -- 卡片生成 API（需认证）
    cards/[id]/route.ts           -- 更新卡片可见性 PUT
    cards/mine/route.ts           -- 获取我的卡片 GET
    gallery/route.ts              -- 公开卡片列表 GET（分页 + 搜索）
```

---

## 认证流程

### 邮箱密码注册
1. 用户填写邮箱 + 密码 → POST /api/auth/sign-up/email
2. Better Auth 创建 user（`emailVerified = false`）+ account（`providerId = 'email'`）
3. Resend 发送验证邮件（含验证链接）
4. 用户点击链接 → Better Auth 标记 `emailVerified = true`
5. 重定向到生成器首页

### 社交登录（GitHub/Google）
1. 用户点击社交登录按钮 → 跳转 OAuth 授权页
2. 授权回调 → Better Auth 创建/关联 user + account
3. 社交登录的邮箱自动视为已验证（`emailVerified = true`）
4. 重定向到生成器首页

### 路由保护
- `(protected)` 路由组使用 middleware 检查：
  1. 用户是否已登录（session 有效）
  2. 邮箱是否已验证（`emailVerified = true`）
- 未登录 → 重定向到 /login
- 已登录但未验证 → 重定向到 /verify-email

---

## 卡片生成流程（改造后）

1. 前端提交词语 → `POST /api/generate`
2. 服务端验证：session 有效 + 邮箱已验证
3. **重复词检查**：查询 `cards` 表，同一用户 24h 内是否已生成该词 → 有则直接返回缓存
4. **配额检查**（按顺序）：
   - 全局熔断 → 检查 `global_usage`
   - 短期限流 → 检查最近 1 分钟 `cards.createdAt`
   - 每日配额 → 检查 `user_usage.dailyCount`
   - 每月配额 → 检查 `SUM(dailyCount)` 本月
5. 调用 OpenAI API → 获取 JSON 结果
6. **服务端生成 SVG** → 调用 `generateSVGCard()`（从 `lib/svgGenerator.ts`，纯函数可直接在服务端使用）
7. 写入 `cards` 表（`isPublic = true`）
8. 更新 `user_usage.dailyCount += 1` 和 `global_usage.dailyCount += 1, monthlyCount += 1`
9. 返回结果 + 剩余配额信息

---

## 画廊功能

- **路由**：`/gallery`，公开可访问，无需登录
- **渲染方式**：SSR（Cloudflare Workers 不支持 ISR，直接查询 Neon）
- **布局**：CSS `columns` 瀑布流（纯 CSS，无需额外库）
- **数据**：`SELECT * FROM cards WHERE isPublic = true ORDER BY createdAt DESC LIMIT 20 OFFSET ?`
- **搜索**：`/gallery?q=词语`，服务端 `WHERE word LIKE '%词语%'`
- **分页**：无限滚动或 "加载更多" 按钮，每次加载 20 张
- **展示内容**：SVG 卡片缩略图 + 词语 + 作者名 + 生成时间

---

## 用户中心

### 账户设置（/account）
- 修改密码（通过 Better Auth API）
- 修改用户名
- 查看邮箱（已验证标识）

### 我的卡片（/account/cards）
- 列表展示用户所有卡片（含公开/隐藏状态）
- 切换按钮：公开 ↔ 隐藏（调用 `PUT /api/cards/[id]`）
- 下载 SVG 按钮

---

## 用户体验反馈

前端需展示配额状态：
- **正常**：进度条 `今日已用 1/3 次 · 本月 15/30 次`
- **接近限额**：黄色警告 `今日剩余 1 次生成机会`
- **达到限额**：生成按钮禁用 + 红色提示 `今日配额已用完，明天再来吧！`
- **全局熔断**：全站横幅 `今日生成次数已达上限，服务将于明天恢复`

---

## 关键文件修改清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `package.json` | 修改 | 添加 drizzle-orm, drizzle-kit, @neondatabase/serverless, better-auth, resend, @auth/core；移除 @opennextjs/cloudflare 相关（如不再需要） |
| `app/api/generate/route.ts` | 重构 | 添加 auth 检查、配额检查、数据库写入、服务端 SVG 生成 |
| `lib/svgGenerator.ts` | 保持 | 纯函数，可在服务端直接调用，无需修改 |
| `components/CardGenerator.tsx` | 修改 | 添加 auth 状态检查、配额显示、重定向逻辑 |
| `components/ResultCard.tsx` | 修改 | 接收 card ID，更新响应数据结构 |
| `app/layout.tsx` | 修改 | 添加导航栏（登录/画廊/账户链接）、session provider |
| `lib/db/schema.ts` | 新建 | Drizzle schema 定义（所有表） |
| `lib/db/index.ts` | 新建 | Drizzle client（Neon WebSocket/HTTP 驱动） |
| `lib/auth.ts` | 新建 | Better Auth 服务端配置 |
| `lib/auth-client.ts` | 新建 | Better Auth 客户端配置 |
| `app/api/auth/[...all]/route.ts` | 新建 | Better Auth catch-all handler |
| `middleware.ts` | 新建 | 路由保护（认证 + 邮箱验证检查） |
| `wrangler.toml` | 修改 | 添加环境变量绑定（DATABASE_URL 等） |
| `open-next.config.ts` | 修改 | 确保 nodejs_compat 支持 Better Auth 所需 API |

---

## Cloudflare Workers 适配要点

1. **Neon 连接**：使用 `@neondatabase/serverless` 的 WebSocket 驱动（Workers 不支持 TCP）
2. **Better Auth**：确保使用 `nodejs_compat` compatibility flag；若遇 crypto API 问题，使用 `node:crypto` polyfill（已在 `open-next.config.ts` 的 `edgeExternals` 中）
3. **Session 策略**：优先使用数据库 session（Better Auth 默认）；若性能不佳可切换 JWT 无状态 session
4. **环境变量**：通过 `wrangler.toml` 的 `[vars]` 或 Cloudflare dashboard 的 secrets 配置

---

## 验证方式

1. **认证流程**：注册 → 收到验证邮件 → 验证 → 登录 → 可生成卡片
2. **社交登录**：GitHub/Google 登录 → 自动验证 → 可生成卡片
3. **配额限制**：生成 3 次后按钮禁用，显示正确提示
4. **重复词缓存**：同一词语第二次生成直接返回，不消耗配额
5. **画廊**：生成的卡片出现在 /gallery，隐藏后消失
6. **全局熔断**：模拟调用达到上限，确认 503 响应和全站提示
