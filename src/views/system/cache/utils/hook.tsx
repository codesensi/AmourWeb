import { ref, reactive, computed, watch, onMounted } from "vue";
import { ElMessageBox } from "element-plus";
import { useDark, useECharts } from "@pureadmin/utils";
import { useClipboard } from "@vueuse/core";
import type { PaginationProps } from "@pureadmin/table";
import type { EChartsOption } from "echarts";
import { getCacheList, type CacheInfo } from "@/api/cache";

import ConfigIcon from "~icons/ep/setting";
import UserIcon from "~icons/ep/user";
import RoleIcon from "~icons/ep/key";
import PermIcon from "~icons/ep/lock";
import MenuIcon from "~icons/ep/menu";
import DictIcon from "~icons/ep/collection";
import QqIcon from "~icons/ep/chat-dot-round";
import CaptchaIcon from "~icons/ep/picture";
import FallbackIcon from "~icons/ep/coin";

/** 缓存类别图标与配色(短名 → 浅色圆底 + 同色图标) */
const CACHE_ICONS: Record<
  string,
  { icon: unknown; color: string; bg: string }
> = {
  config: {
    icon: ConfigIcon,
    color: "var(--el-color-primary)",
    bg: "rgba(64,158,255,0.12)"
  },
  user: {
    icon: UserIcon,
    color: "var(--el-color-success)",
    bg: "rgba(103,194,58,0.14)"
  },
  role: {
    icon: RoleIcon,
    color: "#7c3aed",
    bg: "rgba(124,58,237,0.12)"
  },
  perm: {
    icon: PermIcon,
    color: "var(--el-color-warning)",
    bg: "rgba(230,162,60,0.14)"
  },
  menu: {
    icon: MenuIcon,
    color: "var(--el-color-primary)",
    bg: "rgba(64,158,255,0.12)"
  },
  dict: {
    icon: DictIcon,
    color: "var(--el-color-success)",
    bg: "rgba(103,194,58,0.14)"
  },
  qq: {
    icon: QqIcon,
    color: "#7c3aed",
    bg: "rgba(124,58,237,0.12)"
  },
  captcha: {
    icon: CaptchaIcon,
    color: "var(--el-color-warning)",
    bg: "rgba(230,162,60,0.14)"
  }
};

export function useCacheMonitor() {
  const loading = ref(true);
  /** 全量缓存列表(一次请求,左侧与右侧均由其派生) */
  const caches = ref<Array<CacheInfo>>([]);
  /** 当前选中的缓存名(完整 cacheName,含环境前缀) */
  const selectedName = ref("");
  const entryKeyword = ref("");
  const keyword = ref("");
  /** 最近一次成功拉取的时间(页头展示) */
  const refreshTime = ref("—");

  /** 左栏:按关键字过滤缓存名 */
  const filteredCaches = computed(() => {
    const kw = keyword.value.trim().toLowerCase();
    if (!kw) return caches.value;
    return caches.value.filter(item =>
      item.cacheName.toLowerCase().includes(kw)
    );
  });

  /** 当前选中的缓存对象 */
  const selected = computed(
    () =>
      caches.value.find(item => item.cacheName === selectedName.value) ??
      caches.value[0]
  );

  /** 右侧:选中缓存的条目(键前端过滤后的全量) */
  const filteredEntries = computed(() => {
    const list = selected.value?.entries ?? [];
    const keyword = entryKeyword.value.trim().toLowerCase();
    if (!keyword) return list;
    return list.filter(item => item.key.toLowerCase().includes(keyword));
  });

  /** 条目本地分页(数据已全量在内存,纯展示层切片) */
  const pageInfo = reactive<PaginationProps>({
    total: 0,
    currentPage: 1,
    pageSize: 10,
    background: true
  });

  /** 过滤后条目总数(分页 total) */
  const entryTotal = computed(() => filteredEntries.value.length);

  /** 当前页条目切片 */
  const entries = computed(() => {
    const size = pageInfo.pageSize ?? 10;
    const start = ((pageInfo.currentPage ?? 1) - 1) * size;
    return filteredEntries.value.slice(start, start + size);
  });

  /** 键搜索变化时回到第一页 */
  watch(entryKeyword, () => {
    pageInfo.currentPage = 1;
  });

  /** 顶部全局概览:由全部缓存聚合派生(命中率为加权值) */
  const globalStats = computed(() => {
    const entryCount = caches.value.reduce(
      (sum, item) => sum + item.entries.length,
      0
    );
    const hitCount = caches.value.reduce(
      (sum, item) => sum + (item.stats?.hitCount ?? 0),
      0
    );
    const missCount = caches.value.reduce(
      (sum, item) => sum + (item.stats?.missCount ?? 0),
      0
    );
    const evictionCount = caches.value.reduce(
      (sum, item) => sum + (item.stats?.evictionCount ?? 0),
      0
    );
    const hitRate =
      hitCount + missCount > 0 ? hitCount / (hitCount + missCount) : null;
    return {
      cacheCount: caches.value.length,
      entryCount,
      hitRate,
      evictionCount
    };
  });

  /** 运行环境前缀(取首个缓存名去掉末段短名,如 amour_dev) */
  const envPrefix = computed(() =>
    (caches.value[0]?.cacheName ?? "").replace(/_[^_]+$/, "")
  );

  /** 健康摘要:命中率 ≥90% 的缓存占比(健康摘要带展示) */
  const healthSummary = computed(() => {
    const total = caches.value.length;
    const healthyCount = caches.value.filter(
      item => (item.stats?.hitRate ?? 0) >= 0.9
    ).length;
    return { total, healthyCount };
  });

  /** 拉取全量缓存;原选中项失效时回退到第一项 */
  async function loadAll() {
    loading.value = true;
    try {
      const { success, data } = await getCacheList();
      if (success) {
        caches.value = data;
        if (!data.some(item => item.cacheName === selectedName.value)) {
          selectedName.value = data[0]?.cacheName ?? "";
        }
      }
      refreshTime.value = new Date().toLocaleTimeString("zh-CN", {
        hour12: false
      });
    } finally {
      loading.value = false;
    }
  }

  /** 切换选中缓存:清空条目键过滤并回到第一页 */
  function handleSelect(cacheName: string) {
    if (selectedName.value === cacheName) return;
    selectedName.value = cacheName;
    entryKeyword.value = "";
    pageInfo.currentPage = 1;
  }

  /** 条目分页:每页条数变化(回到第一页) */
  function handleSizeChange(size: number) {
    pageInfo.pageSize = size;
    pageInfo.currentPage = 1;
  }

  /** 条目分页:页码变化 */
  function handleCurrentChange(page: number) {
    pageInfo.currentPage = page;
  }

  /** 缓存类别图标元数据(未知短名回退通用硬币图标) */
  function iconMeta(cacheName: string) {
    const short = cacheName.split("_").pop() ?? "";
    return (
      CACHE_ICONS[short] ?? {
        icon: FallbackIcon,
        color: "var(--el-color-primary)",
        bg: "rgba(64,158,255,0.12)"
      }
    );
  }

  /** 秒 → 人性化时长;null 呈现为兜底文案(如"不限制"/"驻留不过期") */
  function formatDuration(seconds?: number | null, noneText = "不限制") {
    if (seconds == null) return noneText;
    if (seconds === 0) return "0 秒";
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (d > 0) return `${d} 天${h ? ` ${h} 小时` : ""}`;
    if (h > 0) return `${h} 小时${m ? ` ${m} 分钟` : ""}`;
    if (m > 0) return `${m} 分钟${s ? ` ${s} 秒` : ""}`;
    return `${s} 秒`;
  }

  /** 命中率(0~1) → 百分比文案 */
  function formatRate(rate?: number | null) {
    return rate == null ? "—" : `${(rate * 100).toFixed(1)}%`;
  }

  /** 命中率着色:≥80% 正常,50~80% 提醒,<50% 告警(echarts 内取具体色值,不解析 CSS 变量) */
  function rateColor(rate?: number | null) {
    if (rate == null) return "var(--el-text-color-secondary)";
    if (rate >= 0.8) return "var(--el-color-success)";
    if (rate >= 0.5) return "var(--el-color-warning)";
    return "var(--el-color-danger)";
  }

  /** echarts 系列色(与 rateColor 同阈值的具体色值) */
  function gaugeColor(rate?: number | null) {
    if (rate == null) return "#909399";
    if (rate >= 0.8) return "#67c23a";
    if (rate >= 0.5) return "#e6a23c";
    return "#f56c6c";
  }

  const { isDark } = useDark();
  const theme = computed(() => (isDark.value ? "dark" : "light"));
  const ringRef = ref();
  const { setOptions } = useECharts(ringRef, {
    theme,
    renderer: "svg"
  });

  /** 命中率仪表环 option(整圈进度环 + 中央百分比 + 副标) */
  function buildRingOption(rate?: number | null): EChartsOption {
    const value = rate == null ? 0 : Math.min(1, Math.max(0, rate));
    return {
      series: [
        {
          type: "gauge",
          startAngle: 90,
          endAngle: -270,
          radius: "95%",
          center: ["50%", "50%"],
          pointer: { show: false },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          progress: {
            show: true,
            overlap: false,
            roundCap: true,
            width: 12,
            itemStyle: { color: gaugeColor(rate) }
          },
          axisLine: {
            lineStyle: {
              width: 12,
              color: [
                [
                  1,
                  isDark.value
                    ? "rgba(255,255,255,0.12)"
                    : "rgba(144,147,153,0.18)"
                ]
              ]
            }
          },
          data: [
            { value: Number((value * 100).toFixed(1)), name: "当前命中率" }
          ],
          detail: {
            valueAnimation: true,
            offsetCenter: [0, "-8%"],
            formatter: "{value}%",
            fontSize: 20,
            fontWeight: 600,
            color: gaugeColor(rate)
          },
          title: {
            offsetCenter: [0, "35%"],
            fontSize: 12,
            color: isDark.value
              ? "rgba(220,220,242,0.45)"
              : "rgba(42,46,54,0.45)"
          }
        }
      ]
    };
  }

  /** 选中缓存变化时同步刷新仪表环 */
  watch(selected, () => {
    setOptions(buildRingOption(selected.value?.stats?.hitRate));
  });

  /** 缓存值摘要:截断前 40 字符;null 为空值哨兵 */
  function summarize(value: unknown) {
    if (value == null) return "";
    const text = typeof value === "string" ? value : JSON.stringify(value);
    return text.length > 40 ? `${text.slice(0, 40)}…` : text;
  }

  /** 缓存值完整展示:统一 JSON 格式化(字符串原样,避免多余引号) */
  function prettyJson(value: unknown) {
    return typeof value === "string" ? value : JSON.stringify(value, null, 2);
  }

  /** 剩余过期占写后过期的百分比(无写后过期视为驻留,满格) */
  function expirePercent(row: { remainExpire?: number | null }) {
    const total = selected.value?.expireAfterWrite;
    if (!total || row.remainExpire == null) return 100;
    return Math.round(Math.min(100, (row.remainExpire / total) * 100));
  }

  const detail = ref<{ key: string; value: unknown } | null>(null);
  const detailVisible = ref(false);
  const copied = ref(false);
  /** legacy 模式:非安全上下文(http)自动降级 execCommand 复制 */
  const { copy: copyText } = useClipboard({ legacy: true });

  /** 值详情弹窗(pre 文本插值展示,不渲染 HTML 防注入) */
  function openDetail(row: { key: string; value: unknown }) {
    detail.value = row;
    detailVisible.value = true;
    copied.value = false;
  }

  /** 复制详情 JSON 到剪贴板,1.5s 后还原按钮态(legacy 模式在非安全上下文自动降级 execCommand) */
  async function copyDetail() {
    if (!detail.value) return;
    try {
      await copyText(prettyJson(detail.value.value) || "");
      copied.value = true;
      setTimeout(() => {
        copied.value = false;
      }, 1500);
    } catch {
      ElMessageBox.alert("复制失败,请手动选择文本复制", "系统提示");
    }
  }

  /** 条目表格列(JSX 渲染器依赖本 hook 的工具函数,故在此定义) */
  const entryColumns: TableColumnList = [
    {
      label: "缓存键",
      prop: "key",
      minWidth: 160,
      cellRenderer: ({ row }) => (
        <span
          style={{ fontFamily: "Consolas, Monaco, monospace", fontWeight: 500 }}
        >
          {row.key}
        </span>
      )
    },
    {
      label: "缓存值",
      minWidth: 220,
      cellRenderer: ({ row }) =>
        row.value == null ? (
          <el-tag type="warning" size="small" effect="light">
            空值占位
          </el-tag>
        ) : (
          <span
            style={{
              background: "var(--el-fill-color)",
              borderRadius: "4px",
              padding: "2px 6px",
              fontFamily: "Consolas, Monaco, monospace",
              fontSize: "12px"
            }}
          >
            {summarize(row.value)}
          </span>
        )
    },
    {
      label: "剩余过期",
      minWidth: 160,
      cellRenderer: ({ row }) =>
        row.remainExpire == null ? (
          <span>♾ 驻留不过期</span>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                flex: "1",
                minWidth: "60px",
                height: "6px",
                borderRadius: "3px",
                background: "var(--el-fill-color)",
                overflow: "hidden"
              }}
            >
              <div
                style={{
                  width: `${expirePercent(row)}%`,
                  height: "100%",
                  borderRadius: "3px",
                  background: rateColor(expirePercent(row) / 100)
                }}
              />
            </div>
            <span style={{ fontSize: "12px", whiteSpace: "nowrap" }}>
              {formatDuration(row.remainExpire)}
            </span>
            {expirePercent(row) < 20 && (
              <el-tag type="warning" size="small" effect="light">
                即将过期
              </el-tag>
            )}
          </div>
        )
    },
    {
      label: "操作",
      fixed: "right",
      width: 80,
      slot: "operation"
    }
  ];

  onMounted(() => {
    loadAll();
    // 容器挂载后先渲染空环,数据到达后由 watch(selected) 驱动更新
    setOptions(buildRingOption(selected.value?.stats?.hitRate));
  });

  return {
    loading,
    keyword,
    filteredCaches,
    selected,
    selectedName,
    handleSelect,
    entryKeyword,
    entries,
    entryColumns,
    pageInfo,
    entryTotal,
    handleSizeChange,
    handleCurrentChange,
    loadAll,
    refreshTime,
    globalStats,
    envPrefix,
    healthSummary,
    ringRef,
    iconMeta,
    formatDuration,
    formatRate,
    rateColor,
    summarize,
    prettyJson,
    expirePercent,
    detail,
    detailVisible,
    copied,
    openDetail,
    copyDetail
  };
}
