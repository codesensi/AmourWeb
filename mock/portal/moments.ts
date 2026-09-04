// 点点滴滴 mock(GET /love/moments,对齐后端蓝图 love 分组)
import { defineFakeRoute } from "vite-plugin-fake-server/client";

const moments = [
  { id: 1, title: "Like_Girl 默认文章语法", author: "Ki.", date: "2022-11-20" },
  { id: 2, title: "第一次一起去看海", author: "Ki.", date: "2023-05-21" },
  { id: 3, title: "记录我们的第 1000 天", author: "Su", date: "2024-05-15" },
  { id: 4, title: "第一次一起做饭", author: "Ki.", date: "2024-06-01" },
  { id: 5, title: "雨天的一杯奶茶", author: "Su", date: "2024-08-15" },
  { id: 6, title: "一起养的绿萝发芽了", author: "Ki.", date: "2024-09-20" },
  { id: 7, title: "跨年的第一场雪", author: "Su", date: "2025-01-01" },
  { id: 8, title: "周末拍的小短片", author: "Su", date: "2025-03-08" },
  { id: 9, title: "写给未来的旅行清单", author: "Ki.", date: "2025-06-18" }
];

export default defineFakeRoute([
  // 文章分页(GET /love/moments)
  {
    url: "/love/moments",
    method: "get",
    response: ({ query }) => {
      const pageNumber = Number(query?.pageNumber ?? 1);
      const pageSize = Number(query?.pageSize ?? 6);
      const records = moments.slice(
        (pageNumber - 1) * pageSize,
        pageNumber * pageSize
      );
      return {
        success: true,
        code: 200,
        msg: "操作成功",
        timestamp: Date.now(),
        data: {
          records,
          pageNumber,
          pageSize,
          totalRow: moments.length,
          totalPage: Math.ceil(moments.length / pageSize)
        }
      };
    }
  }
]);
