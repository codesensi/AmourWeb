import { getQqInfo } from "@/api/portal";
import { fallbackAvatar, notifyFallbackAvatar } from "@/utils/avatar";

/** QQ 号格式校验(与后端 QqInfoRequest 的 @Pattern 对齐:6~12 位数字) */
const QQ_PATTERN = /^[0-9]{6,12}$/;

/** QQ 信息获取结果:头像地址与昵称 */
export interface QqInfoResult {
  /** QQ 头像地址(后端 /qq-info 已完成降级,恒非空;仅后端 qq-avatar 未配置时为空串) */
  avatarUrl: string;
  /** QQ 昵称(仅 qq-api 解析成功时返回,降级/缺失时为空串) */
  nickname: string;
}

/**
 * 获取 QQ 信息(入参 QQ 号,返回头像与昵称)。
 * <p>
 * 头像:后端 /qq-info 优先调用 qq-api 解析,失败时已按 qq-avatar 以 QQ 号
 * 拼接(qlogo 官方头像,同一 QQ 号头像一致);仅后端 qq-avatar 未配置时为空,
 * 此时回退本地兜底图。
 * 昵称:仅来自 qq-api,为空返回空串,由页面提示手动填写。
 * <p>
 * 内部静默降级:无效 QQ 号(不合 6~12 位数字)不发请求直接本地兜底;
 * 接口异常不抛出、不弹全局错误。
 *
 * @param qq QQ 号
 */
export async function fetchQqInfo(qq: string): Promise<QqInfoResult> {
  const result: QqInfoResult = { avatarUrl: "", nickname: "" };
  // 前置校验与后端 @Pattern 对齐:无效 qq 不发请求,避免后端 400 触发全局错误提示
  if (!QQ_PATTERN.test(qq)) {
    result.avatarUrl = fallbackAvatar;
    notifyFallbackAvatar();
    return result;
  }
  try {
    const { success, data } = await getQqInfo(qq);
    if (success && data) {
      result.avatarUrl = data.avatarUrl ?? "";
      result.nickname = data.nickname ?? "";
    }
  } catch {
    // 后端不可用:头像与昵称均为空,由调用侧兜底
  }
  if (!result.avatarUrl) {
    result.avatarUrl = fallbackAvatar;
    notifyFallbackAvatar();
  }
  return result;
}
