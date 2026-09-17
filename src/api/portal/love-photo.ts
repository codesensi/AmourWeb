import { portalPage } from "./utils";

/** 恋爱相册-照片项 */
export type LovePhotoItem = {
  /** 照片地址(后端为上传文件 URL;mock 为内联 SVG 占位图) */
  img: string;
  /** 照片文案 */
  text: string;
  /** 拍摄/记录日期 */
  date: string;
};

/** 恋爱相册分页(GET /portal/love-photo,每页 6 张) */
export const getLovePhoto = portalPage<LovePhotoItem>("/portal/love-photo");
