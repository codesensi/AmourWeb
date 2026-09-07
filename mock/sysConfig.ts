// 系统配置 mock(对齐后端 /sys/config 接口)
// list-by-keys 契约对齐 ConfigResponse:configKey/configValue/valueType/configGroup,keys 为空时返回空列表
// page 契约对齐 ConfigPageResponse:id/configKey/configValue/valueType/configGroup/status/remark/updateTime
// update 契约对齐 ConfigUpdateRequest:id/configValue/status/remark(仅值/状态/备注可改)
import { defineFakeRoute } from "vite-plugin-fake-server/client";

// 与后端 sys_config 表同源的公共配置键值(值统一字符串存储;id/status/remark 与 init_dml.sql 对齐)
const configs = [
  {
    id: "1001",
    configKey: "name",
    configValue: "爱慕情侣小站",
    valueType: "STRING",
    configGroup: "base",
    status: 0,
    remark: "项目/站点名称",
    updateTime: "2026-01-01 00:00:00"
  },
  {
    id: "1002",
    configKey: "icp",
    configValue: "京ICP备2026010001号",
    valueType: "STRING",
    configGroup: "base",
    status: 0,
    remark: "ICP备案文案",
    updateTime: "2026-01-01 00:00:00"
  },
  {
    id: "1003",
    configKey: "copyright-year",
    configValue: "2026",
    valueType: "STRING",
    configGroup: "base",
    status: 0,
    remark: "版权年份",
    updateTime: "2026-01-01 00:00:00"
  },
  {
    id: "1004",
    configKey: "qq-service",
    configValue: "https://uapis.cn/api/v1/social/qq/userinfo?qq=%s",
    valueType: "STRING",
    configGroup: "base",
    status: 0,
    remark: "用户QQ信息接口地址",
    updateTime: "2026-01-01 00:00:00"
  },
  {
    id: "1005",
    configKey: "avatar-service",
    configValue: "https://api.dicebear.com/7.x/bottts/svg?seed=%s",
    valueType: "STRING",
    configGroup: "base",
    status: 0,
    remark: "用户随机头像服务地址",
    updateTime: "2026-01-01 00:00:00"
  },
  {
    id: "2001",
    configKey: "site.slogan",
    configValue:
      "爱晨雾漫过青瓦，爱暮色染透篱笆，更爱与君并肩立，看遍这人间烟火里的朝暮与年华。",
    valueType: "STRING",
    configGroup: "site",
    status: 0,
    remark: "门户标语文案",
    updateTime: "2026-01-01 00:00:00"
  },
  {
    id: "2002",
    configKey: "site.love-start-date",
    configValue: "2018-07-15 00:00:00",
    valueType: "STRING",
    configGroup: "site",
    status: 0,
    remark: "门户恋爱计时起点",
    updateTime: "2026-01-01 00:00:00"
  },
  {
    id: "3001",
    configKey: "captcha.enabled",
    configValue: "true",
    valueType: "BOOLEAN",
    configGroup: "captcha",
    status: 0,
    remark: "验证码开关",
    updateTime: "2026-01-01 00:00:00"
  },
  {
    id: "3002",
    configKey: "captcha.image-type",
    configValue: "arithmetic",
    valueType: "STRING",
    configGroup: "captcha",
    status: 0,
    remark: "图形验证码类型",
    updateTime: "2026-01-01 00:00:00"
  },
  {
    id: "3003",
    configKey: "captcha.image-expire",
    configValue: "300",
    valueType: "INTEGER",
    configGroup: "captcha",
    status: 0,
    remark: "图形验证码过期秒",
    updateTime: "2026-01-01 00:00:00"
  }
];

/** 统一响应包装 */
function ok(data: unknown) {
  return {
    success: true,
    code: 200,
    msg: "操作成功",
    timestamp: Date.now(),
    data
  };
}

export default defineFakeRoute([
  // 公共配置批量查询(GET /sys/config/list-by-keys?keys=逗号分隔键;仅启用条目)
  {
    url: "/sys/config/list-by-keys",
    method: "get",
    response: ({ query }) => {
      // keys 为逗号分隔(对齐后端 @RequestParam List<String>),为空时返回空列表
      const keys = String(query.keys ?? "")
        .split(",")
        .map(item => item.trim())
        .filter(Boolean);
      return ok(
        configs
          .filter(
            item => keys.includes(item.configKey) && item.status === 0
          )
          .map(({ configKey, configValue, valueType, configGroup }) => ({
            configKey,
            configValue,
            valueType,
            configGroup
          }))
      );
    }
  },
  // 分页查询(GET /sys/config/page;登录态,含禁用条目)
  {
    url: "/sys/config/page",
    method: "get",
    response: ({ query }) => {
      const pageNumber = Number(query.pageNumber ?? 1);
      const pageSize = Number(query.pageSize ?? 20);
      const configKey = String(query.configKey ?? "");
      const configGroup = String(query.configGroup ?? "");
      const status = query.status == null ? "" : String(query.status);
      const filtered = configs.filter(item => {
        return (
          (configKey === "" || item.configKey.includes(configKey)) &&
          (configGroup === "" || item.configGroup === configGroup) &&
          (status === "" || String(item.status) === status)
        );
      });
      return ok({
        records: filtered.slice(
          (pageNumber - 1) * pageSize,
          pageNumber * pageSize
        ),
        pageNumber,
        pageSize,
        totalRow: filtered.length,
        totalPage: Math.ceil(filtered.length / pageSize)
      });
    }
  },
  // 修改(PUT /sys/config/update;仅值/状态/备注可改)
  {
    url: "/sys/config/update",
    method: "put",
    response: ({ body }) => {
      const { id, configValue, status, remark } = body as Record<
        string,
        unknown
      >;
      const target = configs.find(item => item.id === String(id));
      if (!target) {
        return {
          success: false,
          code: 500,
          msg: "配置不存在",
          timestamp: Date.now(),
          data: null
        };
      }
      target.configValue = String(configValue ?? "");
      target.status = Number(status ?? target.status);
      if (remark != null) target.remark = String(remark);
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      target.updateTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      return ok(null);
    }
  }
]);
