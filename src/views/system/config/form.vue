<script setup lang="ts">
import { ref, computed } from "vue";
import type { FormItemProps, FormProps } from "./utils/types";
import { DictTag } from "@/components/DictTag";
import { DictSelect } from "@/components/DictSelect";
import { DICT_CODES } from "@/api/sys-dict";
import ReAvatarUpload from "@/components/ReAvatarUpload";
import { usePublicHooks } from "../hooks";

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    title: "修改",
    id: undefined,
    configKey: "",
    configValue: "",
    valueType: "STRING",
    configGroup: "",
    remark: ""
  })
});

const ruleFormRef = ref();
const { switchStyle } = usePublicHooks();
const newFormInline = ref(props.formInline);

/** 是否整数型配置(INTEGER/LONG 用数字输入框渲染,从源头杜绝非数字输入) */
const numericType = computed(() =>
  ["INTEGER", "LONG"].includes(newFormInline.value.valueType)
);
/** 是否布尔型配置(BOOLEAN 用开关渲染,值仍为字符串 true/false) */
const booleanValue = computed(
  () => newFormInline.value.valueType === "BOOLEAN"
);

/** 是否日期时间型配置(DATETIME 用时间选择器渲染,产出 yyyy-MM-dd HH:mm:ss 字符串) */
const datetimeValue = computed(
  () => newFormInline.value.valueType === "DATETIME"
);

/** 数字输入框与字符串值的桥接(清空回落为空串,交由必填校验拦截) */
const numericProxy = computed<number | undefined>({
  get: () => {
    const raw = newFormInline.value.configValue;
    // 空值先短路:Number("") === 0,直接转换会导致清空后立即回显 0
    if (raw == null || raw === "") return undefined;
    const num = Number(raw);
    return Number.isFinite(num) ? num : undefined;
  },
  set: value => {
    newFormInline.value.configValue = value == null ? "" : String(value);
  }
});

/** 布尔开关/日期时间/年份等控件统一走字符串值桥接(清空回落为空串,交由必填校验拦截) */
const stringValueProxy = computed<string>({
  get: () => newFormInline.value.configValue,
  set: value => (newFormInline.value.configValue = value ?? "")
});

/** 配置键 → 字典编码(取值可枚举的配置项用字典下拉替代自由文本,与 init_dml.sql 字典种子对齐) */
const DICT_CODE_BY_CONFIG_KEY: Record<string, string> = {
  "captcha.image-type": DICT_CODES.imageType,
  "file.storage": DICT_CODES.fileStorageType
};
/** 当前配置绑定的字典编码;未绑定字典的配置返回 undefined,按值类型走默认控件 */
const configDictCode = computed(
  () => DICT_CODE_BY_CONFIG_KEY[newFormInline.value.configKey ?? ""]
);

/** 图片型配置键:渲染头像上传组件(裁剪上传/直链二选一),值仍为字符串 URL,与配置值统一字符串存储契约一致 */
const IMAGE_CONFIG_KEYS = ["logo", "favicon"];
/** 图片型配置的上传文案主体(按配置键区分 Logo/Favicon) */
const IMAGE_LABELS: Record<string, string> = {
  logo: "Logo",
  favicon: "Favicon"
};
/** 是否图片型配置 */
const isImageConfig = computed(() =>
  IMAGE_CONFIG_KEYS.includes(newFormInline.value.configKey ?? "")
);

/** 可选(允许为空)的配置键:清空保存后由消费侧兜底 ——
 *  icp 整块隐藏、copyright-year 回落当前年份、uapi-key 按空值降级、logo/favicon 回退默认图标 */
const OPTIONAL_CONFIG_KEYS = [
  "logo",
  "icp",
  "copyright-year",
  "uapi-key",
  "favicon"
];
/** 是否可选配置(必填校验放行) */
const isOptionalConfig = computed(() =>
  OPTIONAL_CONFIG_KEYS.includes(newFormInline.value.configKey ?? "")
);

/** 年份型配置键:渲染年份选择器(type=year,产出 yyyy 字符串,与配置值字符串契约一致) */
const YEAR_CONFIG_KEYS = ["copyright-year"];
/** 是否年份型配置 */
const isYearConfig = computed(() =>
  YEAR_CONFIG_KEYS.includes(newFormInline.value.configKey ?? "")
);

const formRules = computed(() => ({
  configValue: [
    {
      // 可选配置允许为空(未配置时由消费侧兜底),其余类型保持必填;
      // change 覆盖开关/上传/选择器类控件(blur 不触发),blur 覆盖文本输入
      required: !isOptionalConfig.value,
      message: "配置值为必填项",
      trigger: ["blur", "change"]
    }
  ]
}));

function getRef() {
  return ruleFormRef.value;
}

defineExpose({ getRef });
</script>

<template>
  <el-form
    ref="ruleFormRef"
    :model="newFormInline"
    :rules="formRules"
    label-width="82px"
  >
    <el-form-item label="配置键" prop="configKey">
      <el-input v-model="newFormInline.configKey" disabled />
    </el-form-item>

    <el-form-item label="值类型" prop="valueType">
      <DictTag dict-code="config-value-type" :value="newFormInline.valueType" />
      <span
        class="ml-2 text-xs text-[rgba(42,46,54,0.45)] dark:text-[rgba(220,220,242,0.45)]"
      >
        {{ newFormInline.remark }}
      </span>
    </el-form-item>

    <el-form-item label="配置值" prop="configValue">
      <!-- 站点 logo/favicon:复用头像上传组件(裁剪上传/直链二选一),bizType=infra 走基础设施图片校验(logo/favicon 等站点资源共用) -->
      <ReAvatarUpload
        v-if="isImageConfig"
        v-model="newFormInline.configValue"
        biz-type="infra"
        :label="IMAGE_LABELS[newFormInline.configKey ?? ''] ?? '图片'"
      />
      <DictSelect
        v-else-if="configDictCode"
        v-model="newFormInline.configValue"
        :dict-code="configDictCode"
        placeholder="请选择配置值"
        class="w-full!"
      />
      <el-date-picker
        v-else-if="isYearConfig"
        v-model="stringValueProxy"
        type="year"
        value-format="YYYY"
        placeholder="请选择年份"
        class="w-full!"
      />
      <el-switch
        v-else-if="booleanValue"
        v-model="newFormInline.configValue"
        inline-prompt
        active-value="true"
        inactive-value="false"
        active-text="true"
        inactive-text="false"
        :style="switchStyle"
      />
      <el-input-number
        v-else-if="numericType"
        v-model="numericProxy"
        :precision="0"
        controls-position="right"
        class="w-full!"
      />
      <el-date-picker
        v-else-if="datetimeValue"
        v-model="stringValueProxy"
        type="datetime"
        value-format="YYYY-MM-DD HH:mm:ss"
        placeholder="请选择日期时间"
        class="w-full!"
      />
      <el-input
        v-else
        v-model="newFormInline.configValue"
        type="textarea"
        :autosize="{ minRows: 1, maxRows: 6 }"
        clearable
        placeholder="请输入配置值"
      />
    </el-form-item>
  </el-form>
</template>
