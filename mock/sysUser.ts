// 用户管理 mock(对齐后端 SysUserController:/sys/user/*)
// 行数据契约对齐 UserPageResponse:id/username/nickname/idCard/phone/email/qq/gender/avatar/status/builtin/remark/createTime
// 状态语义对齐 sys_user 表与 EnableEnum:0-启用,1-禁用
import { defineFakeRoute } from "vite-plugin-fake-server/client";

const users = [
  {
    id: "1",
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
    createTime: "2026-01-01 08:00:00"
  },
  {
    id: "2",
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
    createTime: "2026-01-01 09:00:00"
  },
  {
    id: "3",
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
    createTime: "2026-01-01 09:01:00"
  },
  {
    id: "4",
    username: "common",
    nickname: "小林",
    idCard: "110101199001011234",
    email: "",
    phone: "",
    qq: "",
    gender: "M",
    avatar: "",
    status: 1,
    builtin: 0,
    remark: "普通用户",
    createTime: "2026-06-15 10:00:00"
  }
];

// 角色ID以字符串下发(对齐后端 RoleResponse:ToStringSerializer 避免前端精度丢失)
const rolesByUser: Record<number, string[]> = {
  1: ["1"],
  2: ["2"],
  3: ["2"],
  4: ["2"]
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
      return ok({
        records: records.slice(start, start + pageSize),
        pageNumber,
        pageSize,
        totalRow: records.length,
        totalPage: Math.ceil(records.length / pageSize)
      });
    }
  },
  // 用户已有角色 id(GET /sys/user/role-ids/:id)
  {
    url: "/sys/user/role-ids/:id",
    method: "get",
    response: ({ params }) => {
      return ok(rolesByUser[Number(params.id)] ?? []);
    }
  },
  // 新增(POST /sys/user/insert,落地内存数据,刷新页面即还原)
  {
    url: "/sys/user/insert",
    method: "post",
    response: ({ body }) => {
      const maxId = Math.max(...users.map(item => Number(item.id)));
      users.push({
        id: String(maxId + 1),
        username: body?.username ?? "",
        // 对齐后端 insert:未输入昵称则默认与用户名一致
        nickname: body?.nickname ?? body?.username ?? "",
        idCard: body?.idCard ?? "",
        email: body?.email ?? "",
        phone: body?.phone ?? "",
        qq: body?.qq ?? "",
        gender: body?.gender ?? "U",
        avatar: body?.avatar ?? "",
        status: body?.status ?? 0,
        builtin: 0,
        remark: body?.remark ?? "",
        createTime: formatNow()
      });
      return ok();
    }
  },
  // 修改(PUT /sys/user/update,落地内存数据;用户名/内置标识/创建时间不可改,对齐后端 UserUpdateRequest)
  {
    url: "/sys/user/update",
    method: "put",
    response: ({ body }) => {
      const target = users.find(item => item.id === String(body?.id));
      if (!target) return fail("用户不存在");
      target.nickname = body?.nickname ?? target.nickname;
      target.idCard = body?.idCard ?? target.idCard;
      target.email = body?.email ?? target.email;
      target.phone = body?.phone ?? target.phone;
      target.qq = body?.qq ?? target.qq;
      target.gender = body?.gender ?? target.gender;
      target.avatar = body?.avatar ?? target.avatar;
      target.remark = body?.remark ?? target.remark;
      return ok();
    }
  },
  // 删除(DELETE /sys/user/delete/:id,落地内存数据;id 支持英文逗号分隔批量,
  // 内置用户不可删且整批失败,对齐后端校验)
  {
    url: "/sys/user/delete/:id",
    method: "delete",
    response: ({ params }) => {
      const ids = String(params.id)
        .split(",")
        .map(item => Number(item));
      const missing = ids.filter(
        id => !users.some(item => Number(item.id) === id)
      );
      if (missing.length) {
        return fail(`用户不存在：${missing.join("、")}`);
      }
      const containsBuiltin = users.some(
        item => ids.includes(Number(item.id)) && item.builtin === 1
      );
      if (containsBuiltin) {
        return fail("系统内置用户不允许删除");
      }
      for (const id of ids) {
        const index = users.findIndex(item => Number(item.id) === id);
        if (index !== -1) users.splice(index, 1);
        delete rolesByUser[id];
      }
      return ok();
    }
  },
  // 重置密码为默认密码(PUT /sys/user/reset-password/:id)
  {
    url: "/sys/user/reset-password/:id",
    method: "put",
    response: ({ params }) => {
      const exists = users.some(item => Number(item.id) === Number(params.id));
      if (!exists) return fail("用户不存在");
      return ok();
    }
  },
  // 修改状态(PUT /sys/user/change-status,落地内存数据;内置用户禁禁用,对齐后端校验)
  {
    url: "/sys/user/change-status",
    method: "put",
    response: ({ body }) => {
      const target = users.find(item => item.id === String(body?.id));
      if (!target) return fail("用户不存在");
      const status = Number(body?.status);
      if (target.builtin === 1 && status === 1) {
        return fail("系统内置用户不允许禁用");
      }
      target.status = status;
      return ok();
    }
  },
  // 分配角色(PUT /sys/user/assign-roles,落地内存数据;内置用户禁改角色,对齐后端校验)
  {
    url: "/sys/user/assign-roles",
    method: "put",
    response: ({ body }) => {
      const target = users.find(item => item.id === String(body?.userId));
      if (!target) return fail("用户不存在");
      if (target.builtin === 1) {
        return fail("系统内置用户不允许修改角色");
      }
      rolesByUser[Number(body?.userId)] = body?.roleIds ?? [];
      return ok();
    }
  }
]);
