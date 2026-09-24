import { reactive } from "vue";
import type { FormRules } from "element-plus";

/** 自定义表单规则校验(标题/记录日期/内容必填;长度上限对齐后端 MomentsInsertRequest 的注解) */
export const formRules = reactive(<FormRules>{
  title: [
    { required: true, message: "请输入文章标题", trigger: "blur" },
    { max: 256, message: "标题长度不能超过 256 位", trigger: "blur" }
  ],
  recordDate: [
    { required: true, message: "请选择记录日期", trigger: "change" }
  ],
  content: [{ required: true, message: "请输入文章内容", trigger: "blur" }],
  category: [{ max: 64, message: "分类长度不能超过 64 位", trigger: "blur" }],
  tags: [{ max: 64, message: "标签长度不能超过 64 位", trigger: "blur" }]
});
