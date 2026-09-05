<script setup lang="ts">
import { inject, onMounted, ref, type Ref } from "vue";
import likeSvg from "@/assets/portal/img/like.svg?url";
import { getHeroes } from "@/api/portal";
import type { SysConfigData } from "@/api/sysConfig";
import { fallbackAvatar } from "@/utils/avatar";
import { resolveUserDisplay } from "@/utils/userDisplay";

defineOptions({ name: "PortalHero" });

/** 站点展示配置(portal 布局 provide):随机头像服务地址模板取自 sys_config avatar-service */
const sysConfig = inject<Ref<Partial<SysConfigData>>>(
  "portalSysConfig",
  ref({})
);

/** 男女主展示信息:初始头像为本地兜底图,昵称留空(为空时不显示),挂载后由 /portal/hero 回填 */
const female = ref({ name: "", avatar: fallbackAvatar });
const male = ref({ name: "", avatar: fallbackAvatar });

/** 头像加载失败:改用本地兜底图 */
function onHeroAvatarError(target: { avatar: string }) {
  target.avatar = fallbackAvatar;
}

onMounted(async () => {
  // 男女主取自 hero 角色绑定的启用用户;展示链路(QQ 优先)见 utils/userDisplay;
  // 接口不可用时保持本地兜底展示
  try {
    const { success, data } = await getHeroes();
    if (!success || !data) return;
    [female.value, male.value] = await Promise.all([
      resolveUserDisplay(data.female, sysConfig.value.avatarService),
      resolveUserDisplay(data.male, sysConfig.value.avatarService)
    ]);
  } catch {
    // 后端不可用:静默降级
  }
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
            <span v-if="female.name">{{ female.name }}</span>
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
            <span v-if="male.name">{{ male.name }}</span>
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
