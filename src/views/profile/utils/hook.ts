// 个人中心共享逻辑(对齐 system/*/utils/hook.tsx 既有组织方式)
import { ElMessageBox } from "element-plus";

/** 敏感操作(改用户名/改密码)二次确认:确认返回 true,取消返回 false */
export function confirmRelogin(tip: string): Promise<boolean> {
  return ElMessageBox.confirm(tip, "系统提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
    draggable: true
  })
    .then(() => true)
    .catch(() => false);
}
