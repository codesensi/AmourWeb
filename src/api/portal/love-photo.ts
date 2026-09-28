import { http } from "@/utils/http";
import type { PageQuery, PageResult } from "@/api/types";
import { omitEmpty } from "@/utils/params";

/** 恋爱相册-照片项 */
export type LovePhotoItem = {
  /** 照片ID(后端雪花ID序列化为字符串) */
  id: string;
  /** 照片地址(后端为上传文件 URL;mock 为内联 SVG 占位图) */
  img: string;
  /** 照片文案 */
  text: string;
  /** 拍摄/记录日期 */
  date: string;
  /** 照片标签集合(后端由逗号分隔存储拆分;空数据/无标签为空数组) */
  tags?: Array<string>;
};

/** 恋爱相册分页查询参数(年份/标签过滤均可缺省,缺省时与原门户口径一致) */
export type LovePhotoQuery = PageQuery & {
  /** 照片年份(按照片日期前四位精确匹配) */
  year?: number;
  /** 照片标签(单标签精确匹配) */
  tag?: string;
};

/** 恋爱相册分页(GET /portal/love-photo/page,免登录;仅显隐为「显示」的照片,每页 6 张) */
export const getLovePhoto = (params?: LovePhotoQuery) =>
  http.request<PageResult<LovePhotoItem>>("get", "/portal/love-photo/page", {
    params: omitEmpty({ pageNumber: 1, pageSize: 6, ...params })
  });

/** 恋爱画册年份归档条目 */
export type LovePhotoArchiveItem = {
  /** 照片年份 */
  year: number;
  /** 该年份的照片数量 */
  count: number;
};

/** 年份归档(GET /portal/love-photo/archive,免登录;按年份降序) */
export const getLovePhotoArchive = () =>
  http.request<Array<LovePhotoArchiveItem>>(
    "get",
    "/portal/love-photo/archive"
  );

/** 画册封面照片(GET /portal/love-photo/cover,免登录;sort 首位,画册为空时 data 为 null) */
export const getLovePhotoCover = () =>
  http.request<LovePhotoItem | null>("get", "/portal/love-photo/cover");
