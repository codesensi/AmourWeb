import demoAvatar from "@/assets/portal/img/demo-avatar.png";

/** 本地兜底头像:QQ 头像与 avatar-service 均不可用时的固定兜底图(演示号头像) */
export const fallbackAvatar = demoAvatar;

/** QQ 头像地址(按系统配置 qq-service 模板,%s 为 QQ 号);模板未配置时返回空串 */
export const qqAvatar = (qq: string, service?: string): string =>
  qq ? (service ?? "").replace("%s", encodeURIComponent(qq)) : "";

/** 随机头像地址(系统配置 avatar-service,参数=用户名),模板缺失时回退本地兜底图 */
export const randomAvatar = (seed: string, service?: string): string => {
  if (service && service.includes("%s")) {
    return service.replace("%s", encodeURIComponent(seed));
  }
  return fallbackAvatar;
};
