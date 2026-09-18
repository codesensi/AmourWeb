// 系统配置 mock(对齐后端 /sys/config 接口)
// list-by-keys 契约对齐 ConfigResponse:configKey/configValue/valueType/configGroup(keys 为空时返回空列表;
// sensitive=1 的敏感配置不下发,对齐后端 PortalConfigController 行为)
// page 契约对齐 ConfigPageResponse:id/configKey/configValue/valueType/configGroup/sensitive/remark/updateTime
// update 契约对齐 ConfigUpdateRequest:id/configValue(仅配置值可改;键、类型、分组与状态由代码侧约定)
import { defineFakeRoute } from "vite-plugin-fake-server/client";

// 与后端 sys_config 表种子同源(init_dml.sql;值统一字符串存储;id/sensitive/remark 与其对齐)
const configs = [
  {
    id: "1001",
    configKey: "name",
    configValue: "爱慕情侣小站",
    valueType: "STRING",
    configGroup: "base",
    sensitive: 0,
    remark: "项目/站点名称",
    updateTime: "2026-01-01 00:00:00"
  },
  {
    id: "1002",
    configKey: "icp",
    configValue: "京ICP备2026010001号",
    valueType: "STRING",
    configGroup: "base",
    sensitive: 0,
    remark: "ICP备案文案",
    updateTime: "2026-01-01 00:00:00"
  },
  {
    id: "1003",
    configKey: "copyright-year",
    configValue: "2026",
    valueType: "STRING",
    configGroup: "base",
    sensitive: 0,
    remark: "版权年份",
    updateTime: "2026-01-01 00:00:00"
  },
  {
    id: "1005",
    configKey: "trust-proxy-headers",
    configValue: "true",
    valueType: "BOOLEAN",
    configGroup: "base",
    sensitive: 0,
    remark: "是否信任X-Real-IP等代理头(仅部署于可信反向代理后开启)",
    updateTime: "2026-01-01 00:00:00"
  },
  {
    id: "1006",
    configKey: "logo",
    configValue: "",
    valueType: "STRING",
    configGroup: "base",
    sensitive: 0,
    remark: "项目/站点logo图片(登录页/管理端/门户端统一)",
    updateTime: "2026-01-01 00:00:00"
  },
  {
    id: "1007",
    configKey: "favicon",
    configValue: "",
    valueType: "STRING",
    configGroup: "base",
    sensitive: 0,
    remark: "项目/站点favicon图标(登录页/管理端/门户端统一)",
    updateTime: "2026-01-01 00:00:00"
  },
  {
    id: "2001",
    configKey: "site.love-start-date",
    configValue: "2018-07-15 00:00:00",
    valueType: "DATETIME",
    configGroup: "site",
    sensitive: 0,
    remark: "门户恋爱计时起点",
    updateTime: "2026-01-01 00:00:00"
  },
  {
    id: "3001",
    configKey: "captcha.enabled",
    configValue: "true",
    valueType: "BOOLEAN",
    configGroup: "captcha",
    sensitive: 0,
    remark: "验证码开关",
    updateTime: "2026-01-01 00:00:00"
  },
  {
    id: "3002",
    configKey: "captcha.image-type",
    configValue: "arithmetic",
    valueType: "STRING",
    configGroup: "captcha",
    sensitive: 0,
    remark: "图形验证码类型",
    updateTime: "2026-01-01 00:00:00"
  },
  {
    id: "4001",
    configKey: "file.storage",
    configValue: "local",
    valueType: "STRING",
    configGroup: "file",
    sensitive: 0,
    remark: "文件存储方式: local-本地, oss-对象存储",
    updateTime: "2026-01-01 00:00:00"
  },
  {
    id: "5001",
    configKey: "rate-limit.login.limit",
    configValue: "5",
    valueType: "INTEGER",
    configGroup: "rate-limit",
    sensitive: 0,
    remark: "登录接口-窗口内最大请求数(0 表示拒绝全部请求)",
    updateTime: "2026-01-01 00:00:00"
  },
  {
    id: "5002",
    configKey: "rate-limit.login.window",
    configValue: "60",
    valueType: "INTEGER",
    configGroup: "rate-limit",
    sensitive: 0,
    remark: "登录接口-时间窗口(秒)",
    updateTime: "2026-01-01 00:00:00"
  },
  {
    id: "5003",
    configKey: "rate-limit.captcha.limit",
    configValue: "10",
    valueType: "INTEGER",
    configGroup: "rate-limit",
    sensitive: 0,
    remark: "验证码接口-窗口内最大请求数(0 表示拒绝全部请求)",
    updateTime: "2026-01-01 00:00:00"
  },
  {
    id: "5004",
    configKey: "rate-limit.captcha.window",
    configValue: "60",
    valueType: "INTEGER",
    configGroup: "rate-limit",
    sensitive: 0,
    remark: "验证码接口-时间窗口(秒)",
    updateTime: "2026-01-01 00:00:00"
  },
  {
    id: "5005",
    configKey: "rate-limit.qq.limit",
    configValue: "10",
    valueType: "INTEGER",
    configGroup: "rate-limit",
    sensitive: 0,
    remark: "QQ信息接口-窗口内最大请求数(0 表示拒绝全部请求)",
    updateTime: "2026-01-01 00:00:00"
  },
  {
    id: "5006",
    configKey: "rate-limit.qq.window",
    configValue: "60",
    valueType: "INTEGER",
    configGroup: "rate-limit",
    sensitive: 0,
    remark: "QQ信息接口-时间窗口(秒)",
    updateTime: "2026-01-01 00:00:00"
  },
  {
    id: "6001",
    configKey: "security.uapi-key",
    configValue: "",
    valueType: "STRING",
    configGroup: "security",
    sensitive: 1,
    remark: "UApiPro接口密钥(https://uapis.cn)",
    updateTime: "2026-01-01 00:00:00"
  },
  {
    id: "6002",
    configKey: "security.amap-key",
    configValue: "",
    valueType: "STRING",
    configGroup: "security",
    sensitive: 0,
    remark: "高德地图Web端JS API Key(足迹地图选点/门户足迹地图展示)",
    updateTime: "2026-01-01 00:00:00"
  },
  {
    id: "6003",
    configKey: "security.amap-code",
    configValue: "",
    valueType: "STRING",
    configGroup: "security",
    sensitive: 1,
    remark: "高德地图安全密钥(与Web端JS API Key配套,经后端代理注入,不下发浏览器)",
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
  // 公共配置批量查询(GET /portal/config/list-by-keys?keys=逗号分隔键;对齐 api/sysConfig.ts getSysConfig;
  // sensitive=1 的敏感配置不下发,对齐后端行为)
  {
    url: "/portal/config/list-by-keys",
    method: "get",
    response: ({ query }) => {
      // keys 为逗号分隔(对齐后端 @RequestParam List<String>),为空时返回空列表
      const keys = String(query.keys ?? "")
        .split(",")
        .map(item => item.trim())
        .filter(Boolean);
      return ok(
        configs
          .filter(item => !item.sensitive && keys.includes(item.configKey))
          .map(({ configKey, configValue, valueType, configGroup }) => ({
            configKey,
            configValue,
            valueType,
            configGroup
          }))
      );
    }
  },
  // 分页查询(GET /sys/config/page;登录态)
  {
    url: "/sys/config/page",
    method: "get",
    response: ({ query }) => {
      const pageNumber = Number(query.pageNumber ?? 1);
      const pageSize = Number(query.pageSize ?? 20);
      const configKey = String(query.configKey ?? "");
      const configGroup = String(query.configGroup ?? "");
      const filtered = configs.filter(item => {
        return (
          (configKey === "" || item.configKey.includes(configKey)) &&
          (configGroup === "" || item.configGroup === configGroup)
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
  // 修改(PUT /sys/config/update;仅配置值可改)
  {
    url: "/sys/config/update",
    method: "put",
    response: ({ body }) => {
      const { id, configValue } = body as Record<string, unknown>;
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
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      target.updateTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      return ok(null);
    }
  }
]);
