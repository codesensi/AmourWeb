// 角色管理 mock(对齐后端 SysRoleController:/sys/role/*)
// 行数据契约对齐 RolePageResponse:id/name/code/sort/status/builtin/remark/createTime
// 状态语义对齐 sys_role 表与 EnableEnum:0-启用,1-禁用
import { defineFakeRoute } from "vite-plugin-fake-server/client";

const roles = [
  {
    id: "1",
    name: "超级管理员",
    code: "admin",
    sort: 1,
    status: 0,
    builtin: 1,
    remark: "超级管理员拥有最高权限",
    createTime: "2020-11-15 16:00:00"
  },
  {
    id: "2",
    name: "普通角色",
    code: "common",
    sort: 2,
    status: 0,
    builtin: 0,
    remark: "普通角色拥有部分权限",
    createTime: "2020-11-15 16:00:00"
  },
  {
    id: "3",
    name: "内容编辑",
    code: "editor",
    sort: 3,
    status: 0,
    builtin: 0,
    remark: "负责内容的编辑与发布",
    createTime: "2026-01-01 10:00:00"
  },
  {
    id: "4",
    name: "访客",
    code: "guest",
    sort: 4,
    status: 1,
    builtin: 0,
    remark: "仅可浏览,当前已禁用",
    createTime: "2026-01-01 10:00:00"
  }
];

// 角色已分配的菜单ID(角色ID为键;分配后落地,menu-ids 回显读取)
const menusByRole: Record<number, string[]> = {
  1: [
    "1000",
    "1200",
    "1201",
    "1202",
    "1203",
    "1204",
    "1205",
    "1300",
    "1301",
    "1302",
    "1303",
    "1304",
    "1305",
    "1400",
    "1401",
    "1402",
    "1403",
    "1404",
    "1405",
    "3000",
    "3200",
    "3300",
    "3400"
  ],
  2: ["3000", "3200", "3300", "3400"],
  3: ["3000", "3200", "3300", "3400"],
  4: ["3000", "3200", "3300", "3400"]
};

/** 当前时间,格式对齐后端 createTime(yyyy-MM-dd HH:mm:ss) */
const formatNow = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

/** 对齐后端 Result<T> 的成功响应(自动携带 timestamp) */
const ok = (data = null, msg = "操作成功") => ({
  success: true,
  code: 200,
  msg,
  data,
  timestamp: Date.now()
});

/** 对齐后端 Result<T> 的失败响应 */
const fail = (msg: string) => ({
  success: false,
  code: 400,
  msg,
  data: null,
  timestamp: Date.now()
});

export default defineFakeRoute([
  // 角色分页(GET /sys/role/page,条件缺省时自动忽略)
  {
    url: "/sys/role/page",
    method: "get",
    response: ({ query }) => {
      const name = String(query.name ?? "");
      const code = String(query.code ?? "");
      const status = query.status;
      const records = roles.filter(
        item =>
          item.name.includes(name) &&
          item.code.includes(code) &&
          (status === undefined ||
            status === "" ||
            item.status === Number(status))
      );
      const pageNumber = Number(query.pageNumber ?? 1);
      const pageSize = Number(query.pageSize ?? 20);
      const start = (pageNumber - 1) * pageSize;
      return ok({
        records: records.slice(start, start + pageSize),
        pageNumber,
        pageSize,
        totalRow: records.length,
        totalPage: Math.ceil(records.length / pageSize)
      });
    }
  },
  // 角色全量列表(GET /sys/role/list,分配角色等场景的选项数据源,字段对齐后端 RoleResponse)
  {
    url: "/sys/role/list",
    method: "get",
    response: () => {
      return ok(
        roles.map(({ id, name, code, status, builtin }) => ({
          id,
          name,
          code,
          status,
          builtin
        }))
      );
    }
  },
  // 角色已有菜单 id(GET /sys/role/menu-ids/:id)
  {
    url: "/sys/role/menu-ids/:id",
    method: "get",
    response: ({ params }) => {
      return ok(menusByRole[Number(params.id)] ?? []);
    }
  },
  // 新增(POST /sys/role/insert,落地内存数据,刷新页面即还原;新增角色默认启用)
  {
    url: "/sys/role/insert",
    method: "post",
    response: ({ body }) => {
      const maxId = Math.max(...roles.map(item => Number(item.id)));
      roles.push({
        id: String(maxId + 1),
        name: body?.name ?? "",
        code: body?.code ?? "",
        sort: body?.sort ?? 1,
        status: 0,
        builtin: 0,
        remark: body?.remark ?? "",
        createTime: formatNow()
      });
      return ok();
    }
  },
  // 修改(PUT /sys/role/update,落地内存数据;角色编码/状态/内置标识/创建时间不可改,对齐后端 RoleUpdateRequest)
  {
    url: "/sys/role/update",
    method: "put",
    response: ({ body }) => {
      const target = roles.find(item => item.id === String(body?.id));
      if (!target) return fail("角色不存在");
      target.name = body?.name ?? target.name;
      target.sort = body?.sort ?? target.sort;
      target.remark = body?.remark ?? target.remark;
      return ok();
    }
  },
  // 删除(DELETE /sys/role/delete/:id,落地内存数据;id 支持英文逗号分隔批量,
  // 内置角色不可删且整批失败,对齐后端校验)
  {
    url: "/sys/role/delete/:id",
    method: "delete",
    response: ({ params }) => {
      const ids = String(params.id)
        .split(",")
        .map(item => Number(item));
      const missing = ids.filter(
        id => !roles.some(item => Number(item.id) === id)
      );
      if (missing.length) {
        return fail(`角色不存在：${missing.join("、")}`);
      }
      const containsBuiltin = roles.some(
        item => ids.includes(Number(item.id)) && item.builtin === 1
      );
      if (containsBuiltin) {
        return fail("系统内置角色不允许删除");
      }
      for (const id of ids) {
        const index = roles.findIndex(item => Number(item.id) === id);
        if (index !== -1) roles.splice(index, 1);
        delete menusByRole[id];
      }
      return ok();
    }
  },
  // 修改状态(PUT /sys/role/change-status,落地内存数据;内置角色禁禁用,对齐后端校验)
  {
    url: "/sys/role/change-status",
    method: "put",
    response: ({ body }) => {
      const target = roles.find(item => item.id === String(body?.id));
      if (!target) return fail("角色不存在");
      const status = Number(body?.status);
      if (target.builtin === 1 && status === 1) {
        return fail("系统内置角色不允许禁用");
      }
      target.status = status;
      return ok();
    }
  },
  // 保存菜单授权(PUT /sys/role/assign-menus,落地内存数据;内置角色禁改权限,对齐后端校验)
  {
    url: "/sys/role/assign-menus",
    method: "put",
    response: ({ body }) => {
      const target = roles.find(item => item.id === String(body?.roleId));
      if (!target) return fail("角色不存在");
      if (target.builtin === 1) {
        return fail("系统内置角色不允许修改权限");
      }
      menusByRole[Number(body?.roleId)] = body?.menuIds ?? [];
      return ok();
    }
  }
]);
