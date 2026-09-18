/**
 * 高德 JS API 2.0 动态加载器(全局单例)。
 * <p>
 * 管理端(MapPicker)与门户(足迹地图)共用同一份加载逻辑:
 * 安全密钥经后端代理注入(/_AMapService,jscode 不下发浏览器),前端仅设置 serviceHost;
 * 多组件共享同一加载 Promise,避免重复注入 script。
 */

type AMapGlobal = any;

let amapPromise: Promise<AMapGlobal> | null = null;

/**
 * 加载高德 JS API 2.0。
 *
 * @param key Web端(JS API)Key(域名白名单防滥用的公开标识)
 * @returns 全局 AMap 对象
 */
export function loadAMap(key: string): Promise<AMapGlobal> {
  const w = window as any;
  if (w.AMap) return Promise.resolve(w.AMap as AMapGlobal);
  if (amapPromise) return amapPromise;
  // 安全密钥走官方推荐的代理方式:serviceHost 须在 SDK 脚本加载前置入全局,
  // SDK 的 Web 服务请求自动带上 /_AMapService 前缀,由后端转发并附加 jscode
  w._AMapSecurityConfig = { serviceHost: "/_AMapService" };
  amapPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(key)}`;
    script.onload = () => resolve(w.AMap as AMapGlobal);
    script.onerror = () => {
      amapPromise = null;
      reject(new Error("高德地图 SDK 加载失败"));
    };
    document.head.appendChild(script);
  });
  return amapPromise;
}

export type { AMapGlobal };
