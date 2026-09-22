interface FormItemProps {
  /** 清单项ID(编辑时透传) */
  id?: string;
  /** 用于判断是`新增`还是`修改` */
  title: string;
  /** 清单内容 */
  content: string;
  /** 完成状态: 0-未完成, 1-已完成(新增与修改均可在表单维护) */
  done: number;
  /** 纪念照地址(完成项可选,上传后由文件服务返回) */
  photo: string;
  /** 排序(数字越小越靠前) */
  sort: number;
  /** 显隐: 0-显示, 1-隐藏 */
  hidden: number;
}

interface FormProps {
  formInline: FormItemProps;
}

export type { FormItemProps, FormProps };
