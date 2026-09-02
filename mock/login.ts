// 登录
import { defineFakeRoute } from "vite-plugin-fake-server/client";

export default defineFakeRoute([
  {
    url: "/login",
    method: "post",
    response: () => {
      return {
        success: true,
        code: 200,
        msg: "操作成功",
        timestamp: Date.now(),
        data: {
          // 访问令牌(对齐后端 LoginResponse;用户信息统一由 getCurrentUser 下发)
          accessToken: "eyJhbGciOiJIUzUxMiJ9.admin",
          // 访问令牌过期时间（毫秒时间戳，模拟 30 天有效期）
          expires: Date.now() + 30 * 24 * 60 * 60 * 1000,
          // 访问令牌名称与前缀(与后端 sa-token 配置一致)
          tokenName: "Authorization",
          tokenPrefix: "Bearer"
        }
      };
    }
  },
  // 退出系统(POST /logout,第 3 期后端作废当前 token,mock 恒返回成功)
  {
    url: "/logout",
    method: "post",
    response: () => ({
      success: true,
      code: 200,
      msg: "操作成功",
      timestamp: Date.now(),
      data: null
    })
  }
]);
