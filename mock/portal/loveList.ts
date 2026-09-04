// 恋爱清单 mock(GET /love/list 分页;7 条清单,移植原站 PORTAL_MOCK.loveList)
import { defineFakeRoute } from "vite-plugin-fake-server/client";
import { mockPhoto } from "./mockPhoto";

const loveList = [
  { text: "一起期待未来甜蜜小生活💑", done: false },
  { text: "一起为我们的小家添置东西🏠", done: false },
  { text: "一起挑选婚纱👗", done: false },
  { text: "一起去见父母👨‍👩‍👧‍👦", done: false },
  { text: "一起听一次演唱会🎤", done: true, img: mockPhoto("演唱会的回忆") },
  { text: "一起去看樱花🌸", done: false },
  { text: "一起存钱💰", done: false }
];

export default defineFakeRoute([
  // 恋爱清单分页(GET /love/list)
  {
    url: "/love/list",
    method: "get",
    response: ({ query }) => {
      const pageNumber = Number(query?.pageNumber ?? 1);
      const pageSize = Number(query?.pageSize ?? 6);
      const records = loveList.slice(
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
          totalRow: loveList.length,
          totalPage: Math.ceil(loveList.length / pageSize)
        }
      };
    }
  }
]);
