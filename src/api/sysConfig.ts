import { http } from "@/utils/http";
import type { ApiResult } from "@/api/types";

/** 系统公共配置数据(GET /sys/config 免登录;字段名 = sys_config 配置键转 camelCase) */
export interface SysConfigData {
  /** 项目/站点名称(sys_config name) */
  name: string;
  /** ICP 备案文案(sys_config icp) */
  icp: string;
  /** 版权年份(sys_config copyright-year) */
  copyrightYear: string;
  /** QQ 头像服务地址模板(sys_config qq-service,%s 为 QQ 号;留言头像使用,降级方案后续实现) */
  qqService: string;
  /** 用户随机头像服务地址模板(sys_config avatar-service,%s 为种子) */
  avatarService: string;
  /** 门户站点标语(sys_config site.slogan) */
  siteSlogan: string;
  /** 门户恋爱计时起点(sys_config site.love-start-date,格式 yyyy-MM-dd HH:mm:ss) */
  siteLoveStartDate: string;
  /** 验证码显隐开关(后端 sys_config captcha.enabled) */
  captchaEnabled: boolean;
}

/** 系统公共配置响应(GET /sys/config;免登录,字段随期次扩充) */
export type SysConfigResult = ApiResult<SysConfigData>;

/**
 * QQ 头像地址。
 * <p>
 * 传入站点配置的 qq-service 模板(sys_config qq-service,%s 为 QQ 号)时优先使用,
 * 缺省回退 qlogo 公共接口;门户 Hero 640、留言列表 100。
 */
export const qqAvatar = (
  qq: string | undefined,
  size = 640,
  service?: string
): string => {
  if (!qq) return "";
  if (service && service.includes("%s")) {
    return service.replace("%s", encodeURIComponent(qq));
  }
  return `https://q1.qlogo.cn/g?b=qq&nk=${encodeURIComponent(qq)}&s=${size}`;
};

/**
 * 本地生成头像:QQ 头像获取失败时的本地降级方案。
 * <p>
 * 以 seed(昵称或 QQ 号)首字符 + 确定性底色生成内联 SVG,
 * 同一种子永远同色,无需网络请求。
 */
export const localAvatar = (seed: string, size = 100): string => {
  const text = (seed ?? "").trim();
  let hash = 0;
  for (const ch of text) hash = (hash * 31 + ch.charCodeAt(0)) % 360;
  const initial = text ? text.charAt(0).toUpperCase() : "?";
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
    `<rect width="100%" height="100%" fill="hsl(${hash}, 60%, 62%)"/>` +
    `<text x="50%" y="50%" dy="0.36em" text-anchor="middle" fill="#fff" font-size="${Math.round(size * 0.4)}" font-family="sans-serif">${initial}</text></svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
};

/** 获取系统公共配置 */
export const getSysConfig = () => {
  return http.request<SysConfigResult>("get", "/sys/config");
};
