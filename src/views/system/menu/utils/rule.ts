import { reactive } from "vue";
import type { FormRules } from "element-plus";

/** 自定义表单规则校验（path/perms 随菜单类型条件渲染，仅渲染时校验） */
export const formRules = reactive(<FormRules>{
  title: [{ required: true, message: "菜单名称为必填项", trigger: "blur" }],
  path: [
    { required: true, message: "路由路径为必填项", trigger: "blur" },
    {
      validator: (rule, value, callback) => {
        if (!value || /^\/[A-Za-z0-9_-]+(\/[A-Za-z0-9_-]+)*$/.test(value)) {
          callback();
        } else {
          callback(new Error("路由路径需以 / 开头，仅含字母、数字、-、_"));
        }
      },
      trigger: "blur"
    }
  ],
  perms: [
    { required: true, message: "权限标识为必填项", trigger: "blur" },
    {
      validator: (rule, value, callback) => {
        if (
          !value ||
          /^[A-Za-z][A-Za-z0-9]*(?::[A-Za-z][A-Za-z0-9]*)*$/.test(value)
        ) {
          callback();
        } else {
          callback(new Error("权限标识格式如 system:menu:insert"));
        }
      },
      trigger: "blur"
    }
  ]
});
