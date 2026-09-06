// 用户管理 mock(对齐后端 SysUserController:/sys/user/*)
// 行数据契约对齐 UserPageResponse:id/username/nickname/idCard/phone/email/qq/gender/avatar/status/builtin/remark/createTime
// 状态语义对齐 sys_user 表:0-启用,1-禁用
import { defineFakeRoute } from "vite-plugin-fake-server/client";

const users = [
  {
    id: 1,
    username: "admin",
    nickname: "超级管理员",
    idCard: "",
    email: "",
    phone: "",
    qq: "12345678",
    gender: "U",
    avatar: "",
    status: 0,
    builtin: 1,
    remark: "超级管理员",
    createTime: "2026-01-01T08:00:00"
  },
  {
    id: 2,
    username: "li",
    nickname: "Li",
    idCard: "",
    email: "",
    phone: "",
    qq: "2623669948",
    gender: "M",
    avatar: "",
    status: 0,
    builtin: 1,
    remark: "门户男主",
    createTime: "2026-01-01T09:00:00"
  },
  {
    id: 3,
    username: "su",
    nickname: "Su",
    idCard: "",
    email: "",
    phone: "",
    qq: "673822943",
    gender: "F",
    avatar: "",
    status: 0,
    builtin: 1,
    remark: "门户女主",
    createTime: "2026-01-01T09:01:00"
  },
  {
    id: 4,
    username: "common",
    nickname: "小林",
    idCard: "",
    email: "",
    phone: "",
    qq: "",
    gender: "M",
    avatar: "",
    status: 1,
    builtin: 0,
    remark: "普通用户",
    createTime: "2026-06-15T10:00:00"
  }
];

// 响应剔除 idCard(对齐后端 UserPageResponse:可按身份证搜索但不下发)
const rolesByUser: Record<number, number[]> = {
  1: [1],
  2: [2],
  3: [2],
  4: [2]
};

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
        (item.phone ?? "").includes(String(query.phone ?? ""))
      );
      records = records.filter(item =>
        (item.qq ?? "").includes(String(query.qq ?? ""))
      );
      records = records.filter(item =>
        (item.email ?? "").includes(String(query.email ?? ""))
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
  // 分配角色(PUT /sys/user/assign-roles)
  {
    url: "/sys/user/assign-roles",
    method: "put",
    response: () => ({ success: true, code: 200, msg: "操作成功" })
  }
]);
