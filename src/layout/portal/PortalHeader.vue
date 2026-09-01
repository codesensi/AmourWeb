<script setup lang="ts">
import type { SysConfigData } from "@/api/sysConfig";
import { RouterLink } from "vue-router";

defineOptions({ name: "PortalHeader" });

defineProps<{ site: Partial<SysConfigData> }>();
</script>

<template>
  <!-- 头部导航条:固定吸顶毛玻璃(滚动变色交互后续步骤随页面逻辑移植) -->
  <div class="header-wrap">
    <div class="header">
      <div class="logo">
        <h1>
          <RouterLink class="alogo" to="/">{{ site.title }}</RouterLink>
        </h1>
      </div>
      <!-- 文案来自 sys_config,页面内不硬编码 -->
      <div class="word" :data-tip="site.siteSlogan" data-tip-position="bottom">
        <span class="wenan">{{ site.siteSlogan }}</span>
      </div>
    </div>
  </div>
</template>
