import { fallbackAvatar } from "@/utils/avatar";
import { fetchQqInfo } from "@/utils/qqInfo";

/** 用户展示信息入参(nickname/username/avatar/qq,均可选) */
export interface UserDisplayInput {
  /** 用户昵称 */
  nickname?: string;
  /** 用户名 */
  username?: string;
  /** 用户上传头像地址 */
  avatar?: string;
  /** 用户QQ号码 */
  qq?: string;
}

/** 用户展示信息解析结果:展示昵称与头像地址 */
export interface UserDisplay {
  /** 展示昵称(QQ 昵称 → 用户表昵称 → 用户名,均为空时为空串) */
  name: string;
  /** 头像地址(恒非空) */
  avatar: string;
}

/**
 * 解析用户展示信息(门户男女主与管理端右上角共用):
 * 昵称:QQ 昵称 → 用户表昵称 → 用户名,均为空时返回空串(不显示);
 * 头像:维护了 QQ → 走 /qq-info + avatar-service 头像链路;
 *      未维护 QQ → 用户表上传头像;都没有 → 本地兜底图
 * <p>
 * 内部静默降级:接口异常不抛出,头像地址恒为非空。
 *
 * @param info 用户资料(含 QQ 号)
 * @param avatarService 系统配置 avatar-service 地址模板(%s 为种子)
 * @param fallback 本地兜底头像(仅「未维护 QQ 且无上传头像」时使用;缺省为门户兜底图)
 */
export async function resolveUserDisplay(
  info: UserDisplayInput | null,
  avatarService?: string,
  fallback: string = fallbackAvatar
): Promise<UserDisplay> {
  if (!info) return { name: "", avatar: fallback };
  if (info.qq) {
    const qqInfo = await fetchQqInfo(info.qq, avatarService);
    return {
      name: qqInfo.nickname || info.nickname || info.username || "",
      avatar: qqInfo.avatarUrl
    };
  }
  return {
    name: info.nickname || info.username || "",
    avatar: info.avatar || fallback
  };
}
