<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import ReAvatarUpload from "@/components/ReAvatarUpload";
import { DictSelect } from "@/components/DictSelect";
import { message } from "@/utils/message";
import { useUserStoreHook } from "@/store/modules/user";
import { ZxcvbnFactory } from "@zxcvbn-ts/core";
import type { FormInstance, FormRules } from "element-plus";
import {
  renameUser,
  updatePassword,
  updateProfile,
  type ProfileInfo
} from "@/api/profile";
import { getCurrentUser } from "@/api/user";
import { ElMessageBox } from "element-plus";
import userIcon from "~icons/ep/user";
import lockIcon from "~icons/ep/lock";
import warningFilledIcon from "~icons/ep/warning-filled";

defineOptions({
  name: "UserProfile"
});

const userStore = useUserStoreHook();

/** 资料表单(与 sys_user 资料字段对齐) */
const form = reactive<ProfileInfo>({
  username: "",
  nickname: "",
  gender: "",
  email: "",
  qq: "",
  remark: "",
  avatar: ""
});

/* ================= 个人信息 ================= */

const profileFormRef = ref<FormInstance>();
const profileLoading = ref(false);
/** 首屏加载标记:加载中显示骨架屏 */
const loading = ref(true);
/** 已保存状态的快照(JSON):用于脏检测与「放弃」恢复 */
const snapshot = ref<string | null>(null);
/** 表单与最近一次保存状态不一致时显示底部保存条 */
const isDirty = computed(
  () =>
    snapshot.value !== null && JSON.stringify({ ...form }) !== snapshot.value
);

function syncSnapshot() {
  snapshot.value = JSON.stringify({ ...form });
}

/** 放弃修改:恢复到最近一次保存状态 */
function resetProfile() {
  if (!snapshot.value) return;
  Object.assign(form, JSON.parse(snapshot.value) as ProfileInfo);
  profileFormRef.value?.clearValidate();
}

const profileRules = reactive<FormRules<ProfileInfo>>({
  nickname: [{ required: true, message: "请输入昵称", trigger: "blur" }],
  email: [
    {
      type: "email",
      message: "邮箱格式不正确",
      trigger: ["blur", "change"]
    }
  ]
});

/** 加载当前用户资料:复用 current-user 接口(资料部分走后端 user 缓存,不额外查库) */
async function loadProfile() {
  try {
    const { success, data } = await getCurrentUser();
    if (success) {
      form.username = data.username;
      form.nickname = data.nickname ?? "";
      nameForm.username = data.username ?? "";
      form.gender = data.gender ?? "";
      form.email = data.email ?? "";
      form.qq = data.qq ?? "";
      form.remark = data.remark ?? "";
      form.avatar = data.avatar ?? "";
      syncSnapshot();
    }
  } finally {
    loading.value = false;
  }
}

/** 资料更新载荷(剔除只读的 username 字段,后端仅接收白名单资料字段) */
function profilePayload(): Omit<ProfileInfo, "username"> {
  return {
    nickname: form.nickname,
    gender: form.gender,
    email: form.email,
    qq: form.qq,
    remark: form.remark,
    avatar: form.avatar
  };
}

/** 敏感操作二次确认:确认返回 true,取消返回 false */
function confirmRelogin(tip: string): Promise<boolean> {
  return ElMessageBox.confirm(tip, "系统提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
    draggable: true
  })
    .then(() => true)
    .catch(() => false);
}

async function saveProfile() {
  await profileFormRef.value?.validate();
  profileLoading.value = true;
  try {
    const { success } = await updateProfile(profilePayload());
    if (success) {
      message("资料更新成功", { type: "success" });
      // 同步导航栏昵称与头像显示
      userStore.SET_NICKNAME(form.nickname);
      userStore.SET_AVATAR(form.avatar ?? "");
      syncSnapshot();
    }
  } finally {
    profileLoading.value = false;
  }
}

/* ================= 更改名称 ================= */
const nameFormRef = ref();
const nameLoading = ref(false);
const nameForm = reactive({ username: "" });
const nameRules = reactive<FormRules<{ username: string }>>({
  username: [{ required: true, message: "请输入用户名", trigger: "blur" }]
});

/** 保存用户名:用户名为登录凭证,修改成功后退出登录,需使用新用户名重新登录 */
async function saveName() {
  await nameFormRef.value?.validate();
  if (
    !(await confirmRelogin(
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

/** 邮箱后缀联想(对齐 pure-admin 个人信息页) */
function queryEmail(queryString, callback) {
  const emailList = [
    { value: "@qq.com" },
    { value: "@126.com" },
    { value: "@163.com" }
  ];
  const queryList = emailList.map(item => ({
    value: `${queryString.split("@")[0]}${item.value}`
  }));
  callback(
    queryString
      ? queryList.filter(item =>
          item.value.toLowerCase().startsWith(queryString.toLowerCase())
        )
      : queryList
  );
}

/* ================= 更改密码 ================= */

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
    { min: 6, message: "密码长度不能少于 6 位", trigger: "blur" }
  ],
  confirmPwd: [
    { required: true, message: "请再次输入新密码", trigger: "blur" },
    {
      validator: (_rule, value, callback) => {
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
    !(await confirmRelogin(
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

loadProfile();
</script>

<template>
  <div class="profile-page">
    <!-- 个人信息 / 账号安全 双栏并排(窄屏堆叠);卡片撑满视口余高,底部保留与用户管理页一致的 100px 灰色区域 -->
    <el-card shadow="never" class="min-w-0 flex-1">
      <div class="cols">
        <div class="col">
          <div class="col-title">
            <IconifyIconOffline :icon="userIcon" class="col-icon" />
            <span class="t">个人信息</span>
          </div>
          <el-skeleton v-if="loading" :rows="8" animated />
          <template v-else>
            <el-form
              ref="profileFormRef"
              label-position="top"
              :model="form"
              :rules="profileRules"
              class="max-w-150"
            >
              <el-form-item label="头像">
                <ReAvatarUpload v-model="form.avatar" />
              </el-form-item>
              <el-form-item label="昵称" prop="nickname">
                <el-input
                  v-model="form.nickname"
                  clearable
                  placeholder="请输入昵称"
                />
              </el-form-item>
              <el-form-item label="性别">
                <DictSelect
                  v-model="form.gender"
                  dict-code="gender"
                  placeholder="请选择性别"
                  class="w-full"
                  clearable
                />
              </el-form-item>
              <el-form-item label="邮箱" prop="email">
                <el-autocomplete
                  v-model="form.email"
                  :fetch-suggestions="queryEmail"
                  :trigger-on-focus="false"
                  clearable
                  placeholder="请输入邮箱"
                  class="w-full"
                />
              </el-form-item>
              <el-form-item label="QQ号">
                <el-input
                  v-model="form.qq"
                  clearable
                  placeholder="请输入QQ号"
                />
              </el-form-item>
              <el-form-item label="简介" prop="remark">
                <el-input
                  v-model="form.remark"
                  type="textarea"
                  :autosize="{ minRows: 4, maxRows: 8 }"
                  maxlength="56"
                  show-word-limit
                  placeholder="介绍一下自己吧"
                />
              </el-form-item>
            </el-form>
            <!-- 内联保存操作:常驻展示,有未保存更改时才可操作 -->
            <div
              class="mt-2 flex items-center gap-2 border-t border-(--el-border-color-lighter) pt-3"
            >
              <span v-if="isDirty" class="dirty-hint">
                <IconifyIconOffline :icon="warningFilledIcon" />
                个人信息有未保存的更改
              </span>
              <el-button :disabled="!isDirty" @click="resetProfile">
                放弃
              </el-button>
              <el-button
                type="primary"
                :disabled="!isDirty"
                :loading="profileLoading"
                @click="saveProfile"
              >
                保存更改
              </el-button>
            </div>
          </template>
        </div>
        <div class="col">
          <div class="col-title">
            <IconifyIconOffline :icon="lockIcon" class="col-icon" />
            <span class="t">账号安全</span>
          </div>
          <div class="sec">
            <div class="sec-head">
              <span class="sec-bar" />
              <span class="sec-title">修改用户名</span>
            </div>
            <el-alert
              class="sec-alert"
              type="info"
              :closable="false"
              show-icon
              title="用户名为登录凭证,修改成功后将退出登录,需使用新用户名重新登录。"
            />
            <el-form
              ref="nameFormRef"
              label-position="top"
              :model="nameForm"
              :rules="nameRules"
              class="max-w-150"
            >
              <el-form-item label="用户名" prop="username">
                <el-input
                  v-model="nameForm.username"
                  maxlength="128"
                  clearable
                  placeholder="请输入新的用户名"
                />
              </el-form-item>
              <el-form-item>
                <el-button
                  type="primary"
                  :loading="nameLoading"
                  @click="saveName"
                >
                  保存更改
                </el-button>
              </el-form-item>
            </el-form>
          </div>
          <div class="sec">
            <div class="sec-head">
              <span class="sec-bar" />
              <span class="sec-title">修改密码</span>
            </div>
            <el-alert
              class="sec-alert"
              type="info"
              :closable="false"
              show-icon
              title="修改密码成功后将退出登录,需使用新密码重新登录,请确认当前密码已牢记。"
            />
            <el-form
              ref="pwdFormRef"
              label-position="top"
              :model="pwdForm"
              :rules="pwdRules"
              class="max-w-150"
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
              <el-form-item>
                <el-button
                  type="primary"
                  :loading="pwdLoading"
                  @click="savePassword"
                >
                  确认修改
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.cols {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.col {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 18px;
  min-width: 0;
}

.col-title {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 4px;
}

.col-icon {
  font-size: 18px;
  color: var(--el-color-primary);
}

.col-title .t {
  font-size: 16px;
  font-weight: 500;
  color: var(--el-text-color-primary);
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
}

.dirty-hint {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 4px 10px;
  margin-right: auto;
  font-size: 13px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-8);
  border-radius: 4px;
}

.sec-head {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 6px;
}

.sec-bar {
  width: 3px;
  height: 16px;
  background: var(--el-color-primary);
  border-radius: 2px;
}

.sec-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

/* 对齐表格页:底部 margin 归零,底部留白由 .profile-page 自行声明 */
.main-content {
  margin: 24px 24px 0 !important;
}

/* 页面容器:卡片撑满视口余高(最小高度扣除顶部 24px margin,避免溢出滚动),
   底部保留 100px 灰色区域,与用户管理页一致 */
.profile-page {
  display: flex;
  flex-direction: column;
  min-height: calc(100% - 24px);
  padding-bottom: 100px;
}

/* el-alert 自带 margin:0(未分层样式),须用 scoped 规则显式覆盖间距 */
.sec-alert {
  margin-bottom: 16px;
}

.strength-txt {
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-secondary);
}
</style>
