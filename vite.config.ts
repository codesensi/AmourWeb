import { getPluginsList } from "./build/plugins.ts";
import { include, exclude } from "./build/optimize.ts";
import { backendFallback } from "./build/backendFallback.ts";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import { type UserConfigExport, type ConfigEnv, loadEnv } from "vite";
import {
  root,
  alias,
  wrapperEnv,
  pathResolve,
  __APP_INFO__
} from "./build/utils.ts";

export default async ({ mode }: ConfigEnv): Promise<UserConfigExport> => {
  const {
    VITE_CDN,
    VITE_PORT,
    VITE_COMPRESSION,
    VITE_PUBLIC_PATH,
    VITE_USE_MOCK,
    VITE_PROXY_TARGET
  } = wrapperEnv(loadEnv(mode, root));
  return {
    base: VITE_PUBLIC_PATH,
    root,
    resolve: {
      alias
    },
    // 服务端渲染
    server: {
      // 端口号
      port: VITE_PORT,
      host: "0.0.0.0",
      // 预热文件以提前转换和缓存结果，降低启动期间的初始页面加载时长并防止转换瀑布
      warmup: {
        clientFiles: ["./index.html", "./src/{views,components}/*"]
      }
    },
    // 后端兜底代理：Vite 未响应的请求统一转发到后端（见 build/backendFallback.ts）；
    // 转发目标由 .env.development 的 VITE_PROXY_TARGET 配置，留空时不启用（如同源部署形态）
    plugins: [
      VITE_PROXY_TARGET ? backendFallback(VITE_PROXY_TARGET) : null,
      // element-plus 按需引入:自动解析 .vue 模板中的 el-* 组件并注入按需样式
      // dirs 置空:禁用对 src/components 的自动扫描——扫描会向 SFC 注入直连
      // index.vue 的导入(如 ReDrawer/ReDialog),与其 index.ts 的既有循环依赖
      // 叠加会翻转模块求值顺序,触发 "Cannot access before initialization" 崩溃;
      // 项目组件均为显式导入或 main.ts 全局注册,无需扫描兜底
      Components({ resolvers: [ElementPlusResolver()], dirs: [] }),
      ...(await getPluginsList(VITE_CDN, VITE_COMPRESSION, VITE_USE_MOCK))
    ],
    // https://cn.vitejs.dev/config/dep-optimization-options.html#dep-optimization-options
    optimizeDeps: {
      include,
      exclude
    },
    build: {
      // https://cn.vitejs.dev/guide/build.html#browser-compatibility
      target: "es2015",
      sourcemap: false,
      // 恢复超限告警能力(按需引入后最大 chunk 为 echarts ~737KB,独立动态加载)
      chunkSizeWarningLimit: 1000,
      rolldownOptions: {
        input: {
          index: pathResolve("./index.html", import.meta.url)
        },
        // 静态资源分类打包
        output: {
          chunkFileNames: "static/js/[name]-[hash].js",
          entryFileNames: "static/js/[name]-[hash].js",
          assetFileNames: "static/[ext]/[name]-[hash].[ext]"
        },
        checks: {
          pluginTimings: false,
          toleratedTransform: false
        }
      }
    },
    define: {
      __INTLIFY_PROD_DEVTOOLS__: false,
      __APP_INFO__: JSON.stringify(__APP_INFO__)
    }
  };
};
