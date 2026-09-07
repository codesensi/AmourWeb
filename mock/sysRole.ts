// 角色管理 mock(对齐后端 SysRoleController:/sys/role/*)
// 状态语义与后端 EnableEnum 对齐:0-启用,1-禁用
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
    createTime: "2020-11-15T16:00:00"
  },
  {
    id: "2",
    name: "普通角色",
    code: "common",
    sort: 2,
    status: 0,
    builtin: 0,
    remark: "普通角色拥有部分权限",
    createTime: "2020-11-15T16:00:00"
  },
  {
    id: "3",
    name: "内容编辑",
    code: "editor",
    sort: 3,
    status: 0,
    builtin: 0,
    remark: "负责内容的编辑与发布",
    createTime: "2026-01-01T10:00:00"
  },
  {
    id: "4",
    name: "访客",
    code: "guest",
    sort: 4,
    status: 1,
    builtin: 0,
    remark: "仅可浏览,当前已停用",
    createTime: "2026-01-01T10:00:00"
  }
];

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
      return {
        success: true,
        code: 200,
        msg: "操作成功",
        data: {
          records: records.slice(start, start + pageSize),
          pageNumber,
          pageSize,
          totalRow: records.length,
          totalPage: Math.ceil(records.length / pageSize)
        }
      };
    }
  },
  // 角色全量列表(GET /sys/role/list,分配角色等场景的选项数据源,字段对齐后端 RoleResponse)
  {
    url: "/sys/role/list",
    method: "get",
    response: () => {
      return {
        success: true,
        code: 200,
        msg: "操作成功",
        data: roles.map(({ id, name, code, status, builtin }) => ({
          id,
          name,
          code,
          status,
          builtin
        }))
      };
    }
  },
  // 角色已有菜单 id(GET /sys/role/menu-ids/:id)
  {
    url: "/sys/role/menu-ids/:id",
    method: "get",
    response: ({ params }) => {
      const id = Number(params.id);
      return {
        success: true,
        code: 200,
        msg: "操作成功",
        data:
          id === 1
            ? [
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
              ]
            : ["3000", "3200", "3300", "3400"]
      };
    }
  },
  // 新增(POST /sys/role/insert)
  {
    url: "/sys/role/insert",
    method: "post",
    response: () => ({ success: true, code: 200, msg: "操作成功" })
  },
  // 保存菜单授权(PUT /sys/role/assign-menus)
  {
    url: "/sys/role/assign-menus",
    method: "put",
    response: () => ({ success: true, code: 200, msg: "操作成功" })
  }
]);
