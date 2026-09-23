import { reactive } from "vue";
import type { FormRules } from "element-plus";

/** 自定义表单规则校验(标题/内容/解锁时间必填;长度上限对齐后端 TimeCapsuleInsertRequest 的注解) */
export const formRules = reactive(<FormRules>{
  title: [
    { required: true, message: "请输入标题", trigger: "blur" },
    { max: 128, message: "标题长度不能超过 128 位", trigger: "blur" }
  ],
  content: [
    { required: true, message: "请输入信件内容", trigger: "blur" },
    { max: 5000, message: "信件内容长度不能超过 5000 位", trigger: "blur" }
  ],
  openTime: [{ required: true, message: "请选择解锁时间", trigger: "change" }]
});
