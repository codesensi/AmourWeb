<script setup lang="ts">
import { computed, ref, watch } from "vue";
import dayjs from "dayjs";
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
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: "",
  size: 80
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

/** 外链判断:http(s) 开头视为外部链接;其余(站内 /file/view/{id}、相对路径、空值)视为站内 */
function isExternalUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

/** 外链地址校验:非空时需以 http(s):// 开头 */
function validateUrl() {
  urlError.value = props.modelValue && !isExternalUrl(props.modelValue)
    ? "请输入正确的图片地址"
    : "";
}

/** 按当前头像形态反推页签选中:外链选中"外部链接",站内路径选中"裁剪上传";
 *  空值不纠正,避免在"外部链接"页签清空输入时被强行切走 */
watch(
  () => props.modelValue,
  value => {
    if (!value) return;
    avatarMode.value = isExternalUrl(value) ? "url" : "upload";
  },
  { immediate: true }
);

/** 头像加载失败提示(外链失效等);按 URL 去重,避免失败重渲染时重复弹提示 */
const avatarErrorNotified = ref("");

function onAvatarError() {
  if (!props.modelValue || avatarErrorNotified.value === props.modelValue) {
    return;
  }
  avatarErrorNotified.value = props.modelValue;
  message("头像图片无法加载,请检查链接", { type: "warning" });
}

/* 裁剪上传:选择文件 → 弹窗裁剪 → 确认上传 */
const uploadRef = ref();
const cropRef = ref();
const isShow = ref(false);
const cropSrc = ref("");
const cropperPayload = ref();
const avatarLoading = ref(false);
/** 用户选择的原始文件名(裁剪会重编码,上传时还原用户视角的文件名) */
const rawFileName = ref("");
/** 用户选择的源文件类型(裁剪输出对齐它;gif 走原图直传不经裁剪) */
const rawType = ref("image/png");

function onChange(uploadFile) {
  const raw = uploadFile.raw;
  // 记录原始文件名与类型,供裁剪上传时提交
  rawFileName.value = uploadFile.name || "";
  rawType.value = raw.type || "image/png";
  // 校验文件类型;大小不在前端拦截,由后端 FileBizTypeEnum 的 maxBytes 校验并提示
  if (!raw.type.startsWith("image/")) {
    message("仅支持图片格式", { type: "warning" });
    return;
  }
  // 动图(gif)不参与裁剪:canvas 裁剪只能产出静态帧,直接上传原图保留动图
  if (raw.type === "image/gif") {
    doUpload(raw, rawFileName.value || buildFallbackName(raw));
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

/** 统一上传入口:裁剪产物与原图直传共用,成功后回填地址并关闭弹窗 */
async function doUpload(blob: Blob, name: string) {
  avatarLoading.value = true;
  try {
    // 以 multipart 上传,后端返回 /file/view/{id} 形态的真实文件 URL
    const res = await uploadAvatar(blob, name);
    if (res.success) {
      emit("update:modelValue", res.data.url);
      emit("uploaded", res.data.url);
      handleClose();
    }
  } finally {
    avatarLoading.value = false;
  }
}

/** 兜底文件名:原始名缺失时按 年月日时分秒.文件类型 生成(如 20250619153042.png) */
function buildFallbackName(blob: Blob) {
  return `${dayjs().format("YYYYMMDDHHmmss")}.${
    blob.type.split("/")[1] || "png"
  }`;
}

async function confirmUpload() {
  if (!cropperPayload.value) {
    message("请先裁剪头像", { type: "warning" });
    return;
  }
  await doUpload(
    cropperPayload.value.blob,
    rawFileName.value || buildFallbackName(cropperPayload.value.blob)
  );
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
        accept=".jpg,.jpeg,.png,.gif,.webp"
        action="#"
        :limit="1"
        :auto-upload="false"
        :show-file-list="false"
        :on-change="onChange"
      >
        <el-button plain :loading="avatarLoading">
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
      <ReCropperPreview
        ref="cropRef"
        :imgSrc="cropSrc"
        :output-type="rawType"
        @cropper="onCropper"
      />
      <template #footer>
        <el-button bg text @click="handleClose">取消</el-button>
        <el-button
          bg
          text
          type="primary"
          :loading="avatarLoading"
          @click="confirmUpload"
        >
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>
