import { http } from "@/utils/http";
import type { ApiResult } from "@/api/types";

/** 系统公共配置数据(GET /sys/config 免登录;门户展示类配置键对齐后端 sys_config) */
export interface SysConfigData {
  /** 验证码显隐开关(后端 sys_config captcha.enabled) */
  captchaEnabled: boolean;
  /** 站点名称(浏览器标签/登录页标题/门户 logo 文案,sys_config name) */
  title: string;
  /** 门户顶栏文案(sys_config site.slogan) */
  siteSlogan: string;
  /** 恋爱计时起点(sys_config site.love-start-date,格式 yyyy-MM-dd HH:mm:ss) */
  loveStartDate: string;
  /** ICP 备案文案(sys_config icp) */
  icpText: string;
  /** 版权年份(sys_config copyright-year) */
  copyright: string;
}

/** 系统公共配置响应(GET /sys/config;免登录,字段随期次扩充) */
export type SysConfigResult = ApiResult<SysConfigData>;

/** QQ 头像地址(与 sys_config qq-service 模板同源;门户 Hero 640、留言列表 100) */
export const qqAvatar = (qq: string | undefined, size = 640): string =>
  qq ? `https://q1.qlogo.cn/g?b=qq&nk=${encodeURIComponent(qq)}&s=${size}` : "";

/** 获取系统公共配置 */
export const getSysConfig = () => {
  return http.request<SysConfigResult>("get", "/sys/config");
};
