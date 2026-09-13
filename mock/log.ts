// 日志管理 mock(对齐后端 SysLogController:/sys/log/login/page 与 /sys/log/operate/page)
// 行数据契约对齐 LogPageResponse:id/username/module/operation/logType/ip/region/elapsed/status/msg/url/param/result/createTime
// 同表不同类型域:login 端点仅登录/登出(logType 1-2),operate 端点为其余业务类型(3-9);
// 过滤对齐后端:用户名模糊、状态精确、类型集合取交集,按 ID 倒序(最新在前)
import { defineFakeRoute } from "vite-plugin-fake-server/client";

/** 日志行数据(契约对齐 LogPageResponse / api/log.ts SysLogItem) */
type LogRow = {
  id: string;
  username: string;
  module: string;
  operation: string;
  logType: number;
  ip: string;
  region: string;
  elapsed: number;
  status: number;
  msg: string;
  url: string;
  param: string;
  result: string;
  createTime: string;
};

/** 登录/登出日志(logType: 1-登录, 2-登出) */
const loginLogs: Array<LogRow> = [
  {
    id: "1004",
    username: "admin",
    module: "登录",
    operation: "退出登录",
    logType: 2,
    ip: "127.0.0.1",
    region: "内网",
    elapsed: 35,
    status: 1,
    msg: "",
    url: "cn.codesensi.amour.controller.LoginController#logout",
    param: "",
    result: "",
    createTime: "2026-01-03 18:02:11"
  },
  {
    id: "1003",
    username: "admin",
    module: "登录",
    operation: "账号登录",
    logType: 1,
    ip: "127.0.0.1",
    region: "内网",
    elapsed: 842,
    status: 1,
    msg: "",
    url: "cn.codesensi.amour.controller.LoginController#login",
    param: '{"username":"admin","password":"***"}',
    result: "",
    createTime: "2026-01-03 09:15:27"
  },
  {
    id: "1002",
    username: "admin",
    module: "登录",
    operation: "账号登录",
    logType: 1,
    ip: "192.168.1.20",
    region: "内网",
    elapsed: 765,
    status: 0,
    msg: "验证码错误",
    url: "cn.codesensi.amour.controller.LoginController#login",
    param: '{"username":"admin","password":"***"}',
    result: "",
    createTime: "2026-01-02 15:40:03"
  },
  {
    id: "1001",
    username: "visitor",
    module: "登录",
    operation: "账号登录",
    logType: 1,
    ip: "113.57.182.10",
    region: "湖北武汉",
    elapsed: 913,
    status: 0,
    msg: "密码错误",
    url: "cn.codesensi.amour.controller.LoginController#login",
    param: '{"username":"visitor","password":"***"}',
    result: "",
    createTime: "2026-01-02 10:05:48"
  }
];

/** 业务操作日志(logType: 3-查询, 4-新增, 5-修改, 6-删除, 7-授权, 8-上传, 9-下载) */
const operateLogs: Array<LogRow> = [
  {
    id: "2008",
    username: "admin",
    module: "文件管理",
    operation: "上传文件",
    logType: 8,
    ip: "127.0.0.1",
    region: "内网",
    elapsed: 126,
    status: 1,
    msg: "",
    url: "cn.codesensi.amour.controller.FileController#upload",
    param: '{"bizType":"avatar"}',
    result: "",
    createTime: "2026-01-03 10:21:05"
  },
  {
    id: "2007",
    username: "admin",
    module: "用户管理",
    operation: "新增用户",
    logType: 4,
    ip: "127.0.0.1",
    region: "内网",
    elapsed: 54,
    status: 1,
    msg: "",
    url: "cn.codesensi.amour.controller.SysUserController#insert",
    param: '{"username":"tester"}',
    result: "",
    createTime: "2026-01-03 09:41:32"
  },
  {
    id: "2006",
    username: "admin",
    module: "角色管理",
    operation: "分配菜单",
    logType: 7,
    ip: "127.0.0.1",
    region: "内网",
    elapsed: 47,
    status: 1,
    msg: "",
    url: "cn.codesensi.amour.controller.SysRoleController#assignMenus",
    param: '{"roleId":"1"}',
    result: "",
    createTime: "2026-01-03 09:30:12"
  },
  {
    id: "2005",
    username: "admin",
    module: "系统配置",
    operation: "修改配置",
    logType: 5,
    ip: "127.0.0.1",
    region: "内网",
    elapsed: 38,
    status: 1,
    msg: "",
    url: "cn.codesensi.amour.controller.SysConfigController#update",
    param: '{"id":"1001"}',
    result: "",
    createTime: "2026-01-02 16:20:44"
  },
  {
    id: "2004",
    username: "admin",
    module: "用户管理",
    operation: "查询用户列表",
    logType: 3,
    ip: "127.0.0.1",
    region: "内网",
    elapsed: 21,
    status: 1,
    msg: "",
    url: "cn.codesensi.amour.controller.SysUserController#page",
    param: '{"pageNumber":1}',
    result: "",
    createTime: "2026-01-02 16:02:09"
  },
  {
    id: "2003",
    username: "admin",
    module: "字典管理",
    operation: "删除字典",
    logType: 6,
    ip: "127.0.0.1",
    region: "内网",
    elapsed: 33,
    status: 0,
    msg: "内置字典条目不允许删除",
    url: "cn.codesensi.amour.controller.SysDictController#delete",
    param: '{"id":"10001"}',
    result: "",
    createTime: "2026-01-02 15:58:31"
  },
  {
    id: "2002",
    username: "admin",
    module: "文件管理",
    operation: "下载文件",
    logType: 9,
    ip: "127.0.0.1",
    region: "内网",
    elapsed: 88,
    status: 1,
    msg: "",
    url: "cn.codesensi.amour.controller.FileController#download",
    param: "",
    result: "",
    createTime: "2026-01-02 14:11:52"
  },
  {
    id: "2001",
    username: "admin",
    module: "用户管理",
    operation: "修改用户",
    logType: 5,
    ip: "192.168.1.20",
    region: "内网",
    elapsed: 41,
    status: 1,
    msg: "",
    url: "cn.codesensi.amour.controller.SysUserController#update",
    param: '{"id":"1"}',
    result: "",
    createTime: "2026-01-01 11:26:18"
  }
];

/** 分页构建:端点类型域与用户多选取交集,用户名模糊、状态精确,按 ID 倒序分页 */
function buildPage(
  domainTypes: Array<number>,
  source: Array<LogRow>,
  query: Record<string, unknown>
) {
  const pageNumber = Number(query.pageNumber ?? 1);
  const pageSize = Number(query.pageSize ?? 20);
  const username = String(query.username ?? "");
  const status = query.status == null ? "" : String(query.status);
  // 多选类型逗号分隔下发(对齐 api/log.ts getLogPage),空则取端点全量类型域
  const logTypes = String(query.logTypes ?? "")
    .split(",")
    .map(item => Number(item))
    .filter(item => !Number.isNaN(item));
  const scope = logTypes.length
    ? domainTypes.filter(type => logTypes.includes(type))
    : domainTypes;
  const filtered = source
    .filter(item => scope.includes(item.logType))
    .filter(item => username === "" || item.username.includes(username))
    .filter(item => status === "" || String(item.status) === status);
  const records = [...filtered].sort((a, b) => Number(b.id) - Number(a.id));
  return {
    success: true,
    code: 200,
    msg: "操作成功",
    timestamp: Date.now(),
    data: {
      records: records.slice(
        (pageNumber - 1) * pageSize,
        pageNumber * pageSize
      ),
      pageNumber,
      pageSize,
      totalRow: records.length,
      totalPage: Math.ceil(records.length / pageSize)
    }
  };
}

export default defineFakeRoute([
  // 登录日志分页(GET /sys/log/login/page;类型域仅登录/登出)
  {
    url: "/sys/log/login/page",
    method: "get",
    response: ({ query }) => buildPage([1, 2], loginLogs, query)
  },
  // 操作日志分页(GET /sys/log/operate/page;类型域为登录/登出之外的业务操作)
  {
    url: "/sys/log/operate/page",
    method: "get",
    response: ({ query }) =>
      buildPage([3, 4, 5, 6, 7, 8, 9], operateLogs, query)
  }
]);
