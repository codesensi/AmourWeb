import type { OptionsType } from "@/components/ReSegmented";

/** 菜单类型选项（与后端 sys_menu.type 对齐:D-目录,M-菜单,B-按钮） */
const typeOptions: Array<OptionsType> = [
  {
    label: "目录",
    tip: "包含子菜单的目录节点",
    value: "D"
  },
  {
    label: "菜单",
    tip: "实际页面菜单",
    value: "M"
  },
  {
    label: "按钮",
    tip: "按钮级别权限节点",
    value: "B"
  }
];

/** 显隐选项（与后端 sys_menu.hidden 对齐:0-显示,1-隐藏） */
const hiddenOptions: Array<OptionsType> = [
  {
    label: "显示",
    tip: "会在菜单中显示",
    value: 0
  },
  {
    label: "隐藏",
    tip: "不会在菜单中显示",
    value: 1
  }
];

/** 状态选项（与后端 sys_menu.status 对齐:0-启用,1-禁用） */
const statusOptions: Array<OptionsType> = [
  {
    label: "启用",
    tip: "启用后菜单生效",
    value: 0
  },
  {
    label: "禁用",
    tip: "禁用后菜单不生效",
    value: 1
  }
];

export { typeOptions, hiddenOptions, statusOptions };
