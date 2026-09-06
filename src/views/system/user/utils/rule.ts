import { reactive } from "vue";
import type { FormRules } from "element-plus";

/** 自定义表单规则校验 */
export const formRules = reactive(<FormRules>{
  nickname: [{ required: true, message: "用户昵称为必填项", trigger: "blur" }],
  username: [{ required: true, message: "用户名称为必填项", trigger: "blur" }],
  password: [{ required: true, message: "用户密码为必填项", trigger: "blur" }],
  qq: [
    {
      validator: (rule, value, callback) => {
        if (value === "") {
          callback();
        } else if (!/^\d{6,12}$/.test(value)) {
          callback(new Error("请输入正确的QQ号格式"));
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ]
});
