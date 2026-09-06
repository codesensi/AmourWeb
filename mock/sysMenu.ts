// 菜单管理 mock(对齐后端 GET /sys/menu/list:返回全量菜单的一维扁平数组,前端按 id + pid 自行组树)
// 数据与 getCurrentUser.menus 同源(28 项 D/M/B),复用后端实体模型字段
import { defineFakeRoute } from "vite-plugin-fake-server/client";
import { menus } from "./currentUser";

export default defineFakeRoute([
  // 菜单列表(GET /sys/menu/list)
  {
    url: "/sys/menu/list",
    method: "get",
    response: () => ({
      success: true,
      code: 200,
      msg: "操作成功",
      data: menus
    })
  },
  // 新增(POST /sys/menu/insert)
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
