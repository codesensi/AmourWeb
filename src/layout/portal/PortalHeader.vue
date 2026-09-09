<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from "vue";
import type { SysConfig } from "@/utils/sysConfig";
import { getPortalSaying, type SayingData } from "@/api/portal";
import { RouterLink } from "vue-router";

defineOptions({ name: "PortalHeader" });

defineProps<{ sysConfig: Partial<SysConfig> }>();

/** 一言(随机优先,失败降级 uapi-saying):content 为空或请求失败时整个角标不展示 */
const saying = ref<SayingData | null>(null);
/** 文本溢出标记:内容过长才启用滑动动画 */
const sayingOverflow = ref(false);
/** 一言正文行(块级,可检测溢出) */
const sayingText = ref<HTMLElement | null>(null);

/** 出处·作者(仅随机一言解析成功时有值;降级一言为空) */
const sayingFrom = computed(() =>
  [saying.value?.source, saying.value?.author].filter(Boolean).join("·")
);

/** 悬停提示全文:文案 + 出处·作者(存在时) */
const sayingTip = computed(() => {
  if (!saying.value?.content) return "";
  return sayingFrom.value
    ? `${saying.value.content} —— ${sayingFrom.value}`
    : saying.value.content;
});

/** 渲染后检测一言文本是否溢出容器(溢出才启用滑动动画) */
async function resolveSaying() {
  try {
    const { success, data } = await getPortalSaying();
    if (success && data?.content) {
      saying.value = data;
      await nextTick();
      // 正文行为块级元素,其 scrollWidth/offsetWidth 可用于溢出检测;第二行出处仅截断不滚动
      sayingOverflow.value =
        (sayingText.value?.scrollWidth ?? 0) >
        (sayingText.value?.offsetWidth ?? 0);
    }
  } catch {
    // 后端不可用:一言角标不展示
  }
}

onMounted(resolveSaying);
</script>

<template>
  <!-- 头部导航条:固定吸顶毛玻璃(滚动变色交互后续步骤随页面逻辑移植) -->
  <div class="header-wrap">
    <div class="header">
      <div class="logo">
        <h1>
          <RouterLink class="alogo" to="/">{{ sysConfig.name }}</RouterLink>
        </h1>
      </div>
      <!-- 一言:来自 /portal/saying(随机优先,失败后端降级);返回空时整个角标不展示;
           内容过长时滑动展示后续内容,悬停暂停滚动并显示全文(el-tooltip 不受滑动/溢出裁剪影响) -->
      <el-tooltip
        v-if="saying?.content"
        :content="sayingTip"
        placement="bottom"
        :show-after="150"
      >
        <div class="word">
          <span
            ref="sayingText"
            class="wenan"
            :class="{ 'wenan-marquee': sayingOverflow }"
          >{{ saying.content }}</span>
          <span v-if="sayingFrom" class="wenan-from">—— {{ sayingFrom }}</span>
        </div>
      </el-tooltip>
    </div>
  </div>
</template>
