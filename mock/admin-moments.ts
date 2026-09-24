// 点点滴滴管理 mock(对齐后端 /admin/moments 接口)
// page 契约对齐 MomentsPageResponse:id/userId/username/content/recordDate/sort/category/tags/status/createTime
// insert 契约对齐 MomentsInsertRequest:作者由后端取当前登录人填充,不接收 userId
// update 契约对齐 MomentsUpdateRequest:不含状态,显隐单独走 change-status 端点
// delete 契约对齐 DELETE /admin/moments/delete/{ids}:批量逻辑删除(ids 逗号拼接)
// history 契约对齐 GET /admin/moments/history:历史分类/标签建议
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

/** 作者展示信息(用户名对齐后端 sys_user 种子;userId 与后端同形,字符串化) */
const writers = [
  { userId: "2", username: "li" },
  { userId: "3", username: "su" }
];

/** 文章内容池(富文本 HTML,与门户 mock 同源风格) */
const contents = [
  "<p>这是这个小世界里的第一篇文章。所有日常都会以<strong>短篇</strong>的形式记在这里,偶尔夹一句<em>没头没尾的情话</em>。</p>",
  "<p>凌晨四点起床赶车,却在看到海的那一瞬间觉得都值了。海风很咸,你笑得很甜。</p>",
  "<p>一千天,说长不长,说短不短。数字会一直涨下去,而<em>记录</em>是我们最好的纪念方式。</p>",
  "<p>暴雨,外卖小哥迟到了四十分钟。你撑着伞冲下楼,回来时半边袖子都湿了,奶茶却一滴没洒。</p>",
  "<p>厨房太小,两个人转身都要打招呼。番茄炒蛋糊了锅底,你却说<strong>好吃</strong>。</p>"
];

/** 分类与标签池(与种子数据 37001-37004 对齐) */
const categories = ["日常", "旅行", "纪念"];
const tagsPool = ["日常", "记录", "旅行", "海边", "纪念日", "雨天"];

/** 批量生成文章(两位作者交替,凑足多页数据) */
const momentsList = Array.from({ length: 12 }, (_, i) => {
  const writer = writers[i % writers.length];
  const month = String(((i * 4) % 12) + 1).padStart(2, "0");
  const day = String((i % 27) + 1).padStart(2, "0");
  return {
    id: String(i + 1),
    title: `点点滴滴第 ${i + 1} 篇:甜甜的日常`,
    userId: writer.userId,
    username: writer.username,
    content: contents[i % contents.length],
    recordDate: `2025-${month}-${day}`,
    sort: i + 1,
    category: categories[i % categories.length],
    tags: tagsPool[i % tagsPool.length],
    status: i === 11 ? 1 : 0,
    createTime: `2025-${month}-${day} 10:30:00`
  };
});

/** 自增主键(内存数据源递增,语义对齐后端雪花字符串) */
let nextId = 6000;

export default defineFakeRoute([
  // 分页查询(GET /admin/moments/page;全量,标题模糊+分类/状态精确)
  {
    url: "/admin/moments/page",
    method: "get",
    response: ({ query }) => {
      const { title, category, status, pageNumber = 1, pageSize = 20 } = query;
      const filtered = momentsList.filter(
        item =>
          (!title || item.title.includes(String(title))) &&
          (!category || item.category === category) &&
          (status === undefined ||
            status === "" ||
            item.status === Number(status))
      );
      filtered.sort(
        (a, b) =>
          a.sort - b.sort ||
          b.recordDate.localeCompare(a.recordDate) ||
          Number(b.id) - Number(a.id)
      );
      return fakePageResponse(filtered, { pageNumber, pageSize });
    }
  },
  // 历史分类/标签建议(GET /admin/moments/history)
  {
    url: "/admin/moments/history",
    method: "get",
    response: () => ok({ categories, tags: tagsPool })
  },
  // 新增(POST /admin/moments/insert;作者默认取门户男主)
  {
    url: "/admin/moments/insert",
    method: "post",
    response: ({ body }) => {
      const writer = writers[0];
      momentsList.push({
        id: String(nextId++),
        title: String(body.title ?? ""),
        userId: writer.userId,
        username: writer.username,
        content: String(body.content ?? ""),
        recordDate: String(body.recordDate ?? ""),
        sort: Number(body.sort ?? 0),
        category: body.category ? String(body.category) : "",
        tags: body.tags ? String(body.tags) : "",
        status: Number(body.status ?? 0),
        createTime: new Date().toISOString().slice(0, 19).replace("T", " ")
      });
      return ok(null, "新增点点滴滴文章成功");
    }
  },
  // 修改(PUT /admin/moments/update;按 id 覆盖可编辑字段,作者归属不可变)
  {
    url: "/admin/moments/update",
    method: "put",
    response: ({ body }) => {
      const row = momentsList.find(item => item.id === String(body.id));
      if (!row) {
        return fail("文章不存在");
      }
      row.title = String(body.title ?? "");
      row.content = String(body.content ?? "");
      row.recordDate = String(body.recordDate ?? "");
      row.sort = Number(body.sort ?? 0);
      row.category = body.category ? String(body.category) : "";
      row.tags = body.tags ? String(body.tags) : "";
      return ok(null, "修改点点滴滴文章成功");
    }
  },
  // 修改状态(PUT /admin/moments/change-status;显隐独立端点,同状态幂等返回对齐后端)
  {
    url: "/admin/moments/change-status",
    method: "put",
    response: ({ body }) => {
      const row = momentsList.find(item => item.id === String(body.id));
      if (!row) {
        return fail("文章不存在");
      }
      row.status = Number(body.status ?? 0);
      return ok(null, "修改文章状态成功");
    }
  },
  // 批量逻辑删除(DELETE /admin/moments/delete/:ids;任一 id 不存在时整批失败,对齐后端校验)
  {
    url: "/admin/moments/delete/:ids",
    method: "delete",
    response: ({ params }) => {
      const ids = String(params.ids).split(",");
      const missing = ids.some(id => !momentsList.some(item => item.id === id));
      if (missing) {
        return fail("文章不存在");
      }
      ids.forEach(id => {
        const idx = momentsList.findIndex(item => item.id === id);
        if (idx >= 0) momentsList.splice(idx, 1);
      });
      return ok(null, "删除点点滴滴文章成功");
    }
  }
]);
