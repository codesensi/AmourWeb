<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import ReCropperPreview from "@/components/ReCropperPreview";
import { DictSelect } from "@/components/DictSelect";
import { message } from "@/utils/message";
import { fallbackAvatar } from "@/utils/avatar";
import { useUserStoreHook } from "@/store/modules/user";
import { ZxcvbnFactory } from "@zxcvbn-ts/core";
import type { FormInstance, FormRules } from "element-plus";
import { deviceDetection } from "@pureadmin/utils";
import uploadLine from "~icons/ri/upload-line";
import { changePassword, updateProfile, type ProfileInfo } from "@/api/profile";
import { getCurrentUser } from "@/api/user";
import { uploadAvatar } from "@/api/file";

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

const imgSrc = computed(() => form.avatar || fallbackAvatar);

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

async function saveProfile() {
  await profileFormRef.value?.validate();
  profileLoading.value = true;
  try {
    const { success } = await updateProfile({ ...form });
    if (success) {
      message("资料更新成功", { type: "success" });
      // 同步导航栏昵称显示
      userStore.SET_NICKNAME(form.nickname);
      syncSnapshot();
    }
  } finally {
    profileLoading.value = false;
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

/* 头像上传:选择文件 → 弹窗裁剪 → 确认上传 */
const uploadRef = ref();
const cropRef = ref();
const isShow = ref(false);
const cropSrc = ref("");
const cropperPayload = ref();
const avatarLoading = ref(false);

function onChange(uploadFile) {
  const reader = new FileReader();
  reader.onload = e => {
    cropSrc.value = e.target.result as string;
    isShow.value = true;
  };
  reader.readAsDataURL(uploadFile.raw);
}

function onCropper(payload) {
  cropperPayload.value = payload;
}

function handleClose() {
  cropRef.value?.hidePopover();
  uploadRef.value?.clearFiles();
  isShow.value = false;
}

async function saveAvatar() {
  if (!cropperPayload.value) {
    message("请先裁剪头像", { type: "warning" });
    return;
  }
  avatarLoading.value = true;
  try {
    // mock 阶段:裁剪产物直接回传 base64;后端文件服务落地后返回真实文件 URL
    const res = await uploadAvatar({ file: cropperPayload.value });
    if (res.success) {
      form.avatar = res.data.url;
      const { success } = await updateProfile({ ...form });
      if (success) {
        // 同步导航栏头像显示
        userStore.SET_AVATAR(form.avatar);
        message("头像更新成功", { type: "success" });
        syncSnapshot();
      }
      handleClose();
    }
  } finally {
    avatarLoading.value = false;
  }
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
  pwdLoading.value = true;
  try {
    const { success } = await changePassword({
      oldPassword: pwdForm.oldPwd,
      newPassword: pwdForm.newPwd
    });
    if (success) {
      message("密码修改成功", { type: "success" });
      pwdForm.oldPwd = "";
      pwdForm.newPwd = "";
      pwdForm.confirmPwd = "";
    }
  } finally {
    pwdLoading.value = false;
  }
}

loadProfile();
</script>

<template>
  <div class="p-2">
    <el-card shadow="never">
      <div class="flex flex-col gap-4 lg:flex-row lg:gap-10">
        <!-- 左栏:个人信息 -->
        <div class="min-w-0 flex-1 lg:max-w-[600px]">
          <h3 class="my-4! text-base font-medium">个人信息</h3>
          <el-skeleton v-if="loading" :rows="9" animated />
          <template v-else>
            <!-- 身份卡:头像 + 昵称 + 角色标签 -->
            <div class="mb-6 flex items-center gap-4">
              <el-avatar :size="56" :src="imgSrc" />
              <div class="flex flex-col gap-1">
                <span class="text-lg font-bold">
                  {{ form.nickname || form.username }}
                </span>
                <div class="flex flex-wrap gap-2">
                  <el-tag
                    v-for="role in userStore.roles"
                    :key="role"
                    size="small"
                  >
                    {{ role }}
                  </el-tag>
                </div>
              </div>
            </div>
            <el-form
              ref="profileFormRef"
              label-position="top"
              :model="form"
              :rules="profileRules"
            >
              <el-form-item label="头像">
                <el-avatar :size="80" :src="imgSrc" />
                <el-upload
                  ref="uploadRef"
                  accept="image/*"
                  action="#"
                  :limit="1"
                  :auto-upload="false"
                  :show-file-list="false"
                  :on-change="onChange"
                >
                  <el-button plain class="ml-4!">
                    <IconifyIconOffline :icon="uploadLine" />
                    <span class="ml-2">更新头像</span>
                  </el-button>
                </el-upload>
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
                  :autosize="{ minRows: 6, maxRows: 8 }"
                  maxlength="56"
                  show-word-limit
                  placeholder="介绍一下自己吧"
                />
              </el-form-item>
            </el-form>
            <!-- 未保存时出现的粘性保存条 -->
            <div
              v-if="isDirty"
              class="sticky bottom-0 z-10 mt-2 flex items-center gap-2 border-t border-[var(--el-border-color-lighter)] bg-[var(--el-card-bg-color)] py-3"
            >
              <span class="text-sm text-[var(--el-text-color-secondary)]">
                有未保存的更改
              </span>
              <div class="ml-auto flex gap-2">
                <el-button @click="resetProfile">放弃</el-button>
                <el-button
                  type="primary"
                  :loading="profileLoading"
                  @click="saveProfile"
                >
                  保存更改
                </el-button>
              </div>
            </div>
          </template>
          <!-- 编辑头像弹窗:选择图片后裁剪再上传 -->
          <el-dialog
            v-model="isShow"
            width="40%"
            title="编辑头像"
            destroy-on-close
            :close-on-click-modal="false"
            :before-close="handleClose"
            :fullscreen="deviceDetection()"
          >
            <ReCropperPreview
              ref="cropRef"
              :imgSrc="cropSrc"
              @cropper="onCropper"
            />
            <template #footer>
              <el-button bg text @click="handleClose">取消</el-button>
              <el-button
                bg
                text
                type="primary"
                :loading="avatarLoading"
                @click="saveAvatar"
              >
                确定
              </el-button>
            </template>
          </el-dialog>
        </div>
        <!-- 右栏:更改密码 -->
        <div class="min-w-0 flex-1 lg:max-w-[520px]">
          <h3 class="my-4! text-base font-medium">更改密码</h3>
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
            <div v-if="pwdForm.newPwd" class="mb-4 flex">
              <div
                v-for="({ color, text }, idx) in pwdProgress"
                :key="idx"
                class="flex-1"
                :style="{ marginLeft: idx !== 0 ? '4px' : 0 }"
              >
                <el-progress
                  :percentage="curScore >= idx ? 100 : 0"
                  :color="color"
                  :duration="curScore === idx ? 6 : 0"
                  :stroke-width="10"
                  striped
                  striped-flow
                  :show-text="false"
                />
                <p
                  class="text-center"
                  :style="{ color: curScore === idx ? color : '' }"
                >
                  {{ text }}
                </p>
              </div>
            </div>
            <el-button
              type="primary"
              :loading="pwdLoading"
              @click="savePassword"
            >
              确认修改
            </el-button>
          </el-form>
        </div>
      </div>
    </el-card>
  </div>
</template>
