// 关于页对话剧本 mock(GET /love/chat;后台可配置,未实现时前端降级内置默认剧本)
// 数据移植原站 PORTAL_MOCK.aboutChat;与 about 页组件的 DEFAULT_CHAT_SCRIPT 保持同步
import { defineFakeRoute } from "vite-plugin-fake-server/client";

export default defineFakeRoute([
  {
    url: "/love/chat",
    method: "get",
    response: () => ({
      success: true,
      code: 200,
      msg: "操作成功",
      timestamp: Date.now(),
      data: [
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
                  content:
                    "在开发过程中遇到了许多奇葩问题 也是只能自己探索解决..."
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
      ]
    })
  }
]);
