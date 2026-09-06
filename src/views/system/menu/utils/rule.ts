import { reactive } from "vue";
import type { FormRules } from "element-plus";

/** 自定义表单规则校验（path/perms 随菜单类型条件渲染，仅渲染时校验） */
export const formRules = reactive(<FormRules>{
  title: [{ required: true, message: "菜单名称为必填项", trigger: "blur" }],
  path: [{ required: true, message: "路由路径为必填项", trigger: "blur" }],
  perms: [{ required: true, message: "权限标识为必填项", trigger: "blur" }]
});
