<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from "vue";
import { LOGO_FALLBACK } from "@/utils/sysConfig";
import { usePortalSysConfig } from "./usePortalSysConfig";
import { getPortalSaying, type SayingData } from "@/api/portal";
import { RouterLink } from "vue-router";

defineOptions({ name: "PortalHeader" });

/** 站点公共配置:由 PortalLayout 经 providePortalSysConfig 注入(替代 props 双通道) */
const sysConfig = usePortalSysConfig();

/** logo 加载失败降级标记:降级目标为本地 favicon(必可达,不会二次触发) */
const logoBroken = ref(false);

/** 站点 logo 展示地址:配置优先,未配置/加载失败统一回退 favicon.ico */
const logoSrc = computed(() =>
  logoBroken.value ? LOGO_FALLBACK : (sysConfig.value.logo ?? LOGO_FALLBACK)
);

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
          <RouterLink class="alogo" to="/">
            <!-- 站点 logo 配置(项目/站点logo图片)优先展示,缺失/加载失败统一回落 favicon -->
            <img
              :src="logoSrc"
              alt="logo"
              class="logo-img"
              @error="logoBroken = true"
            />
            {{ sysConfig.name }}
          </RouterLink>
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
            >{{ saying.content }}</span
          >
          <span v-if="sayingFrom" class="wenan-from">—— {{ sayingFrom }}</span>
        </div>
      </el-tooltip>
    </div>
  </div>
</template>

<style scoped>
/* 站点 logo:行内对齐 h1 文字(字号 1.5rem,见 portal.css),随文字基线微调 */
.logo-img {
  height: 1.5em;
  margin-right: 0.4em;
  vertical-align: -0.3em;
}
</style>
