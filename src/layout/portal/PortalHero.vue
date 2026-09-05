<script setup lang="ts">
import { inject, onMounted, ref } from "vue";
import likeSvg from "@/assets/portal/img/like.svg?url";
import type { SysConfigData } from "@/api/sysConfig";
import { fallbackAvatar } from "@/utils/avatar";
import { fetchQqInfo } from "@/utils/qqInfo";

defineOptions({ name: "PortalHero" });

/** 站点展示配置(portal 布局 provide):随机头像服务地址模板取自 sys_config avatar-service */
const sysConfig = inject("portalSysConfig", ref<Partial<SysConfigData>>({}));

// 男女主昵称与头像 QQ:暂时页面写死,后续头像方案定稿后再改造
const FEMALE_QQ = "673822943";
const MALE_QQ = "2623669948";

/** 男女主展示信息:头像初始为本地兜底图,挂载后按现有展示逻辑拉取 */
const female = ref({
  name: "Su",
  avatar: fallbackAvatar
});
const male = ref({
  name: "Li",
  avatar: fallbackAvatar
});

/** 头像加载失败:改用本地兜底图 */
function onHeroAvatarError(target: { avatar: string }) {
  target.avatar = fallbackAvatar;
}

onMounted(async () => {
  // 现有头像展示逻辑:/qq-info 解析地址优先,为空时按 avatar-service 以 QQ 号兜底
  const [femaleInfo, maleInfo] = await Promise.all([
    fetchQqInfo(FEMALE_QQ, sysConfig.value.avatarService),
    fetchQqInfo(MALE_QQ, sysConfig.value.avatarService)
  ]);
  female.value.avatar = femaleInfo.avatarUrl;
  male.value.avatar = maleInfo.avatarUrl;
});
</script>

<template>
  <!-- 首屏:背景壁纸 + 双头像心跳 + 四层波浪(全部门户页共享) -->
  <div class="bg-wrap">
    <div class="bg-img">
      <div class="central central-800">
        <div class="middle animated fadeInDown">
          <div class="img-female">
            <img
              :src="female.avatar"
              draggable="false"
              alt=""
              @error="onHeroAvatarError(female)"
            />
            <span>{{ female.name }}</span>
          </div>
          <div class="love-icon">
            <img :src="likeSvg" draggable="false" alt="" />
          </div>
          <div class="img-male">
            <img
              :src="male.avatar"
              draggable="false"
              alt=""
              @error="onHeroAvatarError(male)"
            />
            <span>{{ male.name }}</span>
          </div>
        </div>
      </div>
      <svg
        class="waves"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        viewBox="0 24 150 28"
        preserveAspectRatio="none"
        shape-rendering="auto"
      >
        <defs>
          <path
            id="gentle-wave"
            d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z"
          />
        </defs>
        <g class="parallax">
          <use
            xlink:href="#gentle-wave"
            x="48"
            y="0"
            fill="rgba(255,255,255,0.7"
          />
          <use
            xlink:href="#gentle-wave"
            x="48"
            y="3"
            fill="rgba(255,255,255,0.5)"
          />
          <use
            xlink:href="#gentle-wave"
            x="48"
            y="5"
            fill="rgba(255,255,255,0.3)"
          />
          <use xlink:href="#gentle-wave" x="48" y="7" fill="#fff" />
        </g>
      </svg>
    </div>
  </div>
</template>
