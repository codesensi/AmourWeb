<script setup lang="tsx">
// @ts-nocheck
import type Cropper from "cropperjs";
import { ref } from "vue";
import ReCropper from "@/components/ReCropper";
import { formatBytes } from "@pureadmin/utils";

defineOptions({
  name: "ReCropperPreview"
});

defineProps({
  imgSrc: String,
  /** 裁剪输出的图片类型(对齐源文件类型,如 image/jpeg) */
  outputType: { type: String, default: "image/png" }
});

/** 裁剪产物载荷:base64 预览图、Blob 二进制、原始图像信息 */
interface CropperPayload {
  base64: string;
  blob: Blob;
  info: Cropper.Data & { size: number };
}

const emit = defineEmits<{
  cropper: [payload: CropperPayload];
}>();

const infos = ref();
/** 裁剪器就绪标记:就绪前展示透明 loading 遮罩 */
const cropperReady = ref(false);
const cropperImg = ref<string>("");

function onCropper(payload: CropperPayload) {
  infos.value = payload.info;
  cropperImg.value = payload.base64;
  emit("cropper", payload);
}

function onReadied() {
  cropperReady.value = true;
}
</script>

<template>
  <div v-loading="!cropperReady" element-loading-background="transparent">
    <div class="flex items-start gap-3">
      <div class="w-[18vw]">
        <ReCropper
          :src="imgSrc"
          :output-type="outputType"
          circled
          @cropper="onCropper"
          @readied="onReadied"
        />
        <p v-show="cropperReady" class="mt-1 text-center">
          温馨提示：右键上方裁剪区可开启功能菜单
        </p>
      </div>
      <div class="w-[18vw]">
        <!-- 预览图约束为与裁剪区同宽的方形,避免按原始尺寸撑开遮挡弹窗按钮 -->
        <el-image
          v-if="cropperImg"
          :src="cropperImg"
          :preview-src-list="Array.of(cropperImg)"
          hide-on-click-modal
          fit="cover"
          class="h-[18vw] w-full"
        />
        <div v-if="infos" class="mt-1 text-center">
          <p>
            图像大小：{{ parseInt(infos.width) }} ×
            {{ parseInt(infos.height) }}像素
          </p>
          <p>
            文件大小：{{ formatBytes(infos.size) }}（{{ infos.size }} 字节）
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
