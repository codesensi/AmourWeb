import { ref } from "vue";

/**
 * 门户影院模式状态 hook——收敛足迹/画册/清单重复的开关与索引状态机。
 * <p>
 * open/index 经 v-model 绑定 PortalLightbox;openAt(i) 打开并定位到第 i 张。
 * 影院模式数据源(条目到 LightboxItem 的映射)由各页面自行维护。
 */
export function useLightbox() {
  const lightboxOpen = ref(false);
  const lightboxIndex = ref(0);

  /** 打开影院模式并定位到第 i 张 */
  function openAt(i: number) {
    lightboxIndex.value = i;
    lightboxOpen.value = true;
  }

  return { lightboxOpen, lightboxIndex, openAt };
}
