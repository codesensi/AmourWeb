import { http } from "@/utils/http";
import type { ApiResult, PageQuery, PageResult } from "@/api/types";

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
export const uploadFile = (
  bizType: string,
  blob: Blob,
  originalName?: string
) => {
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

/** 文件行数据(后端 sys_file 下发,仅展示字段) */
export type FileItem = {
  /** 文件ID(后端序列化为字符串,避免 JS 精度丢失) */
  id: string;
  /** 原始文件名 */
  originalName: string;
  /** 文件大小(字节) */
  size: number;
  /** 文件扩展名(全小写) */
  extension: string;
  /** 文件类型(Content-Type) */
  contentType: string;
  /** 存储类型: local-本地, oss-对象存储 */
  storageType: string;
  /** 存储路径(相对 key) */
  path: string;
  /** 业务来源: avatar-用户头像, photo-相册照片, markdown-点滴配图 */
  bizType: string;
  /** 业务关联ID(文件被业务采纳时回填,后端序列化为字符串) */
  bizId: string;
  /** 上传人ID(后端序列化为字符串) */
  creator: string;
  /** 上传人用户名 */
  creatorName: string;
  /** 上传时间(yyyy-MM-dd HH:mm:ss) */
  createTime: string;
};

/** 文件分页查询参数 */
export type FileQuery = PageQuery & {
  /** 原始文件名(模糊匹配) */
  originalName?: string;
  /** 业务类型编码 */
  bizType?: string;
  /** 存储类型 */
  storageType?: string;
  /** 上传人用户名(模糊匹配) */
  creatorName?: string;
  /** 上传时间范围-起(yyyy-MM-dd,含当日) */
  beginTime?: string;
  /** 上传时间范围-止(yyyy-MM-dd,含当日) */
  endTime?: string;
  /** 删除标识: 0-文件列表(缺省), 1-回收站 */
  delFlag?: number;
};

/** 文件分页查询(GET /file/page;登录态,file:page 权限) */
export const getFilePage = (params?: FileQuery) => {
  return http.request<ApiResult<PageResult<FileItem>>>("get", "/file/page", {
    params
  });
};

/**
 * 删除文件(DELETE /file/{id};登录态,file:delete 权限)。
 * 仅逻辑删除,物理文件保留,可在回收站恢复或彻底删除。
 */
export const deleteFile = (id: string) => {
  return http.request<ApiResult<null>>("delete", `/file/${id}`);
};

/** 恢复回收站文件(PUT /file/{id}/restore;登录态,file:delete 权限) */
export const restoreFile = (id: string) => {
  return http.request<ApiResult<null>>("put", `/file/${id}/restore`);
};

/** 彻底删除回收站文件(DELETE /file/{id}/physical;登录态,file:delete 权限) */
export const physicalDeleteFile = (id: string) => {
  return http.request<ApiResult<null>>("delete", `/file/${id}/physical`);
};