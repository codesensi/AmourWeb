<script setup lang="ts">
import icpSvg from "@/assets/portal/img/icp.svg?url";
import type { SysConfigData } from "@/api/sysConfig";

defineOptions({ name: "PortalFooter" });

defineProps<{ sysConfig: Partial<SysConfigData> }>();
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
        Copyright © {{ sysConfig.copyrightYear }} All Rights Reserved.
      </p>
    </div>
  </div>
</template>
