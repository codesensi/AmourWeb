<script setup lang="ts">
// 个人中心:页面壳(数据加载 + 概要横幅 + 双栏布局)
// 资料表单/改用户名/改密码分别由 components/ 下子组件承载
import { reactive, ref } from "vue";
import { useUserStoreHook } from "@/store/modules/user";
import { getCurrentUser } from "@/api/auth";
import type { ProfileInfo } from "@/api/profile";
import ProfileForm from "./components/ProfileForm.vue";
import RenameCard from "./components/RenameCard.vue";
import PasswordCard from "./components/PasswordCard.vue";
import userIcon from "~icons/ep/user";
import lockIcon from "~icons/ep/lock";

defineOptions({
  name: "UserProfile"
});

const userStore = useUserStoreHook();

/** 当前用户资料(加载后分发给各子组件,概要横幅据此渲染) */
const user = reactive<ProfileInfo>({
  username: "",
  nickname: "",
  gender: "",
  email: "",
  qq: "",
  remark: "",
  avatar: ""
});

/** 首屏加载标记:加载中显示骨架屏 */
const loading = ref(true);

/** 加载当前用户资料:复用 current-user 接口(资料部分走后端 user 缓存,不额外查库) */
async function loadProfile() {
  try {
    const { success, data } = await getCurrentUser();
    if (success) {
      Object.assign(user, {
        username: data.username,
        nickname: data.nickname ?? "",
        gender: data.gender ?? "",
        email: data.email ?? "",
        qq: data.qq ?? "",
        remark: data.remark ?? "",
        avatar: data.avatar ?? ""
      });
    }
  } finally {
    loading.value = false;
  }
}

/** 资料保存成功:同步概要横幅显示 */
function onProfileSaved(info: { nickname: string; avatar: string }) {
  user.nickname = info.nickname;
  user.avatar = info.avatar;
}

loadProfile();
</script>

<template>
  <div class="profile-page">
    <!-- 个人信息 / 账号安全 双栏并排(窄屏堆叠);卡片撑满视口余高,底部保留与表格页一致的 36px 灰色区域 -->
    <el-card shadow="never" class="min-w-0 flex-1 flex flex-col">
      <!-- 页头带:页面级标题与双栏工作区分层 -->
      <div class="page-head">
        <span class="page-title">个人中心</span>
        <span class="page-sub">管理你的个人资料与账号安全</span>
      </div>
      <!-- 概要横幅:头像实时预览 + 身份信息;头像更换入口在左栏"头像"表单项 -->
      <div class="profile-banner">
        <el-avatar :size="64" :src="user.avatar">
          <IconifyIconOffline :icon="userIcon" class="text-3xl" />
        </el-avatar>
        <div class="banner-info">
          <div class="banner-name">
            {{ user.nickname || user.username || "—" }}
            <el-tag
              v-for="role in userStore.roles"
              :key="role"
              size="small"
              effect="light"
            >
              {{ role }}
            </el-tag>
          </div>
          <span class="banner-username">@{{ user.username }}</span>
        </div>
      </div>
      <div class="cols">
        <div class="col">
          <div class="col-title">
            <span class="col-icon">
              <IconifyIconOffline :icon="userIcon" />
            </span>
            <span class="t">个人信息</span>
          </div>
          <el-skeleton v-if="loading" :rows="8" animated />
          <ProfileForm v-else :user="user" @saved="onProfileSaved" />
        </div>
        <div class="col">
          <div class="col-title">
            <span class="col-icon">
              <IconifyIconOffline :icon="lockIcon" />
            </span>
            <span class="t">账号安全</span>
          </div>
          <RenameCard v-if="!loading" :username="user.username" />
          <PasswordCard />
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.cols {
  display: flex;
  flex: 1;
  flex-direction: column;

  /* 仅作用于堆叠方向;不用 gap,避免宽屏并排时在分割线左侧叠加横向间隔 */
  row-gap: 18px;

  /* 基础水平间距:叠加卡片 20px 内边距后,内容距卡片边缘 36px */
  padding-inline: 16px;
}

/* 卡片 body 纵向撑满,使双栏与分割线贯穿到内容区底部 */
:deep(.el-card__body) {
  display: flex;
  flex: 1;
  flex-direction: column;
}

.col {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

.col-title {
  display: flex;
  gap: 10px;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.col-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  font-size: 18px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: 8px;
}

.col-title .t {
  font-size: 17px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

/* 页头带:页面级标题与双栏工作区分层 */
.page-head {
  display: flex;
  gap: 12px;
  align-items: baseline;
  padding-bottom: 16px;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.page-sub {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

/* 宽屏双栏并排,窄屏堆叠;分隔线仅在并排时出现 */
@media (width >= 1280px) {
  .cols {
    flex-direction: row;
  }

  .cols .col + .col {
    padding-left: 24px;
    margin-left: 24px;
    border-left: 1px solid var(--el-border-color-lighter);
  }

  /* 双栏内容按自然高度排布,不做纵向拉伸分摊,行距保持一致 */
}

/* 概要横幅:头像预览 + 身份信息,浅主色底与页面主色呼应 */
.profile-banner {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 16px 20px;
  margin-bottom: 20px;
  background: linear-gradient(
    135deg,
    var(--el-color-primary-light-9),
    var(--el-color-primary-light-8)
  );
  border-radius: 8px;
}

.banner-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.banner-name {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.banner-username {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

/* 页面容器:卡片撑满视口余高(最小高度扣除顶部 24px margin,避免溢出滚动),
   底部保留 36px 灰色区域,与表格页(自适应 offsetBottom 补偿后的 36px 视觉留白)一致 */
.profile-page {
  display: flex;
  flex-direction: column;
  min-height: calc(100% - 24px);
  padding-bottom: 36px;
}

/* 表单主次:小号次级色标签 + 聚焦主色光环(子组件根元素继承本组件作用域,
   :deep 规则可贯穿至三个子组件的表单内部) */
:deep(.el-form-item__label) {
  margin-bottom: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

:deep(.el-input__wrapper.is-focus),
:deep(.el-textarea__inner:focus) {
  box-shadow:
    0 0 0 1px var(--el-color-primary) inset,
    0 0 0 3px var(--el-color-primary-light-8);
}
</style>
