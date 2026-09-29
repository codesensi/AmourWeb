# 更新日志

本项目的所有显著变更都记录在本文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循[语义化版本](https://semver.org/lang/zh-CN/)，提交信息遵循 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/)。

## [Unreleased]

<!-- 未发布的变更记录在此段，发布时改为 [x.y.z] - 日期 -->

## [1.1.4] - 2026-09-29

### 新增

- 定时任务管理：支持任务的创建、修改、启停、手动执行与删除，修改 cron 表达式后即时生效；可选禁止任务并发执行，上次未结束时自动跳过本次触发；完整记录每次执行的开始时间、耗时与结果，执行日志可查
- 管理端仪表盘与足迹统计：汇总、访问趋势、留言地区分布、年度回顾、足迹统计、恋爱画册归档，门户首页时间胶囊卡片与封面增强

### 变更

- 操作日志展示链路追踪ID

## [1.1.3] - 2026-09-28

### 新增

- Release 自动化：推送 `v*` 标签后自动从本文件提取对应版本段落创建 GitHub Release

### 变更

- README 完善：契约约定补充数据范围（`canEdit`）条目，提交规范升级为 Conventional Commits 口径
- 工程版本号由 `7.0.0`（继承上游模板）重置，与后端同节奏演进，当前为 `1.1.3`

## [1.1.2] - 2026-09-28

### 新增

- 业务模块分页行消费后端回填的 `canEdit`（数据范围判定结果），操作列修改/删除按钮按 `canEdit === true` 门控显示
- 状态开关列（`useStatusColumn` 公共骨架）接入门控：行数据携带 `canEdit: false` 时禁用切换，系统管理页无数据范围概念不受影响

### 变更

- 角色数据权限保存接口路径对齐后端 `PUT /sys/role/assign-data-scope`
- 门户展示类种子数据创建人归属修正为两位主角用户交替，情侣日记创建人与记录人对齐

### 修复

- 修复 `canEdit` 缺失时按钮误显示、提交才报无权限的问题（门控语义收紧为「缺证即隐藏」）
- mock 分页响应统一注入 `canEdit: true` 模拟"本人视角"，与后端回填契约对齐，避免收紧后按钮整体消失

## [1.0.0] - 2026-09-24

### 新增

- **门户**：情侣主页、纪念日、点点滴滴、情侣日记、恋爱画册、恋爱清单、足迹地图（高德地图渲染）、留言簿、时间胶囊，免登录展示
- **管理后台**：系统管理（用户/角色/菜单/字典/参数配置/文件/登录与操作日志/通知中心/缓存）与各业务模块内容管理、仪表盘
- **契约**：统一响应 `Result{success, code, msg, data, timestamp, traceId?}`、分页五字段、雪花 ID 序列化为字符串防精度丢失
- **工程**：pnpm 工作流（`dev` / `build` / `typecheck` / `lint`）、vite-plugin-fake-server 本地 mock（生产构建固定关闭）、nginx 同源反代部署与 Dockerfile（`BACKEND_ORIGIN` 渲染反代上游、`/healthz` 健康自检）

[Unreleased]: https://github.com/codesensi/AmourWeb/compare/v1.1.4...HEAD
[1.1.4]: https://github.com/codesensi/AmourWeb/compare/v1.1.3...v1.1.4
[1.1.3]: https://github.com/codesensi/AmourWeb/compare/v1.1.2...v1.1.3
[1.1.2]: https://github.com/codesensi/AmourWeb/compare/v1.0.0...v1.1.2
[1.0.0]: https://github.com/codesensi/AmourWeb/releases/tag/v1.0.0
