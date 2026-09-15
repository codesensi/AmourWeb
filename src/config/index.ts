import axios from "axios";
import { ref } from "vue";
import type { App } from "vue";

let config: object = {};
const { VITE_PUBLIC_PATH } = import.meta.env;

/** 站点标题(浏览器标签页名称):出厂值取 platform-config.json 的 Title,启动时由 GET /portal/config/list-by-keys 覆盖 */
export const siteTitle = ref("");

const setConfig = (cfg?: unknown) => {
  config = Object.assign(config, cfg);
};

const getConfig = (key?: string): PlatformConfigs => {
  if (typeof key === "string") {
    const arr = key.split(".");
    if (arr && arr.length) {
      let data: Record<string, unknown> | null = config as Record<
        string,
        unknown
      >;
      arr.forEach(v => {
        if (data && typeof data[v] !== "undefined") {
          data = data[v] as Record<string, unknown>;
        } else {
          data = null;
        }
      });
      return data as PlatformConfigs;
    }
  }
  return config as PlatformConfigs;
};

/** 获取项目动态全局配置 */
export const getPlatformConfig = async (app: App): Promise<PlatformConfigs> => {
  app.config.globalProperties.$config = getConfig();
  try {
    const { data: config } = await axios({
      method: "get",
      url: `${VITE_PUBLIC_PATH}platform-config.json`
    });
    let $config = app.config.globalProperties.$config;
    // 自动注入系统配置
    if (app && $config && typeof config === "object") {
      $config = Object.assign($config, config);
      app.config.globalProperties.$config = $config;
      // 设置全局配置
      setConfig($config);
    }
    return $config as PlatformConfigs;
  } catch {
    // 抛 Error 对象保留堆栈,由 main.ts 的调用链统一提示
    throw new Error("请在public文件夹下添加platform-config.json配置文件");
  }
};

/** 本地响应式存储的命名空间 */
const responsiveStorageNameSpace = () => getConfig().ResponsiveStorageNameSpace;

export { getConfig, setConfig, responsiveStorageNameSpace };
