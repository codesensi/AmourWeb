// 系统公共配置(GET /sys/config):字段名 = sys_config 配置键转 camelCase;
// qq-service/avatar-service 下发预留(留言头像降级方案后续实现)
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
          // 项目/站点名称(对应后端 sys_config name)
          name: "爱慕情侣小站",
          // ICP 备案文案(对应后端 sys_config icp)
          icp: "京ICP备2026010001号",
          // 版权年份(对应后端 sys_config copyright-year)
          copyrightYear: "2026",
          // QQ 头像服务地址模板(对应后端 sys_config qq-service,%s 为 QQ 号;留言头像使用,降级方案后续实现)
          qqService: "https://q1.qlogo.cn/g?b=qq&nk=%s&s=640",
          // 用户随机头像服务地址模板(对应后端 sys_config avatar-service,%s 为种子)
          avatarService: "https://api.dicebear.com/7.x/bottts/svg?seed=%s",
          // 门户站点标语(对应后端 sys_config site.slogan)
          siteSlogan:
            "爱晨雾漫过青瓦，爱暮色染透篱笆，更爱与君并肩立，看遍这人间烟火里的朝暮与年华。",
          // 门户恋爱计时起点(对应后端 sys_config site.love-start-date,格式 yyyy-MM-dd HH:mm:ss)
          siteLoveStartDate: "2018-07-15 00:00:00",
          // 验证码显隐开关(对应后端 sys_config captcha.enabled)
          captchaEnabled: true
        }
      };
    }
  }
]);
