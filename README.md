# Amour Web

Amour（爱慕情侣小站）项目的前端工程，包含 **门户站点** 与 **管理后台** 两部分：

- **门户**：情侣主页、纪念日、点点滴滴、情侣日记、恋爱画册、恋爱清单、足迹地图、留言簿、时间胶囊等
- **管理后台**：用户/角色/菜单/字典/参数配置/登录与操作日志/文件管理等系统管理，以及各业务模块的内容管理

基于 [vue-pure-admin](https://github.com/pure-admin/vue-pure-admin) 二次开发。

## 技术栈

- Vue 3 + TypeScript + Vite
- Element Plus + TailwindCSS
- Pinia + Vue Router + TanStack Vue Query
- 包管理器：pnpm（仅限，`preinstall` 已锁定）

## 环境要求

| 依赖    | 版本                      |
| ------- | ------------------------- |
| Node.js | >= 22.22.1（见 `.nvmrc`） |
| pnpm    | >= 11                     |

## 快速开始

```bash
# 安装依赖
pnpm install

# 本地开发（默认 http://localhost:8848）
pnpm dev

# 生产构建 / 预发构建
pnpm build
pnpm build:staging
```

### 常用脚本

| 命令                                | 说明                                          |
| ----------------------------------- | --------------------------------------------- |
| `pnpm dev`                          | 本地开发服务器                                |
| `pnpm build` / `pnpm build:staging` | 生产 / 预发构建                               |
| `pnpm typecheck`                    | 类型检查（vue-tsc，以不新增错误为通过标准）   |
| `pnpm lint`                         | ESLint + Prettier + Stylelint（自带 `--fix`） |
| `pnpm report`                       | 构建并生成产物体积分析报告                    |

## 环境变量

| 变量                  | 作用                  | 备注                                        |
| --------------------- | --------------------- | ------------------------------------------- |
| `VITE_PORT`           | 本地开发端口          | 默认 `8848`                                 |
| `VITE_USE_MOCK`       | mock 总开关           | `true` = fake-server 拦截；生产构建固定关闭 |
| `VITE_PROXY_TARGET`   | 开发环境后端代理目标  | 留空不启用；默认 `http://localhost:9666`    |
| `VITE_PUBLIC_PATH`    | 部署路径前缀          | 默认 `/`                                    |
| `VITE_ROUTER_HISTORY` | 路由历史模式          | `hash` / `h5`                               |
| `VITE_CDN`            | 构建时 CDN 替换本地库 | 默认 `false`                                |
| `VITE_COMPRESSION`    | 构建压缩开关          | 默认 `none`，可选 `gzip` 等                 |
| `VITE_APP_TITLE`      | 页面初始标题          | 启动后由后端配置 `sys_config name` 动态覆盖 |

## 后端联调

- 配套后端工程：[Amour](https://github.com/codesensi/Amour)（Java 21 + Spring Boot 4 + MyBatis-Flex），默认端口 `9666`
- 开发态请求分两层：mock 路由由 `vite-plugin-fake-server` 拦截（`mock/` 目录），未命中的请求经 `build/backendFallback.ts` 兜底代理转发到 `VITE_PROXY_TARGET`
- 建议全开（纯 mock 调试）或全关（联调真实后端），避免"登录是假的、部分数据是真的"混合态
- 生产构建不含 mock 与代理逻辑，为同源部署：由 nginx/后端把接口前缀转发到后端

### 契约约定

- 统一响应 `Result{ success, code, msg, data, timestamp, traceId? }`，契约类型集中在 `src/api/types.ts`
- 分页五字段：`records / pageNumber / pageSize / totalRow / totalPage`
- 雪花 ID 防精度丢失：后端所有标识类 `Long` 字段（主键/外键/用户 ID 等）序列化为字符串，前端类型一律 `string`
- 时间格式：`LocalDateTime` 为 `yyyy-MM-dd HH:mm:ss`，`LocalDate` 为 `yyyy-MM-dd`
- mock 数据必须与后端 DTO 同形，发现不一致先报告再修改

## Docker 部署

镜像内 nginx 除承载静态资源外，还把后端接口前缀（`/sys` `/admin` `/portal` `/file` `/captcha` `/login` `/logout` `/qq-info` `/_AMapService`）反代到后端，生产为同源部署。

1. 构建镜像（末尾的 `.` 表示使用当前路径下的 `Dockerfile`，可根据实际情况指定路径）

```bash
docker build -t amour-web .
```

2. 端口映射并启动容器（`8080:80`：容器内 `80` 端口转发到主机 `8080` 端口）

```bash
# BACKEND_ORIGIN 为后端接口反代上游(仅协议+主机+端口,不带路径);
# 与后端容器同网络时指向后端容器名,前端容器直连本机后端时用 host.docker.internal
docker run -dp 8080:80 --name amour-web -e BACKEND_ORIGIN=http://host.docker.internal:9666 amour-web
```

操作完上面两个命令后，在浏览器打开 `http://localhost:8080` 即可预览。

容器内置 `HEALTHCHECK`（本地 `/healthz` 自检），`docker ps` 可见健康状态。

## Git 提交规范

参考 [Angular](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-angular) 约定：`feat` 新功能、`fix` 修复、`style` 格式、`perf` 性能、`refactor` 重构、`revert` 撤销、`test` 测试、`docs` 文档、`chore` 工程配置、`types` 类型定义、`wip` 开发中。

## 源项目

本工程基于 [vue-pure-admin](https://github.com/pure-admin/vue-pure-admin) 二次开发，感谢 pure-admin 团队的开源付出（MIT License）。
