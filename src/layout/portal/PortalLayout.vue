<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import PortalHeader from "./PortalHeader.vue";
import PortalSidebar from "./PortalSidebar.vue";
import PortalFooter from "./PortalFooter.vue";
import { providePortalSysConfig } from "./usePortalSysConfig";
import {
  applySiteFavicon,
  applySiteLogo,
  fetchSysConfig,
  type SysConfig
} from "@/utils/sysConfig";
// 门户样式入口(「双人小站」:base 元素级重置 + 设计令牌)
import "@/assets/portal/index.css";

defineOptions({ name: "PortalLayout" });

const route = useRoute();

/** 站点公共配置:按需拉取门户所需键(后端 config 缓存兜底),经 provide 下发子组件 */
const sysConfig = ref<Partial<SysConfig>>({});
onMounted(async () => {
  const config = await fetchSysConfig(
    "name",
    "icp",
    "copyrightYear",
    "siteLoveStartDate",
    "logo",
    "favicon"
  );
  // logo 顺手回填全局状态,管理端/登录页共享,门户内不再单独拉取
  applySiteLogo(config.logo);
  // favicon 同步注入 <head>(与 logo 同批拉取,免重复请求)
  applySiteFavicon(config.favicon);
  Object.assign(sysConfig.value, config);
});
providePortalSysConfig(sysConfig);

/* ---------------- 列表状态与滚动位置保持(KeepAlive + 滚动记忆) ---------------- */

/** 各路径离开时的滚动位置记忆(切页返回后还原,对齐 Medium/掘金阅读体验) */
const scrollMemory = new Map<string, number>();

/** 离开页面:在路由切换生效前捕获当前滚动位置 */
watch(
  () => route.fullPath,
  (_to, from) => {
    if (from) scrollMemory.set(from, window.scrollY);
  }
);

/** 进入页面:等待过渡与 KeepAlive DOM 恢复后还原滚动位置 */
watch(
  () => route.fullPath,
  to => {
    const saved = scrollMemory.get(to);
    nextTick(() => {
      window.setTimeout(() => {
        window.scrollTo(0, saved ?? 0);
      }, 260);
    });
  }
);
</script>

<template>
  <!-- 门户样式作用域根容器:门户样式经 postcss 统一加 .portal 前缀,避免全局泄漏污染管理端 -->
  <div class="portal">
    <PortalHeader />
    <!-- 内容区:各门户页面经 RouterView 注入;KeepAlive 缓存列表状态(分页/滚动位置),
         过渡淡入消除路由切换硬切 -->
    <div class="portal-content">
      <RouterView v-slot="{ Component }">
        <Transition name="portal-fade" mode="out-in">
          <KeepAlive>
            <component :is="Component" />
          </KeepAlive>
        </Transition>
      </RouterView>
    </div>
    <PortalSidebar />
    <PortalFooter />
  </div>
</template>

<style lang="scss" scoped>
/* 门户基础观感:杂志纸感底 + 墨色正文(令牌来自 tokens.css) */
.portal {
  font-family: var(
    --am-font-body,
    Inter,
    "PingFang SC",
    "Microsoft YaHei",
    sans-serif
  );
  font-size: 16px;
  line-height: 1.7;
  color: var(--am-ink);
  background: var(--am-bg);
}

/* 内容区最小高度:避免短页面(如空态列表页)切换时页脚大幅上跳 */
.portal-content {
  min-height: 60vh;
}

/* 路由切换过渡:进入时轻微上移淡入,离开仅快速淡出,消除瞬间替换的闪屏感 */
.portal-fade-enter-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.portal-fade-leave-active {
  transition: opacity 0.15s ease;
}

.portal-fade-enter-from {
  opacity: 0;
  transform: translateY(1rem);
}

.portal-fade-leave-to {
  opacity: 0;
}
</style>
