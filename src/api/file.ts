import { http } from "@/utils/http";
import type { ApiResult } from "@/api/types";

/** 头像上传响应 */
export type UploadAvatarResult = ApiResult<{
  /** 上传后的头像 URL */
  url: string;
}>;

/** 上传头像(裁剪后的图片信息,第 1 期走 mock、返回占位图 URL) */
export const uploadAvatar = (data?: object) => {
  return http.request<UploadAvatarResult>("post", "/file/upload/avatar", {
    data
  });
};
