import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

// 自定义格式解析插件,模块级扩展一次(dayjs.extend 全局幂等)
dayjs.extend(customParseFormat);

/**
 * 解析后端日期契约 yyyy-MM-dd HH:mm:ss 为本地时间 Date。
 * <p>
 * 严格按格式解析(依赖 customParseFormat 插件),空格分隔格式在 Safari/Firefox
 * 上无法被 new Date 直接解析,统一经由本入口转换;非法/空输入返回 null,由调用侧决定降级行为。
 */
export function parseDateTime(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = dayjs(value, "YYYY-MM-DD HH:mm:ss");
  return d.isValid() ? d.toDate() : null;
}

/**
 * 锁定剩余倒计时文案(天/时/分,当天不足 1 天时省略天数)。
 * <p>
 * 后端 openTime 为空格分隔(yyyy-MM-dd HH:mm:ss),经 {@link parseDateTime}
 * 统一解析(Safari 仅认显式分隔);已到解锁时间或解析失败返回 null,由调用侧决定空态。
 *
 * @param openTime 解锁时间(yyyy-MM-dd HH:mm:ss)
 * @param now      当前时间(由调用侧的时钟驱动,便于复用同一定时器)
 */
export function countdownText(openTime: string, now: Date): string | null {
  const open = parseDateTime(openTime);
  if (!open) return null;
  const diff = Math.max(0, open.getTime() - now.getTime());
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  return days > 0
    ? `${days} 天 ${hours} 时 ${minutes} 分`
    : `${hours} 时 ${minutes} 分`;
}
