import { defineFakeRoute } from "vite-plugin-fake-server/client";
import { faker } from "@faker-js/faker/locale/zh_CN";

export default defineFakeRoute([
  // 账户设置-个人信息
  {
    url: "/mine",
    method: "get",
    response: ({ query }) => {
      return {
        success: true,
        code: 200,
        msg: "操作成功",
        timestamp: Date.now(),
        data: {
          avatar: "https://avatars.githubusercontent.com/u/44761321",
          username: "admin",
          nickname: "小铭",
          email: "pureadmin@163.com",
          phone: "15888886789",
          description: "一个热爱开源的前端工程师"
        }
      };
    }
  },
  // 账户设置-个人安全日志
  {
    url: "/mine-logs",
    method: "get",
    response: ({ query }) => {
      const list = [
        {
          id: 1,
          ip: faker.internet.ipv4(),
          address: "中国河南省信阳市",
          system: "macOS",
          browser: "Chrome",
          summary: "账户登录", // 详情
          operatingTime: new Date() // 时间
        },
        {
          id: 2,
          ip: faker.internet.ipv4(),
          address: "中国广东省深圳市",
          system: "Windows",
          browser: "Firefox",
          summary: "绑定了手机号码",
          operatingTime: new Date().setDate(new Date().getDate() - 1)
        }
      ];
      const pageNumber = Number(query?.pageNumber ?? 1);
      const pageSize = Number(query?.pageSize ?? 20);
      const start = (pageNumber - 1) * pageSize;
      return {
        success: true,
        code: 200,
        msg: "操作成功",
        timestamp: Date.now(),
        data: {
          records: list.slice(start, start + pageSize),
          pageNumber,
          pageSize,
          totalRow: list.length,
          totalPages: Math.ceil(list.length / pageSize)
        }
      };
    }
  }
]);
