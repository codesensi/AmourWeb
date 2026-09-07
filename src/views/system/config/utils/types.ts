interface FormItemProps {
  /** 弹窗标题(修改) */
  title: string;
  /** 行 id(编辑时传入) */
  id?: string;
  /** 配置键(只读展示,由代码侧 ConfigKeyEnum 约定) */
  configKey: string;
  /** 配置值(统一字符串存储) */
  configValue: string;
  /** 值类型:STRING,INTEGER,LONG,BOOLEAN(决定配置值的编辑控件) */
  valueType: string;
  /** 分组(base/site/captcha) */
  configGroup: string;
  /** 状态:0-启用,1-禁用 */
  status: number;
  /** 备注 */
  remark: string;
}

interface FormProps {
  formInline: FormItemProps;
}

export type { FormItemProps, FormProps };
