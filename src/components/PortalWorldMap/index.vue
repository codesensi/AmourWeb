<script lang="ts">
/** 地图点位(经纬度为度;坐标缺失的地点由调用方过滤) */
export interface MapPoint {
  id: number;
  city: string;
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

const themeObserver = new MutationObserver(refreshPalette);

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

  /* 相邻到访地点两两连线 */
  const linesData: { coords: number[][] }[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    linesData.push({
      coords: [
        [pts[i].longitude, pts[i].latitude],
        [pts[i + 1].longitude, pts[i + 1].latitude]
      ]
    });
  }

  /* 最新到访点用大一号白边点强调 */
  const last = pts.length ? pts[pts.length - 1] : null;

  return {
    /* 纯静态渲染:无常驻动画循环,漫游重绘成本最低 */
    animation: false,
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
        type: "lines",
        coordinateSystem: "geo",
        lineStyle: {
          color: palette.rose,
          width: 1.5,
          opacity: 0.75,
          curveness: 0.2
        },
        data: linesData
      },
      {
        type: "scatter",
        coordinateSystem: "geo",
        symbolSize: 9,
        itemStyle: { color: palette.rose },
        label: {
          show: true,
          position: "right",
          distance: 6,
          formatter: (p: { name: string }) => p.name,
          color: palette.ink,
          fontSize: 11
        },
        labelLayout: { hideOverlap: true },
        data: pts
          .filter(p => p.id !== last?.id)
          .map(p => ({
            value: [p.longitude, p.latitude],
            name: p.city,
            point: p
          }))
      },
      {
        type: "scatter",
        coordinateSystem: "geo",
        symbolSize: 13,
        itemStyle: {
          color: palette.rose,
          borderColor: "rgb(255 251 245 / 90%)",
          borderWidth: 2
        },
        label: {
          show: true,
          position: "right",
          distance: 6,
          formatter: (p: { name: string }) => p.name,
          color: palette.ink,
          fontSize: 12,
          fontWeight: 700
        },
        labelLayout: { hideOverlap: true },
        data: last
          ? [
              {
                value: [last.longitude, last.latitude],
                name: last.city,
                point: last
              }
            ]
          : []
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
let cnBordersVisible: boolean | null = null;
let borderTimer = 0;
const CN_BORDER_ZOOM = 3;

async function loadBoundaries() {
  const res = await fetch(
    `${import.meta.env.BASE_URL}map/china-boundaries.json`
  );
  if (!res.ok) return;
  chinaBoundaries = (await res.json()) as number[][][];
}

/** 漫游结束后按当前缩放级别切换省界线显隐 */
function syncCnBorders() {
  window.clearTimeout(borderTimer);
  borderTimer = window.setTimeout(() => {
    if (!chart || !chinaBoundaries) return;
    const opt = chart.getOption() as { geo?: { zoom?: number }[] };
    const visible = (opt.geo?.[0]?.zoom ?? 1) >= CN_BORDER_ZOOM;
    if (visible !== cnBordersVisible) {
      cnBordersVisible = visible;
      chart.setOption({
        series: [
          {
            id: "cn-borders",
            data: visible ? chinaBoundaries.map(coords => ({ coords })) : []
          }
        ]
      });
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
    chart.on("georoam", () => {
      userInteracted = true;
      syncCnBorders();
    });
  } catch {
    // 静默降级:地图数据不可用时保持空容器
  }

  /* 省界线懒加载:就绪后按当前缩放级别决定是否显示 */
  loadBoundaries().then(() => syncCnBorders());

  resizeObserver = new ResizeObserver(() => chart?.resize());
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

.map-reset:focus-visible {
  outline: 2px solid var(--am-rose);
  outline-offset: 2px;
}
</style>
