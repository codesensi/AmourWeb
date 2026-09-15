import { reactive } from "vue";
import type { FormRules } from "element-plus";

/** 自定义表单规则校验（path/perms 随菜单类型条件渲染，仅渲染时校验；长度上限对齐后端 MenuUpsertRequest 的 @Size） */
export const formRules = reactive(<FormRules>{
  // pid 兜底语义:顶级菜单为 "0",清空 cascader 后拦截提交,避免后端 @NotNull 400
  pid: [{ required: true, message: "上级菜单为必填项", trigger: "change" }],
  title: [
    { required: true, message: "菜单名称为必填项", trigger: "blur" },
    { max: 256, message: "菜单名称长度不能超过 256 位", trigger: "blur" }
  ],
  component: [
    { max: 256, message: "组件路径长度不能超过 256 位", trigger: "blur" }
  ],
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
    { max: 64, message: "权限标识长度不能超过 64 位", trigger: "blur" },
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
