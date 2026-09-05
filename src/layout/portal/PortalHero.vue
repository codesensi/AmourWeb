<script setup lang="ts">
import { inject, onMounted, ref, type Ref } from "vue";
import likeSvg from "@/assets/portal/img/like.svg?url";
import type { HeroInfoData } from "@/api/portal";
import { getHeroes } from "@/api/portal";
import type { SysConfigData } from "@/api/sysConfig";
import { fallbackAvatar } from "@/utils/avatar";
import { fetchQqInfo } from "@/utils/qqInfo";

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

/**
 * 解析单个主角的展示信息:
 * 昵称:QQ 昵称 → 用户表昵称 → 用户名,均为空时返回空串(不显示);
 * 头像:维护了 QQ → 走 /qq-info + avatar-service 头像链路;
 *      未维护 QQ → 用户表上传头像;都没有 → 本地兜底图
 */
async function toHeroView(
  info: HeroInfoData | null
): Promise<{ name: string; avatar: string }> {
  if (!info) return { name: "", avatar: fallbackAvatar };
  if (info.qq) {
    const qqInfo = await fetchQqInfo(info.qq, sysConfig.value.avatarService);
    return {
      name: qqInfo.nickname || info.nickname || info.username || "",
      avatar: qqInfo.avatarUrl
    };
  }
  return {
    name: info.nickname || info.username || "",
    avatar: info.avatar || fallbackAvatar
  };
}

onMounted(async () => {
  // 男女主取自 hero 角色绑定的启用用户;接口不可用时保持本地兜底展示
  try {
    const { success, data } = await getHeroes();
    if (!success || !data) return;
    [female.value, male.value] = await Promise.all([
      toHeroView(data.female),
      toHeroView(data.male)
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
