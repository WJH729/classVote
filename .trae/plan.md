# 班级投票系统实现计划

## 需求分析
1. 12个班级账号，每班一个，绑定一台电脑
2. 投票界面显示当前投票内容
3. 多维表格和其他数据统计结果
4. 每班投票匿名

## 实现步骤

### 1. 数据库层
- 修改 `AdminUser` 模型，添加 `deviceId` 字段（设备绑定）
- 新增 `VoteClass` 模型记录班级维度投票（班级ID + 投票ID + 票数分布）
- 更新 `prisma.schema` 和运行 `prisma db push`

### 2. 后端 API
- 在 `admin-auth.service.ts` 添加设备绑定验证逻辑
- 创建班级登录接口 `/class/auth/login`
- 创建班级投票接口 `/class/votes`
- 创建统计接口 `/class/stats`

### 3. 前端页面
- 创建 `/class/login` - 班级登录页面
  - **新文件**：`f:\pppp\apps\web\src\app\class\login\page.tsx`
  - **页面结构**：标题（"班级投票系统 - 登录"）、班级编号选择器（Class 01 ~ 12）、密码输入框、设备绑定确认复选框（"确认本机为班级专用投票机"）、提交按钮、提示信息
  - **默认凭据**：邮箱格式 `classXX@vote.system`，密码与班级编号相同
  - **登录逻辑**：用户选择班级编号 → 自动生成 email → 调用 `/class/auth/login` → 首次登录记录 `deviceId`（浏览器指纹/localStorage） → 后续登录验证 `deviceId` 是否匹配 → 登录成功跳转 `/class/vote`
- 创建 `/class/vote` - 投票界面
- 创建 `/class/results` - 统计结果页

### 4. 种子脚本
- 创建 12 个班级账号（class1-class12@vote.system）
- 设置默认密码为班级编号
