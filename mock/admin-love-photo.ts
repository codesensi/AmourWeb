// 恋爱画册管理 mock(对齐后端 /admin/love-photo 接口)
// page 契约对齐 LovePhotoPageResponse:id/url/caption/dateText/tags(逗号分隔串)/sort/hidden/createTime
// insert/update 契约对齐 LovePhotoSaveRequest:tags 前端传数组,提交时按后端同规则规范化为逗号分隔串
// delete 契约对齐 DELETE /admin/love-photo/delete/{ids}:批量逻辑删除(ids 逗号拼接)
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

/** 内存数据源(与门户 mock 同源的占位照片;hidden=1 的行门户侧不下发) */
const photos = [
  {
    id: "1000",
    url: mockPhoto("海边漫步", "#ffd3d3", "#cfe8ff"),
    caption: "海边漫步",
    dateText: "2025-07-01",
    tags: "旅行",
    sort: 2,
    hidden: 0,
    createTime: "2026-01-01 08:00:00"
  },
  {
    id: "1001",
    url: mockPhoto("巷口的猫", "#d3ffe3", "#cfe0ff"),
    caption: "巷口的猫",
    dateText: "2025-08-15",
    tags: "日常",
    sort: 3,
    hidden: 0,
    createTime: "2026-01-02 09:30:00"
  },
  {
    id: "1002",
    url: mockPhoto("跨年烟花", "#fff3d3", "#ffd6e0"),
    caption: "跨年烟花",
    dateText: "2025-12-31",
    tags: "节日,旅行",
    sort: 4,
    hidden: 1,
    createTime: "2026-01-03 10:00:00"
  }
];

/** 自增主键(内存数据源递增,语义对齐后端雪花字符串) */
let nextId = 2000;

/** 标签规范化(与后端一致:trim/去空/去重后逗号拼接) */
function joinTags(tags: Array<string> | undefined): string {
  return (tags ?? [])
    .map(tag => tag.trim())
    .filter(tag => tag !== "")
    .filter((tag, index, list) => list.indexOf(tag) === index)
    .join(",");
}

export default defineFakeRoute([
  // 分页查询(GET /admin/love-photo/page;全量含隐藏)
  {
    url: "/admin/love-photo/page",
    method: "get",
    response: ({ query }) => {
      const { caption, tag, hidden, pageNumber = 1, pageSize = 20 } = query;
      const keyword = String(caption ?? "");
      const tagText = String(tag ?? "");
      const filtered = photos.filter(
        row =>
          (!keyword || row.caption?.includes(keyword)) &&
          (!tagText || row.tags.split(",").includes(tagText)) &&
          (hidden === undefined ||
            hidden === "" ||
            row.hidden === Number(hidden))
      );
      filtered.sort((a, b) => a.sort - b.sort || Number(a.id) - Number(b.id));
      return fakePageResponse(filtered, { pageNumber, pageSize });
    }
  },
  // 新增(POST /admin/love-photo/insert)
  {
    url: "/admin/love-photo/insert",
    method: "post",
    response: ({ body }) => {
      const now = new Date();
      photos.unshift({
        id: String(nextId++),
        url: String(body.url),
        caption: String(body.caption ?? ""),
        dateText: String(body.dateText ?? ""),
        tags: joinTags(body.tags),
        sort: Number(body.sort ?? 0),
        hidden: Number(body.hidden ?? 0),
        createTime: now.toISOString().slice(0, 19).replace("T", " ")
      });
      return ok(null, "新增照片成功");
    }
  },
  // 修改(PUT /admin/love-photo/update;按 id 覆盖全部可编辑字段)
  {
    url: "/admin/love-photo/update",
    method: "put",
    response: ({ body }) => {
      const row = photos.find(item => item.id === String(body.id));
      if (!row) {
        return fail("照片不存在");
      }
      row.url = String(body.url ?? row.url);
      row.caption = String(body.caption ?? "");
      row.dateText = String(body.dateText ?? "");
      row.tags = joinTags(body.tags);
      row.sort = Number(body.sort ?? row.sort);
      row.hidden = Number(body.hidden ?? row.hidden);
      return ok(null, "修改照片成功");
    }
  },
  // 修改照片显隐(PUT /admin/love-photo/change-hidden;独立显隐端点)
  {
    url: "/admin/love-photo/change-hidden",
    method: "put",
    response: ({ body }) => {
      const row = photos.find(item => item.id === String(body.id));
      if (!row) {
        return fail("照片不存在");
      }
      row.hidden = Number(body.hidden);
      return ok(null, "修改照片显隐成功");
    }
  },
  // 批量逻辑删除(DELETE /admin/love-photo/delete/:ids;任一 id 不存在时整批失败,对齐后端校验)
  {
    url: "/admin/love-photo/delete/:ids",
    method: "delete",
    response: ({ params }) => {
      const ids = String(params.ids)
        .split(",")
        .map(item => item.trim())
        .filter(Boolean);
      const missing = ids.filter(id => !photos.some(item => item.id === id));
      if (missing.length) {
        return fail(`照片不存在：${missing.join("、")}`);
      }
      for (const id of ids) {
        const index = photos.findIndex(item => item.id === id);
        if (index !== -1) photos.splice(index, 1);
      }
      return ok(null, "删除成功");
    }
  }
]);
