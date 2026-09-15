<script setup lang="ts">
// @ts-nocheck
import Motion from "./utils/motion";
import { useRouter } from "vue-router";
import { message } from "@/utils/message";
import { loginRules } from "./utils/rule";
import TypeIt from "@/components/ReTypeit";
import { debounce } from "@pureadmin/utils";
import { useNav } from "@/layout/hooks/useNav";
import { useEventListener } from "@vueuse/core";
import type { FormInstance } from "element-plus";
import { useLayout } from "@/layout/hooks/useLayout";
import { useUserStoreHook } from "@/store/modules/user";
import { getCaptchaImage } from "@/api/captcha";
import {
  applySiteLogo,
  fetchSysConfig,
  LOGO_FALLBACK,
  siteLogo
} from "@/utils/sysConfig";
import { initRouter, getTopMenu } from "@/router/utils";
import { bg, illustration } from "./utils/static";
import { ref, toRaw, reactive, watch, computed, onMounted } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";

import dayIcon from "@/assets/svg/day.svg?component";
import darkIcon from "@/assets/svg/dark.svg?component";
import Lock from "~icons/ri/lock-fill";
import User from "~icons/ri/user-3-fill";
import Info from "~icons/ri/information-line";
import Keyhole from "~icons/ri/shield-keyhole-line";

defineOptions({
  name: "Login"
});

const captchaKey = ref("");
const captchaImg = ref("");
/** 验证码显隐开关:由 /portal/config/list-by-keys 下发决定,缺省关闭 */
const captchaEnabled = ref(false);
const router = useRouter();
const loading = ref(false);
const checked = ref(false);
const disabled = ref(false);
const ruleFormRef = ref<FormInstance>();
const currentPage = computed(() => {
  return useUserStoreHook().currentPage;
});

const { initStorage } = useLayout();
initStorage();
const { dataTheme, themeMode, dataThemeChange } = useDataThemeChange();
dataThemeChange(themeMode.value);
const { title, onLogoError } = useNav();

/** 登录框顶部图标:站点 logo 配置优先,未配置时统一回退本地 favicon */
const siteLogoImg = computed(() => siteLogo.value || LOGO_FALLBACK);

const ruleForm = reactive({
  username: "",
  password: "",
  captchaValue: ""
});

/** 获取图形验证码(纯资源,仅开关开启时调用) */
const getCaptcha = async () => {
  const res = await getCaptchaImage();
  if (res.success) {
    captchaKey.value = res.data.captchaKey;
    captchaImg.value = res.data.captchaValue;
  }
};

/** 拉取站点公共配置:一次合并拉取 logo 与验证码开关(logo 经 applySiteLogo 回填全局状态,
 *  避免与 useNav 内 initSiteLogo 各拉一次);验证码开关开启时才拉取验证码 */
const loadSiteConfig = async () => {
  const { logo, captchaEnabled: enabled } = await fetchSysConfig(
    "logo",
    "captchaEnabled"
  );
  applySiteLogo(logo);
  captchaEnabled.value = enabled ?? false;
  if (captchaEnabled.value) await getCaptcha();
};

onMounted(loadSiteConfig);

const onLogin = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  await formEl.validate(valid => {
    if (valid) {
      loading.value = true;
      useUserStoreHook()
        .loginByUsername({
          username: ruleForm.username,
          password: ruleForm.password,
          captchaKey: captchaKey.value,
          captchaValue: ruleForm.captchaValue
        })
        .then(async () => {
          // 获取后端路由
          await initRouter();
          disabled.value = true;
          router.push(getTopMenu(true).path).then(() => {
            message("登录成功", { type: "success" });
          });
        })
        .catch(() => {
          // 登录失败提示由 http 拦截器统一弹出后端 res.msg,此处不再重复弹窗;
          // 失败后自动刷新验证码(开关开启时)并清空已输入的验证码
          if (captchaEnabled.value) getCaptcha();
          ruleForm.captchaValue = "";
        })
        .finally(() => {
          disabled.value = false;
          loading.value = false;
        });
    }
  });
};

const immediateDebounce: any = debounce(
  formRef => onLogin(formRef),
  1000,
  true
);

useEventListener(document, "keydown", ({ code }) => {
  if (
    ["Enter", "NumpadEnter"].includes(code) &&
    !disabled.value &&
    !loading.value
  )
    immediateDebounce(ruleFormRef.value);
});

watch(checked, bool => {
  useUserStoreHook().SET_ISREMEMBERED(bool);
});
</script>

<template>
  <div class="select-none">
    <!-- 装饰性背景波浪:对读屏无意义,alt 置空交由辅助技术跳过 -->
    <img :src="bg" class="wave" alt="" />
    <div class="flex-c absolute right-5 top-3">
      <!-- 主题 -->
      <el-switch
        v-model="dataTheme"
        inline-prompt
        :active-icon="dayIcon"
        :inactive-icon="darkIcon"
        @change="dataThemeChange"
      />
    </div>
    <div class="login-container">
      <div class="img">
        <component :is="toRaw(illustration)" />
      </div>
      <div class="login-box">
        <div class="login-form">
          <img
            :src="siteLogoImg"
            class="avatar"
            :alt="title || 'logo'"
            @error="onLogoError"
          />
          <Motion>
            <h2 class="outline-hidden">
              <TypeIt
                :options="{ strings: [title], cursor: false, speed: 100 }"
              />
            </h2>
          </Motion>

          <el-form
            v-if="currentPage === 0"
            ref="ruleFormRef"
            :model="ruleForm"
            :rules="loginRules"
            size="large"
          >
            <Motion :delay="100">
              <el-form-item
                :rules="[
                  {
                    required: true,
                    message: '请输入账号',
                    trigger: 'blur'
                  }
                ]"
                prop="username"
              >
                <el-input
                  v-model="ruleForm.username"
                  clearable
                  placeholder="用户名 / QQ号"
                  :prefix-icon="useRenderIcon(User)"
                />
              </el-form-item>
            </Motion>

            <Motion :delay="150">
              <el-form-item prop="password">
                <el-input
                  v-model="ruleForm.password"
                  clearable
                  show-password
                  placeholder="密码"
                  :prefix-icon="useRenderIcon(Lock)"
                />
              </el-form-item>
            </Motion>

            <Motion :delay="200">
              <el-form-item v-if="captchaEnabled" prop="captchaValue">
                <el-input
                  v-model="ruleForm.captchaValue"
                  clearable
                  placeholder="验证码"
                  :prefix-icon="useRenderIcon(Keyhole)"
                >
                  <template v-slot:append>
                    <img
                      :src="captchaImg"
                      alt="验证码"
                      title="点击刷新"
                      class="h-8 cursor-pointer"
                      @click="getCaptcha"
                    />
                  </template>
                </el-input>
              </el-form-item>
            </Motion>

            <Motion :delay="250">
              <el-form-item>
                <div class="w-full h-5 flex-bc">
                  <el-checkbox v-model="checked">
                    <span class="flex">
                      记住密码
                      <IconifyIconOffline
                        v-tippy="{
                          content:
                            '勾选并登录后，登录状态长期保持，登录失效时将自动退出并返回登录页',
                          placement: 'top'
                        }"
                        :icon="Info"
                        class="ml-1"
                      />
                    </span>
                  </el-checkbox>
                </div>
                <el-button
                  class="w-full mt-4!"
                  size="default"
                  type="primary"
                  :loading="loading"
                  :disabled="disabled"
                  @click="onLogin(ruleFormRef)"
                >
                  登录
                </el-button>
              </el-form-item>
            </Motion>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url("@/style/login.css");
</style>

<style lang="scss" scoped>
/* append 单元格边框由 inset box-shadow 绘制:留出内边距避免被验证码图片盖住;
   背景置透明,避免灰色底形成一圈阴影观感 */
:deep(.el-input-group__append) {
  padding: 4px;
  background-color: transparent;
}
</style>
