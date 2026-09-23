import { reactive } from "vue";
import type { FormRules } from "element-plus";

/** 自定义表单规则校验(记录日期/内容必填;长度上限对齐后端 DiaryInsertRequest 的注解) */
export const formRules = reactive(<FormRules>{
  diaryDate: [{ required: true, message: "请选择记录日期", trigger: "change" }],
  content: [
    { required: true, message: "请输入日记内容", trigger: "blur" },
    { max: 5000, message: "日记内容长度不能超过 5000 位", trigger: "blur" }
  ]
});
