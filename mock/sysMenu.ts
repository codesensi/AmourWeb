// 菜单管理 mock(数据与 getCurrentUser.menus 同源,28 项 D/M/B)
import { defineFakeRoute } from "vite-plugin-fake-server/client";
import { menus } from "./getCurrentUser";

/** 将 getCurrentUser 的菜单项转换为菜单管理页面所需的记录格式 */
const toMenuRecord = (m: (typeof menus)[number]) => ({
  id: m.id,
  parentId: m.pid,
  title: m.title,
  // D/M 统一映射为"菜单",B 映射为"按钮"
  menuType: m.type === "B" ? 3 : 0,
  path: m.path ?? "",
  component: m.component ?? "",
  rank: m.sort,
  icon: m.icon ?? "",
  auths: m.perms ?? "",
  showLink: m.hidden !== 1
});

export default defineFakeRoute([
  // 菜单分页(GET /sys/menu/page,返回一维数组由前端组树)
  {
    url: "/sys/menu/page",
    method: "get",
    response: () => {
      return {
        success: true,
        code: 200,
        msg: "操作成功",
        data: {
          records: menus.map(toMenuRecord),
          pageNumber: 1,
          pageSize: menus.length,
          totalRow: menus.length,
          totalPage: 1
        }
      };
    }
  },
  // 新增(POST /sys/menu/insert,第 3 期后端对齐)
  {
    url: "/sys/menu/insert",
    method: "post",
    response: () => ({ success: true, code: 200, msg: "操作成功" })
  },
  // 修改(PUT /sys/menu/update)
  {
    url: "/sys/menu/update",
    method: "put",
    response: () => ({ success: true, code: 200, msg: "操作成功" })
  },
  // 删除(DELETE /sys/menu/delete/:id)
  {
    url: "/sys/menu/delete/:id",
    method: "delete",
    response: () => ({ success: true, code: 200, msg: "操作成功" })
  }
]);
