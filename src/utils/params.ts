/**
 * 剔除对象中值为空字符串/undefined/null 的字段,用于 GET 查询参数序列化。
 * axios 仅自动省略 undefined/null,空字符串会序列化为 "key=";
 * 统一剥离后,未赋值的筛选条件不再出现在请求链接上(缺字段 = 不过滤)。
 */
export const omitEmpty = <T extends object>(params?: T): T | undefined => {
  if (!params) return undefined;
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== "" && value != null)
  ) as T;
};
