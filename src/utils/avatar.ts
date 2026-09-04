import { reactive } from "vue";

/** 头像降级阶段:QQ 头像 → avatar-service → 本地生成 */
export const AvatarStage = {
  /** QQ 头像(服务地址取系统配置 qq-service) */
  QQ: 0,
  /** 系统配置 avatar-service 随机头像(参数=用户名) */
  RANDOM: 1,
  /** 本地生成兜底(首字符 + 确定性底色,无网络请求) */
  LOCAL: 2
} as const;

/** 头像服务地址模板集合(sys_config 下发) */
export interface AvatarServiceOptions {
  /** QQ 头像服务地址模板(%s 为 QQ 号) */
  qqService?: string;
  /** 随机头像服务地址模板(%s 为用户名/种子) */
  avatarService?: string;
}

/** QQ 头像地址(按系统配置 qq-service 模板,%s 为 QQ 号);模板未配置时返回空串 */
export const qqAvatar = (qq: string, service?: string): string =>
  qq ? (service ?? "").replace("%s", encodeURIComponent(qq)) : "";

/** 随机头像地址(系统配置 avatar-service,参数=用户名),模板缺失时回退本地生成 */
export const randomAvatar = (seed: string, service?: string): string => {
  if (service && service.includes("%s")) {
    return service.replace("%s", encodeURIComponent(seed));
  }
  return localAvatar(seed);
};

/** 本地生成头像:QQ 头像不可用时的兜底方案(首字符 + 确定性底色,无网络请求) */
export const localAvatar = (seed: string, size = 100): string => {
  const text = (seed ?? "").trim();
  let hash = 0;
  for (const ch of text) hash = (hash * 31 + ch.charCodeAt(0)) % 360;
  const initial = text ? text.charAt(0).toUpperCase() : "?";
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
    `<rect width="100%" height="100%" fill="hsl(${hash}, 60%, 62%)"/>` +
    `<text x="50%" y="50%" dy="0.36em" text-anchor="middle" fill="#fff" font-size="${Math.round(size * 0.4)}" font-family="sans-serif">${initial}</text></svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
};

/** 按降级阶段取头像地址:0=QQ 头像 1=随机头像(avatar-service) 2=本地生成;模板缺失时自动降级下一阶段 */
export const avatarByStage = (
  qq: string,
  seed: string,
  stage: number,
  services?: AvatarServiceOptions
): string => {
  if (stage >= AvatarStage.LOCAL) return localAvatar(seed);
  if (stage >= AvatarStage.RANDOM) {
    return randomAvatar(seed, services?.avatarService);
  }
  const template = services?.qqService;
  if (!template) return randomAvatar(seed, services?.avatarService);
  return template.replace("%s", encodeURIComponent(qq));
};

/**
 * 通用头像降级组合式:管理各头像键的降级阶段。
 * <p>
 * 每个头像键(任意唯一字符串)独立记录降级阶段,加载失败时调用
 * {@link useAvatarStages.markError | markError} 逐级降级:
 * QQ 头像(qq-service 模板)→ avatar-service(用户名)→ 本地生成。
 *
 * @param services 头像服务地址模板的响应式取值(通常源自 sys_config)
 */
export function useAvatarStages(
  services: () => AvatarServiceOptions | undefined
) {
  const stages = reactive<Record<string, number>>({});

  /** 指定键当前的降级阶段 */
  const stageOf = (key: string): number => stages[key] ?? AvatarStage.QQ;

  /**
   * 指定键的头像地址
   *
   * @param key  头像键(同一键共享降级状态)
   * @param qq   QQ 号(阶段 0 使用)
   * @param seed 用户名/种子(阶段 1、2 使用)
   */
  const avatarOf = (key: string, qq: string, seed: string): string =>
    avatarByStage(qq, seed, stageOf(key), services());

  /** 头像加载失败:降级到下一阶段(封顶本地生成) */
  const markError = (key: string) => {
    stages[key] = Math.min(stageOf(key) + 1, AvatarStage.LOCAL);
  };

  /** 重置降级阶段:有 key 时仅重置该键,缺省重置全部 */
  const reset = (key?: string) => {
    if (key) {
      delete stages[key];
    } else {
      Object.keys(stages).forEach(key => delete stages[key]);
    }
  };

  return { avatarOf, markError, reset };
}
