<script setup lang="ts">
import { provide, ref } from "vue";
import PortalHeader from "./PortalHeader.vue";
import PortalHero from "./PortalHero.vue";
import PortalSidebar from "./PortalSidebar.vue";
import PortalFooter from "./PortalFooter.vue";
import { getSysConfig, type SysConfigData } from "@/api/sysConfig";
import "animate.css";
// layui 基础样式置前(栅格/表单底座),门户样式整体覆盖;引入顺序对齐原站 layout.html
import "@/assets/layui/2.13.9/layui.css";
import "@/assets/portal/index.css";
import "@/assets/portal/icons/iconfont-sprite.js";

defineOptions({ name: "PortalLayout" });

/** 站点展示配置(sys_config):接口就绪前为空对象,子组件按配置缺失安全降级 */
const site = ref<Partial<SysConfigData>>({});
provide("portalSite", site);

getSysConfig()
  .then(({ success, data }) => {
    if (success) site.value = data;
  })
  .catch(() => {});
</script>

<template>
  <PortalHeader :site="site" />
  <PortalHero :site="site" />
  <!-- 内容区:各门户页面经 RouterView 注入 -->
  <RouterView />
  <PortalSidebar />
  <PortalFooter :site="site" />
</template>

<style lang="scss" scoped>
/* 门户外壳无自身布局样式:布局全部来自迁移的 portal 原站样式 */
</style>
