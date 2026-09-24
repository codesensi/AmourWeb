# 构建阶段:Node 版本对齐 .nvmrc(v24)与 package.json engines(node >= 22.22.1)
FROM node:24-alpine AS build-stage

WORKDIR /app

# pnpm 版本对齐 package.json engines(pnpm >= 11)
RUN npm install -g pnpm@11

# 镜像源:pnpm 读取 npm_config_registry 环境变量(不读 npm config set 的配置)
ENV npm_config_registry=https://registry.npmmirror.com

# 先单独拷贝依赖清单安装,最大化利用层缓存(源码变更不触发重装依赖)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# 运行阶段:nginx 承载静态资源,并反代后端接口(生产为同源部署,契约与 dev 的后端兜底代理一致)
FROM nginx:stable-alpine AS production-stage

# API 反代上游,由 nginx/templates/default.conf.template 在启动时渲染;
# 仅支持协议+主机+端口(如 http://backend:9666),不带路径,与本机启动后端时的默认端口一致
ENV BACKEND_ORIGIN=http://backend:9666

COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80

# 健康检查:走本地自检端点(不落访问日志)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -q --spider http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
