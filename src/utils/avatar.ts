import demoAvatar from "@/assets/portal/img/demo-avatar.webp";

/** 本地兜底头像:QQ 头像与 avatar-service 均不可用时的固定兜底图 */
export const fallbackAvatar = demoAvatar;

/** 随机头像地址(系统配置 avatar-service,参数=用户名),模板缺失时回退本地兜底图 */
export const randomAvatar = (seed: string, service?: string): string => {
  if (service && service.includes("%s")) {
    return service.replace("%s", encodeURIComponent(seed));
  }
  return fallbackAvatar;
};
