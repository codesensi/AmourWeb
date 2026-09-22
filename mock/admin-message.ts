// 留言簿管理 mock(对齐后端 /admin/message 接口)
// page 契约对齐 MessagePageResponse:id/nickname/avatar/content/ip/region/auditStatus/createTime
// audit 契约对齐 MessageAuditRequest:auditStatus 仅允许 approved-通过/rejected-驳回
// delete 契约对齐 DELETE /admin/message/delete/{ids}:批量逻辑删除(ids 逗号拼接)
import { defineFakeRoute } from "vite-plugin-fake-server/client";
import { fakePageResponse } from "./utils";

/** 对齐 ApiResult<T> 的成功响应 */
const ok = (data: unknown = null, msg = "操作成功") => ({
  success: true,
  code: 200,
  msg,
  timestamp: Date.now(),
  data
});

/** 对齐 ApiResult<T> 的失败响应 */
const fail = (msg: string) => ({
  success: false,
  code: 400,
  msg,
  timestamp: Date.now(),
  data: null
});

/** 内存数据源(auditStatus 覆盖待审核/通过/驳回三种状态;审核后下墙通过 delete 或驳回态呈现) */
const messages = [
  {
    id: "1000",
    nickname: "Ki.",
    avatar: "https://q1.qlogo.cn/g?b=qq&nk=3439780232&s=100",
    content: "Like Girl 5.2.1-Stable 默认留言",
    ip: "113.64.12.7",
    region: "广东",
    auditStatus: "approved",
    createTime: "2025-09-02 16:24:09"
  },
  {
    id: "1001",
    nickname: "柠檬不酸",
    avatar: "https://q1.qlogo.cn/g?b=qq&nk=1324497787&s=100",
    content: "祝你们永远像热恋期一样甜！",
    ip: "182.44.7.19",
    region: "浙江",
    auditStatus: "pending",
    createTime: "2025-09-05 09:20:00"
  },
  {
    id: "1002",
    nickname: "南风知我意",
    avatar: "https://q1.qlogo.cn/g?b=qq&nk=1024335566&s=100",
    content: "愿你们把平凡的日子过成诗。",
    ip: "220.181.38.148",
    region: "四川",
    auditStatus: "rejected",
    createTime: "2025-09-06 11:11:11"
  }
];

export default defineFakeRoute([
  // 留言分页(GET /admin/message/page)
  {
    url: "/admin/message/page",
    method: "get",
    response: ({ query }) => {
      const nickname = String(query.nickname ?? "").trim();
      const auditStatus = query.auditStatus;
      const filtered = messages.filter(
        message =>
          (!nickname || message.nickname.includes(nickname)) &&
          (auditStatus === undefined ||
            auditStatus === "" ||
            auditStatus === message.auditStatus)
      );
      return fakePageResponse(filtered, query);
    }
  },
  // 审核留言(PUT /admin/message/audit)
  {
    url: "/admin/message/audit",
    method: "put",
    response: ({ body }) => {
      const target = messages.find(message => message.id === body.id);
      if (!target) return fail("留言不存在");
      target.auditStatus = body.auditStatus;
      return ok();
    }
  },
  // 批量逻辑删除留言(DELETE /admin/message/delete/{ids})
  {
    url: "/admin/message/delete/:ids",
    method: "delete",
    response: ({ query }) => {
      const ids = String(query.ids ?? "")
        .split(",")
        .filter(Boolean);
      const missing = ids.filter(
        id => !messages.some(message => message.id === id)
      );
      if (missing.length > 0) return fail("留言不存在");
      const idSet = new Set(ids);
      for (let i = messages.length - 1; i >= 0; i--) {
        if (idSet.has(messages[i].id)) messages.splice(i, 1);
      }
      return ok();
    }
  }
]);
