import { http } from "@/utils/http";
import type { ApiResult } from "@/api/types";

type Result = ApiResult<Array<any>>;

export const getAsyncRoutes = () => {
  return http.request<Result>("get", "/get-async-routes");
};
