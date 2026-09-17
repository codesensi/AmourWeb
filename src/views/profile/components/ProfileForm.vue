<script setup lang="ts">
// 资料表单(头像/昵称/性别/邮箱/QQ/简介):脏检测 + 保存 + 放弃
// 数据由父级一次性加载后经 props 下发,保存成功经 saved 事件回传以同步概要横幅
import { computed, reactive, ref } from "vue";
import ReAvatarUpload from "@/components/ReAvatarUpload";
import { DictSelect } from "@/components/DictSelect";
import { message } from "@/utils/message";
import { useUserStoreHook } from "@/store/modules/user";
import type { FormInstance, FormRules } from "element-plus";
import { updateProfile, type ProfileInfo } from "@/api/user-profile";
import warningFilledIcon from "~icons/ep/warning-filled";

const props = defineProps<{
  /** 已加载的当前用户资料(父级 getCurrentUser 结果) */
  user: ProfileInfo;
}>();

const emit = defineEmits<{
  /** 资料保存成功:回传昵称与头像,供父级同步概要横幅 */
  saved: [info: { nickname: string; avatar: string }];
}>();

const userStore = useUserStoreHook();

/** 资料表单(与 sys_user 资料字段对齐) */
const form = reactive<ProfileInfo>({ ...props.user });

const profileFormRef = ref<FormInstance>();
const profileLoading = ref(false);
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

// 初始化快照基线:表单已由 props 一次性填充,以挂载时状态为脏检测与「放弃」恢复的基准
syncSnapshot();

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
      // 同步父级概要横幅
      emit("saved", { nickname: form.nickname, avatar: form.avatar ?? "" });
    }
  } finally {
    profileLoading.value = false;
  }
}

/** 邮箱后缀联想(对齐 pure-admin 个人信息页) */
function queryEmail(
  queryString: string,
  callback: (items: Array<{ value: string }>) => void
) {
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
</script>

<template>
  <el-form
    ref="profileFormRef"
    label-position="top"
    :model="form"
    :rules="profileRules"
  >
    <el-form-item label="头像">
      <ReAvatarUpload v-model="form.avatar" />
    </el-form-item>
    <el-form-item label="昵称" prop="nickname">
      <el-input v-model="form.nickname" clearable placeholder="请输入昵称" />
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
      <el-input v-model="form.qq" clearable placeholder="请输入QQ号" />
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
    <!-- 内联保存操作:作为表单末项参与纵向均布,间距与其他表单项一致,宽屏下与右侧"确认修改"水平对齐 -->
    <el-form-item class="profile-actions">
      <span v-if="isDirty" class="dirty-hint">
        <IconifyIconOffline :icon="warningFilledIcon" />
        个人信息有未保存的更改
      </span>
      <el-button :disabled="!isDirty" @click="resetProfile">放弃</el-button>
      <el-button
        type="primary"
        :disabled="!isDirty"
        :loading="profileLoading"
        @click="saveProfile"
      >
        保存更改
      </el-button>
    </el-form-item>
  </el-form>
</template>

<style scoped>
/* 保存操作行:提示文案 margin-right:auto 把按钮推到行尾,与右栏操作按钮对齐 */
.profile-actions :deep(.el-form-item__content) {
  justify-content: flex-end;
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
</style>
