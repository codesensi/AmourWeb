import { http } from "@/utils/http";
import type { ApiResult } from "@/api/types";

/** 图形验证码响应(纯资源:仅标识与图片;显隐开关由 /sys/config 下发) */
export type CaptchaResult = ApiResult<{
  /** 验证码唯一标识 */
  captchaKey: string;
  /** 验证码图片(Base64 data URI,可直接绑定 img src) */
  captchaValue: string;
}>;

/** 获取图形验证码 */
export const getCaptchaImage = () => {
  return http.request<CaptchaResult>("get", "/captcha");
};
