import type { ApiResult, PageResult } from "@/api/types";
import { http } from "@/utils/http";

/** 点点滴滴-文章项 */
export interface LittleItem {
  id: number;
  title: string;
  author: string;
  date: string;
}

/** 点点滴滴-文章分页(GET /love/littles,每页 6 条) */
export const getLittles = (page: number, limit = 6) => {
  return http.request<ApiResult<PageResult<LittleItem>>>(
    "get",
    "/love/littles",
    {
      params: { page, limit }
    }
  );
};

/** 恋爱相册-照片项 */
export interface PhotoItem {
  /** 照片地址(后端为上传文件 URL;mock 为内联 SVG 占位图) */
  img: string;
  /** 照片文案 */
  text: string;
  /** 拍摄/记录日期 */
  date: string;
}

/** 恋爱相册分页(POST /love/photos,每页 6 张) */
export const getPhotos = (page: number, limit = 6) => {
  return http.request<ApiResult<PageResult<PhotoItem>>>(
    "post",
    "/love/photos",
    {
      data: { page, limit }
    }
  );
};

/** 恋爱清单-清单项 */
export interface LoveListItem {
  /** 清单文案 */
  text: string;
  /** 是否已完成 */
  done: boolean;
  /** 可选照片(已完成项可带纪念照) */
  img?: string;
}

/** 恋爱清单分页(GET /love/list,每页 6 条) */
export const getLoveList = (page: number, limit = 6) => {
  return http.request<ApiResult<PageResult<LoveListItem>>>(
    "get",
    "/love/list",
    {
      params: { page, limit }
    }
  );
};

/** 留言-留言项 */
export interface MessageItem {
  qq: string;
  nickname: string;
  avatar: string;
  content: string;
  date: string;
  location: string;
}

/** 留言分页(GET /love/messages) */
export const getMessages = (page: number, limit = 6) => {
  return http.request<ApiResult<PageResult<MessageItem>>>(
    "get",
    "/love/messages",
    { params: { page, limit } }
  );
};

/** 提交留言(POST /love/messages,字段 {qq, name, text}) */
export const sendMessage = (data: {
  qq: string;
  name: string;
  text: string;
}) => {
  return http.request<ApiResult<null>>("post", "/love/messages", { data });
};

/** 关于页对话-剧本分支选项(点选后递归播放 next 分支) */
export interface ChatScriptOption {
  text: string;
  value: string;
  next?: ChatScriptNode[];
}

/** 关于页对话-剧本节点(两种:type=bot 消息气泡 / type=buttons 分支按钮) */
export interface ChatScriptNode {
  type: "bot" | "buttons";
  /** 播放前的延时(毫秒) */
  delay?: number;
  /** bot 消息内容,支持 ![alt](url) 图片语法 */
  content?: string;
  /** 分支按钮组(type=buttons 时有效) */
  options?: ChatScriptOption[];
}

/** 关于页对话剧本(GET /love/chat,后台可配) */
export const getChatScript = () => {
  return http.request<ApiResult<ChatScriptNode[]>>("get", "/love/chat");
};
