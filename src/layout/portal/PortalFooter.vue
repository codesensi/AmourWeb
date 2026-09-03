<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import icpSvg from "@/assets/portal/img/icp.svg?url";
import type { SysConfigData } from "@/api/sysConfig";

defineOptions({ name: "PortalFooter" });

const props = defineProps<{ sysConfig: Partial<SysConfigData> }>();

/** 版权年份:配置起始年份早于当前年份时显示「起始-当前」区间;
 * 配置缺失、非法或恰为当前年份(防御性:配置晚于当前年份同理)时仅显示当前年份 */
const copyrightYears = computed(() => {
  const nowYear = new Date().getFullYear();
  const startYear = Number.parseInt(props.sysConfig.copyrightYear ?? "", 10);
  const start = Number.isInteger(startYear) && startYear < nowYear ? startYear : null;
  return start ? `${start}-${nowYear}` : String(nowYear);
});
</script>

<template>
  <!-- 页脚:ICP 备案(链接为固定地址,文案由 sys_config 注入)+ 版权行(年份由前端拼接) -->
  <div class="footer-warp">
    <div class="footer">
      <p class="footer-icp">
        <img :src="icpSvg" alt="" />
        <a
          id="footerIcpLink"
          href="https://beian.miit.gov.cn/#/Integrated/index"
          target="_blank"
          rel="noopener"
          >{{ sysConfig.icp }}</a
        >
      </p>
      <p id="footerCopyright">
        Copyright {{ copyrightYears }}
        <RouterLink to="/">{{ sysConfig.name }}</RouterLink>. All Rights Reserved.
      </p>
    </div>
  </div>
</template>
