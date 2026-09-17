import { portalPage } from "./utils";

/** 时间胶囊-胶囊项(GET /portal/time-capsule 分页) */
export type TimeCapsuleItem = {
  id: number;
  /** 标题 */
  title: string | null;
  /** 信件内容(未到期时服务端裁剪为 null,前端只展示倒计时) */
  content: string | null;
  /** 解锁时间(yyyy-MM-dd HH:mm:ss) */
  openTime: string;
};

/** 时间胶囊分页(GET /portal/time-capsule,每页 6 封) */
export const getTimeCapsule = portalPage<TimeCapsuleItem>(
  "/portal/time-capsule"
);
