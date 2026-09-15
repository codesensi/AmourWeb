import { reactive } from "vue";
import type { FormRules } from "element-plus";

/** 自定义表单规则校验(长度上限对齐后端 DictUpsertRequest 的 @Size) */
export const formRules = reactive(<FormRules>{
  dictCode: [{ required: true, message: "字典编码为必填项", trigger: "blur" }],
  dictName: [{ required: true, message: "字典名称为必填项", trigger: "blur" }],
  dictValue: [
    { required: true, message: "字典值为必填项", trigger: "blur" },
    { max: 128, message: "字典值长度不能超过 128 位", trigger: "blur" }
  ],
  dictLabel: [
    { required: true, message: "字典标签为必填项", trigger: "blur" },
    { max: 128, message: "字典标签长度不能超过 128 位", trigger: "blur" }
  ]
});
