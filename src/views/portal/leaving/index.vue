<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { getMessages, sendMessage, type MessageItem } from "@/api/portal";
import { qqAvatar } from "@/api/sysConfig";
import { message } from "@/utils/message";

defineOptions({ name: "PortalLeaving" });

/** 门户列表每页条数(与原站 PAGE_SIZE 一致) */
const PAGE_SIZE = 6;

const items = ref<MessageItem[]>([]);
const totalRow = ref(0);
const pageNumber = ref(0);
const loading = ref(false);

/** 是否还有更多数据(到底后隐藏「加载更多」) */
const hasMore = computed(() => items.value.length < totalRow.value);

async function loadMore() {
  if (loading.value) return;
  loading.value = true;
  try {
    const { success, data } = await getMessages(
      pageNumber.value + 1,
      PAGE_SIZE
    );
    if (success) {
      items.value.push(...data.records);
      totalRow.value = data.totalRow;
      pageNumber.value = data.pageNumber;
    }
  } finally {
    loading.value = false;
  }
}

/** 提交留言后重载列表:清空旧内容并重建流加载 */
function reloadMessages() {
  items.value = [];
  totalRow.value = 0;
  pageNumber.value = 0;
  loadMore();
}

/** 留言表单:校验文案逐字保留原站 */
const form = reactive({ qq: "", name: "", text: "" });
const submitting = ref(false);
const submitText = ref("提交留言");

/** 表单区头像 QQ(初始演示号 1234567,QQ 失焦后切换,对齐原站) */
const avatarQq = ref("1234567");

/** QQ 失焦:切换头像并尝试第三方接口回填昵称(8 秒超时,失败提示手填) */
function onQqBlur() {
  const qq = form.qq.trim();
  if (!qq) return;
  avatarQq.value = qq;
  // fetch 原生不支持 timeout 选项,使用 AbortController 实现 8 秒超时
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  fetch(`https://v1.apizero.cn/api/qq?qq=${encodeURIComponent(qq)}`, {
    signal: controller.signal
  })
    .then(r => r.json())
    .then(result => {
      clearTimeout(timer);
      if (result?.code === 0 && result?.data?.name) {
        form.name = result.data.name;
      } else {
        message("请手动填写昵称", { type: "warning" });
      }
    })
    .catch(() => {
      clearTimeout(timer);
      message("请手动填写昵称", { type: "warning" });
    });
}

async function submit() {
  if (submitting.value) return;
  if (form.qq.length === 0) {
    message("请填写QQ号码！", { type: "warning" });
    return;
  }
  if (!/^[0-9]{6,12}$/.test(form.qq)) {
    message("您的QQ号码格式错误 请输入由6-12位的数字组成的QQ号码！", {
      type: "warning"
    });
    return;
  }
  if (["123456", "100000", "1234567"].includes(form.qq)) {
    message("我想也许这并不是您的QQ号码...", { type: "warning" });
    return;
  }
  if (!form.name.trim()) {
    message("请填写您的昵称！", { type: "warning" });
    return;
  }
  if (!form.text.trim()) {
    message("请填写您要留言的内容！", { type: "warning" });
    return;
  }
  if (form.text.length <= 2) {
    message("请填写两个字符以上的内容！", { type: "warning" });
    return;
  }
  if (/^[0-9]+$/.test(form.text)) {
    message("内容为纯数字 已被拦截！", { type: "warning" });
    return;
  }
  if (new RegExp("[操垃圾傻逼妈]").test(form.text)) {
    message(
      "您输入的内容是违禁词 请注意您的发言不文明的留言会被管理员拉进小黑屋喔",
      { type: "warning" }
    );
    return;
  }

  submitting.value = true;
  submitText.value = "留言提交中...";
  try {
    await sendMessage({ qq: form.qq, name: form.name, text: form.text });
    message("留言提交成功！", { type: "success" });
    submitText.value = "留言成功";
    reloadMessages();
    // 按钮置灰 5 秒后恢复(对齐原站 submitMessage)
    setTimeout(() => {
      submitting.value = false;
      submitText.value = "提交留言";
    }, 5000);
  } catch {
    submitting.value = false;
    submitText.value = "提交留言";
  }
}

function scrollToArea() {
  document
    .getElementById("MessageArea")
    ?.scrollIntoView({ behavior: "smooth", block: "center" });
}

onMounted(() => loadMore());
</script>

<template>
  <!-- 点击滚动到留言区 -->
  <div id="MessageBtn" class="MessageButtonCard" @click="scrollToArea">
    <svg
      t="1730880204691"
      class="Message-Icon icon"
      viewBox="0 0 1024 1024"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M512 96C229.2 96 0 282.3 0 512c0 92.1 36.8 177.1 99.1 246 4 4.5 5.3 10.9 3.1 16.5-5.7 14.7-12 29.2-19 43.3-12.9 26.3-28.2 51.7-45.3 75.5-6.2 8.6-7.7 19.7-4.1 29.6 3.6 10 11.9 17.5 22.2 20.1 9.4 2.4 25.2 5.4 44.8 5.4 26 0 58.7-5.4 91.5-25 21.4-12.8 37.5-28.6 49.3-44 4.5-5.9 12.5-7.9 19.3-4.8 74.2 34 159.8 53.4 251 53.4 282.8 0 512-186.3 512-416S794.8 96 512 96z m192 464c-30.9 0-56-25.1-56-56s25.1-56 56-56 56 25.1 56 56-25.1 56-56 56-56-25.1-56-56z m-440-56c0-30.9 25.1-56 56-56s56 25.1 56 56-25.1 56-56 56-56-25.1-56-56z m192 0c0-30.9 25.1-56 56-56s56 25.1 56 56-25.1 56-56 56-56-25.1-56-56z"
        fill="#6a6a6a"
      />
    </svg>
  </div>
  <div class="central central-800 bg">
    <div class="title mt-2rem">
      <h1>在这里写下我们的留言祝福</h1>
    </div>
    <h3>
      已收到 <b id="leavingCount">{{ totalRow }}</b> 条祝福留言<i class="jiequ"
        >(显示最新 100条)</i
      >
    </h3>
    <div class="row">
      <div class="card col-lg-12 col-md-12 col-sm-12 col-sm-x-12">
        <!-- 留言列表 -->
        <div id="leavingList">
          <div
            v-for="(m, i) in items"
            :key="m.date"
            class="leavform animated fadeInUp delay-03s"
          >
            <div class="MsgTopInfo">
              <i class="time" :data-tip="m.date" data-tip-position="top">
                {{ m.date }}<b v-if="m.location" class="yuan" />{{ m.location }}
              </i>
            </div>
            <div class="user_info">
              <img :src="m.avatar" alt="" />
              <div class="head_content">
                <div class="level">
                  访客 <b>#{{ i + 1 }}</b>
                </div>
                <span class="name">{{ m.nickname }}</span>
              </div>
            </div>
            <div class="text">{{ m.content }}</div>
          </div>
          <div v-if="!loading && items.length === 0" class="portal-empty">
            还没有留言,来写下第一条吧~
          </div>
        </div>
        <!-- 提交表单(POST /love/messages {qq, name, text};校验文案逐字保留原站) -->
        <form class="leaving-form" @submit.prevent="submit">
          <div id="MessageArea" class="inputbox">
            <img :src="qqAvatar(avatarQq, 100)" alt="" class="avatar" />
            <input
              id="QQ"
              v-model="form.qq"
              type="text"
              placeholder="请输入QQ号码"
              class="rig"
              @blur="onQqBlur"
            />
            <input
              id="nickname"
              v-model="form.name"
              type="text"
              placeholder="输入QQ号码后自动获取"
              class="let"
            />
          </div>
          <textarea
            id="wenben"
            v-model="form.text"
            rows="8"
            placeholder="请输入您的留言内容..."
          />
          <div class="input-sub">
            <button
              id="leavingPost"
              type="button"
              class="tijiao"
              :disabled="submitting"
              @click="submit"
            >
              {{ submitText }}
              <svg
                style="width: 1.3em; height: 1.3em"
                viewBox="0 0 1024 1024"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M620.8 179.2c12.8 12.8 6.4 32-6.4 44.8-19.2 6.4-38.4 6.4-44.8-12.8-44.8-70.4-128-115.2-217.6-115.2-140.8 0-256 115.2-256 256 0 89.6 44.8 166.4 115.2 217.6 19.2 6.4 19.2 25.6 12.8 38.4-12.8 19.2-32 19.2-44.8 12.8C89.6 563.2 32 460.8 32 352c0-179.2 140.8-320 320-320 108.8 0 211.2 57.6 268.8 147.2zM326.4 332.8l243.2 601.6 83.2-243.2c6.4-19.2 19.2-32 38.4-38.4L934.4 576 326.4 332.8z m25.6-57.6L960 518.4c32 12.8 51.2 51.2 38.4 83.2-6.4 19.2-19.2 32-38.4 38.4l-243.2 83.2L633.6 960c-12.8 32-44.8 51.2-83.2 38.4-19.2-6.4-32-19.2-38.4-38.4L268.8 358.4c-12.8-32 6.4-70.4 38.4-83.2 12.8-6.4 32-6.4 44.8 0z"
                  fill="#ffffff"
                />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
