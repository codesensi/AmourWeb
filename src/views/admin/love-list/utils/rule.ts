import { reactive } from "vue";
import type { FormRules } from "element-plus";

/** 自定义表单规则校验(内容必填;长度上限对齐后端 LoveListInsertRequest 的注解) */
export const formRules = reactive(<FormRules>{
  content: [
    { required: true, message: "请输入清单内容", trigger: "blur" },
    { max: 256, message: "清单内容长度不能超过 256 位", trigger: "blur" }
  ]
});
