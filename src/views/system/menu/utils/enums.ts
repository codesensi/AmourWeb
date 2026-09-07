import { computed } from "vue";
import { useDict } from "@/hooks/useDict";
import { DICT_CODES } from "@/api/dict";
import type { OptionsType } from "@/components/ReSegmented";

/** 菜单类型选项（与后端 sys_menu.type 对齐:D-目录,M-菜单,B-按钮;纯前端路由语义,保留静态常量) */
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

/** 显隐选项（与后端 sys_menu.hidden 对齐:0-显示,1-隐藏;纯前端语义,保留静态常量) */
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

// 状态选项（enable 字典驱动:0-启用,1-禁用;value 转数字与后端 status 对齐）
const { options: enableOptions } = useDict(DICT_CODES.enable);
const statusOptions = computed<Array<OptionsType>>(() =>
  enableOptions.value.map(item => ({
    label: item.dictLabel,
    tip: item.dictLabel,
    value: Number(item.dictValue)
  }))
);

export { typeOptions, hiddenOptions, statusOptions };
