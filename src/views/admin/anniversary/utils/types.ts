interface FormItemProps {
  /** 纪念日ID(编辑时透传) */
  id?: string;
  /** 用于判断是`新增`还是`修改` */
  title: string;
  /** 纪念日名称 */
  name: string;
  /** 纪念日类型(字典 anniversary-type 编码) */
  type: string;
  /** 纪念日日期(yyyy-MM-dd) */
  anniversaryDate: string;
  /** 是否每年重复 */
  repeatYearly: boolean;
  /** 排序(数字越小越靠前) */
  sort: number;
  /** 显隐标识: 0-显示, 1-隐藏(仅新增表单使用,修改经 change-hidden 端点) */
  hidden: number;
}

interface FormProps {
  formInline: FormItemProps;
}

export type { FormItemProps, FormProps };
