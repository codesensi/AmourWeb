import { reactive } from "vue";
import type { FormRules } from "element-plus";

/** 自定义表单规则校验(城市/到访日期必填;经纬度/照片/备注选填;长度与格式上限对齐后端 FootprintInsertRequest 的注解) */
export const formRules = reactive(<FormRules>{
  city: [
    { required: true, message: "请输入城市/地点名称", trigger: "blur" },
    { max: 128, message: "城市名称长度不能超过 128 位", trigger: "blur" }
  ],
  arrivalDate: [
    { required: true, message: "请选择到访日期", trigger: "change" },
    {
      validator: (rule, value, callback) => {
        // 选填:填写时才校验格式(对齐后端 @Pattern 空值放行)
        if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          callback(new Error("到访日期格式须为 yyyy-MM-dd"));
        } else {
          callback();
        }
      },
      trigger: "change"
    }
  ],
  remark: [{ max: 512, message: "备注长度不能超过 512 位", trigger: "blur" }]
});
