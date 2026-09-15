import { ref } from "vue";
import { getSysConfig } from "@/api/sysConfig";

/** 站点公共配置键注册表 —— 前端唯一键源(字段名 → sys_config 配置键);新增配置键只改这里 */
export const SYS_CONFIG_KEYS = {
  /** 项目/站点名称 */
  name: { key: "name", boolean: false },
  /** 项目/站点logo图片(值为文件访问地址 /file/view/{id};登录页/管理端/门户端统一) */
  logo: { key: "logo", boolean: false },
  /** 项目/站点favicon图标(值为文件访问地址 /file/view/{id};浏览器标签页图标) */
  favicon: { key: "favicon", boolean: false },
  /** ICP 备案文案 */
  icp: { key: "icp", boolean: false },
  /** 版权年份 */
  copyrightYear: { key: "copyright-year", boolean: false },
  /** 门户恋爱计时起点 */
  siteLoveStartDate: { key: "site.love-start-date", boolean: false },
  /** 验证码显隐开关(布尔型) */
  captchaEnabled: { key: "captcha.enabled", boolean: true }
} as const;

export type SysConfigField = keyof typeof SYS_CONFIG_KEYS;

/** 由注册表派生的归一化数据形态(布尔键 → boolean,其余 → string) */
export type SysConfig = {
  [K in SysConfigField]: (typeof SYS_CONFIG_KEYS)[K] extends { boolean: true }
    ? boolean
    : string;
};

/** 会话级配置缓存(field → 归一化值):同键跨调用点复用,不再重复请求 */
const configCache = new Map<SysConfigField, unknown>();

/** 进行中的拉取任务(field → Promise):相同字段的并发调用共享同一次请求 */
const pendingTasks = new Map<SysConfigField, Promise<void>>();

/**
 * 按需拉取站点公共配置并归一化为 camelCase 字段对象。
 * 内置会话缓存与并发去重(登录页/门户/管理端布局各自拉取时,同键仅首次发起请求),
 * 内部吞掉网络异常返回已拿到的部分结果(消费侧均有兜底),可放心在多处调用。
 *
 * @param fields 需要下发的配置字段名
 * @returns 仅含请求字段的归一化数据(键停用/缺失/拉取失败时字段不出现)
 */
export async function fetchSysConfig<F extends SysConfigField>(
  ...fields: F[]
): Promise<Pick<SysConfig, F>> {
  // 缓存已持有的字段直接复用,仅对缺失字段发起请求
  const missed = fields.filter(field => !configCache.has(field));
  if (missed.length) {
    const task = getSysConfig(missed.map(field => SYS_CONFIG_KEYS[field].key))
      .then(res => {
        for (const item of res.data ?? []) {
          const field = missed.find(
            f => SYS_CONFIG_KEYS[f].key === item.configKey
          );
          if (!field || item.configValue == null) continue;
          configCache.set(
            field,
            SYS_CONFIG_KEYS[field].boolean
              ? item.configValue === "true"
              : item.configValue
          );
        }
        // 请求成功的字段统一入缓存(含后端未下发的键,以 undefined 占位),
        // 区分"成功但未配置"与"拉取失败",前者不再重试、后者允许重试
        for (const field of missed) {
          if (!configCache.has(field)) configCache.set(field, undefined);
        }
      })
      .catch(() => {
        // 网络异常:静默降级为空配置(消费侧回退兜底),不写缓存以便后续重试
      });
    for (const field of missed) pendingTasks.set(field, task);
    try {
      await task;
    } finally {
      for (const field of missed) pendingTasks.delete(field);
    }
  }
  const data = {} as Pick<SysConfig, F>;
  for (const field of fields) {
    if (configCache.has(field)) {
      (data as Record<string, unknown>)[field] = configCache.get(field);
    }
  }
  return data;
}

/** 站点 Logo 兜底图(配置缺失或图片加载失败时,三端统一回退 public/favicon.ico) */
export const LOGO_FALLBACK = "/favicon.ico";

/** 站点 Logo 的全局响应式状态(空值时消费侧回退本地静态默认图) */
export const siteLogo = ref("");

/** 站点 favicon 兜底(与 LOGO_FALLBACK 同源,均为 public 内置默认图标) */
const FAVICON_FALLBACK = "/favicon.ico";

/** 进行中的初始化 Promise(幂等去重:多个组件同时调用仅发起一次请求) */
let siteLogoTask: Promise<void> | null = null;

/** 回填站点 Logo 全局状态(供登录页/门户等批量拉取配置的调用点复用,避免单独再拉 logo) */
export function applySiteLogo(value: string | undefined) {
  siteLogo.value = value ?? "";
}

/**
 * 动态维护 `<head>` 中的 favicon link:复用 index.html 的静态声明节点(存在则仅改 href,
 * 首次进入前静态 /favicon.ico 仍生效,避免配置拉取前标签页图标闪烁),缺失时新建。
 * 配置为空回落 public 内置默认图标。
 */
export function applySiteFavicon(value: string | undefined) {
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = value || FAVICON_FALLBACK;
}

/**
 * 初始化站点 Logo(经免登录配置下发接口,登录前后均可调用)。
 * 配置为空或拉取失败时置空,由消费侧回退默认静态图;
 * 失败后清空去重标记,允许下次进入时重新触发拉取。
 * 同时回填 favicon(与 logo 同属 base 分组品牌资源,一次请求两键)。
 */
export function initSiteLogo(): Promise<void> {
  if (siteLogoTask) return siteLogoTask;
  siteLogoTask = fetchSysConfig("logo", "favicon").then(({ logo, favicon }) => {
    siteLogo.value = logo ?? "";
    applySiteFavicon(favicon);
  });
  void siteLogoTask.finally(() => {
    // 拉取失败(logo 未写入缓存)时清空去重标记,允许后续重试
    if (!configCache.has("logo")) siteLogoTask = null;
  });
  return siteLogoTask;
}
