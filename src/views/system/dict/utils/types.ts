interface FormItemProps {
  /** 弹窗标题(新增/修改) */
  title: string;
  /** 行 id(编辑时传入) */
  id?: string;
  /** 字典编码(非"新建类型"时固定为选中类型) */
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
  /** 是否内置:1-是,0-否 */
  builtin: number;
  /** 备注 */
  remark: string;
}

interface FormProps {
  formInline: FormItemProps;
}

export type { FormItemProps, FormProps };
