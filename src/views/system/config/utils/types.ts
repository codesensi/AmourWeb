interface FormItemProps {
  /** 弹窗标题(修改) */
  title: string;
  /** 行 id(编辑时传入) */
  id?: string;
  /** 配置键(只读展示,由代码侧 ConfigKeyEnum 约定) */
  configKey: string;
  /** 配置值(统一字符串存储;表单层以空串表达未配置,接口行的 null 在打开弹窗时归一化) */
  configValue: string;
  /** 值类型:STRING,INTEGER,LONG,BOOLEAN(决定配置值的编辑控件) */
  valueType: string;
  /** 分组(base/site/captcha) */
  configGroup: string;
  /** 备注 */
  remark: string;
}

interface FormProps {
  formInline: FormItemProps;
}

export type { FormItemProps, FormProps };
