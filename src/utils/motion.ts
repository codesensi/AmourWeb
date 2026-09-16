/** 动效偏好与滚动工具:统一 reduced-motion 探测,避免各页重复 matchMedia */

/** 是否偏好减少动态(一次性读取;CSS 层动画由各组件的媒体查询自行降级) */
export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** 回到页首:默认平滑滚动,减少动态偏好时瞬时定位 */
export function scrollToTop(): void {
  window.scrollTo({
    top: 0,
    behavior: prefersReducedMotion() ? "auto" : "smooth"
  });
}
