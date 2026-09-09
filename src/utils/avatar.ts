import fallbackAvatarImg from "@/assets/img/fallback-avatar.png";
import { message } from "@/utils/message";

/** 本地兜底头像:后端头像链路(/qq-info)不可用或未返回地址时的固定兜底图 */
export const fallbackAvatar = fallbackAvatarImg;

/** 上次弹出兜底提示的时间:时间窗内去重,避免批量失败时刷屏 */
let lastFallbackNotify = 0;

/**
 * 头像最终落到本地兜底图时弹出全局提示(时间窗内去重)。
 * <p>
 * 供各头像消费点(QQ 解析失败、快照缺失、图片加载失败等)统一调用;
 * 正常空态(如用户未设置头像的编辑表单)不应调用。
 */
export function notifyFallbackAvatar() {
  const now = Date.now();
  if (now - lastFallbackNotify < 3000) return;
  lastFallbackNotify = now;
  message("头像缺失或加载失败，已使用默认头像", { type: "warning" });
}
