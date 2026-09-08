import type { SysRoleOption } from "@/api/system";

interface FormItemProps {
  /** 用户ID(后端序列化为字符串,编辑时透传) */
  id?: string;
  /** 用于判断是`新增`还是`修改` */
  title: string;
  nickname: string;
  username: string;
  /** 用户头像地址(裁剪上传后由文件服务返回) */
  avatar?: string;
  qq: string;
  /** 用户邮箱(选填,格式校验见 rule.ts) */
  email?: string;
  /** 用户性别:U-未知,M-男,F-女 */
  gender: string;
  /** 用户状态:0-启用,1-禁用 */
  status: number;
  remark: string;
}
interface FormProps {
  formInline: FormItemProps;
}

interface RoleFormItemProps {
  username: string;
  nickname: string;
  /** 角色列表选项(来自 GET /sys/role/list) */
  roleOptions: SysRoleOption[];
  /** 选中的角色列表 */
  ids: Array<string>;
}
interface RoleFormProps {
  formInline: RoleFormItemProps;
}

export type { FormItemProps, FormProps, RoleFormItemProps, RoleFormProps };
