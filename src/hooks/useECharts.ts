import { computed, nextTick, onMounted, onUnmounted, toValue, watch } from "vue";
import type { Ref } from "vue";
import type { UtilsEChartsOption } from "@pureadmin/utils";
import type { ECharts } from "echarts/core";
import echarts from "@/plugins/echarts";

/** 局部注册的图表初始化选项 */
interface EchartOptions {
  /** 主题名（"dark"/"light"），支持响应式切换 */
  theme?: Ref<string> | string;
  /** 渲染器：canvas（默认）或 svg */
  renderer?: "canvas" | "svg";
  /** 是否监听窗口 resize 自适应，默认开启（设置了 option.container 时改为观察容器尺寸） */
  resize?: boolean;
}

/**
 * 页面级 echarts 薄封装（局部注册，替代 @pureadmin/utils 的 useECharts）：
 * echarts 实例由消费页面直接 import（随页面 chunk 按需加载），不经 globalProperties，
 * 入口与全局注册彻底解耦。行为对齐原 hook 的核心子集：
 * setup 阶段即可 setOptions（延迟至 DOM 挂载可见后渲染）、主题响应式重建
 * （dark 时画布背景置透明，底色由页面 CSS 提供）、resize 自适应、组件卸载时销毁实例。
 */
export function useECharts(
  elRef: Ref<HTMLElement | undefined>,
  options?: EchartOptions
) {
  const theme = computed(() => toValue(options?.theme) ?? "default");
  const renderer = toValue(options?.renderer) ?? "canvas";
  let instance: ECharts | null = null;
  let cachedOption: UtilsEChartsOption | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let resizeTimer: ReturnType<typeof setTimeout> | null = null;

  /** dark 主题下 echarts 默认深色画布，与页面 CSS 底色冲突，统一置透明 */
  function withTheme(option: UtilsEChartsOption): UtilsEChartsOption {
    return theme.value === "dark"
      ? { backgroundColor: "transparent", ...option }
      : option;
  }

  /** 渲染缓存的 option；DOM 未挂载或不可见（高度为 0）时延迟重试直至可见 */
  function render(delayMs = 50) {
    const el = toValue(elRef);
    if (!el || el.offsetHeight === 0) {
      window.setTimeout(() => render(), delayMs);
      return;
    }
    if (!instance) {
      instance = echarts.init(el, theme.value, { renderer });
    }
    instance.clear();
    instance.setOption(withTheme(cachedOption!));
  }

  /** 根据配置项渲染图表（兼容原 useECharts.setOptions 的扩展字段与延迟渲染语义） */
  function setOptions(option: UtilsEChartsOption) {
    cachedOption = option;
    nextTick(() => {
      const el = toValue(elRef);
      if (!el || el.offsetHeight === 0) {
        window.setTimeout(() => setOptions(option), 50);
        return;
      }
      if (!instance) {
        instance = echarts.init(el, theme.value, { renderer });
      }
      if (option.clear ?? true) {
        instance.clear();
      }
      instance.setOption(withTheme(option));
    });
  }

  /** 窗口拖动时延迟自适应（与原 hook 的 300ms 防抖一致），避免连续触发布局计算 */
  function handleWindowResize() {
    resizeTimer = setTimeout(() => instance?.resize(), 300);
  }

  watch(theme, value => {
    if (!instance) return;
    const el = toValue(elRef);
    if (!el) return;
    instance.dispose();
    instance = echarts.init(el, value, { renderer });
    if (cachedOption) {
      instance.clear();
      instance.setOption(withTheme(cachedOption));
    }
  });

  onMounted(() => {
    const container = cachedOption?.container;
    if (container) {
      // 指定容器时监听其尺寸变化（卡片布局自适应），与原 hook 的 ResizeObserver 行为一致
      resizeObserver = new ResizeObserver(() => instance?.resize());
      const targets = Array.isArray(container) ? container : [container];
      for (const item of targets) {
        const el =
          typeof item === "string"
            ? document.querySelector(item)
            : item instanceof HTMLElement
              ? item
              : item.value;
        el && resizeObserver.observe(el);
      }
    } else {
      window.addEventListener("resize", handleWindowResize);
    }
  });

  onUnmounted(() => {
    resizeTimer && clearTimeout(resizeTimer);
    resizeObserver?.disconnect();
    resizeObserver = null;
    window.removeEventListener("resize", handleWindowResize);
    instance?.dispose();
    instance = null;
  });

  return { setOptions };
}
