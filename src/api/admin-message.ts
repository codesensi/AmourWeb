import { http } from "@/utils/http";
import { omitEmpty } from "@/utils/params";
import type { PageQuery, PageResult } from "@/api/types";

/** 留言审核状态(英文单词枚举,与后端 MessageAuditStatusEnum 的 code 对齐) */
export type MessageAuditStatus = "pending" | "approved" | "rejected";

/** 留言簿管理-行数据(分页;完整字段) */
export interface MessagePageItem {
  /** 主键ID(后端序列化为字符串,避免 JS 精度丢失) */
  id: string;
  /** 访客昵称 */
  nickname: string;
  /** 留言头像快照(空时页面用本地兜底图) */
  avatar?: string;
  /** 留言内容 */
  content: string;
  /** 留言IP */
  ip?: string;
  /** IP归属地 */
  region?: string;
  /** 审核状态: pending-待审核, approved-通过, rejected-驳回 */
  auditStatus: MessageAuditStatus;
  /** 留言时间(yyyy-MM-dd HH:mm:ss) */
  createTime?: string;
}

/** 留言簿分页查询参数 */
export type MessageQuery = PageQuery & {
  /** 访客昵称(模糊匹配) */
  nickname?: string;
  /** 审核状态: pending-待审核, approved-通过, rejected-驳回 */
  auditStatus?: MessageAuditStatus;
};

/** 留言簿分页查询(GET /admin/message/page;登录态) */
export const getAdminMessagePage = (params?: MessageQuery) => {
  return http.request<PageResult<MessagePageItem>>(
    "get",
    "/admin/message/page",
    { params: omitEmpty(params) }
  );
};

/** 留言审核参数(auditStatus 仅允许 approved/rejected,pending 为初始态不允许回设) */
export type MessageAudit = {
  id: string;
  auditStatus: Exclude<MessageAuditStatus, "pending">;
};

/** 审核留言(PUT /admin/message/audit) */
export const auditMessage = (data: MessageAudit) => {
  return http.request<null>("put", "/admin/message/audit", { data });
};

/** 批量逻辑删除留言(DELETE /admin/message/delete/{ids};单条传 id,批量逗号拼接) */
export const deleteAdminMessage = (ids: string) => {
  return http.request<null>("delete", `/admin/message/delete/${ids}`);
};
