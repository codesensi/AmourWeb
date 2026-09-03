<script setup lang="ts">
import likeSvg from "@/assets/portal/img/like.svg?url";
import { qqAvatar } from "@/api/sysConfig";

defineOptions({ name: "PortalHero" });

// 男女主昵称与头像:暂时页面写死,后续头像方案定稿后再改造
// (头像地址与 sys_config qq-service 模板同源:q1.qlogo.cn 按号拉取)
const female = { name: "Su", avatar: qqAvatar("673822943") };
const male = { name: "Li", avatar: qqAvatar("2623669948") };
</script>

<template>
  <!-- 首屏:背景壁纸 + 双头像心跳 + 四层波浪(全部门户页共享) -->
  <div class="bg-wrap">
    <div class="bg-img">
      <div class="central central-800">
        <div class="middle animated fadeInDown">
          <div class="img-female">
            <img :src="female.avatar" draggable="false" alt="" />
            <span>{{ female.name }}</span>
          </div>
          <div class="love-icon">
            <img :src="likeSvg" draggable="false" alt="" />
          </div>
          <div class="img-male">
            <img :src="male.avatar" draggable="false" alt="" />
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
