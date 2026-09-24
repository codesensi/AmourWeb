import { reactive } from "vue";
import type { FormRules } from "element-plus";

/** 自定义表单规则校验(用户昵称选填;长度上限对齐后端 UserInsertRequest 的 @Size:username/nickname 均 64) */
export const formRules = reactive(<FormRules>{
  username: [
    { required: true, message: "用户名称为必填项", trigger: "blur" },
    { max: 64, message: "用户名称长度不能超过 64 位", trigger: "blur" }
  ],
  nickname: [
    { max: 64, message: "用户昵称长度不能超过 64 位", trigger: "blur" }
  ],
  remark: [{ max: 512, message: "备注长度不能超过 512 位", trigger: "blur" }],
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
  ],
  email: [
    { max: 64, message: "邮箱长度不能超过 64 位", trigger: "blur" },
    {
      validator: (rule, value, callback) => {
        if (value === "") {
          callback();
        } else if (
          !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value)
        ) {
          callback(new Error("请输入正确的邮箱格式"));
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ]
});
