// 点点滴滴 mock(GET /love/littles,对齐后端蓝图 love 分组)
import { defineFakeRoute } from "vite-plugin-fake-server/client";

const littles = [
  { id: 1, title: "Like_Girl 默认文章语法", author: "Ki.", date: "2022-11-20" },
  { id: 2, title: "第一次一起去看海", author: "Ki.", date: "2023-05-21" },
  { id: 3, title: "记录我们的第 1000 天", author: "Su", date: "2024-05-15" }
];

export default defineFakeRoute([
  // 文章分页(GET /love/littles?page=&limit=)
  {
    url: "/love/littles",
    method: "get",
    response: ({ query }) => {
      const page = Number(query.page ?? 1);
      const limit = Number(query.limit ?? 6);
      const records = littles.slice((page - 1) * limit, page * limit);
      return {
        success: true,
        code: 200,
        msg: "操作成功",
        timestamp: Date.now(),
        data: {
          records,
          pageNumber: page,
          pageSize: limit,
          totalRow: littles.length,
          totalPages: Math.ceil(littles.length / limit)
        }
      };
    }
  }
]);
