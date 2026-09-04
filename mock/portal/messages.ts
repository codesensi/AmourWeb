// 留言板 mock(GET /love/message 分页 + POST /love/message 提交)
import { defineFakeRoute } from "vite-plugin-fake-server/client";

const messages = [
  {
    qq: "3439780232",
    nickname: "Ki.",
    avatar: "https://q1.qlogo.cn/g?b=qq&nk=3439780232&s=100",
    content: "Like Girl 5.2.1-Stable 默认留言",
    date: "2025-09-02 16:24:09",
    location: "广东"
  },
  {
    qq: "673822943",
    nickname: "Su",
    avatar: "https://q1.qlogo.cn/g?b=qq&nk=673822943&s=100",
    content: "愿得一心人，白头不相离。",
    date: "2025-09-03 00:00:00",
    location: ""
  }
];

export default defineFakeRoute([
  // 留言分页(GET /love/message)
  {
    url: "/love/message",
    method: "get",
    response: ({ query }) => {
      const pageNumber = Number(query?.pageNumber ?? 1);
      const pageSize = Number(query?.pageSize ?? 6);
      const records = messages.slice(
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
          totalRow: messages.length,
          totalPage: Math.ceil(messages.length / pageSize)
        }
      };
    }
  },
  // 提交留言(POST /love/message)
  {
    url: "/love/message",
    method: "post",
    response: () => ({
      success: true,
      code: 200,
      msg: "操作成功",
      timestamp: Date.now()
    })
  }
]);
