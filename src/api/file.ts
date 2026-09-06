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

/** 资料表单上传响应(pure-admin 演示服务的响应结构) */
interface FormUploadResult {
  code: number;
  message: string;
  data: Array<any>;
}

/**
 * 资料表单上传(pure-admin 演示遗留:指向演示服务 pureadmin.free.beeceptor.com,
 * 后端文件上传接口落地前仅供账户设置页演示)
 */
export const formUpload = data => {
  return http.request<FormUploadResult>(
    "post",
    "https://pureadmin.free.beeceptor.com/images",
    { data },
    {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }
  );
};
