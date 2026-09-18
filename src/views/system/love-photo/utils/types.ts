interface FormItemProps {
  /** 照片ID(编辑时透传) */
  id?: string;
  /** 用于判断是`新增`还是`修改` */
  title: string;
  /** 照片地址(上传后由文件服务返回) */
  url: string;
  /** 照片文案 */
  caption: string;
  /** 照片日期(yyyy-MM-dd) */
  dateText: string;
  /** 照片标签集合(后端逗号分隔存储的表单态数组) */
  tags: Array<string>;
  /** 排序(数字越小越靠前) */
  sort: number;
  /** 显隐: 0-显示, 1-隐藏(仅新增表单使用,修改经 change-hidden 端点) */
  hidden: number;
}

interface FormProps {
  formInline: FormItemProps;
}

export type { FormItemProps, FormProps };
