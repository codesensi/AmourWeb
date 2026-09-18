<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import PortalWorldMap, {
  type MapPoint
} from "@/components/PortalWorldMap/index.vue";
import { getSysConfig } from "@/api/sys-config";
import { loadAMap, type AMapGlobal } from "@/utils/amap";

/**
 * 门户足迹地图(策略组件):
 * - 系统配置了 security.amap-key → 渲染高德真实底图(按到访顺序 Polyline 连线 + 点标记 + 自动贴合视角);
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
/** 路径线/点强调色(与站点 rose 主题一致) */
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

/** 创建覆盖物:逐城标记 + 按到访顺序的路径折线 */
function buildOverlays(AMap: AMapGlobal, map: AMapGlobal) {
  props.points.forEach(point => {
    const marker = new AMap.Marker({
      position: [point.longitude, point.latitude],
      title: point.city,
      map
    });
    marker.on("click", () => onSelect(point));
    markers.value.push(marker);
  });
  if (props.points.length > 1) {
    new AMap.Polyline({
      path: props.points.map(point => [point.longitude, point.latitude]),
      strokeColor: trackColor,
      strokeWeight: 3,
      strokeOpacity: 0.85,
      // 实线方向箭头:体现行程推进方向
      showDir: true,
      map
    });
  }
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
