import { reactive } from "vue";
import type { FormRules } from "element-plus";

/** 自定义表单规则校验(名称/类型/日期/是否重复必填;长度上限对齐后端 AnniversaryInsertRequest 的注解) */
export const formRules = reactive(<FormRules>{
  name: [
    { required: true, message: "请输入纪念日名称", trigger: "blur" },
    { max: 128, message: "纪念日名称长度不能超过 128 位", trigger: "blur" }
  ],
  type: [
    { required: true, message: "请选择纪念日类型", trigger: "change" },
    { max: 64, message: "纪念日类型长度不能超过 64 位", trigger: "change" }
  ],
  anniversaryDate: [
    { required: true, message: "请选择纪念日日期", trigger: "change" },
    {
      validator: (rule, value, callback) => {
        // 格式校验(必填由同组 required 规则承载,对齐后端 @NotBlank + @Pattern)
        if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          callback(new Error("纪念日日期格式须为 yyyy-MM-dd"));
        } else {
          callback();
        }
      },
      trigger: "change"
    }
  ]
});
