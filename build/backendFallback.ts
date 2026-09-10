import http from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";

/**
 * 开发环境后端兜底代理。
 *
 * 注册时机：通过 configureServer 的 post-hook 挂载，位于 Vite 全部内部中间件
 * （源码转换、静态资源、HTML 回退）之后——凡 Vite 无法响应的请求（即后端接口）
 * 统一转发到 target，无需按接口前缀逐条维护，新增后端接口零配置。
 *
 * 注意：Vite 的 htmlFallback 中间件会把"无扩展名的 GET"重写为 /index.html，
 * 导致原始路径丢失，因此用最前置的中间件先把原始路径记录到请求对象上，
 * 兜底转发时使用记录的原始路径。
 *
 * 仅在 serve（dev）命令下生效，构建产物不含此逻辑。
 * target 仅支持协议 + 主机 + 端口的源地址（如 http://localhost:9666），不支持带路径。
 */
export function backendFallback(target: string): Plugin {
  const backend = new URL(target);
  /** 每个请求的原始路径（htmlFallback 重写前） */
  const originalPaths = new WeakMap<IncomingMessage, string>();

  return {
    name: "dev-backend-fallback",
    apply: "serve",
    configureServer(server) {
      // 最前置：在任何内部中间件改写 req.url 之前记录原始路径
      server.middlewares.use(
        (req: IncomingMessage, _res: ServerResponse, next) => {
          originalPaths.set(req, req.url ?? "/");
          next();
        }
      );

      return () => {
        server.middlewares.use(
          (req: IncomingMessage, res: ServerResponse, next) => {
            const path = originalPaths.get(req) ?? req.url ?? "/";
            // 页面入口与浏览器页面导航交给 Vite（hash 路由下浏览器只访问 / 与 /index.html）
            if (
              path === "/" ||
              path === "/index.html" ||
              req.headers.accept?.includes("text/html")
            ) {
              next();
              return;
            }
            // 其余请求（后端接口）转发到后端
            const proxyReq = http.request(
              {
                host: backend.hostname,
                port: backend.port,
                method: req.method,
                path,
                headers: { ...req.headers, host: backend.host }
              },
              proxyRes => {
                const headers = { ...proxyRes.headers };
                delete headers["transfer-encoding"];
                delete headers.connection;
                res.writeHead(proxyRes.statusCode ?? 502, headers);
                proxyRes.pipe(res);
              }
            );
            proxyReq.on("error", () => {
              res.statusCode = 502;
              res.end();
            });
            req.pipe(proxyReq);
          }
        );
      };
    }
  };
}
