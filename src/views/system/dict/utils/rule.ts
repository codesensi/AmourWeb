import { reactive } from "vue";
import type { FormRules } from "element-plus";

/** 自定义表单规则校验 */
export const formRules = reactive(<FormRules>{
  dictCode: [{ required: true, message: "字典编码为必填项", trigger: "blur" }],
  dictName: [{ required: true, message: "字典名称为必填项", trigger: "blur" }],
  dictValue: [{ required: true, message: "字典值为必填项", trigger: "blur" }],
  dictLabel: [{ required: true, message: "字典标签为必填项", trigger: "blur" }]
});
