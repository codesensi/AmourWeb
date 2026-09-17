import type { ApiResult, PageQuery, PageResult } from "@/api/types";
import { http } from "@/utils/http";
import { omitEmpty } from "@/utils/params";

/** 门户分页接口工厂:统一默认分页参数(每页 6 条,与原站一致),单点维护 */
export const portalPage = <T>(url: string) => {
  return (params?: PageQuery) =>
    http.request<ApiResult<PageResult<T>>>("get", url, {
      params: omitEmpty({ pageNumber: 1, pageSize: 6, ...params })
    });
};
