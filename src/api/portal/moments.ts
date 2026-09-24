import { http } from "@/utils/http";
import { portalPage } from "./utils";
import type { ApiResult } from "@/api/types";

/** 点点滴滴-文章项(门户契约,对齐后端 PortalMomentsResponse) */
export type MomentsItem = {
  /** 文章 ID(后端主键序列化为字符串,JS Number 精度丢失防护) */
  id: string;
  title: string;
  /** 作者用户ID(后端序列化为字符串,避免 JS 精度丢失) */
  userId: string;
  /** 作者用户名(服务层批量回填;作者缺失时为 null) */
  username: string | null;
  /** 作者昵称(服务层批量回填;展示链路 QQ 昵称 → 昵称 → 用户名) */
  nickname: string | null;
  /** 作者 QQ 号(服务层批量回填;已维护时前端走 QQ 头像链路) */
  qq: string | null;
  /** 作者上传头像(空则前端兜底图) */
  avatar: string | null;
  /** 富文本正文(HTML 片段;渲染前经 DOMPurify 净化) */
  content: string;
  /** 记录日期(yyyy-MM-dd) */
  recordDate: string;
  /** 文章分类(自由文本) */
  category: string | null;
  /** 文章标签(逗号分隔,自由文本) */
  tags: string | null;
  /** 最后更新时间(yyyy-MM-dd HH:mm:ss;创建即写入,后续编辑时刷新) */
  updateTime: string;
};

/** 点点滴滴-文章分页(GET /portal/moments/page,每页 6 条,仅显示状态) */
export const getMoments = portalPage<MomentsItem>("/portal/moments/page");

/** 对齐 ApiResult<T> 的空数据成功响应(详情 id 非法时本地降级,不出网) */
const emptyResult: ApiResult<MomentsItem | null> = {
  success: true,
  code: 200,
  msg: "操作成功",
  timestamp: Date.now(),
  data: null
};

/**
 * 点点滴滴-文章详情(GET /portal/moments/detail/{id},免登录;未命中返回 data null)。
 * id 为后端序列化的字符串雪花号(19 位超出 JS Number 安全整数,禁止 Number 化);
 * 非法(路由参数未就绪/非数字)时拦截不出网,返回空数据走空态降级
 */
export const getMoment = (
  id: string
): Promise<ApiResult<MomentsItem | null>> => {
  if (!/^\d+$/.test(id)) {
    return Promise.resolve(emptyResult);
  }
  return http.request<MomentsItem>("get", `/portal/moments/detail/${id}`);
};
