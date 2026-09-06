interface FormItemProps {
  /** 菜单ID（修改时传入；后端 Long 序列化为字符串） */
  id?: number | string;
  /** 菜单类型（D-目录、M-菜单、B-按钮） */
  type: "D" | "M" | "B";
  /** 父级菜单ID（0 表示根节点；后端 Long 序列化为字符串） */
  pid: number | string;
  /** 菜单名称 */
  title: string;
  /** 路由路径 */
  path: string;
  /** 组件路径 */
  component: string;
  /** 菜单排序 */
  sort: number;
  /** 菜单图标 */
  icon: string;
  /** 权限编码 */
  perms: string;
  /** 菜单状态:0-启用,1-禁用 */
  status: number;
  /** 显隐标识:0-显示,1-隐藏 */
  hidden: number;
  /** 备注 */
  remark: string;
  /** 上级菜单选项（UI 数据，不提交后端） */
  higherMenuOptions: Record<string, unknown>[];
}
interface FormProps {
  formInline: FormItemProps;
}

export type { FormItemProps, FormProps };
