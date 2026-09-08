// 菜单管理 mock(对齐后端 SysMenuController:/sys/menu/*)
// 行数据契约对齐 MenuResponse:id/pid/title/type/path/component/sort/icon/perms/status/hidden/builtin/remark/createTime
// 数据与 getCurrentUser.menus 同源(28 项 D/M/B),复制为独立工作副本,增删改仅落地内存,刷新页面即还原
import { defineFakeRoute } from "vite-plugin-fake-server/client";
import { menus as seedMenus } from "./currentUser";

/** 种子行固定创建时间(种子数据无 createTime 字段,列表"创建时间"列展示兜底) */
const SEED_CREATE_TIME = "2026-06-28 09:00:00";

const menuTable = seedMenus.map(item => ({
  ...item,
  createTime: item.createTime ?? SEED_CREATE_TIME
}));

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

/** 收集 menuId 的全部下级菜单 id(含自身),沿 pid 向下遍历 */
const collectIds = (menuId: string, result: string[] = []) => {
  result.push(menuId);
  for (const item of menuTable) {
    if (item.pid === menuId) {
      collectIds(String(item.id), result);
    }
  }
  return result;
};

export default defineFakeRoute([
  // 菜单列表(GET /sys/menu/list)
  {
    url: "/sys/menu/list",
    method: "get",
    response: () => ok(menuTable)
  },
  // 新增(POST /sys/menu/insert,落地内存数据)
  {
    url: "/sys/menu/insert",
    method: "post",
    response: ({ body }) => {
      const maxId = Math.max(...menuTable.map(item => Number(item.id)));
      // 同级下菜单名称唯一、权限标识全局唯一,对齐后端校验
      const pid = String(body?.pid ?? "0");
      if (
        menuTable.some(item => item.pid === pid && item.title === body?.title)
      )
        return fail("同级下已存在同名菜单");
      const perms = body?.perms ?? "";
      if (perms && menuTable.some(item => item.perms === perms))
        return fail("权限标识已存在");
      menuTable.push({
        id: String(maxId + 1),
        pid,
        title: body?.title ?? "",
        type: body?.type ?? "D",
        path: body?.path ?? "",
        component: body?.component ?? "",
        sort: body?.sort ?? 0,
        icon: body?.icon ?? "",
        perms: body?.perms ?? "",
        status: body?.status ?? 0,
        hidden: body?.hidden ?? 0,
        builtin: 0,
        remark: body?.remark ?? "",
        createTime: formatNow()
      });
      return ok();
    }
  },
  // 修改(PUT /sys/menu/update,落地内存数据;类型不在修改入参中、内置菜单结构字段不可改,对齐后端校验)
  {
    url: "/sys/menu/update",
    method: "put",
    response: ({ body }) => {
      const target = menuTable.find(item => item.id === String(body?.id));
      if (!target) return fail("菜单不存在");
      // 空串与 null 视为一致,避免表单提交空串被误判为修改
      const same = (a?: string, b?: string) => (a ?? "") === (b ?? "");
      if (target.builtin === 1) {
        if (target.pid !== String(body?.pid ?? target.pid))
          return fail("系统内置菜单不允许修改上级菜单");
        if (!same(target.path, body?.path))
          return fail("系统内置菜单不允许修改路由路径");
        if (!same(target.component, body?.component))
          return fail("系统内置菜单不允许修改组件路径");
        if (!same(target.perms, body?.perms))
          return fail("系统内置菜单不允许修改权限编码");
      }
      // 同级下菜单名称唯一、权限标识全局唯一(排除自身),对齐后端校验
      if (
        menuTable.some(
          item =>
            item.id !== target.id &&
            item.pid === String(body?.pid ?? target.pid) &&
            item.title === (body?.title ?? target.title)
        )
      )
        return fail("同级下已存在同名菜单");
      const updatePerms = body?.perms ?? target.perms;
      if (
        updatePerms &&
        menuTable.some(
          item => item.perms === updatePerms && item.id !== target.id
        )
      )
        return fail("权限标识已存在");
      target.pid = String(body?.pid ?? target.pid);
      target.title = body?.title ?? target.title;
      target.path = body?.path ?? target.path;
      target.component = body?.component ?? target.component;
      target.sort = body?.sort ?? target.sort;
      target.icon = body?.icon ?? target.icon;
      target.perms = body?.perms ?? target.perms;
      target.status = body?.status ?? target.status;
      target.hidden = body?.hidden ?? target.hidden;
      target.remark = body?.remark ?? target.remark;
      return ok();
    }
  },
  // 修改状态(PUT /sys/menu/change-status,落地内存数据;内置菜单禁禁用,对齐后端校验)
  {
    url: "/sys/menu/change-status",
    method: "put",
    response: ({ body }) => {
      const target = menuTable.find(item => item.id === String(body?.id));
      if (!target) return fail("菜单不存在");
      const status = Number(body?.status);
      if (target.builtin === 1 && status === 1) {
        return fail("系统内置菜单不允许禁用");
      }
      target.status = status;
      return ok();
    }
  },
  // 删除(DELETE /sys/menu/delete/:id,落地内存数据;内置菜单不可删,
  // 级联删除其全部下级菜单,对齐后端校验)
  {
    url: "/sys/menu/delete/:id",
    method: "delete",
    response: ({ params }) => {
      const id = String(params.id);
      const target = menuTable.find(item => item.id === id);
      if (!target) return fail("菜单不存在");
      if (target.builtin === 1) {
        return fail("系统内置菜单不允许删除");
      }
      const deleteIds = collectIds(id, []);
      for (const deleteId of deleteIds) {
        const index = menuTable.findIndex(item => item.id === deleteId);
        if (index !== -1) menuTable.splice(index, 1);
      }
      return ok();
    }
  }
]);
