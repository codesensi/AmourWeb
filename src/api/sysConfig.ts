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

/** 获取系统公共配置 */
export const getSysConfig = () => {
  return http.request<SysConfigResult>("get", "/sys/config");
};
