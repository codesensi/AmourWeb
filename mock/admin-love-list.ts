// 恋爱清单管理 mock(对齐后端 /admin/love-list 接口)
// page 契约对齐 LoveListPageResponse:id/content/done/photo/sort/hidden/createTime
// insert/update 契约对齐 LoveListInsertRequest/LoveListUpdateRequest:done/hidden 并入表单整体维护
// delete 契约对齐 DELETE /admin/love-list/delete/{ids}:批量逻辑删除(ids 逗号拼接)
import { defineFakeRoute } from "vite-plugin-fake-server/client";
import { mockPhoto } from "./portal/mock-photo";
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

/** 内存数据源(与门户 mock 同源的 7 条愿望;hidden=1 的行门户侧不下发) */
const loveList = [
  {
    id: "3000",
    content: "一起期待未来甜蜜小生活💑",
    done: 0,
    photo: null,
    sort: 1,
    hidden: 0,
    createTime: "2026-01-01 08:00:00"
  },
  {
    id: "3001",
    content: "一起为我们的小家添置东西🏠",
    done: 0,
    photo: null,
    sort: 2,
    hidden: 0,
    createTime: "2026-01-02 09:00:00"
  },
  {
    id: "3002",
    content: "一起挑选婚纱👗",
    done: 0,
    photo: null,
    sort: 3,
    hidden: 0,
    createTime: "2026-01-03 10:00:00"
  },
  {
    id: "3003",
    content: "一起去见父母👨‍👩‍👧‍👦",
    done: 0,
    photo: null,
    sort: 4,
    hidden: 0,
    createTime: "2026-01-04 11:00:00"
  },
  {
    id: "3004",
    content: "一起听一次演唱会🎤",
    done: 1,
    photo: mockPhoto("演唱会的回忆"),
    sort: 5,
    hidden: 0,
    createTime: "2026-01-05 12:00:00"
  },
  {
    id: "3005",
    content: "一起去看樱花🌸",
    done: 0,
    photo: null,
    sort: 6,
    hidden: 0,
    createTime: "2026-01-06 13:00:00"
  },
  {
    id: "3006",
    content: "一起去看烟花🎆",
    done: 0,
    photo: null,
    sort: 7,
    hidden: 1,
    createTime: "2026-01-07 14:00:00"
  }
];

/** 自增主键(内存数据源递增,语义对齐后端雪花字符串) */
let nextId = 5000;

export default defineFakeRoute([
  // 分页查询(GET /admin/love-list/page;全量含隐藏)
  {
    url: "/admin/love-list/page",
    method: "get",
    response: ({ query }) => {
      const { content, done, hidden, pageNumber = 1, pageSize = 20 } = query;
      const keyword = String(content ?? "");
      const filtered = loveList.filter(
        item =>
          (!keyword || item.content.includes(keyword)) &&
          (done === undefined || done === "" || item.done === Number(done)) &&
          (hidden === undefined ||
            hidden === "" ||
            item.hidden === Number(hidden))
      );
      filtered.sort((a, b) => a.sort - b.sort || Number(a.id) - Number(b.id));
      return fakePageResponse(filtered, { pageNumber, pageSize });
    }
  },
  // 新增(POST /admin/love-list/insert)
  {
    url: "/admin/love-list/insert",
    method: "post",
    response: ({ body }) => {
      const now = new Date();
      loveList.push({
        id: String(nextId++),
        content: String(body.content ?? ""),
        done: Number(body.done ?? 0),
        photo: body.photo ? String(body.photo) : null,
        sort: Number(body.sort ?? 0),
        hidden: Number(body.hidden ?? 0),
        createTime: now.toISOString().slice(0, 19).replace("T", " ")
      });
      return ok(null, "新增清单项成功");
    }
  },
  // 修改(PUT /admin/love-list/update;按 id 覆盖可编辑字段,hidden 显隐仅走 change-hidden 端点)
  {
    url: "/admin/love-list/update",
    method: "put",
    response: ({ body }) => {
      const row = loveList.find(item => item.id === String(body.id));
      if (!row) {
        return fail("清单项不存在");
      }
      row.content = String(body.content ?? "");
      row.done = Number(body.done ?? 0);
      row.photo = body.photo ? String(body.photo) : null;
      row.sort = Number(body.sort ?? row.sort);
      return ok(null, "修改清单项成功");
    }
  },
  // 修改清单项显隐(PUT /admin/love-list/change-hidden;独立显隐端点)
  {
    url: "/admin/love-list/change-hidden",
    method: "put",
    response: ({ body }) => {
      const row = loveList.find(item => item.id === String(body.id));
      if (!row) {
        return fail("清单项不存在");
      }
      row.hidden = Number(body.hidden);
      return ok(null, "修改清单项显隐成功");
    }
  },
  // 批量逻辑删除(DELETE /admin/love-list/delete/:ids;任一 id 不存在时整批失败,对齐后端校验)
  {
    url: "/admin/love-list/delete/:ids",
    method: "delete",
    response: ({ params }) => {
      const ids = String(params.ids)
        .split(",")
        .map(item => item.trim())
        .filter(Boolean);
      const missing = ids.filter(id => !loveList.some(item => item.id === id));
      if (missing.length) {
        return fail(`清单项不存在：${missing.join("、")}`);
      }
      for (const id of ids) {
        const index = loveList.findIndex(item => item.id === id);
        if (index !== -1) loveList.splice(index, 1);
      }
      return ok(null, "删除成功");
    }
  }
]);
