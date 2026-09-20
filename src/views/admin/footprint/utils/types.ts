interface FormItemProps {
  /** 足迹ID(编辑时透传) */
  id?: string;
  /** 用于判断是`新增`还是`修改` */
  title: string;
  /** 城市/地点名称 */
  city: string;
  /** 精确地点名称(地图选点搜索选中的地点,或手动录入) */
  placeName: string;
  /** 高德服务降级标记(驱动标题行胶囊与输入提示,不参与提交) */
  degraded: boolean;
  /** 经度(可空;地图选点或手动录入) */
  longitude: number | null;
  /** 纬度(可空) */
  latitude: number | null;
  /** 到访日期(yyyy-MM-dd) */
  arrivalDate: string;
  /** 显隐标识: 0-显示, 1-隐藏(仅新增表单使用,修改经 change-hidden 端点) */
  hidden: number;
  /** 照片地址(站内 /file/view/{id} 或外链;保存记录时直接绑定) */
  photoUrl: string;
  /** 备注 */
  remark: string;
}

interface FormProps {
  formInline: FormItemProps;
}

export type { FormItemProps, FormProps };
