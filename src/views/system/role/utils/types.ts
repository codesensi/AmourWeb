// 虽然字段很少 但是抽离出来 后续有扩展字段需求就很方便了

interface FormItemProps {
  /** 弹窗类型:新增/修改(修改时角色标识禁改) */
  title?: string;
  /** 角色ID(修改时传入) */
  id?: number | string;
  /** 角色名称 */
  name: string;
  /** 角色编码 */
  code: string;
  /** 角色排序 */
  sort?: number;
  /** 备注 */
  remark: string;
}
interface FormProps {
  formInline: FormItemProps;
}

export type { FormItemProps, FormProps };
