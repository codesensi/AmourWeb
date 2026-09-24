interface FormItemProps {
  /** 文章ID(编辑时透传) */
  id?: string;
  /** 文章标题 */
  title: string;
  /** 记录日期(yyyy-MM-dd) */
  recordDate: string;
  /** 文章分类(自由输入) */
  category: string;
  /** 文章标签(逗号分隔,自由输入) */
  tags: string;
  /** 排序(数字越小越靠前) */
  sort: number;
  /** 状态(0-显示,1-隐藏) */
  status: number;
  /** 文章内容(富文本 HTML) */
  content: string;
}

interface FormProps {
  formInline: FormItemProps;
}

export type { FormItemProps, FormProps };
