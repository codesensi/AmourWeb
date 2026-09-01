// 用户管理 mock(对齐后端 SysUserController:/sys/user/*)
import { defineFakeRoute } from "vite-plugin-fake-server/client";

const users = [
  {
    id: 1,
    username: "admin",
    nickname: "小铭",
    phone: "15888886789",
    email: "pureadmin@163.com",
    sex: 0,
    avatar: "https://avatars.githubusercontent.com/u/44761321",
    status: 1,
    builtin: 1,
    remark: "管理员",
    deptId: 103,
    dept: { id: 103, name: "研发部门" },
    createTime: 1605456000000
  },
  {
    id: 2,
    username: "common",
    nickname: "小林",
    phone: "18288882345",
    email: "common@example.com",
    sex: 1,
    avatar: "https://avatars.githubusercontent.com/u/52823142",
    status: 1,
    builtin: 0,
    remark: "普通用户",
    deptId: 105,
    dept: { id: 105, name: "测试部门" },
    createTime: 1605456000000
  }
];

const rolesByUser: Record<number, number[]> = { 1: [1], 2: [2] };

export default defineFakeRoute([
  // 用户分页(GET /sys/user/page)
  {
    url: "/sys/user/page",
    method: "get",
    response: ({ query }) => {
      let records = [...users];
      records = records.filter(item =>
        item.username.includes(String(query.username ?? ""))
      );
      records = records.filter(item =>
        String(item.status).includes(String(query.status ?? ""))
      );
      if (query.phone)
        records = records.filter(item => item.phone === query.phone);
      if (query.deptId)
        records = records.filter(item => item.deptId === Number(query.deptId));
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
  // 用户已有角色 id(GET /sys/user/role-ids/{id})
  {
    url: "/sys/user/role-ids/{id}",
    method: "get",
    response: ({ query }) => {
      return {
        success: true,
        code: 200,
        msg: "操作成功",
        data: rolesByUser[Number(query.id)] ?? []
      };
    }
  },
  // 新增(POST /sys/user/insert)
  {
    url: "/sys/user/insert",
    method: "post",
    response: () => ({ success: true, code: 200, msg: "操作成功" })
  },
  // 修改(PUT /sys/user/update)
  {
    url: "/sys/user/update",
    method: "put",
    response: () => ({ success: true, code: 200, msg: "操作成功" })
  },
  // 删除(DELETE /sys/user/delete/{id})
  {
    url: "/sys/user/delete/{id}",
    method: "delete",
    response: () => ({ success: true, code: 200, msg: "操作成功" })
  },
  // 分配角色(PUT /sys/user/assignRoles)
  {
    url: "/sys/user/assignRoles",
    method: "put",
    response: () => ({ success: true, code: 200, msg: "操作成功" })
  }
]);
