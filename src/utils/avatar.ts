/** 默认头像(内联 SVG 占位,零依赖;第 2 期可替换为本地资产 avatar-default.png) */
const defaultAvatar =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">' +
      '<rect width="100%" height="100%" fill="#e5e7eb"/>' +
      '<circle cx="32" cy="24" r="12" fill="#94a3b8"/>' +
      '<path d="M8 64 C8 46 20 38 32 38 C44 38 56 46 56 54" fill="#94a3b8"/>' +
      "</svg>"
  );

/** 解析用户头像:avatar 为空时兜底默认头像(第八章头像专项方案) */
export function resolveUserAvatar(avatar?: string): string {
  return avatar && avatar.trim() ? avatar : defaultAvatar;
}

/** 解析门户留言头像:后端 URL || 内置字母头像(第 2 期接入) */
export function resolveCommentAvatar(avatar?: string): string {
  return avatar && avatar.trim() ? avatar : defaultAvatar;
}
