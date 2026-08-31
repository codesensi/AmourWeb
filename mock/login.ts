// 登录
import { defineFakeRoute } from "vite-plugin-fake-server/client";

export default defineFakeRoute([
  {
    url: "/login",
    method: "post",
    response: ({ body }) => {
      // 模拟 admin 与 common 两种角色
      const isAdmin = body?.username === "admin";
      return {
        success: true,
        code: 200,
        msg: "操作成功",
        timestamp: Date.now(),
        data: {
          avatar: isAdmin
            ? "https://avatars.githubusercontent.com/u/44761321"
            : "https://avatars.githubusercontent.com/u/52823142",
          username: isAdmin ? "admin" : "common",
          nickname: isAdmin ? "小铭" : "小林",
          roles: [isAdmin ? "admin" : "common"],
          permissions: isAdmin
            ? ["*:*:*"]
            : ["permission:btn:add", "permission:btn:edit"],
          accessToken: isAdmin
            ? "eyJhbGciOiJIUzUxMiJ9.admin"
            : "eyJhbGciOiJIUzUxMiJ9.common",
          // 访问令牌过期时间（毫秒时间戳，模拟 30 天有效期）
          expires: Date.now() + 30 * 24 * 60 * 60 * 1000
        }
      };
    }
  }
]);
