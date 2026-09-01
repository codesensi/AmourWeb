import { http } from "@/utils/http";
import type { ApiResult } from "@/api/types";

/** 图形验证码响应 */
export type CaptchaResult = ApiResult<{
  /** 验证码唯一标识 */
  captchaKey: string;
  /** 验证码图片(Base64 data URI,可直接绑定 img src) */
  captchaValue: string;
  /** 验证码开关(后端 sys_config captcha.enabled;缺省视为开启) */
  enabled?: boolean;
}>;

/** 获取图形验证码 */
export const getCaptchaImage = () => {
  return http.request<CaptchaResult>("get", "/captcha");
};
