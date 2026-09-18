interface FormItemProps {
  /** 足迹ID(编辑时透传) */
  id?: string;
  /** 用于判断是`新增`还是`修改` */
  title: string;
  /** 城市/地点名称 */
  city: string;
  /** 经度(可空;地图选点或手动录入) */
  longitude: number | null;
  /** 纬度(可空) */
  latitude: number | null;
  /** 到访日期(yyyy-MM-dd) */
  arrivalDate: string;
  /** 照片地址(站内 /file/view/{id} 或外链;保存记录时直接绑定) */
  photoUrl: string;
  /** 备注 */
  remark: string;
}

interface FormProps {
  formInline: FormItemProps;
}

export type { FormItemProps, FormProps };
