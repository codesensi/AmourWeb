<script lang="ts">
/** 地图点位(经纬度为度;坐标缺失的地点由调用方过滤) */
export interface MapPoint {
  id: string;
  city: string;
  /** 精确地点名称(详情浮层展示,与城市同名视为未录入;可为 null) */
  placeName?: string | null;
  longitude: number;
  latitude: number;
  arrivalDate: string | null;
  /** 到访备注(详情浮层展示,可为 null) */
  remark: string | null;
  /** 足迹照片(详情浮层背景,可为 null) */
  photoUrl: string | null;
}
</script>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import * as echarts from "echarts/core";
import type { ECElementEvent } from "echarts";
import { LinesChart, ScatterChart } from "echarts/charts";
import { GeoComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

const props = defineProps<{
  points: MapPoint[];
}>();

const emit = defineEmits<{ select: [point: MapPoint | null] }>();

defineOptions({ name: "PortalWorldMap" });

/* 本组件所需的图表/组件按需注册(全局注册表幂等,不与他处冲突) */
echarts.use([LinesChart, ScatterChart, GeoComponent, CanvasRenderer]);

const wrapRef = ref<HTMLDivElement | null>(null);
const mapRef = ref<HTMLDivElement | null>(null);

let chart: echarts.ECharts | null = null;

/** hover 气泡:当前悬停的城市名与点位像素位置(相对地图容器) */
const hoverCity = ref("");
const hoverPos = ref({ x: 0, y: 0 });

/** 点位 hover:定位到足迹点上方(与高德侧气泡同款形态) */
function onPointHover(params: ECElementEvent) {
  const data = params.data as { point?: MapPoint } | undefined;
  const point = data?.point;
  if (!point || !chart || params.seriesIndex == null) {
    hoverCity.value = "";
    return;
  }
  hoverCity.value = point.city;
  const pixel = chart.convertToPixel({ seriesIndex: params.seriesIndex }, [
    point.longitude,
    point.latitude
  ]);
  hoverPos.value = { x: pixel[0], y: pixel[1] };
}

/** 移开点位即隐藏,无任何残留范围 */
function onPointLeave() {
  hoverCity.value = "";
}

/* ---- 主题色:echarts 不解析 css 变量,初始化/主题切换时读取一次 ---- */
const palette = {
  rose: "#e11d48",
  line: "#eddbd7",
  ink: "#1f1f1f",
  bgDeep: "#f5efe9"
};

function refreshPalette() {
  const el = wrapRef.value;
  if (!el) return;
  const s = getComputedStyle(el);
  palette.rose = (s.getPropertyValue("--am-rose") || palette.rose).trim();
  palette.line = (s.getPropertyValue("--am-line") || palette.line).trim();
  palette.ink = (s.getPropertyValue("--am-ink") || palette.ink).trim();
  palette.bgDeep = (
    s.getPropertyValue("--am-bg-deep") || palette.bgDeep
  ).trim();
}

const themeObserver = new MutationObserver(onThemeChange);

/** 主题切换:重读调色板并按新配色刷新(echarts 不解析 CSS 变量,必须重新 setOption) */
function onThemeChange() {
  refreshPalette();
  /* 不带 center/zoom 的增量刷新:保留用户拖动后的视角 */
  refreshOption();
}

/** 初始视角:自动贴合所有足迹点的包围盒 */
function fitBounds(): { center: [number, number]; zoom: number } {
  const pts = props.points;
  if (!pts.length) return { center: [20, 25], zoom: 1.2 };
  const lons = pts.map(p => p.longitude);
  const lats = pts.map(p => p.latitude);
  const span = Math.max(
    Math.max(...lons) - Math.min(...lons),
    (Math.max(...lats) - Math.min(...lats)) * 1.7,
    12
  );
  const zoom = span > 90 ? 1.1 : span > 45 ? 1.8 : span > 22 ? 2.6 : 3.4;
  return {
    center: [
      (Math.min(...lons) + Math.max(...lons)) / 2,
      (Math.min(...lats) + Math.max(...lats)) / 2
    ],
    zoom: Math.min(zoom, 4)
  };
}

function buildOption(initial = false): echarts.EChartsCoreOption {
  const pts = props.points;

  return {
    /* 纯静态渲染:无常驻动画循环,漫游重绘成本最低 */
    animation: false,
    /* hover 城市名气泡不用 echarts tooltip(geo 系下隐藏时机不可控),
     * 改由 mouseover/mouseout 事件驱动的自绘 DOM 气泡承担,显示/隐藏完全确定 */
    geo: {
      map: "world",
      roam: true,
      scaleLimit: { min: 1, max: 20 },

      /* 初始视角只在首次设置:后续刷新不带 center/zoom,避免覆盖用户拖动后的视角 */
      ...(initial ? fitBounds() : {}),

      itemStyle: {
        /* 陆地填充页面深底色,与透明海洋(卡片底色)形成明暗对比 */
        areaColor: palette.bgDeep,
        borderColor: palette.line,
        borderWidth: 1
      },
      emphasis: { disabled: true },
      select: { disabled: true }
    },
    series: [
      {
        id: "cn-borders",
        type: "lines",
        coordinateSystem: "geo",
        silent: true,
        polyline: true,
        lineStyle: { color: palette.line, width: 0.8, opacity: 0.9 },
        data:
          cnBordersVisible && chinaBoundaries
            ? chinaBoundaries.map(coords => ({ coords }))
            : []
      },
      {
        /* 全部足迹点同款圆点(rose + 白边),与高德侧形态一致 */
        type: "scatter",
        coordinateSystem: "geo",
        symbolSize: 12,
        itemStyle: {
          color: palette.rose,
          borderColor: "rgb(255 251 245 / 90%)",
          borderWidth: 2
        },
        data: pts.map(p => ({
          value: [p.longitude, p.latitude],
          name: p.city,
          point: p
        }))
      }
    ]
  };
}

function onChartClick(params: ECElementEvent) {
  /* 仅旅程点位响应点击;地图空白/拖拽不产生任何行为 */
  const data = params.data as { point?: MapPoint } | undefined;
  if (data?.point) emit("select", data.point);
}

/** 用户是否已手动漫游过:交互前数据更新会重新贴合视角,交互后保留用户视角 */
let userInteracted = false;

function refreshOption() {
  /* 未交互时随数据重新贴合足迹点;交互后不再带 center/zoom,保留用户当前视角 */
  chart?.setOption(buildOption(!userInteracted));
}

/** 鼠标按住拖拽中移出画布时,合成一次 pointerup 结束漫游,
 * 地图停在鼠标离开的位置,而不是持续跟随画布外的鼠标 */
function onCanvasLeave(e: PointerEvent) {
  /* 未按下鼠标时的普通移入移出无需处理 */
  if (e.buttons === 0) return;
  const canvas = mapRef.value?.querySelector("canvas");
  if (!canvas) return;
  canvas.dispatchEvent(
    new PointerEvent("pointerup", {
      bubbles: true,
      pointerId: e.pointerId,
      isPrimary: true,
      clientX: e.clientX,
      clientY: e.clientY,
      buttons: 0
    })
  );
}

function resetView() {
  /* 显式回到初始视角 */
  userInteracted = true;
  chart?.setOption({ geo: { ...fitBounds() } });
}

async function loadMapData(): Promise<
  Parameters<typeof echarts.registerMap>[1]
> {
  const res = await fetch(`${import.meta.env.BASE_URL}map/world.json`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as Parameters<typeof echarts.registerMap>[1];
}

/** 中国省界线数据(懒加载,世界视角下不显示,放大后叠加显示) */
let chinaBoundaries: number[][][] | null = null;
let cnBordersVisible = false;
let borderTimer = 0;
const CN_BORDER_ZOOM = 3;

async function loadBoundaries() {
  const res = await fetch(
    `${import.meta.env.BASE_URL}map/china-boundaries.json`
  );
  if (!res.ok) return;
  chinaBoundaries = (await res.json()) as number[][][];
}

/** 漫游结束后按当前缩放级别切换省界线显隐(跨越阈值才触发一次完整重建) */
function syncCnBorders() {
  window.clearTimeout(borderTimer);
  borderTimer = window.setTimeout(() => {
    if (!chart || !chinaBoundaries) return;
    const opt = chart.getOption() as { geo?: { zoom?: number }[] };
    const visible = (opt.geo?.[0]?.zoom ?? 1) >= CN_BORDER_ZOOM;
    if (visible !== cnBordersVisible) {
      cnBordersVisible = visible;
      /* 走完整重建而非对单条 series 部分更新,规避 polyline data 增量替换的边缘问题 */
      refreshOption();
    }
  }, 150);
}

let resizeObserver: ResizeObserver | null = null;

onMounted(async () => {
  refreshPalette();
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-amour-theme"]
  });

  try {
    const worldGeo = await loadMapData();
    echarts.registerMap("world", worldGeo);
    if (!mapRef.value) return;

    /* devicePixelRatio 降为 1:大幅减少大画布漫游时的重绘量 */
    chart = echarts.init(mapRef.value, null, { devicePixelRatio: 1 });
    chart.setOption(buildOption(true));
    chart.on("click", onChartClick);
    /* 自绘 hover 气泡:mouseover/mouseout 事件驱动,隐藏时机确定 */
    chart.on("mouseover", onPointHover);
    chart.on("mouseout", onPointLeave);
    chart.on("georoam", () => {
      userInteracted = true;
      syncCnBorders();
      /* 漫游后点位像素位置变化,气泡先隐藏避免错位 */
      onPointLeave();
    });
  } catch {
    // 静默降级:地图数据不可用时保持空容器
  }

  /* 省界线懒加载:就绪后按当前缩放级别决定是否显示 */
  loadBoundaries().then(() => syncCnBorders());

  /* KeepAlive 摘离 DOM 的瞬间容器尺寸为 0,echarts 在 0 尺寸上重建坐标系
   * 会导致变换矩阵不可逆(空指针 TypeError),故离屏/零尺寸时跳过 resize */
  resizeObserver = new ResizeObserver(entries => {
    const hasSize = entries.some(e => e.contentRect.width > 0 && e.contentRect.height > 0);
    if (!hasSize || !wrapRef.value?.isConnected) return;
    chart?.resize();
  });
  if (wrapRef.value) resizeObserver.observe(wrapRef.value);
});

onBeforeUnmount(() => {
  chart?.dispose();
  chart = null;
  resizeObserver?.disconnect();
  themeObserver.disconnect();
});

watch(
  () => props.points,
  () => refreshOption()
);
</script>

<template>
  <!-- 点击不冒泡:地图区域内的点击属于地图交互,不应触发卡片链接跳转 -->
  <div ref="wrapRef" class="map-wrap" @click.stop>
    <div
      ref="mapRef"
      class="map-canvas"
      role="img"
      :aria-label="`足迹世界地图:已到访 ${points.length} 座城市`"
      @pointerleave="onCanvasLeave"
    />
    <!-- 自绘 hover 城市名气泡:点上方居中,pointer-events 关闭避免遮挡交互 -->
    <div
      v-show="hoverCity"
      class="map-tip"
      :style="{ left: `${hoverPos.x}px`, top: `${hoverPos.y}px` }"
    >
      {{ hoverCity }}
    </div>
    <button type="button" class="map-reset" @click.stop="resetView">
      重置视角
    </button>
  </div>
</template>

<style scoped>
.map-wrap {
  position: relative;
  width: 100%;
  height: 100%;
}

.map-canvas {
  width: 100%;
  height: 100%;

  /* 水平拖拽漫游,垂直手势留给页面滚动(触屏) */
  touch-action: pan-y;
  cursor: grab;

  /* 独立合成层:画布变换与卡片阴影/位移互不干扰 */
  transform: translateZ(0);
}

.map-reset {
  position: absolute;
  right: 12px;
  bottom: 12px;
  z-index: 3;
  padding: 4px 10px;
  font-size: var(--am-text-xs);
  color: var(--am-ink-secondary);
  cursor: pointer;
  background: var(--am-card);
  border: 1px solid var(--am-line);
  border-radius: calc(var(--am-radius) - 6px);
}

.map-reset:hover {
  color: var(--am-ink);
}

/* 自绘 hover 城市名气泡:与高德侧圆点气泡同款(深色半透明底白字,点上方居中) */
.map-tip {
  position: absolute;
  z-index: 2;
  padding: 3px 10px;
  font-size: 12px;
  color: #fff;
  white-space: nowrap;
  pointer-events: none;
  background: rgb(15 18 25 / 85%);
  border-radius: 6px;
  transform: translate(-50%, calc(-100% - 8px));
}

.map-reset:focus-visible {
  outline: 2px solid var(--am-rose);
  outline-offset: 2px;
}
</style>
