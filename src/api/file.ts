import { http } from "@/utils/http";
import type { ApiResult } from "@/api/types";

/** 文件上传响应 */
export type UploadFileResult = ApiResult<{
  /** 文件ID */
  id: string;
  /** 文件访问地址(形如 /file/view/{id}) */
  url: string;
  /** 原始文件名 */
  originalName: string;
}>;

/**
 * 上传文件。
 * blob 由前端裁剪组件产出,以 multipart/form-data 提交;
 * bizType 路由业务类型(avatar-头像, photo-相册, markdown-点滴配图),
 * 扩展名与大小限制由后端 FileBizTypeEnum 按类型校验。
 */
export const uploadFile = (bizType: string, blob: Blob, originalName?: string) => {
  const formData = new FormData();
  // 文件名需携带扩展名,后端按扩展名白名单校验
  formData.append("file", blob, originalName);
  return http.request<UploadFileResult>("post", `/file/upload/${bizType}`, {
    data: formData,
    // 覆盖 http 工具默认的 application/json:显式声明 multipart 后,
    // axios 不再把 FormData 序列化成 JSON(transformRequest 的 JSON 分支),
    // 并在适配器层移除该头交由浏览器补 boundary,后端才能解析出 MultipartFile
    headers: { "Content-Type": "multipart/form-data" }
  });
};

/** 上传头像(内容为裁剪产物或 gif 原图;文件名传用户原始文件名,缺失时由调用方生成时间戳兜底名) */
export const uploadAvatar = (blob: Blob, originalName?: string) => {
  return uploadFile("avatar", blob, originalName);
};
