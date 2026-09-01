<script setup lang="ts">
import { computed, inject, onBeforeUnmount, ref, type Ref } from "vue";
import { RouterLink } from "vue-router";
import cardMoments from "@/assets/portal/img/card/card-moments.svg";
import cardMessage from "@/assets/portal/img/card/card-message.svg";
import cardAbout from "@/assets/portal/img/card/card-about.svg";
import cardLovePhoto from "@/assets/portal/img/card/card-love-photo.svg";
import cardLoveList from "@/assets/portal/img/card/card-love-list.svg";
import type { SysConfigData } from "@/api/sysConfig";

defineOptions({ name: "PortalHome" });

/** 站点展示配置:由 PortalLayout provide */
const site = inject<Ref<Partial<SysConfigData>>>("portalSite", ref({}));

/** 功能卡片:文案与结构照搬原站 */
const cards = [
  {
    title: "点点滴滴",
    desc: "有人愿意听你碎碎念念也很浪漫",
    to: "/little",
    kind: "card",
    icon: cardMoments
  },
  {
    title: "留言板",
    desc: "在这里写下我们的留言祝福",
    to: "/leaving",
    kind: "card",
    icon: cardMessage
  },
  {
    title: "关于我们",
    desc: "我们之间认识的经历回忆",
    to: "/about",
    kind: "card",
    icon: cardAbout
  },
  {
    title: "Love Photo",
    desc: "恋爱相册 记录最美瞬间",
    to: "/photo",
    kind: "card-b",
    icon: cardLovePhoto
  },
  {
    title: "Love List",
    desc: "恋爱列表 你我之间的约定",
    to: "/list",
    kind: "card-b",
    icon: cardLoveList
  }
];

/** 恋爱计时:每秒刷新;起点来自 sys_config,配置未就绪或非法时跳过渲染 */
const now = ref(Date.now());
const clock = window.setInterval(() => {
  now.value = Date.now();
}, 1000);
onBeforeUnmount(() => window.clearInterval(clock));

const loveTime = computed(() => {
  const start = site.value.loveStartDate;
  if (!start) return null;
  const birth = new Date(start);
  if (isNaN(birth.getTime())) return null;
  const timeold = Math.max(0, now.value - birth.getTime());
  const msPerDay = 24 * 60 * 60 * 1000;
  const eDaysold = timeold / msPerDay;
  const days = Math.floor(eDaysold);
  const eHrsold = (eDaysold - days) * 24;
  const hrsold = Math.floor(eHrsold);
  const eMinsold = (eHrsold - hrsold) * 60;
  const minsold = Math.floor(eMinsold);
  let seconds: number | string = Math.floor((eMinsold - minsold) * 60);
  if (seconds < 10) seconds = `0${seconds}`;
  return { days, hours: hrsold, minutes: minsold, seconds };
});
</script>

<template>
  <div class="time">
    <span>这是我们一起走过的</span>
    <b>{{ loveTime?.days }}天</b>
    <b>{{ loveTime?.hours }}时</b>
    <b>{{ loveTime?.minutes }}分</b>
    <b>{{ loveTime?.seconds }}秒</b>
  </div>

  <!-- 功能卡片:整卡可点 -->
  <div class="card-wrap">
    <div class="row central">
      <RouterLink
        v-for="card in cards"
        :key="card.to"
        :to="card.to"
        :class="card.kind"
        class="flex-h animated fadeInUp"
      >
        <img :src="card.icon" alt="" />
        <div class="text">
          <span>{{ card.title }}</span>
          <p>{{ card.desc }}</p>
        </div>
      </RouterLink>
    </div>
  </div>
</template>
