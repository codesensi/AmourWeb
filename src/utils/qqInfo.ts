import { getQqInfo } from "@/api/portal";
import { randomAvatar } from "@/utils/avatar";

/** QQ 信息获取结果:头像地址与昵称(均可能为空串,由页面判空兜底) */
export interface QqInfoResult {
  /** QQ 头像地址(优先 /qq-info 解析地址,为空时按 avatar-service 以 QQ 号为种子拼接) */
  avatarUrl: string;
  /** QQ 昵称(仅 /qq-info 解析成功时返回,失败/缺失时为空串) */
  nickname: string;
}

/**
 * 获取 QQ 信息(入参 QQ 号,返回头像与昵称)。
 * <p>
 * 头像:优先调用后端 /qq-info 接口,返回的头像地址不为空则直接取值;
 * 为空(或请求失败)时按系统配置 avatar-service 以 QQ 号为种子拼接头像地址,
 * 同一 QQ 号每次生成的头像一致。
 * 昵称:仅来自 /qq-info,为空返回空串,由页面提示手动填写。
 * <p>
 * 内部静默降级:接口异常不抛出、不弹全局错误,avatarUrl 恒为非空
 * (avatar-service 模板缺失时进一步回退本地兜底图)。
 *
 * @param qq QQ 号
 * @param avatarService 系统配置 avatar-service 地址模板(%s 为种子)
 */
export async function fetchQqInfo(
  qq: string,
  avatarService?: string
): Promise<QqInfoResult> {
  const result: QqInfoResult = { avatarUrl: "", nickname: "" };
  try {
    const { success, data } = await getQqInfo(qq);
    if (success && data) {
      result.avatarUrl = data.avatarUrl ?? "";
      result.nickname = data.nickname ?? "";
    }
  } catch {
    // 后端不可用:昵称置空,头像走 avatar-service 兜底
  }
  if (!result.avatarUrl) {
    result.avatarUrl = randomAvatar(qq, avatarService);
  }
  return result;
}
