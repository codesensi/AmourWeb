// 获取当前登录用户信息（扁平 D/M/B 结构）
import { defineFakeRoute } from "vite-plugin-fake-server/client";

interface MenuItem {
  id: string;
  pid: string;
  title: string;
  type: "D" | "M" | "B";
  path?: string;
  component?: string;
  sort: number;
  icon?: string;
  perms?: string;
  status: number;
  hidden: number;
  builtin: number;
}

export const menus: MenuItem[] = [
  // 系统管理
  {
    id: "1000",
    pid: "0",
    title: "系统管理",
    type: "D",
    path: "/admin/system",
    sort: 1,
    icon: "ep:setting",
    status: 0,
    hidden: 0,
    builtin: 1
  },
  {
    id: "1200",
    pid: "1000",
    title: "用户管理",
    type: "M",
    path: "/admin/system/user/index",
    component: "system/user/index",
    sort: 1,
    icon: "ep:user",
    status: 0,
    hidden: 0,
    builtin: 1
  },
  {
    id: "1201",
    pid: "1200",
    title: "分页查询",
    type: "B",
    perms: "system:user:page",
    sort: 1,
    status: 0,
    hidden: 0,
    builtin: 1
  },
  {
    id: "1202",
    pid: "1200",
    title: "详情",
    type: "B",
    perms: "system:user:detail",
    sort: 2,
    status: 0,
    hidden: 0,
    builtin: 1
  },
  {
    id: "1203",
    pid: "1200",
    title: "修改",
    type: "B",
    perms: "system:user:update",
    sort: 3,
    status: 0,
    hidden: 0,
    builtin: 1
  },
  {
    id: "1204",
    pid: "1200",
    title: "增加",
    type: "B",
    perms: "system:user:insert",
    sort: 4,
    status: 0,
    hidden: 0,
    builtin: 1
  },
  {
    id: "1205",
    pid: "1200",
    title: "删除",
    type: "B",
    perms: "system:user:delete",
    sort: 5,
    status: 0,
    hidden: 0,
    builtin: 1
  },
  {
    id: "1300",
    pid: "1000",
    title: "角色管理",
    type: "M",
    path: "/admin/system/role/index",
    component: "system/role/index",
    sort: 2,
    icon: "ep:avatar",
    status: 0,
    hidden: 0,
    builtin: 1
  },
  {
    id: "1301",
    pid: "1300",
    title: "分页查询",
    type: "B",
    perms: "system:role:page",
    sort: 1,
    status: 0,
    hidden: 0,
    builtin: 1
  },
  {
    id: "1302",
    pid: "1300",
    title: "详情",
    type: "B",
    perms: "system:role:detail",
    sort: 2,
    status: 0,
    hidden: 0,
    builtin: 1
  },
  {
    id: "1303",
    pid: "1300",
    title: "修改",
    type: "B",
    perms: "system:role:update",
    sort: 3,
    status: 0,
    hidden: 0,
    builtin: 1
  },
  {
    id: "1304",
    pid: "1300",
    title: "增加",
    type: "B",
    perms: "system:role:insert",
    sort: 4,
    status: 0,
    hidden: 0,
    builtin: 1
  },
  {
    id: "1305",
    pid: "1300",
    title: "删除",
    type: "B",
    perms: "system:role:delete",
    sort: 5,
    status: 0,
    hidden: 0,
    builtin: 1
  },
  {
    id: "1400",
    pid: "1000",
    title: "菜单管理",
    type: "M",
    path: "/admin/system/menu/index",
    component: "system/menu/index",
    sort: 3,
    icon: "ep:menu",
    status: 0,
    hidden: 0,
    builtin: 1
  },
  {
    id: "1401",
    pid: "1400",
    title: "分页查询",
    type: "B",
    perms: "system:menu:page",
    sort: 1,
    status: 0,
    hidden: 0,
    builtin: 1
  },
  {
    id: "1402",
    pid: "1400",
    title: "详情",
    type: "B",
    perms: "system:menu:detail",
    sort: 2,
    status: 0,
    hidden: 0,
    builtin: 1
  },
  {
    id: "1403",
    pid: "1400",
    title: "修改",
    type: "B",
    perms: "system:menu:update",
    sort: 3,
    status: 0,
    hidden: 0,
    builtin: 1
  },
  {
    id: "1404",
    pid: "1400",
    title: "增加",
    type: "B",
    perms: "system:menu:insert",
    sort: 4,
    status: 0,
    hidden: 0,
    builtin: 1
  },
  {
    id: "1405",
    pid: "1400",
    title: "删除",
    type: "B",
    perms: "system:menu:delete",
    sort: 5,
    status: 0,
    hidden: 0,
    builtin: 1
  },
  // 日志管理（对应模板保留的 monitor 页面，第 3 期与后端蓝图对齐）
  {
    id: "3000",
    pid: "0",
    title: "日志管理",
    type: "D",
    path: "/admin/monitor",
    sort: 2,
    icon: "ep:monitor",
    status: 0,
    hidden: 0,
    builtin: 1
  },
  {
    id: "3200",
    pid: "3000",
    title: "登录日志",
    type: "M",
    path: "/admin/monitor/login-logs",
    component: "monitor/logs/login/index",
    sort: 2,
    icon: "ri:window-line",
    status: 0,
    hidden: 0,
    builtin: 1
  },
  {
    id: "3300",
    pid: "3000",
    title: "操作日志",
    type: "M",
    path: "/admin/monitor/operation-logs",
    component: "monitor/logs/operation/index",
    sort: 3,
    icon: "ri:history-fill",
    status: 0,
    hidden: 0,
    builtin: 1
  }
];

export default defineFakeRoute([
  {
    url: "/sys/user/getCurrentUser",
    method: "get",
    response: () => {
      return {
        success: true,
        code: 200,
        msg: "操作成功",
        timestamp: Date.now(),
        data: {
          username: "admin",
          nickname: "小铭",
          avatar: "https://avatars.githubusercontent.com/u/44761321",
          email: "pureadmin@163.com",
          phone: "15888886789",
          gender: "M",
          remark: "",
          builtin: 1,
          roles: ["admin"],
          perms: ["*:*:*"],
          menus
        }
      };
    }
  }
]);
