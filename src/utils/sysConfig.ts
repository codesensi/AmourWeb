import { ref } from "vue";
import { getSysConfig } from "@/api/sysConfig";

/** 站点公共配置键注册表 —— 前端唯一键源(字段名 → sys_config 配置键);新增配置键只改这里 */
export const SYS_CONFIG_KEYS = {
  /** 项目/站点名称 */
  name: { key: "name", boolean: false },
  /** 项目/站点logo图片(值为文件访问地址 /file/view/{id};登录页/管理端/门户端统一) */
  logo: { key: "logo", boolean: false },
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

/**
 * 按需拉取站点公共配置并归一化为 camelCase 字段对象。
 * 后端 config 缓存兜底,可放心在多处调用。
 *
 * @param fields 需要下发的配置字段名
 * @returns 仅含请求字段的归一化数据(键停用/缺失时字段不出现)
 */
export async function fetchSysConfig<F extends SysConfigField>(
  ...fields: F[]
): Promise<Pick<SysConfig, F>> {
  const res = await getSysConfig(
    fields.map(field => SYS_CONFIG_KEYS[field].key)
  );
  const data = {} as Pick<SysConfig, F>;
  if (res.success) {
    for (const item of res.data) {
      const field = fields.find(f => SYS_CONFIG_KEYS[f].key === item.configKey);
      if (!field || item.configValue == null) continue;
      (data as Record<string, unknown>)[field] = SYS_CONFIG_KEYS[field].boolean
        ? item.configValue === "true"
        : item.configValue;
    }
  }
  return data;
}

/** 站点 Logo 兜底图(配置缺失或图片加载失败时,三端统一回退 public/favicon.ico) */
export const LOGO_FALLBACK = "/favicon.ico";

/** 站点 Logo 的全局响应式状态(空值时消费侧回退本地静态默认图) */
export const siteLogo = ref("");

/** 进行中的初始化 Promise(幂等去重:多个组件同时调用仅发起一次请求) */
let siteLogoTask: Promise<void> | null = null;

/**
 * 初始化站点 Logo(经免登录配置下发接口,登录前后均可调用)。
 * 配置为空或拉取失败时置空,由消费侧回退默认静态图;
 * 失败后清空去重标记,允许下次进入时重新触发拉取。
 */
export function initSiteLogo(): Promise<void> {
  if (!siteLogoTask) {
    siteLogoTask = fetchSysConfig("logo")
      .then(({ logo }) => {
        siteLogo.value = logo ?? "";
      })
      .catch(() => {
        siteLogoTask = null;
      });
  }
  return siteLogoTask;
}
