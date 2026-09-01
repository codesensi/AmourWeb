// 角色管理 mock(对齐后端 SysRoleController:/sys/role/*)
import { defineFakeRoute } from "vite-plugin-fake-server/client";

const roles = [
  {
    id: 1,
    name: "超级管理员",
    code: "admin",
    status: 1,
    builtin: 1,
    remark: "超级管理员拥有最高权限",
    createTime: 1605456000000,
    updateTime: 1684512000000
  },
  {
    id: 2,
    name: "普通角色",
    code: "common",
    status: 1,
    builtin: 0,
    remark: "普通角色拥有部分权限",
    createTime: 1605456000000,
    updateTime: 1684512000000
  }
];

export default defineFakeRoute([
  // 角色分页(GET /sys/role/page)
  {
    url: "/sys/role/page",
    method: "get",
    response: ({ query }) => {
      let records = [...roles];
      records = records.filter(item => item.name.includes(String(query.name ?? "")));
      records = records.filter(item =>
        String(item.status).includes(String(query.status ?? ""))
      );
      if (query.code)
        records = records.filter(item => item.code === query.code);
      return {
        success: true,
        code: 200,
        msg: "操作成功",
        data: {
          records,
          pageNumber: 1,
          pageSize: 10,
          totalRow: records.length,
          totalPages: 1
        }
      };
    }
  },
  // 角色已有菜单 id(GET /sys/role/menu-ids/{id})
  {
    url: "/sys/role/menu-ids/{id}",
    method: "get",
    response: ({ query }) => {
      const id = Number(query.id);
      return {
        success: true,
        code: 200,
        msg: "操作成功",
        data:
          id === 1
            ? [
                1000, 1200, 1201, 1202, 1203, 1204, 1205, 1100, 1101, 1102,
                1103, 1104, 1105, 1300, 1301, 1302, 1303, 1304, 1305, 1400,
                1401, 1402, 1403, 1404, 1405, 3000, 3100, 3200, 3300, 3400
              ]
            : [3000, 3100, 3200, 3300, 3400]
      };
    }
  },
  // 全量菜单树(GET /sys/role/menu-tree,授权弹窗用)
  {
    url: "/sys/role/menu-tree",
    method: "get",
    response: () => {
      return {
        success: true,
        code: 200,
        msg: "操作成功",
        data: [
          {
            parentId: 0,
            id: 1000,
            menuType: 0,
            title: "系统管理"
          },
          {
            parentId: 1000,
            id: 1200,
            menuType: 0,
            title: "用户管理"
          },
          {
            parentId: 1200,
            id: 1201,
            menuType: 3,
            title: "分页查询"
          },
          {
            parentId: 1000,
            id: 1100,
            menuType: 0,
            title: "部门管理"
          },
          {
            parentId: 1000,
            id: 1300,
            menuType: 0,
            title: "角色管理"
          },
          {
            parentId: 1000,
            id: 1400,
            menuType: 0,
            title: "菜单管理"
          },
          {
            parentId: 0,
            id: 3000,
            menuType: 0,
            title: "系统监控"
          },
          {
            parentId: 3000,
            id: 3100,
            menuType: 0,
            title: "在线用户"
          },
          {
            parentId: 3000,
            id: 3200,
            menuType: 0,
            title: "登录日志"
          },
          {
            parentId: 3000,
            id: 3300,
            menuType: 0,
            title: "操作日志"
          },
          {
            parentId: 3000,
            id: 3400,
            menuType: 0,
            title: "系统日志"
          }
        ]
      };
    }
  },
  // 新增(POST /sys/role/insert)
  {
    url: "/sys/role/insert",
    method: "post",
    response: () => ({ success: true, code: 200, msg: "操作成功" })
  },
  // 修改(PUT /sys/role/update)
  {
    url: "/sys/role/update",
    method: "put",
    response: () => ({ success: true, code: 200, msg: "操作成功" })
  },
  // 删除(DELETE /sys/role/delete/{id})
  {
    url: "/sys/role/delete/{id}",
    method: "delete",
    response: () => ({ success: true, code: 200, msg: "操作成功" })
  },
  // 保存菜单授权(PUT /sys/role/assignMenus)
  {
    url: "/sys/role/assignMenus",
    method: "put",
    response: () => ({ success: true, code: 200, msg: "操作成功" })
  }
]);
