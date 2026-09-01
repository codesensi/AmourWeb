import { http } from "@/utils/http";
import type { ApiResult } from "@/api/types";

/** 系统公共配置响应(GET /sys/config;免登录,字段随期次扩充) */
export type SysConfigResult = ApiResult<{
  /** 验证码显隐开关(后端 sys_config captcha.enabled) */
  captchaEnabled: boolean;
  /** 站点名称(对应后端 sys_config site.title) */
  title: string;
}>;

/** 获取系统公共配置 */
export const getSysConfig = () => {
  return http.request<SysConfigResult>("get", "/sys/config");
};
