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
          // 站点名称(浏览器标签页/登录页标题/门户 logo 文案)
          title: "爱慕情侣小站",
          // 门户顶栏文案(对应后端 sys_config site.slogan)
          siteSlogan:
            "爱晨雾漫过青瓦，爱暮色染透篱笆，更爱与君并肩立，看遍这人间烟火里的朝暮与年华。",
          // 双方昵称与 QQ 号(头像经 q1.qlogo.cn 拉取)
          femaleName: "Su",
          maleName: "Li",
          femaleQq: "673822943",
          maleQq: "2623669948",
          // 恋爱计时起点(对应后端 sys_config site.love-start-date,格式 yyyy-MM-dd HH:mm:ss)
          loveStartDate: "2018-07-15 00:00:00",
          // ICP 备案文案
          icpText: "赣ICP备2026010001号",
          // 版权年份
          copyright: "2026"
        }
      };
    }
  }
]);
