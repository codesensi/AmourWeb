<script setup lang="ts">
import { computed, ref } from "vue";
import ReCropperPreview from "@/components/ReCropperPreview";
import { message } from "@/utils/message";
import { deviceDetection } from "@pureadmin/utils";
import uploadLine from "~icons/ri/upload-line";
import { uploadAvatar } from "@/api/file";

interface Props {
  /** 头像地址(v-model 双向绑定,为空时不渲染预览) */
  modelValue?: string;
  /** 预览尺寸(px) */
  size?: number;
  /** 上传大小限制(MB) */
  maxSize?: number;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: "",
  size: 80,
  maxSize: 2
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
  /** 裁剪上传成功(返回文件地址),即时保存等副作用由父级处理 */
  uploaded: [url: string];
}>();

/** 头像来源:upload-裁剪上传,url-外部链接 */
const avatarMode = ref<"upload" | "url">("upload");
const urlError = ref("");

/** 外链输入框双向绑定 */
const urlModel = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});

/** 外链地址校验:非空时需以 http(s):// 开头 */
function validateUrl() {
  urlError.value =
    props.modelValue && !/^https?:\/\//i.test(props.modelValue)
      ? "请输入正确的图片地址"
      : "";
}

/** 头像加载失败提示(外链失效等) */
function onAvatarError() {
  if (props.modelValue) {
    message("头像图片无法加载,请检查链接", { type: "warning" });
  }
}

/* 裁剪上传:选择文件 → 弹窗裁剪 → 确认上传 */
const uploadRef = ref();
const cropRef = ref();
const isShow = ref(false);
const cropSrc = ref("");
const cropperPayload = ref();
const avatarLoading = ref(false);

function onChange(uploadFile) {
  const raw = uploadFile.raw;
  // 校验文件类型与大小
  if (!raw.type.startsWith("image/")) {
    message("仅支持图片格式", { type: "warning" });
    return;
  }
  if (raw.size > props.maxSize * 1024 * 1024) {
    message(`头像大小不能超过 ${props.maxSize}MB`, { type: "warning" });
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    cropSrc.value = e.target.result as string;
    isShow.value = true;
  };
  reader.readAsDataURL(raw);
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
      emit("update:modelValue", res.data.url);
      emit("uploaded", res.data.url);
      handleClose();
    }
  } finally {
    avatarLoading.value = false;
  }
}
</script>

<template>
  <div class="flex items-start">
    <el-avatar
      v-if="modelValue"
      :size="size"
      :src="modelValue"
      class="shrink-0"
      @error="onAvatarError"
    />
    <div :class="['flex flex-col gap-2', modelValue && 'ml-4']">
      <el-radio-group v-model="avatarMode" size="small">
        <el-radio-button value="upload">裁剪上传</el-radio-button>
        <el-radio-button value="url">外部链接</el-radio-button>
      </el-radio-group>
      <el-upload
        v-if="avatarMode === 'upload'"
        ref="uploadRef"
        accept="image/*"
        action="#"
        :limit="1"
        :auto-upload="false"
        :show-file-list="false"
        :on-change="onChange"
      >
        <el-button plain>
          <IconifyIconOffline :icon="uploadLine" />
          <span class="ml-2">上传头像</span>
        </el-button>
      </el-upload>
      <div v-else>
        <el-input
          v-model="urlModel"
          clearable
          placeholder="https://example.com/avatar.png"
          @blur="validateUrl"
          @input="validateUrl"
        />
        <div v-if="urlError" class="mt-1 text-xs text-(--el-color-danger)">
          {{ urlError }}
        </div>
      </div>
    </div>
    <!-- 编辑头像弹窗:选择图片后裁剪再上传 -->
    <el-dialog
      v-model="isShow"
      width="40%"
      title="编辑头像"
      destroy-on-close
      append-to-body
      :close-on-click-modal="false"
      :before-close="handleClose"
      :fullscreen="deviceDetection()"
    >
      <ReCropperPreview ref="cropRef" :imgSrc="cropSrc" @cropper="onCropper" />
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
</template>
