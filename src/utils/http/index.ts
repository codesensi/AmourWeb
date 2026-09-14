import Axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type CustomParamsSerializer
} from "axios";
import type {
  PureHttpError,
  RequestMethods,
  PureHttpResponse,
  PureHttpRequestConfig
} from "./types.d";
import { stringify } from "qs";
import { message } from "@/utils/message";
import { getToken, formatToken } from "@/utils/auth";
import { useUserStoreHook } from "@/store/modules/user";
import { Code, type ApiResult } from "@/api/types";

/**
 * 401 登出去重标志:业务码 401 与 HTTP 401 两条通道、以及并发请求同时失效时,
 * 只触发一次 logOut,避免重复跳转与提示风暴(短窗口后自动复位,兼容重新登录)。
 */
let handling401 = false;
function handleUnauthorized() {
  if (handling401) return;
  handling401 = true;
  useUserStoreHook().logOut();
  setTimeout(() => (handling401 = false), 1000);
}

/** 系统级错误(5xx)提示:业务消息后附 8 位短错误码(完整 traceId 仍保留在响应体与响应头中),用户报障后凭前缀即可定位服务端全链路日志 */
function buildServerErrMsg(msg: string, traceId?: string): string {
  return traceId ? `${msg}（错误码：${traceId.slice(0, 8)}）` : msg;
}

// 相关配置请参考：www.axios-js.com/zh-cn/docs/#axios-request-config-1
const defaultConfig: AxiosRequestConfig = {
  // 请求超时时间
  timeout: 10000,
  headers: {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest"
  },
  // 数组格式参数序列化（https://github.com/axios/axios/issues/5142）
  paramsSerializer: {
    serialize: stringify as unknown as CustomParamsSerializer
  }
};

class PureHttp {
  constructor() {
    this.httpInterceptorsRequest();
    this.httpInterceptorsResponse();
  }

  /** 初始化配置对象 */
  private static initConfig: PureHttpRequestConfig = {};

  /** 保存当前`Axios`实例对象 */
  private static axiosInstance: AxiosInstance = Axios.create(defaultConfig);

  /** 请求拦截 */
  private httpInterceptorsRequest(): void {
    PureHttp.axiosInstance.interceptors.request.use(
      (config: PureHttpRequestConfig): Promise<any> => {
        // 优先判断post/get等方法是否传入回调，否则执行初始化设置等回调
        if (typeof config.beforeRequestCallback === "function") {
          config.beforeRequestCallback(config);
          return Promise.resolve(config);
        }
        if (PureHttp.initConfig.beforeRequestCallback) {
          PureHttp.initConfig.beforeRequestCallback(config);
          return Promise.resolve(config);
        }
        /** 请求白名单：无需携带`token`的接口（防止登录前请求造成死循环），全等匹配避免误伤其他以白名单结尾的路径 */
        const whiteList = ["/login", "/captcha"];
        if (whiteList.includes(config.url ?? "")) {
          return Promise.resolve(config);
        }
        /** 其余接口统一注入`Authorization` */
        const data = getToken();
        if (data?.accessToken) {
          config.headers["Authorization"] = formatToken(data.accessToken);
        }
        return Promise.resolve(config);
      },
      error => {
        return Promise.reject(error);
      }
    );
  }

  /** 响应拦截 */
  private httpInterceptorsResponse(): void {
    const instance = PureHttp.axiosInstance;
    instance.interceptors.response.use(
      (response: PureHttpResponse) => {
        const $config = response.config;
        // 优先判断post/get等方法是否传入回调，否则执行初始化设置等回调
        if (typeof $config.beforeResponseCallback === "function") {
          $config.beforeResponseCallback(response);
          return response.data;
        }
        if (PureHttp.initConfig.beforeResponseCallback) {
          PureHttp.initConfig.beforeResponseCallback(response);
          return response.data;
        }

        const res = response.data as ApiResult;
        // 非统一契约响应（如第三方接口、二进制流），原样返回
        if (!res || typeof res.success !== "boolean") {
          return res;
        }
        // 业务失败：统一提示并拒绝
        if (!res.success) {
          if (res.code === Code.UNAUTHORIZED) {
            // 与错误分支同口径:1 秒窗口去重,避免并发请求重复 logOut/跳转
            handleUnauthorized();
          }
          // 遗留兼容通道(HTTP 200 + 失败体):业务错误保持提示纯净
          message(res.msg || "请求失败", { type: "error" });
          return Promise.reject(res);
        }
        return res;
      },
      (error: PureHttpError) => {
        const $error = error;
        $error.isCancelRequest = Axios.isCancel($error);
        // 后端契约:非 2xx 时响应体仍为统一 Result 结构(GlobalExceptionHandler 已语义化 HTTP 状态码)
        const res = error.response?.data as ApiResult | undefined;
        if (res && typeof res.success === "boolean") {
          // 业务失败(4xx/5xx + Result 体):与业务码通道行为一致,统一提示并按需登出
          if (res.code === Code.UNAUTHORIZED) {
            handleUnauthorized();
          }
          // 仅系统级错误(5xx)附 8 位短错误码;4xx 业务错误用户可自救,保持提示纯净
          const isServerError = (error.response?.status ?? 0) >= 500;
          message(
            isServerError
              ? buildServerErrMsg(res.msg || "请求失败", res.traceId)
              : res.msg || "请求失败",
            { type: "error" }
          );
          return Promise.reject(res);
        }
        // 响应体非统一契约时的 HTTP 401 兜底:登录态失效,清除凭证并回到登录页
        if (error.response?.status === Code.UNAUTHORIZED) {
          handleUnauthorized();
          return Promise.reject($error);
        }
        // 网络异常/超时等非契约错误:统一提示(主动取消的请求不打扰用户)
        if (!$error.isCancelRequest) {
          message("网络异常，请稍后重试", { type: "error" });
        }
        // 所有的响应异常 区分来源为取消请求/非取消请求
        return Promise.reject($error);
      }
    );
  }

  /** 通用请求工具函数 */
  public request<T>(
    method: RequestMethods,
    url: string,
    param?: AxiosRequestConfig,
    axiosConfig?: PureHttpRequestConfig
  ): Promise<T> {
    const config = {
      method,
      url,
      ...param,
      ...axiosConfig
    } as PureHttpRequestConfig;

    return PureHttp.axiosInstance.request(config) as Promise<T>;
  }

  /** 单独抽离的`post`工具函数 */
  public post<T, P>(
    url: string,
    params?: AxiosRequestConfig<P>,
    config?: PureHttpRequestConfig
  ): Promise<T> {
    return this.request<T>("post", url, params, config);
  }

  /** 单独抽离的`get`工具函数 */
  public get<T, P>(
    url: string,
    params?: AxiosRequestConfig<P>,
    config?: PureHttpRequestConfig
  ): Promise<T> {
    return this.request<T>("get", url, params, config);
  }
}

export const http = new PureHttp();
