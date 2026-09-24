import { reactive } from "vue";
import type { FormRules } from "element-plus";

/** 自定义表单规则校验(文案/日期必填,标签选填;长度与格式上限对齐后端 LovePhotoInsertRequest 的注解) */
export const formRules = reactive(<FormRules>{
  url: [
    { required: true, message: "请上传照片或填写照片地址", trigger: "blur" }
  ],
  caption: [
    { required: true, message: "请输入照片文案", trigger: "blur" },
    { max: 512, message: "照片文案长度不能超过 512 位", trigger: "blur" }
  ],
  dateText: [
    {
      required: true,
      validator: (rule, value, callback) => {
        if (!value) {
          callback(new Error("请选择照片日期"));
        } else if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          callback(new Error("照片日期格式须为 yyyy-MM-dd"));
        } else {
          callback();
        }
      },
      trigger: "change"
    }
  ]
});
