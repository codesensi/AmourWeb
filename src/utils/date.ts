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
