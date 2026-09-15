<script setup lang="ts">
// 修改密码卡片:zxcvbn 强度提示 + 二次确认,保存成功后退出登录
import { computed, reactive, ref, watch } from "vue";
import { message } from "@/utils/message";
import { useUserStoreHook } from "@/store/modules/user";
import { ZxcvbnFactory } from "@zxcvbn-ts/core";
import type { FormInstance } from "element-plus";
import { updatePassword } from "@/api/profile";
import { confirmAction } from "@/utils/message";
import keyIcon from "~icons/ep/key";

const userStore = useUserStoreHook();

const pwdFormRef = ref<FormInstance>();
const pwdLoading = ref(false);
const pwdForm = reactive({
  oldPwd: "",
  newPwd: "",
  confirmPwd: ""
});
const pwdProgress = [
  { color: "#e74242", text: "非常弱" },
  { color: "#EFBD47", text: "弱" },
  { color: "#ffa500", text: "一般" },
  { color: "#1bbf1b", text: "强" },
  { color: "#008000", text: "非常强" }
];
const zxcvbnFactory = new ZxcvbnFactory();
const curScore = ref(-1);

/** 内容无更改(三项均为空)时按钮禁用 */
const pwdDirty = computed(
  () => !!(pwdForm.oldPwd || pwdForm.newPwd || pwdForm.confirmPwd)
);

watch(
  () => pwdForm.newPwd,
  newPwd => (curScore.value = newPwd ? zxcvbnFactory.check(newPwd).score : -1)
);

/** 密码强度展示:zxcvbn score(0-4)映射为单条进度条与文案 */
const strengthPercentage = computed(() => ((curScore.value + 1) / 5) * 100);
const strengthColor = computed(() =>
  curScore.value >= 0 ? pwdProgress[curScore.value].color : "#dcdfe6"
);
const strengthText = computed(() =>
  curScore.value >= 0 ? pwdProgress[curScore.value].text : ""
);

const pwdRules = {
  oldPwd: [{ required: true, message: "请输入原密码", trigger: "blur" }],
  newPwd: [
    { required: true, message: "请输入新密码", trigger: "blur" },
    { min: 6, message: "密码长度不能少于 6 位", trigger: "blur" },
    // 长度上限对齐后端 UserPasswordUpdateRequest 的 PASSWORD_MAX_LENGTH
    { max: 64, message: "密码长度不能超过 64 位", trigger: "blur" }
  ],
  confirmPwd: [
    { required: true, message: "请再次输入新密码", trigger: "blur" },
    {
      validator: (
        _rule: unknown,
        value: string,
        callback: (error?: Error) => void
      ) => {
        if (value !== pwdForm.newPwd) {
          callback(new Error("两次输入的密码不一致"));
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ]
};

async function savePassword() {
  await pwdFormRef.value?.validate();
  if (
    !(await confirmAction(
      "修改密码后将退出登录,需使用新密码重新登录,是否继续?"
    ))
  ) {
    return;
  }
  pwdLoading.value = true;
  try {
    const { success } = await updatePassword({
      oldPassword: pwdForm.oldPwd,
      newPassword: pwdForm.newPwd
    });
    if (success) {
      message("密码修改成功,请重新登录", { type: "success" });
      // 服务端已踢出会话,前端清理本地登录态并跳转登录页
      userStore.logOut();
    }
  } finally {
    pwdLoading.value = false;
  }
}
</script>

<template>
  <div class="sec-card">
    <div class="sec-card-head">
      <span class="sec-icon">
        <IconifyIconOffline :icon="keyIcon" />
      </span>
      <div class="sec-card-t">
        <span class="t">修改密码</span>
        <span class="d">
          修改密码成功后将退出登录,需使用新密码重新登录,请确认当前密码已牢记。
        </span>
      </div>
    </div>
    <el-form
      ref="pwdFormRef"
      label-position="top"
      :model="pwdForm"
      :rules="pwdRules"
    >
      <el-form-item label="原密码" prop="oldPwd">
        <el-input
          v-model="pwdForm.oldPwd"
          type="password"
          show-password
          clearable
          placeholder="请输入原密码"
        />
      </el-form-item>
      <el-form-item label="新密码" prop="newPwd">
        <el-input
          v-model="pwdForm.newPwd"
          type="password"
          show-password
          clearable
          placeholder="请输入新密码"
        />
      </el-form-item>
      <el-form-item label="确认密码" prop="confirmPwd">
        <el-input
          v-model="pwdForm.confirmPwd"
          type="password"
          show-password
          clearable
          placeholder="请再次输入新密码"
        />
      </el-form-item>
      <div v-if="pwdForm.newPwd" class="mb-4">
        <el-progress
          :percentage="strengthPercentage"
          :color="strengthColor"
          :stroke-width="10"
          striped
          striped-flow
          :show-text="false"
        />
        <p class="strength-txt">密码强度:{{ strengthText }}</p>
      </div>
      <el-form-item class="sec-actions">
        <el-button
          type="primary"
          :disabled="!pwdDirty"
          :loading="pwdLoading"
          @click="savePassword"
        >
          确认修改
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

.strength-txt {
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
