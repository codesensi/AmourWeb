<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import {
  getChatScript,
  type ChatScriptNode,
  type ChatScriptOption
} from "@/api/portal";
import goodbyeImg from "@/assets/portal/img/goodbye.webp";

defineOptions({ name: "PortalAbout" });

/** 内置默认剧本(移植原站 PORTAL_MOCK.aboutChat;后台 /love/chat 未配置时降级使用,与 mock/portal/chat.ts 保持同步) */
const DEFAULT_CHAT_SCRIPT: ChatScriptNode[] = [
  { type: "bot", delay: 200, content: "Hi, 欢迎你的来访" },
  { type: "bot", delay: 1000, content: "愿得一人心 白首不相离" },
  { type: "bot", delay: 1000, content: "记录日常生活 留住感动" },
  {
    type: "buttons",
    delay: 1500,
    options: [
      {
        text: "听我介绍",
        value: "and",
        next: [
          {
            type: "bot",
            delay: 1500,
            content: "情侣小站Like Girl是 Ki 的原创项目"
          },
          {
            type: "bot",
            delay: 1500,
            content: "在2022年暑假的假期最后几天里发布了1.0版本"
          },
          {
            type: "bot",
            delay: 1500,
            content: "最新版本为 v5.2.0 亦是最终版本 目前已开源到码云"
          },
          {
            type: "bot",
            delay: 1500,
            content: "PHP确实是 “世界上最好的语言”  我非常喜欢（痛苦"
          },
          {
            type: "bot",
            delay: 1500,
            content: "在开发过程中遇到了许多奇葩问题 也是只能自己探索解决..."
          },
          {
            type: "bot",
            delay: 1500,
            content: "喜欢探索编程领域 热爱学习新知识 热爱开源文化"
          },
          {
            type: "buttons",
            delay: 1500,
            options: [
              {
                text: "为什么叫 Ki？",
                value: "next",
                next: [
                  {
                    type: "bot",
                    delay: 1500,
                    content: "不知道你有没有看过《比悲伤更悲伤的故事》"
                  },
                  {
                    type: "bot",
                    delay: 1500,
                    content: "嗨，我是k，如果有下辈子的话，"
                  },
                  {
                    type: "bot",
                    delay: 1500,
                    content:
                      "“我想当戒指，眼镜，床和笔记本，这样的话，我就可以...”"
                  },
                  {
                    type: "bot",
                    delay: 1500,
                    content: "当然跟这个没有关系哈哈"
                  },
                  {
                    type: "buttons",
                    delay: 1500,
                    options: [
                      {
                        text: "结束对话",
                        value: "end",
                        next: [
                          {
                            type: "bot",
                            delay: 1500,
                            content: "感谢你的来访，祝你们幸福长长久久~"
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        text: "结束介绍",
        value: "gg",
        next: [
          {
            type: "bot",
            delay: 1500,
            content: " ![告辞](/assets/portal/img/goodbye.webp) "
          }
        ]
      }
    ]
  }
];

/** 原站剧本图片走 /assets/portal/img/* 旧路径,映射到迁移后的打包资产 */
const LEGACY_ASSET_MAP: Record<string, string> = {
  "/assets/portal/img/goodbye.webp": goodbyeImg
};

function resolveAssetUrl(url: string): string {
  return LEGACY_ASSET_MAP[url] ?? url;
}

/** 对话流渲染项:气泡 / 输入中指示器 / 分支按钮组 */
type ChatMsgItem = {
  kind: "msg";
  text?: string;
  image?: { alt: string; src: string };
  human?: boolean;
};
type ChatItem =
  | ChatMsgItem
  | { kind: "typing" }
  | {
      kind: "actions";
      options: ChatScriptOption[];
      resolve: (choice: ChatScriptOption) => void;
    };

const items = ref<ChatItem[]>([]);
const chatBoxRef = ref<HTMLElement | null>(null);

/** 卸载中断标记:页面切换后停止后续剧本播放 */
let stopped = false;
onBeforeUnmount(() => {
  stopped = true;
});

const sleep = (ms: number) =>
  new Promise<void>(resolve => setTimeout(resolve, ms));

function scrollToBottom() {
  nextTick(() => {
    const box = chatBoxRef.value;
    if (box) box.scrollTop = box.scrollHeight;
  });
}

/** 机器人气泡:先渲染输入中指示器,延时后替换为消息(content 支持 ![alt](url) 图片语法) */
async function botMessage(content: string, delay: number) {
  items.value.push({ kind: "typing" });
  scrollToBottom();
  await sleep(delay);
  if (stopped) return;
  items.value = items.value.filter(it => it.kind !== "typing");

  const item: ChatMsgItem = { kind: "msg" };
  const image = content.trim().match(/^!\[(.*)\]\((.+)\)$/);
  if (image) {
    item.image = { alt: image[1], src: resolveAssetUrl(image[2]) };
  } else {
    item.text = content;
  }
  items.value.push(item);
  scrollToBottom();
}

/** 分支按钮组:延时后渲染;点选后按钮组移除,所选"提问"以右侧气泡留痕(复刻 botui 行为) */
function botButtons(options: ChatScriptOption[], delay: number) {
  return new Promise<ChatScriptOption>(resolve => {
    setTimeout(() => {
      if (stopped) return;
      items.value.push({
        kind: "actions",
        options,
        resolve: choice => {
          items.value = items.value.filter(it => it.kind !== "actions");
          items.value.push({ kind: "msg", text: choice.text, human: true });
          scrollToBottom();
          resolve(choice);
        }
      });
      scrollToBottom();
    }, delay);
  });
}

/** 渲染剧本节点序列:bot 消息或分支按钮,点选后递归执行所选分支 */
async function play(nodes: ChatScriptNode[]) {
  for (const node of nodes) {
    if (stopped) return;
    if (node.type === "buttons") {
      const chosen = await botButtons(node.options || [], node.delay || 0);
      if (stopped) return;
      if (chosen.next && chosen.next.length) {
        await play(chosen.next);
      }
    } else {
      await botMessage(node.content || "", node.delay || 0);
    }
  }
}

/** 剧本获取:后台可配(GET /love/chat),未配置时降级内置默认剧本 */
async function startChat() {
  let script: ChatScriptNode[] = [];
  try {
    const { success, data } = await getChatScript();
    if (success && Array.isArray(data)) script = data;
  } catch {
    /* 接口未实现或未配置,降级内置默认剧本 */
  }
  if (!Array.isArray(script) || script.length === 0) {
    script = DEFAULT_CHAT_SCRIPT;
  }
  play(script);
}

onMounted(() => startChat());
</script>

<template>
  <!-- 标题(照搬原站 about.html) -->
  <h4 class="text-ce central">与 <i>Ki_About</i> 小站对话中...</h4>
  <!-- 对话区背景卡 -->
  <div class="central central-600">
    <div class="chat-box-wrap">
      <div ref="chatBoxRef" class="chat-box">
        <template v-for="(item, i) in items" :key="i">
          <div
            v-if="item.kind === 'msg'"
            class="chat-msg"
            :class="{ human: item.human }"
          >
            <img
              v-if="item.image"
              class="chat-msg-image"
              :src="item.image.src"
              :alt="item.image.alt"
            />
            <template v-else>{{ item.text }}</template>
          </div>
          <div v-else-if="item.kind === 'typing'" class="chat-typing">
            <span class="dot" /><span class="dot" /><span class="dot" />
          </div>
          <div v-else-if="item.kind === 'actions'" class="chat-actions">
            <button
              v-for="opt in item.options"
              :key="opt.value"
              type="button"
              class="chat-btn"
              @click="item.resolve(opt)"
            >
              {{ opt.text }}
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 原站 about.html 内联样式的等价物:标题与对话卡去除 .central 的内边距(内容贴合圆角卡边缘) */
.text-ce,
.central-600 {
  padding: 0;
}
</style>
