# 投票系统（Web + 管理后台 + three.js 可视化）

## 技术栈
- **前端**：Next.js + React + TypeScript + MUI（Material Design 3 风格）
- **可视化**：three.js（通过 `@react-three/fiber`）
- **后端**：NestJS + JWT（Access/Refresh）+ RBAC
- **数据库**：PostgreSQL + Prisma
- **缓存/限流**：Redis（可选；当前限流用 Nest Throttler 的内存实现）

## 目录结构
- `apps/web/`：网页端（用户端 + 管理后台）
- `apps/api/`：后端 API（NestJS）
- `packages/shared/`：共享类型（可逐步扩展）

## 本地启动（纯 npm，无 Docker）

### 1) 准备数据库
你需要一个可访问的 Postgres，并把连接串写入 `apps/api/.env` 的 `DATABASE_URL`。

默认配置是：
- `DATABASE_URL="postgresql://vote:vote@localhost:5432/vote?schema=public"`

### 2) 迁移数据库（首次）
当前仓库已生成迁移 SQL：`apps/api/prisma/migrations/20260417_init/migration.sql`。

如果你的数据库已经准备好，可执行 Prisma 部署迁移：

```powershell
Set-Location f:\pppp\apps\api
npx prisma migrate deploy
```

### 3) 初始化管理员账号
执行种子脚本写入权限/角色/管理员账号：

```powershell
Set-Location f:\pppp\apps\api
npm run db:seed
```

默认管理员：
- 邮箱：`admin@example.com`
- 密码：`admin123456`

可在 `apps/api/.env` 里配置：
- `ADMIN_SEED_EMAIL`
- `ADMIN_SEED_PASSWORD`

### 4) 启动后端

```powershell
Set-Location f:\pppp\apps\api
npm run start:dev
```

后端默认端口：`3001`

### 5) 启动前端

```powershell
Set-Location f:\pppp\apps\web
npm run dev
```

前端默认端口：`3000`

打开：
- 用户端：`http://localhost:3000`
- 管理后台：`http://localhost:3000/admin/login`

### （推荐）一键同时启动 web + api

```powershell
Set-Location f:\pppp
npm run dev
```

## 关键接口（摘要）
- 管理员登录：`POST /admin/auth/login`
- 发布投票列表：`GET /polls`
- 投票：`POST /polls/:id/votes`（支持 header `x-voter-key` 用于“同一人只能投一次”）
- 结果：`GET /polls/:id/results`（用户端 2D + 3D）
- 管理投票：`/admin/polls/*`（需要 `Authorization: Bearer <accessToken>`）

## 说明与下一步
- **RBAC**：已实现 `RequirePermissions` + `PermissionsGuard`，管理端接口按权限控制。
- **审计日志**：管理员登录/刷新/登出、投票创建/更新/发布/关闭都会写入 `AuditLog`。
- **限流**：默认全局 60s/120 次（可按需细化为不同路由策略）。

## 特色功能

### Live2D 看板娘

网页端右下角有一个可交互的 Live2D 看板娘，具备以下特性：

- **模型切换**：支持初音ミク（Miku）和ひより（Hiyori）两个模型，通过顶部按钮切换
- **邻近感知**：默认隐藏，鼠标靠近 200px 内渐入显示，离开后 400ms 渐隐
- **视线追踪**：眼球和头部跟随鼠标移动实时转动
- **点击反馈**：点击模型播放 Tap 动画，加载后自动播放 Idle 动画
- **自由拖拽**：可拖拽到屏幕任意位置
- **响应式**：桌面端 380×500 / 平板 180×240 / 小屏 140×187 三档适配

**技术实现**：
- `pixi.js` v6 + `pixi-live2d-display` v0.4（Cubism 4）
- Cubism Core 通过 `next/script` 预加载，组件内 `import()` 动态加载渲染模块
- 共用 PIXI Application 实例，切换模型不复建
- 单次全局 mousemove 监听同时处理邻近检测和视线参数更新

**扩展模型**：在 `src/components/Live2DMiku.tsx` 的 `MODELS` 数组中新增配置即可，无需修改其他文件。
