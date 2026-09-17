import { ref } from "vue";
import { getSysConfig } from "@/api/sys-config";
import { queryClient } from "@/plugins/vueQuery";
import { queryKeys } from "@/hooks/queryKeys";

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

/** 全量键名列表(注册表派生,新增键自动纳入一次请求) */
const ALL_FIELDS = Object.keys(SYS_CONFIG_KEYS) as SysConfigField[];

/**
 * 全键拉取并归一化站点公共配置(查询层 queryFn,一次请求覆盖全部键)。
 * 键停用/后端未下发时对应字段为 undefined,与"成功但未配置"语义一致;
 * 网络异常向上抛出,由查询层记录失败状态,下次调用自动重试。
 */
async function fetchSysConfigAll(): Promise<Partial<SysConfig>> {
  const res = await getSysConfig(
    ALL_FIELDS.map(field => SYS_CONFIG_KEYS[field].key)
  );
  const config: Partial<SysConfig> = {};
  for (const item of res.data ?? []) {
    const field = ALL_FIELDS.find(
      f => SYS_CONFIG_KEYS[f].key === item.configKey
    );
    if (!field || item.configValue == null) continue;
    (config as Record<string, unknown>)[field] = SYS_CONFIG_KEYS[field].boolean
      ? item.configValue === "true"
      : item.configValue;
  }
  return config;
}

/**
 * 按需读取站点公共配置(归一化为 camelCase 字段对象)。
 * 内部统一经查询层取数:全部调用点(站点标题/门户布局/登录页/侧边栏 Logo)
 * 共享同一份 ["sys-config"] 缓存与在途请求,同一次会话仅首次发起网络请求;
 * staleTime=Infinity 常驻缓存,管理侧改动后经 invalidateQueries 失效重拉。
 * 拉取失败时向上抛出(消费侧均有兜底),可放心在多处调用。
 *
 * @param fields 需要下发的配置字段名
 * @returns 仅含请求字段的归一化数据(键停用/缺失/拉取失败时字段不出现)
 */
export async function fetchSysConfig<F extends SysConfigField>(
  ...fields: F[]
): Promise<Pick<SysConfig, F>> {
  const config = await queryClient.fetchQuery({
    queryKey: queryKeys.sysConfig().key,
    queryFn: fetchSysConfigAll,
    staleTime: Infinity
  });
  const data = {} as Pick<SysConfig, F>;
  for (const field of fields) {
    (data as Record<string, unknown>)[field] = config[field];
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
    link.href = value || FAVICON_FALLBACK;
    document.head.appendChild(link);
    return;
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
    // 拉取失败(查询层未写入缓存)时清空去重标记,允许后续重试
    if (!queryClient.getQueryState(queryKeys.sysConfig().key)?.data) {
      siteLogoTask = null;
    }
  });
  return siteLogoTask;
}
