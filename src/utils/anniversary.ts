import type { AnniversaryItem } from "@/api/portal";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

// 自定义格式解析插件(dayjs.extend 全局幂等;date.ts 已扩展过,此处重复扩展为防御式)
dayjs.extend(customParseFormat);

/**
 * 解析纪念日日期契约 yyyy-MM-DD(DATE 类型序列化)为本地时间 Date。
 * <p>
 * 与 {@link parseDateTime}(完整日期时间)不同,纪念日 DATE 列只有日期部分;
 * 严格按格式解析,非法/空输入返回 null,由调用侧决定降级行为。
 */
function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = dayjs(value, "YYYY-MM-DD");
  return d.isValid() ? d.toDate() : null;
}

/**
 * 计算纪念日的下一次到访倒计时(天数)。
 * <p>
 * 每年重复(`repeatYearly=true`)取今年/明年最近的月日;
 * 一次性日期仅在未来时计入;今天到期记 0。无法解析日期时返回 null。
 */
export function nextOccurrenceDays(
  item: Pick<AnniversaryItem, "anniversaryDate" | "repeatYearly">,
  from: Date = new Date()
): number | null {
  const target = parseDateOnly(item.anniversaryDate);
  if (!target) return null;
  const today = new Date(from);
  today.setHours(0, 0, 0, 0);
  const msPerDay = 24 * 60 * 60 * 1000;
  if (!item.repeatYearly) {
    // 一次性日期:仅在未来时计入
    const diff = Math.round((target.getTime() - today.getTime()) / msPerDay);
    return diff >= 0 ? diff : null;
  }
  // 每年重复:取今年/明年最近的月日
  const thisYear = new Date(
    today.getFullYear(),
    target.getMonth(),
    target.getDate()
  );
  const nextYear = new Date(
    today.getFullYear() + 1,
    target.getMonth(),
    target.getDate()
  );
  const diffThis = Math.round(
    (thisYear.getTime() - today.getTime()) / msPerDay
  );
  if (diffThis >= 0) return diffThis;
  return Math.round((nextYear.getTime() - today.getTime()) / msPerDay);
}

/** 每年重复纪念日仅取月/日的展示文案(如 06-18) */
export function anniversaryMonthDay(dateStr: string): string {
  const target = parseDateOnly(dateStr);
  if (!target) return dateStr;
  const month = String(target.getMonth() + 1).padStart(2, "0");
  const day = String(target.getDate()).padStart(2, "0");
  return `${month}-${day}`;
}
