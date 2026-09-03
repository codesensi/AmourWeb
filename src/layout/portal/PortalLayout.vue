<script setup lang="ts">
import { provide, ref } from "vue";
import PortalHeader from "./PortalHeader.vue";
import PortalHero from "./PortalHero.vue";
import PortalSidebar from "./PortalSidebar.vue";
import PortalFooter from "./PortalFooter.vue";
import { getSysConfig, type SysConfigData } from "@/api/sysConfig";
import "animate.css";
// 门户样式入口(base 元素级重置已内聚到 portal/css/base.css,不再依赖 layui)
import "@/assets/portal/index.css";
import "@/assets/portal/icons/iconfont-sprite.js";

defineOptions({ name: "PortalLayout" });

/** 站点展示配置(sys_config):接口就绪前为空对象,子组件按配置缺失安全降级 */
const sysConfig = ref<Partial<SysConfigData>>({});
provide("portalSysConfig", sysConfig);

getSysConfig()
  .then(({ success, data }) => {
    if (success) sysConfig.value = data;
  })
  .catch(() => {});
</script>

<template>
  <!-- 门户样式作用域根容器:门户 CSS(layui/portal)经 postcss 统一加 .portal 前缀,避免全局泄漏污染管理端 -->
  <div class="portal">
    <PortalHeader :sys-config="sysConfig" />
    <PortalHero />
    <!-- 内容区:各门户页面经 RouterView 注入;淡入过渡消除路由切换硬切 -->
    <div class="portal-content">
      <RouterView v-slot="{ Component }">
        <Transition name="portal-fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </div>
    <PortalSidebar />
    <PortalFooter :sys-config="sysConfig" />
  </div>
</template>

<style lang="scss" scoped>
/* 门户基础观感:承接 layui.css 原 body 级全局规则
   (前缀隔离后 body 选择器不再命中,统一收敛到 .portal 根容器) */
.portal {
  line-height: 1.6;
  color: rgba(0, 0, 0, 0.85);
  font-size: 14px;
  font-family:
    -apple-system, Roboto, "PingFang SC", "Helvetica Neue", Arial, sans-serif,
    "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
}

/* 内容区最小高度:避免短页面(如空态列表页)切换时页脚大幅上跳 */
.portal-content {
  min-height: 40vh;
}

/* 路由切换过渡:进入时轻微上移淡入(呼应首页卡片入场动画),离开仅快速淡出,消除瞬间替换的闪屏感 */
.portal-fade-enter-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
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
