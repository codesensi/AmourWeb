// 角色管理 mock(对齐后端 SysRoleController:/sys/role/*)
// 行数据契约对齐 RolePageResponse:id/name/code/sort/status/builtin/remark/createTime
// 数据权限契约对齐 RoleDataScopeResponse:全模块补齐,未配置行按最小权限 self 兜底
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
    remark: "系统内置超级管理员角色",
    createTime: "2026-01-01 00:00:00"
  },
  {
    id: "2",
    name: "主角",
    code: "hero",
    sort: 2,
    status: 0,
    builtin: 1,
    remark: "系统内置门户主角角色",
    createTime: "2026-01-01 00:00:00"
  }
];

// 角色已分配的菜单ID(角色ID为键;分配后落地,menu-ids 回显读取;
// admin 内置角色经 *:*:* 通配权限放行,mock 模拟为全量菜单预勾选;hero 无管理端菜单)
const menusByRole: Record<number, string[]> = {
  1: [
    "1000",
    "1100",
    "1101",
    "1102",
    "1103",
    "1104",
    "1105",
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
    "1500",
    "1501",
    "1502",
    "1503",
    "1504",
    "1505",
    "1600",
    "1601",
    "1700",
    "1701",
    "1702",
    "1800",
    "1801",
    "1802",
    "2000",
    "2001",
    "2002",
    "2003",
    "2004",
    "2100",
    "2101",
    "2102",
    "2103",
    "2104",
    "3000"
  ],
  2: []
};

/** 当前时间,格式对齐后端 createTime(yyyy-MM-dd HH:mm:ss) */
const formatNow = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

/** 数据权限模块清单(对齐后端 DataModuleEnum,新增模块时同步维护) */
const dataModules = [
  { module: "time-capsule", moduleDesc: "时间胶囊" },
  { module: "diary", moduleDesc: "日记" },
  { module: "moments", moduleDesc: "点滴" },
  { module: "love-photo", moduleDesc: "恋爱画册" },
  { module: "love-list", moduleDesc: "恋爱清单" },
  { module: "footprint", moduleDesc: "足迹" },
  { module: "anniversary", moduleDesc: "纪念日" },
  { module: "file", moduleDesc: "文件" }
];

// 角色数据范围策略(角色ID为键;未配置模块按最小权限 self 兜底,保存为整角色覆盖式写法)
const dataScopeByRole: Record<
  number,
  Record<string, { visibleScope: string; editableScope: string }>
> = {
  // hero 角色预置一条演示配置,其余模块由 self 兜底,演练「配置+兜底」混合形态
  2: { diary: { visibleScope: "all", editableScope: "all" } }
};

/** 对齐后端 Result<T> 的成功响应(自动携带 timestamp) */
const ok = (data: unknown = null, msg = "操作成功") => ({
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
      const records = roles
        .filter(
          item =>
            item.name.includes(name) &&
            item.code.includes(code) &&
            (status === undefined ||
              status === "" ||
              item.status === Number(status))
        )
        // 排序对齐后端 ORDER BY id DESC(新记录最前)
        .sort((a, b) => Number(b.id) - Number(a.id));
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
  },
  // 数据权限配置(GET /sys/role/data-scope/:id;全模块补齐,未配置行按最小权限 self 下发,
  // 超级管理员角色整单 superAdmin=true 硬编码 all/all,对齐后端 SysRoleDataScopeServiceImpl)
  {
    url: "/sys/role/data-scope/:id",
    method: "get",
    response: ({ params }) => {
      const role = roles.find(item => item.id === String(params.id));
      if (!role) return fail("角色不存在");
      const superAdmin = role.code === "admin";
      const scopeMap = dataScopeByRole[Number(params.id)] ?? {};
      return ok(
        dataModules.map(({ module, moduleDesc }) => {
          const scope = scopeMap[module];
          return {
            module,
            moduleDesc,
            visibleScope: superAdmin ? "all" : (scope?.visibleScope ?? "self"),
            editableScope: superAdmin
              ? "all"
              : (scope?.editableScope ?? "self"),
            superAdmin
          };
        })
      );
    }
  },
  // 保存数据权限(PUT /sys/role/assign-data-scope,整角色覆盖式保存;
  // 超管角色禁配、模块键与档位合法性、可改不得宽于可见,校验链对齐后端)
  {
    url: "/sys/role/assign-data-scope",
    method: "put",
    response: ({ body }) => {
      const role = roles.find(item => item.id === String(body?.roleId));
      if (!role) return fail("角色不存在");
      if (role.code === "admin") {
        return fail("超级管理员持有全部数据权限，无需配置");
      }
      const items = Array.isArray(body?.items) ? body.items : [];
      const scopeMap: Record<
        string,
        { visibleScope: string; editableScope: string }
      > = {};
      for (const item of items) {
        const target = dataModules.find(m => m.module === item?.module);
        if (!target) {
          return fail(`不支持的数据权限模块：${String(item?.module ?? "")}`);
        }
        const visibleScope = String(item?.visibleScope ?? "");
        const editableScope = String(item?.editableScope ?? "");
        if (
          !["all", "self"].includes(visibleScope) ||
          !["all", "self"].includes(editableScope)
        ) {
          return fail(`不支持的数据范围档位：${visibleScope}/${editableScope}`);
        }
        if (visibleScope === "self" && editableScope === "all") {
          return fail(`模块「${target.moduleDesc}」的可改范围不得宽于可见范围`);
        }
        scopeMap[target.module] = { visibleScope, editableScope };
      }
      dataScopeByRole[Number(body?.roleId)] = scopeMap;
      return ok();
    }
  }
]);
