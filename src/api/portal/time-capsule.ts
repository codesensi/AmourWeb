import { portalPage } from "./utils";

/** 时间胶囊-胶囊项(GET /portal/time-capsule 分页) */
export type TimeCapsuleItem = {
  /** 主键ID(后端序列化为字符串,避免 JS 精度丢失) */
  id: string;
  /** 标题 */
  title: string | null;
  /** 信件内容(未到期时服务端裁剪为 null,前端只展示倒计时) */
  content: string | null;
  /** 解锁时间(yyyy-MM-dd HH:mm:ss) */
  openTime: string;
  /** 是否已解锁(服务层按当前时间判定;归零瞬间由前端时钟兜底) */
  unlocked?: boolean;
  /** 封存时间(yyyy-MM-dd HH:mm:ss) */
  createTime?: string;
};

/** 时间胶囊分页(GET /portal/time-capsule/page,每页 6 封) */
export const getTimeCapsule = portalPage<TimeCapsuleItem>(
  "/portal/time-capsule/page"
);
