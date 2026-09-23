interface FormItemProps {
  /** 日记ID(编辑时透传) */
  id?: string;
  /** 记录日期(yyyy-MM-dd) */
  diaryDate: string;
  /** 心情标识(sunny/rainy/starry;空串=不标记) */
  mood: string;
  /** 日记内容 */
  content: string;
}

interface FormProps {
  formInline: FormItemProps;
}

export type { FormItemProps, FormProps };
