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
  },
  {
    qq: "1324497787",
    nickname: "柠檬不酸",
    avatar: "https://q1.qlogo.cn/g?b=qq&nk=666888991&s=100",
    content: "祝你们永远像热恋期一样甜！",
    date: "2025-09-05 09:20:00",
    location: "浙江"
  },
  {
    qq: "1024335566",
    nickname: "南风知我意",
    avatar: "https://q1.qlogo.cn/g?b=qq&nk=102433556&s=100",
    content: "愿你们把平凡的日子过成诗。",
    date: "2025-09-06 11:11:11",
    location: "四川"
  },
  {
    qq: "556677889",
    nickname: "小鹿乱撞",
    avatar: "https://q1.qlogo.cn/g?b=qq&nk=556677889&s=100",
    content: "磕到了磕到了，祝长长久久！",
    date: "2025-09-07 20:45:00",
    location: "湖南"
  },
  {
    qq: "111222333",
    nickname: "半糖主义",
    avatar: "https://q1.qlogo.cn/g?b=qq&nk=111222333&s=100",
    content: "今天是你们的第 1001 天吧？天天开心！",
    date: "2025-09-08 08:30:00",
    location: "江苏"
  },
  {
    qq: "777777777",
    nickname: "老张",
    avatar: "https://q1.qlogo.cn/g?b=qq&nk=777777777&s=100",
    content: "别卷了，快去领证（狗头）",
    date: "2025-09-09 12:00:00",
    location: "北京"
  },
  {
    qq: "888888888",
    nickname: "月亮邮递员",
    avatar: "https://q1.qlogo.cn/g?b=qq&nk=888888888&s=100",
    content: "月亮不睡我不睡，祝你们所愿皆所得。",
    date: "2025-09-10 23:59:59",
    location: "上海"
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
