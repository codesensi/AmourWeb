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

/** 字典类型表单(新建/重命名类型弹窗) */
interface TypeFormItemProps {
  /** 弹窗标题(新增/修改) */
  title: string;
  /** 类型 id(编辑时传入) */
  id?: string;
  /** 字典编码(修改时锁定,创建后不可改) */
  dictCode: string;
  /** 字典名称 */
  dictName: string;
  /** 备注 */
  remark: string;
}

interface TypeFormProps {
  formInline: TypeFormItemProps;
}

export type { FormItemProps, FormProps, TypeFormItemProps, TypeFormProps };
