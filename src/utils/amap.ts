/**
 * 高德 JS API 2.0 动态加载器(全局单例)。
 * <p>
 * 管理端(MapPicker)与门户(足迹地图)共用同一份加载逻辑:
 * 安全密钥经后端代理注入(/_AMapService,jscode 不下发浏览器),前端仅设置 serviceHost;
 * 多组件共享同一加载 Promise,避免重复注入 script。
 */

/**
 * 高德经纬度对象 —— 仅声明已消费的取值方法
 */
interface AMapLngLat {
  getLng(): number;
  getLat(): number;
}

/**
 * 地图点选事件参数 —— lnglat 为 SDK 内置 LngLat 实例
 */
interface AMapMapEvent {
  lnglat: AMapLngLat;
}

/**
 * 地图实例 —— 仅声明本项目已消费的方法
 */
interface AMapMap {
  on(event: "click", handler: (event: AMapMapEvent) => void): void;
  plugin(plugins: string[], callback: () => void): void;
  setStatus(options: {
    dragEnable?: boolean;
    zoomEnable?: boolean;
    doubleClickZoom?: boolean;
  }): void;
  setZoomAndCenter(zoom: number, center: [number, number]): void;
  setFitView(
    overlays: null,
    immediate: boolean,
    padding: [number, number, number, number]
  ): void;
  getCenter(): AMapLngLat;
  getZoom(): number;
  destroy(): void;
}

/**
 * 点标记 —— 仅声明已消费的方法
 */
interface AMapMarker {
  setPosition(position: [number, number]): void;
  on(event: "click", handler: () => void): void;
}

interface AMapMarkerOptions {
  position: [number, number];
  map?: AMapMap;
  anchor?: string;
  content?: string;
}

/**
 * 逆地理编码结果 —— 仅声明已消费的字段(城市字段兼容直辖市返回的数组形态)
 */
interface AMapRegeocodeResult {
  regeocode?: {
    addressComponent?: { city?: string | string[]; province?: string };
    formattedAddress?: string;
  };
}

/**
 * POI 检索结果 —— 仅声明已消费的字段
 */
interface AMapSearchResult {
  poiList?: {
    count?: number;
    pois?: Array<{
      name: string;
      pname?: string;
      cityname?: string;
      adname?: string;
      location: AMapLngLat;
    }>;
  };
}

/**
 * 逆地理编码器 —— 仅声明已消费的方法
 */
interface AMapGeocoder {
  getAddress(
    lnglat: [number, number],
    callback: (status: string, result: AMapRegeocodeResult) => void
  ): void;
}

/**
 * POI 检索器 —— 仅声明已消费的方法
 */
interface AMapPlaceSearch {
  search(
    keyword: string,
    callback: (status: string, result: AMapSearchResult) => void
  ): void;
  setPageIndex(index: number): void;
}

/**
 * 高德 JS API 全局命名空间的最小接口面:仅声明本项目实际消费的构造器,
 * 随消费面演进按需扩展;window 上未注入时为 undefined。
 */
interface AMapGlobal {
  Map: new (
    container: HTMLElement | string,
    options?: { zoom?: number; mapStyle?: string }
  ) => AMapMap;
  Marker: new (options: AMapMarkerOptions) => AMapMarker;
  Geocoder: new () => AMapGeocoder;
  PlaceSearch: new (options: { pageSize?: number }) => AMapPlaceSearch;
}

let amapPromise: Promise<AMapGlobal> | null = null;

/** 同步读取已注入的全局 AMap 对象(SDK 未加载完成时返回 undefined) */
export function getAMapGlobal(): AMapGlobal | undefined {
  return (window as Window & { AMap?: AMapGlobal }).AMap;
}

/**
 * 加载高德 JS API 2.0。
 *
 * @param key Web端(JS API)Key(域名白名单防滥用的公开标识)
 * @returns 全局 AMap 对象
 */
export function loadAMap(key: string): Promise<AMapGlobal> {
  const w = window as Window & {
    AMap?: AMapGlobal;
    _AMapSecurityConfig?: { serviceHost: string };
  };
  if (w.AMap) return Promise.resolve(w.AMap);
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

export type {
  AMapGlobal,
  AMapMarker,
  AMapGeocoder,
  AMapPlaceSearch,
  AMapMap
};
