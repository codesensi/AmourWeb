import type { SysDictTypeItem } from "@/api/dict";

interface FormItemProps {
  /** 弹窗标题(新增/修改/新建类型) */
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
  /** 内置标识:1-内置,0-非内置 */
  builtin: number;
  /** 备注 */
  remark: string;
}

interface FormProps {
  formInline: FormItemProps;
  /** 字典类型选项(新建类型时可选择已有编码或创建新编码) */
  typeOptions?: Array<SysDictTypeItem>;
  /** 编码是否可编辑(仅"新建类型"时允许) */
  codeEditable?: boolean;
}

export type { FormItemProps, FormProps };
