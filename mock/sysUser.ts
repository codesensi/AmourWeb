// 用户管理 mock(对齐后端 SysUserController:/sys/user/*)
import { defineFakeRoute } from "vite-plugin-fake-server/client";

const users = [
  {
    id: 1,
    username: "admin",
    nickname: "小铭",
    idCard: "411103199001011234",
    phone: "15888886789",
    qq: "12345678",
    email: "pureadmin@163.com",
    gender: "F",
    avatar: "https://avatars.githubusercontent.com/u/44761321",
    status: 1,
    builtin: 1,
    remark: "管理员",
    createTime: "2020-11-15T16:00:00"
  },
  {
    id: 2,
    username: "common",
    nickname: "小林",
    idCard: "411103199902021234",
    phone: "18288882345",
    qq: "",
    email: "common@example.com",
    gender: "M",
    avatar: "https://avatars.githubusercontent.com/u/52823142",
    status: 1,
    builtin: 0,
    remark: "普通用户",
    createTime: "2020-11-15T16:00:00"
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
      // 模糊查询条件(对齐后端 LIKE)
      records = records.filter(item =>
        item.username.includes(String(query.username ?? ""))
      );
      records = records.filter(item =>
        (item.nickname ?? "").includes(String(query.nickname ?? ""))
      );
      records = records.filter(item =>
        (item.idCard ?? "").includes(String(query.idCard ?? ""))
      );
      records = records.filter(item =>
        item.phone.includes(String(query.phone ?? ""))
      );
      records = records.filter(item =>
        item.qq.includes(String(query.qq ?? ""))
      );
      records = records.filter(item =>
        item.email.includes(String(query.email ?? ""))
      );
      // 精确匹配条件(对齐后端 eq)
      if (query.gender)
        records = records.filter(item => item.gender === query.gender);
      if (query.status)
        records = records.filter(item => String(item.status) === query.status);
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
  // 用户已有角色 id(GET /sys/user/role-ids/:id)
  {
    url: "/sys/user/role-ids/:id",
    method: "get",
    response: ({ params }) => {
      return {
        success: true,
        code: 200,
        msg: "操作成功",
        data: rolesByUser[Number(params.id)] ?? []
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
  // 删除(DELETE /sys/user/delete/:id)
  {
    url: "/sys/user/delete/:id",
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
