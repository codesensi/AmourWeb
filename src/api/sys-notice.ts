import { http } from "@/utils/http";

/** 通知业务类型(与后端 NoticeBizTypeEnum 的 code 一致) */
export type NoticeBizType = "message-audit";

/** 通知条目(登录态,当前用户视角;read 为该用户的已读状态) */
export interface NoticeItem {
  /** 通知ID(后端雪花ID字符串化,避免 JS 精度丢失) */
  id: string;
  /** 通知标题 */
  title: string;
  /** 通知内容 */
  content: string;
  /** 业务类型(触发本通知的业务事件;空表示无关联业务) */
  bizType?: NoticeBizType;
  /** 业务ID(与 bizType 联合定位业务数据;后端雪花ID字符串化) */
  bizId?: string;
  /** 创建时间(yyyy-MM-dd HH:mm:ss) */
  createTime: string;
  /** 当前用户是否已读 */
  read: boolean;
}

/** 通知列表(GET /sys/notice/list;登录态,按创建时间倒序) */
export const getNoticeList = (limit = 20) => {
  return http.request<Array<NoticeItem>>("get", "/sys/notice/list", {
    params: { limit }
  });
};

/** 标记通知已读(POST /sys/notice/read;请求体为 { noticeIds },noticeIds 缺省=全部未读,幂等) */
export const markNoticesRead = (noticeIds?: Array<string>) => {
  return http.request<null>("post", "/sys/notice/read", {
    data: { noticeIds }
  });
};
