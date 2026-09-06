// 系统公共配置 mock(对齐后端 GET /sys/config/list-by-keys?keys=逗号分隔键)
// 契约对齐 ConfigResponse:configKey/configValue/valueType/configGroup,keys 为空时返回空列表
import { defineFakeRoute } from "vite-plugin-fake-server/client";

// 与后端 sys_config 表同源的公共配置键值(值统一字符串存储)
const configs = [
  {
    configKey: "name",
    configValue: "爱慕情侣小站",
    valueType: "STRING",
    configGroup: "base"
  },
  {
    configKey: "icp",
    configValue: "京ICP备2026010001号",
    valueType: "STRING",
    configGroup: "base"
  },
  {
    configKey: "copyright-year",
    configValue: "2026",
    valueType: "STRING",
    configGroup: "base"
  },
  {
    configKey: "qq-service",
    configValue: "https://uapis.cn/api/v1/social/qq/userinfo?qq=%s",
    valueType: "STRING",
    configGroup: "base"
  },
  {
    configKey: "avatar-service",
    configValue: "https://api.dicebear.com/7.x/bottts/svg?seed=%s",
    valueType: "STRING",
    configGroup: "base"
  },
  {
    configKey: "site.slogan",
    configValue:
      "爱晨雾漫过青瓦，爱暮色染透篱笆，更爱与君并肩立，看遍这人间烟火里的朝暮与年华。",
    valueType: "STRING",
    configGroup: "site"
  },
  {
    configKey: "site.love-start-date",
    configValue: "2018-07-15 00:00:00",
    valueType: "STRING",
    configGroup: "site"
  },
  {
    configKey: "captcha.enabled",
    configValue: "true",
    valueType: "BOOLEAN",
    configGroup: "captcha"
  }
];

export default defineFakeRoute([
  {
    url: "/sys/config/list-by-keys",
    method: "get",
    response: ({ query }) => {
      // keys 为逗号分隔(对齐后端 @RequestParam List<String>),为空时返回空列表
      const keys = String(query.keys ?? "")
        .split(",")
        .map(item => item.trim())
        .filter(Boolean);
      return {
        success: true,
        code: 200,
        msg: "操作成功",
        timestamp: Date.now(),
        data: configs.filter(item => keys.includes(item.configKey))
      };
    }
  }
]);
