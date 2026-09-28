interface FormItemProps {
  /** 胶囊ID(编辑时透传) */
  id?: string;
  /** 标题 */
  title: string;
  /** 信件内容(已解锁后只读,封存语义不可回改;被数据范围遮罩时为空且只读) */
  content: string;
  /** 解锁时间(yyyy-MM-dd HH:mm:ss;到点后门户可见全文) */
  openTime: string;
  /** 显隐: 0-显示, 1-隐藏 */
  hidden: number;
  /** 当前登录人是否可修改本行(数据范围策略判定,服务层回填;编辑场景透传) */
  canEdit?: boolean;
}

interface FormProps {
  formInline: FormItemProps;
}

export type { FormItemProps, FormProps };
