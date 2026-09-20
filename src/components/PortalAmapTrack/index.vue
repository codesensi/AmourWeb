<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import PortalWorldMap, {
  pointLabel,
  type MapPoint
} from "@/components/PortalWorldMap/index.vue";
import { getSysConfig } from "@/api/sys-config";
import { loadAMap, type AMapGlobal } from "@/utils/amap";

/**
 * 门户足迹地图(策略组件):
 * - 系统配置了 security.amap-key → 渲染高德真实底图(逐足迹圆点标记 + hover 点位名气泡 + 自动贴合视角);
 * - 未配置 key 或 SDK 加载失败 → 自动回退 echarts 自绘世界地图(PortalWorldMap),门户零感知。
 * 点位交互与既有契约一致:点击点位 emit select,详情浮层由调用方渲染。
 */
const props = defineProps<{
  points: MapPoint[];
}>();

const emit = defineEmits<{ select: [point: MapPoint | null] }>();

defineOptions({ name: "PortalAmapTrack" });

/** 渲染策略:loading-配置检测中;amap-高德底图;echarts-自绘世界地图回退 */
const mode = ref<"loading" | "amap" | "echarts">("loading");

const containerEl = ref<HTMLElement>();
const mapInstance = ref<AMapGlobal | null>(null);
/** 点标记集合(重建/销毁时统一清理) */
const markers = ref<Array<AMapGlobal>>([]);
/** 地点圆点强调色(与站点 rose 主题一致) */
const trackColor = "#e11d48";

/** 主题切换前的视角(重建地图后恢复,避免跳回默认) */
let lastView: { center: [number, number]; zoom: number } | null = null;

/** 依站点主题取高德内置地图样式:暗色→dark,浅色→normal(底图随主题,保证文字对比度) */
function resolveMapStyle(): string {
  return document.documentElement.getAttribute("data-amour-theme") === "dark"
    ? "amap://styles/dark"
    : "amap://styles/normal";
}

/** 点击点位:转发给调用方的详情浮层 */
function onSelect(point: MapPoint) {
  emit("select", point);
}

/** HTML 转义(城市名进入覆盖物 content 的属性,防注入) */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 创建覆盖物:逐足迹圆点标记(hover 气泡优先显示精确地点名,回落城市名) */
function buildOverlays(AMap: AMapGlobal, map: AMapGlobal) {
  props.points.forEach(point => {
    const marker = new AMap.Marker({
      position: [point.longitude, point.latitude],
      anchor: "center",
      content: `<span class="amap-track-dot" data-label="${escapeHtml(pointLabel(point))}"></span>`,
      map
    });
    marker.on("click", () => onSelect(point));
    markers.value.push(marker);
  });
}

/** 销毁地图实例(覆盖物随实例一并释放) */
function destroyMap() {
  markers.value = [];
  mapInstance.value?.destroy?.();
  mapInstance.value = null;
}

/**
 * 创建/重建地图。主题切换也走这里而非 setMapStyle:
 * 高德 2.0 的运行时换肤存在 Worker postMessage DataCloneError 报错且重绘延迟高,
 * 重建实例可复用瓦片缓存,更快更稳。
 */
function initMap() {
  const AMap = (window as any).AMap as AMapGlobal;
  if (!containerEl.value || !AMap) return;
  destroyMap();
  const map = new AMap.Map(containerEl.value, {
    zoom: 4,
    mapStyle: resolveMapStyle()
  });
  mapInstance.value = map;
  buildOverlays(AMap, map);
  if (lastView) {
    // 主题切换重建:恢复用户当前视角
    map.setZoomAndCenter(lastView.zoom, lastView.center);
  } else {
    // 首次创建:自动贴合全部足迹点(含路径与标记),四周留白
    map.setFitView(null, false, [60, 60, 60, 60]);
  }
  mode.value = "amap";
}

/** 主题切换:记录当前视角后重建底图 */
function onThemeChange() {
  if (mode.value !== "amap" || !mapInstance.value) return;
  const center = mapInstance.value.getCenter();
  lastView = {
    center: [center.getLng(), center.getLat()],
    zoom: mapInstance.value.getZoom()
  };
  initMap();
}

const themeObserver = new MutationObserver(onThemeChange);

onMounted(async () => {
  try {
    // key 为公开标识(域名白名单防滥用);安全密钥 jscode 经 /_AMapService 后端代理注入,不下发浏览器
    const res = await getSysConfig(["security.amap-key"]);
    if (!res.success) {
      mode.value = "echarts";
      return;
    }
    const key =
      res.data.find(item => item.configKey === "security.amap-key")?.configValue ??
      "";
    if (!key) {
      mode.value = "echarts";
      return;
    }
    await loadAMap(key);
    // 容器在 loading 态即已渲染,此处直接初始化
    initMap();
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-amour-theme"]
    });
  } catch {
    mode.value = "echarts";
  }
});

onBeforeUnmount(() => {
  // 组件随页面销毁:释放地图实例避免瓦片任务残留
  themeObserver.disconnect();
  destroyMap();
});
</script>

<template>
  <div class="relative h-full w-full">
    <!-- 高德容器:配置检测期间即渲染(可见),确保地图初始化时容器有尺寸 -->
    <div v-if="mode !== 'echarts'" ref="containerEl" class="h-full w-full" />
    <!-- 无 key / SDK 加载失败:回退 echarts 自绘世界地图 -->
    <PortalWorldMap
      v-if="mode === 'echarts'"
      :points="props.points"
      @select="point => emit('select', point)"
    />
  </div>
</template>

<style>
/* 高德覆盖物 content 由地图动态创建,无法走 scoped:类名加 amap-track- 前缀避免全局污染 */
.amap-track-dot {
  position: relative;
  display: block;
  width: 12px;
  height: 12px;
  cursor: pointer;
  background: #e11d48;
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow: 0 1px 4px rgb(0 0 0 / 30%);
}

/* hover 点位名气泡:attr 读取标记 data-label(精确地点名,回落城市名),单实例无 JS 状态 */
.amap-track-dot::after {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  padding: 3px 10px;
  font-size: 12px;
  color: #fff;
  white-space: nowrap;
  pointer-events: none;
  content: attr(data-label);
  background: rgb(15 18 25 / 85%);
  border-radius: 6px;
  opacity: 0;
  transform: translateX(-50%);
  transition: opacity 0.15s;
}

.amap-track-dot:hover::after {
  opacity: 1;
}
</style>
