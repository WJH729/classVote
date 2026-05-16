# PR 审核总结

> 审核日期: 2026-05-16

## 概述

本次合并包含两个 PR，修复了生产级 Bug 并完成了前端主题系统的全面升级。

| PR | 标题 | 状态 | 合并时间 |
|----|------|------|----------|
| [#2](https://github.com/WJH729/classVote/pull/2) | fix: resolve API proxy 404 when accessing via IP address | ✅ 已合并 | 2026-05-16 |
| [#3](https://github.com/WJH729/classVote/pull/3) | feat: migrate to Material Design 3 full theme system | ✅ 已合并 | 2026-05-16 |

---

## PR #2 — API Proxy 404 修复

### 问题

通过 IP 地址（如 `http://192.168.3.5:3000`）访问前端时，`/api/polls` 返回 404。CLI 测试正常，仅在浏览器中出现。

### 根因

- `next.config.ts` 的 `rewrites()` 在 Turbopack 开发模式下，对非 localhost 来源的请求处理不一致
- 首页 SWR 无错误重试机制，临时代理失败直接显示错误

### 修复方案

1. **新增 `middleware.ts`**: Next.js Middleware 拦截 `/api/*` 和 `/wallpaper/*` 请求，代理到后端 `127.0.0.1:3001`，不受 hostname 影响
2. **SWR 重试**: 添加 `errorRetryCount: 2` + `errorRetryInterval: 3000`，临时故障自动重试
3. **保留 rewrites**: `next.config.ts` 的 rewrite 规则作为兜底

### 审核意见

- ✅ 根本原因分析透彻
- ✅ 解决方案合理且可靠（Middleware 优于 Rewrite）
- ✅ SWR 重试提升了容错性
- ⚠️ SWR key 从 `/api/polls` 改为 `/polls` 需注意：因为 `apiFetch()` 内部已拼接 `/api` 前缀，旧路径 `/api/polls` 实际请求 `/api/api/polls`，这是错误的。修改正确。

---

## PR #3 — Material Design 3 主题系统

### 修改范围

4 个文件，+148/-26 行

### 主要变更

| 文件 | 变更 |
|------|------|
| `apps/web/src/theme.ts` | 完整 MD3 字体层级 + 组件样式覆盖 |
| `apps/web/src/app/globals.css` | 24 个 MD3 颜色 token |
| `apps/web/src/app/layout.tsx` | Geist → Roboto，优化字体加载 |
| `apps/api/package.json` | 移除 `"type": "module"` |

### 审核意见

- ✅ 字体层级完整的 MD3 标准（h1-h6, subtitle1-2, body1-2, caption, overline）
- ✅ 组件一致性提升（Button 胶囊形、Card/Dialog/ Chip 统一圆角）
- ✅ Google Fonts preconnect 优化加载性能
- ⚠️ body 直接写死 `#1D1B20` 颜色值，建议使用 CSS 变量 `var(--md-sys-color-on-background)` 保持主题一致性
- ⚠️ `prefers-color-scheme: dark` 的暗色模式颜色未更新，仍为旧值

---

## 后续建议

1. [ ] 暗色模式 (`prefers-color-scheme: dark`) 的 CSS 变量需要同步更新
2. [ ] Issue [#4](https://github.com/WJH729/classVote/issues/4) (Turbopack HMR ERR_ABORTED) 为已知限制，P2 低优先级
3. [ ] 考虑为 `api.ts` 添加请求重试封装，而非仅在 SWR 层处理
