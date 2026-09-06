import { getSysConfig } from "@/api/sysConfig";

/** 站点公共配置键注册表 —— 前端唯一键源(字段名 → sys_config 配置键);新增配置键只改这里 */
export const SYS_CONFIG_KEYS = {
  /** 项目/站点名称 */
  name: { key: "name", boolean: false },
  /** ICP 备案文案 */
  icp: { key: "icp", boolean: false },
  /** 版权年份 */
  copyrightYear: { key: "copyright-year", boolean: false },
  /** QQ 头像服务地址模板(%s 为 QQ 号) */
  qqService: { key: "qq-service", boolean: false },
  /** 用户随机头像服务地址模板(%s 为种子) */
  avatarService: { key: "avatar-service", boolean: false },
  /** 门户站点标语 */
  siteSlogan: { key: "site.slogan", boolean: false },
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
  const res = await getSysConfig(fields.map(field => SYS_CONFIG_KEYS[field].key));
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
