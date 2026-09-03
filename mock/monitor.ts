// 日志管理 mock:登录日志 / 操作日志
import { defineFakeRoute } from "vite-plugin-fake-server/client";
import { faker } from "@faker-js/faker/locale/zh_CN";

export default defineFakeRoute([
  // 登录日志
  {
    url: "/login-logs",
    method: "post",
    response: ({ body }) => {
      let list = [
        {
          id: 1,
          username: "admin",
          ip: faker.internet.ipv4(),
          address: "中国河南省信阳市",
          system: "macOS",
          browser: "Chrome",
          status: 1, // 登录状态 1 成功 0 失败
          behavior: "账号登录",
          loginTime: new Date()
        },
        {
          id: 2,
          username: "common",
          ip: faker.internet.ipv4(),
          address: "中国广东省深圳市",
          system: "Windows",
          browser: "Firefox",
          status: 0,
          behavior: "第三方登录",
          loginTime: new Date()
        }
      ];
      list = list.filter(item => item.username.includes(body?.username));
      list = list.filter(item =>
        String(item.status).includes(String(body?.status))
      );
      return {
        success: true,
        code: 200,
        msg: "操作成功",
        data: {
          records: list,
          pageNumber: 1,
          pageSize: 20,
          totalRow: list.length,
          totalPages: 1
        }
      };
    }
  },
  // 操作日志
  {
    url: "/operation-logs",
    method: "post",
    response: ({ body }) => {
      let list = [
        {
          id: 1,
          username: "admin",
          ip: faker.internet.ipv4(),
          address: "中国河南省信阳市",
          system: "macOS",
          browser: "Chrome",
          status: 1, // 操作状态 1 成功 0 失败
          summary: "菜单管理-添加菜单", // 操作概要
          module: "系统管理", // 所属模块
          operatingTime: new Date() // 操作时间
        },
        {
          id: 2,
          username: "common",
          ip: faker.internet.ipv4(),
          address: "中国广东省深圳市",
          system: "Windows",
          browser: "Firefox",
          status: 0,
          summary: "列表分页查询",
          module: "部门管理",
          operatingTime: new Date()
        }
      ];
      list = list.filter(item => item.module.includes(body?.module));
      list = list.filter(item =>
        String(item.status).includes(String(body?.status))
      );
      return {
        success: true,
        code: 200,
        msg: "操作成功",
        data: {
          records: list,
          pageNumber: 1,
          pageSize: 20,
          totalRow: list.length,
          totalPages: 1
        }
      };
    }
  }
]);
