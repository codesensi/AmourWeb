<script setup lang="ts">
import { computed, ref, watch } from "vue";
import dayjs from "dayjs";
import type { UploadFile } from "element-plus";
import type Cropper from "cropperjs";
import ReCropperPreview from "@/components/ReCropperPreview";
import { ElMessageBox } from "element-plus";
import { message } from "@/utils/message";
import { deviceDetection } from "@pureadmin/utils";
import uploadLine from "~icons/ri/upload-line";
import closeLine from "~icons/ri/close-line";
import { deleteFile, uploadFile } from "@/api/file";

/** 裁剪产物载荷(对齐 ReCropperPreview 的 cropper 事件) */
interface CropperPayload {
  base64: string;
  blob: Blob;
  info: Cropper.Data & { size: number };
}

interface Props {
  /** 头像地址(v-model 双向绑定,为空时不渲染预览) */
  modelValue?: string;
  /** 预览尺寸(px) */
  size?: number;
  /** 上传业务类型(路由后端 FileBizTypeEnum 的校验规则;默认头像) */
  bizType?: string;
  /** 文案主体(按钮/弹窗/提示中的对象名;默认头像) */
  label?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: "",
  size: 80,
  bizType: "avatar",
  label: "头像"
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
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
  urlError.value =
    props.modelValue && !isExternalUrl(props.modelValue)
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
  message(`${props.label}图片无法加载,请检查链接`, { type: "warning" });
}

/** 站内文件 URL 解析文件 ID(仅识别 /file/view/{id} 形态);外链返回 null */
function parseViewFileId(url: string) {
  return /^\/file\/view\/(\d+)$/.exec(url)?.[1] ?? null;
}

/** 清除请求进行中标记(防重入:避免确认框期间重复触发并发删除) */
const clearing = ref(false);

/** 清除图片:确认后站内文件逻辑删除进回收站,外链仅清空引用;
 *  值清空后由业务侧保存/更新按钮落库,消费端按空值回退兜底图 */
async function onClear() {
  if (clearing.value) return;
  clearing.value = true;
  try {
    const fileId = parseViewFileId(props.modelValue);
    const confirmed = await ElMessageBox.confirm(
      fileId
        ? `确认清除当前${props.label}?清除后图片文件将移入文件回收站。`
        : `确认清除当前${props.label}?外部链接仅清空引用,不影响原文件。`,
      "清除确认",
      {
        confirmButtonText: "确认清除",
        cancelButtonText: "取消",
        type: "warning",
        // 确认语义弹窗禁用点击遮罩关闭,防误触取消
        closeOnClickModal: false,
        draggable: true
      }
    ).catch(() => false);
    if (!confirmed) return;
    // 站内文件逻辑删除到回收站;失败提示由 http 拦截器统一弹出
    if (fileId) {
      const res = await deleteFile(fileId);
      if (!res.success) return;
    }
    emit("update:modelValue", "");
    message("清除成功", { type: "success" });
  } finally {
    clearing.value = false;
  }
}

/* 裁剪上传:选择文件 → 弹窗裁剪 → 确认上传 */
const uploadRef = ref();
const isShow = ref(false);
const cropSrc = ref("");
const cropperPayload = ref<CropperPayload>();
const avatarLoading = ref(false);
/** 用户选择的原始文件名(裁剪会重编码,上传时还原用户视角的文件名) */
const rawFileName = ref("");
/** 用户选择的源文件类型(裁剪输出对齐它;gif 走原图直传不经裁剪) */
const rawType = ref("image/png");

function onChange(file: UploadFile) {
  const raw = file.raw;
  if (!raw) return;
  // 记录原始文件名与类型,供裁剪上传时提交
  rawFileName.value = file.name || "";
  rawType.value = raw.type || "image/png";
  // 校验文件类型;大小不在前端拦截,由后端 FileBizTypeEnum 的 maxBytes 校验并提示
  if (!raw.type.startsWith("image/")) {
    message("仅支持图片格式", { type: "warning" });
    // 清除已入列的文件:fileList 已占满 limit=1,不清除会导致后续选文件
    // 只触发 on-exceed(无人监听),上传按钮静默失效
    uploadRef.value?.clearFiles();
    return;
  }
  // 动图(gif)不参与裁剪:canvas 裁剪只能产出静态帧,直接上传原图保留动图
  if (raw.type === "image/gif") {
    doUpload(raw, rawFileName.value || buildFallbackName(raw));
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    if (!e.target?.result) return;
    cropSrc.value = e.target.result as string;
    isShow.value = true;
  };
  reader.readAsDataURL(raw);
}

function onCropper(payload: CropperPayload) {
  cropperPayload.value = payload;
}

function handleClose() {
  uploadRef.value?.clearFiles();
  isShow.value = false;
}

/** 统一上传入口:裁剪产物与原图直传共用,成功后回填地址并关闭弹窗 */
async function doUpload(blob: Blob, name: string) {
  avatarLoading.value = true;
  try {
    // 以 multipart 上传,后端返回 /file/view/{id} 形态的真实文件 URL
    const res = await uploadFile(props.bizType, blob, name);
    if (res.success) {
      message(`${props.label}上传成功`, { type: "success" });
      emit("update:modelValue", res.data.url);
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
    <!-- 预览图 + 清除按钮:右上角叠加,点击经确认后删除站内文件/清空引用 -->
    <div v-if="modelValue" class="relative shrink-0">
      <el-avatar :size="size" :src="modelValue" @error="onAvatarError" />
      <el-tooltip content="清除" placement="top">
        <el-button
          class="absolute! -right-2! -top-2!"
          circle
          size="small"
          type="danger"
          :disabled="avatarLoading || clearing"
          @click="onClear"
        >
          <IconifyIconOffline :icon="closeLine" />
        </el-button>
      </el-tooltip>
    </div>
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
          <span class="ml-2">上传{{ label }}</span>
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
    <!-- 编辑弹窗:选择图片后裁剪再上传 -->
    <el-dialog
      v-model="isShow"
      width="40%"
      :title="`编辑${label}`"
      destroy-on-close
      append-to-body
      :close-on-click-modal="false"
      :before-close="handleClose"
      :fullscreen="deviceDetection()"
    >
      <ReCropperPreview
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
