// 系统公共配置(GET /sys/config):第 1 期最小集仅 captchaEnabled,第 2 期门户(站名/slogan/双头像/恋爱起点/ICP)复用同一接口
import { defineFakeRoute } from "vite-plugin-fake-server/client";

export default defineFakeRoute([
  {
    url: "/sys/config",
    method: "get",
    response: () => {
      return {
        success: true,
        code: 200,
        msg: "操作成功",
        timestamp: Date.now(),
        data: {
          // 验证码显隐开关(对应后端 sys_config captcha.enabled)
          captchaEnabled: true,
          // 站点名称(浏览器标签页/登录页标题)
          title: "爱慕情侣小站"
        }
      };
    }
  }
]);
