<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { getSysConfig } from "@/api/sys-config";
import { loadAMap, type AMapGlobal } from "@/utils/amap";
import { cityLevels } from "@/utils/city-levels";

/**
 * 高德地图选点(footprint 表单专用)
 * - key/安全密钥取自系统配置(security.amap-key / security.amap-code,经免登录配置接口下发);
 * - 搜索(PlaceSearch,结果必带坐标)与点选地图均可回填坐标,并以逆地理编码反查城市名供表单一并填充;
 * - 未配置 key 或 SDK 加载失败时进入本地模式:输入城市名由内置城市表(市/区县)匹配坐标,经纬度输入框始终可用(手动录入兜底)。
 */

interface Props {
  /** 经度(GCJ-02;v-model:longitude) */
  longitude: number | null;
  /** 纬度(可空;v-model:latitude) */
  latitude: number | null;
  /** 选中城市(选点后反查回填;v-model:city) */
  city: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:longitude": [value: number | null];
  "update:latitude": [value: number | null];
  "update:city": [value: string];
}>();

/** 配置/加载过程中的错误提示(无 key 等降级场景) */
const tip = ref("");

const searchText = ref("");
const mapEl = ref<HTMLElement>();
const searching = ref(false);
/** 高德服务降级标记(服务探测失败或检索失败后置位,成功后复位) */
const serviceDegraded = ref(false);
/** 当前使用的高德 key(服务可用性探测用) */
const amapKey = ref("");
/** 候选滚动容器(触底加载下一页) */
const listScrollRef = ref<HTMLElement>();
/** 键盘导航高亮索引(-1 = 未选中) */
const activeIndex = ref(-1);
/** 高德分页游标:当前页(0 起计数)与命中总数 */
let pageIndex = 0;
let totalCount = 0;
/** 分页加载防重入 */
let loadingMore = false;
/** 组件根容器(点击外部关闭候选的边界) */
const rootRef = ref<HTMLElement>();

/** 城市文本框双向绑定(手动输入兜底) */
const cityModel = computed({
  get: () => props.city,
  set: value => emit("update:city", value)
});

/* ---------------- 地图初始化与选点 ---------------- */

const mapInstance = ref<AMapGlobal | null>(null);
const markerInstance = ref<AMapGlobal | null>(null);
/** 地图 API 就绪后的插件句柄 */
const geocoder = ref<AMapGlobal | null>(null);
const placeSearch = ref<AMapGlobal | null>(null);
/** 搜索候选(PlaceSearch 结果必带 location 坐标) */
const suggestList = ref<
  Array<{ name: string; district: string; lng: number; lat: number }>
>([]);
/** 搜索选择后抑制"点击地图拾取"的重复回填 */
const suppressPick = ref(false);
/** 搜索请求序号(防竞态:仅采纳最后一次响应) */
let searchSeq = 0;

/** 按坐标落点并居中(选点/回显共用) */
function placeMarker(lng: number, lat: number) {
  if (!mapInstance.value) return;
  const AMap = (window as any).AMap as AMapGlobal;
  if (markerInstance.value) {
    markerInstance.value.setPosition([lng, lat]);
  } else {
    markerInstance.value = new AMap.Marker({
      position: [lng, lat],
      map: mapInstance.value
    });
  }
  mapInstance.value.setZoomAndCenter(14, [lng, lat]);
}

/**
 * 点选/搜索选中后的统一回填:更新坐标并反查城市名。
 *
 * @param overwriteCity 搜索选中时为 true(用户明确指定地点,城市总是覆盖);
 *                      点击地图为 false(仅城市为空时回填,不覆盖手动输入)
 */
function pickPoint(lng: number, lat: number, overwriteCity = false) {
  placeMarker(lng, lat);
  emit("update:longitude", Number(Number(lng).toFixed(6)));
  emit("update:latitude", Number(Number(lat).toFixed(6)));
  if (!geocoder.value) return;
  geocoder.value.getAddress([lng, lat], (status: string, result: any) => {
    if (status !== "complete" || !result?.regeocode) return;
    const component = result.regeocode.addressComponent ?? {};
    // 直辖市反查返回空数组 city,回退省名(空数组为真值,须按字符串类型判定)
    const pickedCity =
      (typeof component.city === "string" && component.city) ||
      (typeof component.province === "string" ? component.province : "");
    if (pickedCity && (overwriteCity || !props.city)) {
      emit("update:city", pickedCity.replace(/市$/, ""));
    }
  });
}

/** 搜索框选中候选:候选结果必带坐标,直接落点居中并回填表单 */
function onSuggestSelect(item: {
  name: string;
  district: string;
  lng: number;
  lat: number;
  city?: string;
}) {
  searchText.value = item.name;
  suggestList.value = [];
  activeIndex.value = -1;
  if (item.city) {
    // 本地城市表回退候选:城市已知,直接回填,无需逆地理(服务不可用时逆地理必然失败)
    placeMarker(item.lng, item.lat);
    emit("update:longitude", Number(Number(item.lng).toFixed(6)));
    emit("update:latitude", Number(Number(item.lat).toFixed(6)));
    emit("update:city", item.city);
    return;
  }
  pickPoint(item.lng, item.lat, true);
}

onMounted(async () => {
  try {
    // key 为公开标识(域名白名单防滥用);安全密钥 jscode 经 /_AMapService 后端代理注入,不下发浏览器
    const res = await getSysConfig(["security.amap-key"]);
    if (!res.success) return;
    const key = res.data.find(item => item.configKey === "security.amap-key")?.configValue ?? "";
    if (!key) {
      tip.value =
        "未配置高德地图 Key(系统配置 security.amap-key),可输入城市名自动匹配坐标";
      // 后台预取区县数据包,输入联想更流畅
      ensureDistricts();
      return;
    }
    amapKey.value = key;
    const AMap = await loadAMap(key);
    tip.value = "";
    // 异步探测服务可用性:失败仅提示,不阻塞地图初始化
    void probeService();
    // 对齐高德官方默认视角(不传 center/zoom:北京为心的全国概览);编辑回显由下方 placeMarker 接管
    const map = new AMap.Map(mapEl.value);
    mapInstance.value = map;
    map.on("click", (event: any) => {
      if (suppressPick.value) return;
      // 点选是明确的位置意图,城市总是更新为所点位置(与搜索候选选中行为一致)
      pickPoint(event.lnglat.getLng(), event.lnglat.getLat(), true);
    });
    map.plugin(["AMap.Geocoder", "AMap.PlaceSearch"], () => {
      geocoder.value = new AMap.Geocoder();
      placeSearch.value = new AMap.PlaceSearch({ pageSize: 25 });
      // 编辑回显:已有坐标时定位到存量点
      if (props.longitude != null && props.latitude != null) {
        placeMarker(props.longitude, props.latitude);
      }
    });
  } catch {
    tip.value = "地图加载失败,可输入城市名自动匹配坐标";
    ensureDistricts();
  }
  document.addEventListener("pointerdown", onDocPointerDown);
});

/** 服务可用性探测:经 SDK 的逆地理通道(与真实点选同源),校验安全密钥与代理链路是否就绪 */
async function probeService() {
  try {
    const AMap = await loadAMap(amapKey.value);
    let done = false;
    // 兜底超时:SDK 服务请求挂起时按降级处理
    const timer = window.setTimeout(() => {
      serviceDegraded.value = true;
    }, 5000);
    // 固定探测点(北京市中心),任何有效配置下都能成功反查
    new AMap.Geocoder().getAddress([116.397, 39.909], (status: string) => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      serviceDegraded.value = status !== "complete";
    });
  } catch {
    serviceDegraded.value = true;
  }
}

/** 搜索:PlaceSearch POI 检索,候选滚动触底分页加载;失败时回退内置城市表匹配 */
function searchPlace(): Promise<void> {
  if (!placeSearch.value || !searchText.value) {
    suggestList.value = [];
    return Promise.resolve();
  }
  const seq = ++searchSeq;
  searching.value = true;
  pageIndex = 0;
  totalCount = 0;
  placeSearch.value.setPageIndex(1);
  return new Promise(resolve => {
    placeSearch.value.search(searchText.value, (status: string, result: any) => {
      // 竞态守卫:仅采纳最后一次请求的响应
      if (seq !== searchSeq) return resolve();
      searching.value = false;
      if (status === "complete") {
        serviceDegraded.value = false;
        totalCount = Number(result?.poiList?.count) || 0;
        suggestList.value = extractPois(result);
        resolve();
        return;
      }
      // 高德检索失败(代理异常/网络失败):回退内置城市表匹配,保证弱网/未配 key 时可用
      serviceDegraded.value = true;
      void searchLocal().then(() => {
        // city 随候选保留:本地候选无需逆地理即可回填城市
        suggestList.value = localCandidates.value.map(c => ({
          name: c.name,
          district: c.city,
          lng: c.lng,
          lat: c.lat,
          city: c.city
        }));
        localCandidates.value = [];
        resolve();
      });
    });
  });
}

/** 高德 POI 结果 → 候选列表项 */
function extractPois(result: any) {
  return (result?.poiList?.pois ?? [])
    .filter((poi: any) => poi.location)
    .map((poi: any) => ({
      name: poi.name,
      district: poi.pname
        ? `${poi.pname}${poi.cityname ?? ""}${poi.adname ?? ""}`
        : (poi.cityname ?? ""),
      lng: poi.location.getLng(),
      lat: poi.location.getLat()
    }));
}

/** 候选滚动触底:追加下一页(直到高德命中总数耗尽) */
function onScroll() {
  const el = listScrollRef.value;
  if (!el) return;
  if (el.scrollTop + el.clientHeight < el.scrollHeight - 8) return;
  void loadMore();
}

/** 拉取下一页候选(竞态守卫:新搜索期间到达的旧页直接丢弃) */
function loadMore(): Promise<void> {
  const ps = placeSearch.value;
  if (!ps || loadingMore || !searchText.value) return Promise.resolve();
  if (suggestList.value.length >= totalCount) return Promise.resolve();
  loadingMore = true;
  const seq = searchSeq;
  pageIndex += 1;
  ps.setPageIndex(pageIndex + 1);
  return new Promise(resolve => {
    ps.search(searchText.value, (status: string, result: any) => {
      if (seq !== searchSeq) return resolve();
      loadingMore = false;
      if (status === "complete") {
        // 翻页失败不清空已有候选,仅停止追加
        suggestList.value = [...suggestList.value, ...extractPois(result)];
      }
      resolve();
    });
  });
}

/** 键盘上下键移动候选高亮(边界停住),并保证高亮项滚动进可视区 */
function moveActive(delta: number, length: number) {
  if (!length) return;
  activeIndex.value = Math.min(Math.max(activeIndex.value + delta, 0), length - 1);
  const el = listScrollRef.value;
  el?.children[activeIndex.value]?.scrollIntoView({ block: "nearest" });
}

/** 回车确认:确保候选已加载后自动选中第一条,地图直接跟随定位 */
async function onSearchConfirm() {
  if (suggestList.value.length === 0) {
    await searchPlace();
  }
  const index = activeIndex.value >= 0 ? activeIndex.value : 0;
  const picked = suggestList.value[index] ?? suggestList.value[0];
  if (picked) {
    activeIndex.value = -1;
    onSuggestSelect(picked);
  }
}

onBeforeUnmount(() => {
  // 组件随表单弹窗销毁:释放地图实例避免瓦片任务残留
  mapInstance.value?.destroy?.();
  mapInstance.value = null;
  document.removeEventListener("pointerdown", onDocPointerDown);
});

/** 点击组件外部时收起候选浮层(pointerdown 先于 click,不影响候选选中) */
function onDocPointerDown(event: PointerEvent) {
  if (rootRef.value && !rootRef.value.contains(event.target as Node)) {
    suggestList.value = [];
    localCandidates.value = [];
  }
}

/* ---------------- 无 key 本地模式:内置城市表匹配(市级内联 + 区县级懒加载) ---------------- */

/** 本地城市候选(市级与区县级统一视图;city 为回填表单的城市名) */
interface LocalCity {
  name: string;
  city: string;
  lng: number;
  lat: number;
}

const localCandidates = ref<LocalCity[]>([]);
let districtCache:
  | Array<{ name: string; parent: string; lng: number; lat: number }>
  | null = null;

/** 去行政区划后缀,归一化匹配("成都市"→"成都") */
function normalizeCityName(name: string): string {
  return name
    .replace(/\s/g, "")
    .replace(/(特别行政区|壮族自治区|回族自治区|维吾尔自治区|自治区|自治州|地区|盟|市|区|县|旗)$/, "");
}

/** 区县级数据包按需加载(public 静态 JSON,不占首屏) */
async function ensureDistricts(): Promise<
  Array<{ name: string; parent: string; lng: number; lat: number }>
> {
  if (districtCache) return districtCache;
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}city-districts.json`);
    const data: Array<{ name: string; parent: string; lng: number; lat: number }> =
      (await res.json())?.districts ?? [];
    districtCache = data;
    return data;
  } catch {
    districtCache = [];
    return [];
  }
}

/** 无 key 本地搜索:市级 + 区县级(懒加载)联想 */
async function searchLocal() {
  activeIndex.value = -1;
  const keyword = normalizeCityName(searchText.value);
  if (!keyword) {
    localCandidates.value = [];
    return;
  }
  const hit = (n: string) => {
    const name = normalizeCityName(n);
    return name === keyword || name.startsWith(keyword) || name.includes(keyword);
  };
  const cityHits: LocalCity[] = cityLevels
    .filter(c => hit(c.name))
    .map(c => ({
      name: c.name,
      city: normalizeCityName(c.name),
      lng: c.lng,
      lat: c.lat
    }));
  localCandidates.value = cityHits;
  // 补区县级候选(与市级重名的跳过)
  const districts = await ensureDistricts();
  const districtHits: LocalCity[] = districts
    .filter(d => hit(d.name) || hit(d.parent))
    .map(d => ({
      name: d.name,
      city: normalizeCityName(d.parent),
      lng: d.lng,
      lat: d.lat
    }));
  // 去重:与市级重名的区县跳过
  localCandidates.value = [
    ...cityHits,
    ...districtHits.filter(d => !cityHits.some(c => c.name === d.name))
  ];
}

/** 回车确认:自动选中高亮候选(无高亮时选第一条) */
function confirmLocal() {
  const index = activeIndex.value >= 0 ? activeIndex.value : 0;
  const picked = localCandidates.value[index] ?? localCandidates.value[0];
  if (picked) {
    activeIndex.value = -1;
    onLocalSelect(picked);
  }
}

/** 本地候选选中:回填城市与坐标(坐标为 GCJ-02,与高德底图一致) */
function onLocalSelect(item: LocalCity) {
  searchText.value = item.name;
  localCandidates.value = [];
  activeIndex.value = -1;
  emit("update:city", item.city);
  emit("update:longitude", Number(item.lng.toFixed(6)));
  emit("update:latitude", Number(item.lat.toFixed(6)));
}
</script>

<template>
  <div ref="rootRef" class="w-full">
    <!-- 行高对齐 EP 控件高度(32px),使提示文字与左侧表单 label 水平居中 -->
    <div v-if="tip" class="mb-2 text-xs leading-8 text-(--el-text-color-secondary)">
      {{ tip }}
    </div>
    <!-- 无 key/加载失败时的本地模式:输入城市名由内置城市表匹配经纬度 -->
    <template v-if="tip">
      <div class="relative mb-2">
        <el-input
          v-model="searchText"
          placeholder="输入城市名(如:成都),自动匹配经纬度"
          clearable
          @keyup.enter="confirmLocal"
          @keydown.down.prevent="moveActive(1, localCandidates.length)"
          @keydown.up.prevent="moveActive(-1, localCandidates.length)"
          @input="searchLocal"
        />
        <!-- 本地候选浮层:与高德候选一致的交互 -->
        <div
          v-if="localCandidates.length"
          class="border-(--el-border-color-lighter) bg-(--el-bg-color) shadow-(--el-box-shadow-light) absolute z-10 mt-1 w-full rounded border overflow-hidden"
        >
          <div
            ref="listScrollRef"
            class="max-h-60 overflow-y-auto"
          >
            <div
              v-for="(item, index) in localCandidates"
              :key="`${item.name}-${item.lng}-${item.lat}-${index}`"
              class="cursor-pointer px-3 py-1.5 text-sm hover:bg-(--el-fill-color-light)"
              :class="{ 'bg-(--el-fill-color-light)': index === activeIndex }"
              @click="onLocalSelect(item)"
            >
              {{ item.name }}
              <span class="text-(--el-text-color-secondary)">{{ item.city }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
    <template v-else>
      <!-- 服务降级横幅:底图可用但服务接口受限时明示能力边界 -->
      <div
        v-if="serviceDegraded"
        class="mb-2 text-center text-xs leading-8 text-(--el-color-warning)"
      >
        高德服务暂不可用(未配置安全密钥或网络受限),已切换内置城市表搜索,点选仍可拾取坐标
      </div>
      <div class="relative mb-2">
        <el-input
          v-model="searchText"
          placeholder="输入地点关键词搜索(回车直接定位),或点击地图拾取"
          clearable
          :loading="searching"
          @keyup.enter="onSearchConfirm"
          @keydown.down.prevent="moveActive(1, suggestList.length)"
          @keydown.up.prevent="moveActive(-1, suggestList.length)"
          @input="searchPlace"
        />
        <!-- 候选浮层:绝对定位悬浮于地图之上;内容区触底分页加载下一页 -->
        <div
          v-if="suggestList.length"
          class="border-(--el-border-color-lighter) bg-(--el-bg-color) shadow-(--el-box-shadow-light) absolute z-10 mt-1 w-full rounded border overflow-hidden"
        >
          <div
            ref="listScrollRef"
            class="max-h-60 overflow-y-auto"
            @scroll="onScroll"
          >
            <div
              v-for="(item, index) in suggestList"
              :key="`${item.name}-${item.lng}-${item.lat}-${index}`"
              class="cursor-pointer px-3 py-1.5 text-sm hover:bg-(--el-fill-color-light)"
              :class="{ 'bg-(--el-fill-color-light)': index === activeIndex }"
              @click="onSuggestSelect(item)"
            >
              {{ item.name }}
              <span class="text-(--el-text-color-secondary)">{{ item.district }}</span>
            </div>
          </div>
        </div>
      </div>
      <div ref="mapEl" class="h-60 w-full overflow-hidden rounded" />
    </template>
  </div>
</template>
