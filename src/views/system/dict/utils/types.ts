// 字典管理表单字段(增删改共用)

interface FormItemProps {
  /** 弹窗标题(新增/修改) */
  title: string;
  /** 行 id(编辑时传入) */
  id?: string;
  /** 字典编码(内置行编辑时锁定) */
  dictCode: string;
  /** 字典名称 */
  dictName: string;
  /** 字典值(内置行编辑时锁定) */
  dictValue: string;
  /** 字典标签 */
  dictLabel: string;
  /** 排序(升序) */
  sort: number;
  /** 状态:0-启用,1-禁用 */
  status: number;
  /** 内置标识:1-内置,0-非内置 */
  builtin: number;
  /** 备注 */
  remark: string;
}

interface FormProps {
  formInline: FormItemProps;
}

export type { FormItemProps, FormProps };
