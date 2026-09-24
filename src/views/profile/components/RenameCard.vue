<script setup lang="ts">
// 修改用户名卡片:用户名为登录凭证,保存成功后退出登录,需使用新用户名重新登录
import { computed, reactive, ref } from "vue";
import { confirmAction, message } from "@/utils/message";
import { useUserStoreHook } from "@/store/modules/user";
import type { FormInstance, FormRules } from "element-plus";
import { renameUser } from "@/api/user-profile";
import editPenIcon from "~icons/ep/edit-pen";

const props = defineProps<{
  /** 当前用户名(用于未更改禁用判定) */
  username: string;
}>();

const userStore = useUserStoreHook();

const nameFormRef = ref<FormInstance>();
const nameLoading = ref(false);
const nameForm = reactive({ username: props.username });
const nameRules = reactive<FormRules<{ username: string }>>({
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { max: 64, message: "用户名长度不能超过 64 位", trigger: "blur" }
  ]
});

/** 内容无更改(与当前用户名一致或为空)时按钮禁用 */
const nameDirty = computed(
  () => !!nameForm.username && nameForm.username !== props.username
);

/** 保存用户名:用户名为登录凭证,修改成功后退出登录,需使用新用户名重新登录 */
async function saveName() {
  await nameFormRef.value?.validate();
  if (
    !(await confirmAction(
      "修改用户名后将退出登录,需使用新用户名重新登录,是否继续?"
    ))
  ) {
    return;
  }
  nameLoading.value = true;
  try {
    const { success } = await renameUser({ username: nameForm.username });
    if (success) {
      message("用户名修改成功,请重新登录", { type: "success" });
      // 服务端已踢出会话,前端清理本地登录态并跳转登录页
      userStore.logOut();
    }
  } finally {
    nameLoading.value = false;
  }
}
</script>

<template>
  <div class="sec-card">
    <div class="sec-card-head">
      <span class="sec-icon">
        <IconifyIconOffline :icon="editPenIcon" />
      </span>
      <div class="sec-card-t">
        <span class="t">修改用户名</span>
        <span class="d">
          用户名为登录凭证,修改成功后将退出登录,需使用新用户名重新登录。
        </span>
      </div>
    </div>
    <el-form
      ref="nameFormRef"
      label-position="top"
      :model="nameForm"
      :rules="nameRules"
    >
      <el-form-item label="用户名" prop="username">
        <el-input
          v-model="nameForm.username"
          maxlength="64"
          clearable
          placeholder="请输入新的用户名"
        />
      </el-form-item>
      <el-form-item class="sec-actions">
        <el-button
          type="primary"
          :disabled="!nameDirty"
          :loading="nameLoading"
          @click="saveName"
        >
          保存更改
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped>
/* 账号安全卡片:图标 + 标题 + 说明 + 内联表单,内容自然高度 */
.sec-card {
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.sec-card-head {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 12px;
}

.sec-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  font-size: 16px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: 8px;
}

.sec-card-t {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sec-card-t .t {
  font-size: 15px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.sec-card-t .d {
  font-size: 12px;
  line-height: 18px;
  color: var(--el-text-color-secondary);
}

/* 卡片内操作行:按钮靠右,与左栏操作行方向一致 */
.sec-actions :deep(.el-form-item__content) {
  justify-content: flex-end;
}
</style>
