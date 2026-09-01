import { http } from "@/utils/http";
import type { ApiResult } from "@/api/types";

/** 系统公共配置数据(GET /sys/config 免登录;门户展示类配置键对齐后端 sys_config) */
export interface SysConfigData {
  /** 验证码显隐开关(后端 sys_config captcha.enabled) */
  captchaEnabled: boolean;
  /** 站点名称(浏览器标签/登录页标题/门户 logo 文案) */
  title: string;
  /** 门户顶栏文案(sys_config site.slogan) */
  siteSlogan: string;
  /** 女主昵称(sys_config site.female-name) */
  femaleName: string;
  /** 男主昵称(sys_config site.male-name) */
  maleName: string;
  /** 女主 QQ 号,头像经 q1.qlogo.cn 拉取(sys_config site.female-qq) */
  femaleQq: string;
  /** 男主 QQ 号(sys_config site.male-qq) */
  maleQq: string;
  /** 恋爱计时起点(sys_config site.love-start-date) */
  loveStartDate: string;
  /** ICP 备案文案(sys_config site.icp-text) */
  icpText: string;
  /** 版权年份(sys_config copyright) */
  copyright: string;
}

/** 系统公共配置响应(GET /sys/config;免登录,字段随期次扩充) */
export type SysConfigResult = ApiResult<SysConfigData>;

/** QQ 头像地址(nk 为 QQ 号,门户首页 640、留言列表 100) */
export const qqAvatar = (qq: string | undefined, size = 640): string =>
  qq ? `https://q1.qlogo.cn/g?b=qq&nk=${encodeURIComponent(qq)}&s=${size}` : "";

/** 获取系统公共配置 */
export const getSysConfig = () => {
  return http.request<SysConfigResult>("get", "/sys/config");
};
