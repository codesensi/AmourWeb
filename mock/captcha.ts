// 图形验证码
import { defineFakeRoute } from "vite-plugin-fake-server/client";

const captchaSvg = encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40">' +
    '<rect width="100%" height="100%" fill="#f0f2f5"/>' +
    '<text x="50%" y="58%" font-size="22" font-family="monospace" text-anchor="middle" fill="#409eff">1234</text>' +
    "</svg>"
);

export default defineFakeRoute([
  {
    url: "/captcha",
    method: "get",
    response: () => {
      return {
        success: true,
        code: 200,
        msg: "操作成功",
        timestamp: Date.now(),
        data: {
          captchaKey: "mock-captcha-key",
          // 验证码内容固定为 1234（图片形式）
          captchaValue: `data:image/svg+xml;charset=utf-8,${captchaSvg}`
        }
      };
    }
  }
]);
