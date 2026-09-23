// 时间胶囊管理 mock(对齐后端 /admin/time-capsule 接口)
// page 契约对齐 TimeCapsulePageResponse:id/title/content/openTime/hidden/createTime
// insert/update 契约对齐 TimeCapsuleSaveRequest:hidden 仅新增传入,修改走 change-hidden
// delete 契约对齐 DELETE /admin/time-capsule/delete/{ids}:批量逻辑删除(ids 逗号拼接)
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

/** 内存数据源(与后端种子同源:1 条已解锁 + 2 条未解锁;hidden=1 的行门户侧不下发) */
const timeCapsules = [
  {
    id: "35001",
    title: "写给恋爱三周年的信💌",
    content:
      "三年前的今天你答应了和我在一起，这三年的每一天都比昨天更幸福。希望未来的每一年，我们都像今天一样热爱生活、热爱彼此。",
    openTime: "2025-05-21 00:00:00",
    hidden: 0,
    createTime: "2026-01-01 08:00:00"
  },
  {
    id: "35002",
    title: "写给下一个五年的我们💌",
    content:
      "见字如面。五年后的我们，应该在为小家忙碌着吧？希望那时的我们依然会为一顿烛光晚餐而开心，依然愿意为对方学一道新菜。",
    openTime: "2026-12-31 00:00:00",
    hidden: 0,
    createTime: "2026-01-02 09:00:00"
  },
  {
    id: "35003",
    title: "三十年后打开🔮",
    content:
      "当你打开这封信的时候，我们已经一起走过了大半生。谢谢你没有放开我的手。余生很长，我们慢慢走。",
    openTime: "2048-05-21 00:00:00",
    hidden: 0,
    createTime: "2026-01-03 10:00:00"
  }
];

/** 自增主键(内存数据源递增,语义对齐后端雪花字符串) */
let nextId = 5000;

export default defineFakeRoute([
  // 分页查询(GET /admin/time-capsule/page;全量含隐藏与未解锁)
  {
    url: "/admin/time-capsule/page",
    method: "get",
    response: ({ query }) => {
      const { title, hidden, pageNumber = 1, pageSize = 20 } = query;
      const keyword = String(title ?? "");
      const filtered = timeCapsules.filter(
        item =>
          (!keyword || item.title.includes(keyword)) &&
          (hidden === undefined ||
            hidden === "" ||
            item.hidden === Number(hidden))
      );
      filtered.sort((a, b) => a.openTime.localeCompare(b.openTime));
      return fakePageResponse(filtered, { pageNumber, pageSize });
    }
  },
  // 新增(POST /admin/time-capsule/insert)
  {
    url: "/admin/time-capsule/insert",
    method: "post",
    response: ({ body }) => {
      timeCapsules.push({
        id: String(nextId++),
        title: String(body.title ?? ""),
        content: String(body.content ?? ""),
        openTime: String(body.openTime ?? ""),
        hidden: Number(body.hidden ?? 0),
        createTime: new Date().toISOString().slice(0, 19).replace("T", " ")
      });
      return ok(null, "新增时间胶囊成功");
    }
  },
  // 修改(PUT /admin/time-capsule/update;按 id 覆盖可编辑字段,hidden 显隐仅走 change-hidden 端点)
  {
    url: "/admin/time-capsule/update",
    method: "put",
    response: ({ body }) => {
      const row = timeCapsules.find(item => item.id === String(body.id));
      if (!row) {
        return fail("胶囊不存在");
      }
      row.title = String(body.title ?? "");
      row.content = String(body.content ?? "");
      row.openTime = String(body.openTime ?? "");
      return ok(null, "修改时间胶囊成功");
    }
  },
  // 修改时间胶囊显隐(PUT /admin/time-capsule/change-hidden;独立显隐端点)
  {
    url: "/admin/time-capsule/change-hidden",
    method: "put",
    response: ({ body }) => {
      const row = timeCapsules.find(item => item.id === String(body.id));
      if (!row) {
        return fail("胶囊不存在");
      }
      row.hidden = Number(body.hidden);
      return ok(null, "修改时间胶囊显隐成功");
    }
  },
  // 批量逻辑删除(DELETE /admin/time-capsule/delete/:ids;任一 id 不存在时整批失败,对齐后端校验)
  {
    url: "/admin/time-capsule/delete/:ids",
    method: "delete",
    response: ({ query }) => {
      const ids = String(query.ids).split(",");
      const missing = ids.some(
        id => !timeCapsules.some(item => item.id === id)
      );
      if (missing) {
        return fail("胶囊不存在");
      }
      ids.forEach(id => {
        const idx = timeCapsules.findIndex(item => item.id === id);
        if (idx >= 0) timeCapsules.splice(idx, 1);
      });
      return ok(null, "删除时间胶囊成功");
    }
  }
]);
