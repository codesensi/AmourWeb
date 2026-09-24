// 点点滴滴 mock(GET /portal/moments/page 分页;GET /portal/moments/detail/:id 详情)
// 契约对齐后端 PortalMomentsResponse:id/userId/username/nickname/qq/avatar/content/recordDate/category/tags/updateTime
// content 为富文本 HTML:mock 为本地静态内容(无注入风险);前端渲染前经 DOMPurify 净化
import { defineFakeRoute } from "vite-plugin-fake-server/client";
import { fakePageResponse } from "../utils";
import { mockPhoto } from "./mock-photo";

const moments = [
  {
    id: "1",
    title: "Like_Girl 默认文章语法",
    userId: "2",
    username: "li",
    nickname: "小栗",
    qq: "2623669948",
    avatar: mockPhoto("li", "#fdeef0", "#fbcfe8"),
    recordDate: "2025-01-10",
    updateTime: "2025-01-10 10:30:00",
    category: "日常",
    tags: "日常,记录",
    content:
      "<p>这是这个小世界里的第一篇文章。所有日常都会以<strong>短篇</strong>的形式记在这里,偶尔夹一句<em>没头没尾的情话</em>。</p>" +
      "<blockquote>愿你被这个世界温柔以待,而我就是你的全世界。</blockquote>" +
      "<p>往后翻翻,都是我们。</p>"
  },
  {
    id: "2",
    title: "第一次一起去看海",
    userId: "3",
    username: "su",
    nickname: "小素",
    qq: "673822943",
    avatar: mockPhoto("su", "#e8f0fe", "#c7d9f7"),
    recordDate: "2025-02-20",
    updateTime: "2025-02-20 09:12:00",
    category: "旅行",
    tags: "旅行,海边",
    content:
      "<p>凌晨四点起床赶车,却在看到海的那一瞬间觉得都值了。</p>" +
      `<figure class="moment-figure"><img src="${mockPhoto(
        "sea",
        "#a8d8ff",
        "#ffe3ec"
      )}" alt="海边的第一张合影" /><figcaption>拍下了第一个想留住的瞬间</figcaption></figure>` +
      "<p>海风很咸,你笑得很甜。下次换<strong>日出</strong>场次,再看一遍。</p>"
  },
  {
    id: "3",
    title: "记录我们的第 1000 天",
    userId: "2",
    username: "li",
    nickname: "小栗",
    qq: "2623669948",
    avatar: mockPhoto("li", "#fdeef0", "#fbcfe8"),
    recordDate: "2025-03-15",
    updateTime: "2025-03-15 21:05:00",
    category: "纪念",
    tags: "纪念日",
    content:
      "<p>一千天,说长不长,说短不短。翻了一遍相册,把它折成三行:</p>" +
      "<ol><li>一起吃过 200+ 顿饭</li><li>走过 12 座城市</li><li>拍了 3000 多张照片</li></ol>" +
      "<p>数字会一直涨下去,而<em>记录</em>是我们最好的纪念方式。</p>"
  },
  {
    id: "4",
    title: "第一次一起做饭",
    userId: "2",
    username: "li",
    nickname: "小栗",
    qq: "2623669948",
    avatar: mockPhoto("li", "#fdeef0", "#fbcfe8"),
    recordDate: "2025-04-01",
    updateTime: "2025-04-01 12:40:00",
    category: "日常",
    tags: "日常",
    content:
      "<p>厨房太小,两个人转身都要打招呼。番茄炒蛋糊了锅底,你却说<strong>好吃</strong>。</p>" +
      "<ul><li>番茄炒蛋 —— 焦了</li><li>蒜蓉青菜 —— 盐放两遍</li><li>米饭 —— 唯一的满分</li></ul>" +
      "<p>下次想试试<em>糖醋排骨</em>,先把厨房擦干净再说。</p>"
  },
  {
    id: "5",
    title: "雨天的一杯奶茶",
    userId: "3",
    username: "su",
    nickname: "小素",
    qq: "673822943",
    avatar: mockPhoto("su", "#e8f0fe", "#c7d9f7"),
    recordDate: "2025-04-15",
    updateTime: "2025-04-15 18:20:00",
    category: "日常",
    tags: "日常,雨天",
    content:
      "<p>暴雨,外卖小哥迟到了四十分钟。你撑着伞冲下楼,回来时半边袖子都湿了,奶茶却一滴没洒。</p>" +
      "<blockquote>三分糖去冰,和你在雨天一样刚刚好。</blockquote>" +
      "<p>那杯奶茶其实有点淡,是我喝过<em>最甜</em>的一次。</p>"
  },
  {
    id: "6",
    title: "一起养的绿萝发芽了",
    userId: "2",
    username: "li",
    nickname: "小栗",
    qq: "2623669948",
    avatar: mockPhoto("li", "#fdeef0", "#fbcfe8"),
    recordDate: "2025-05-20",
    updateTime: "2025-05-20 08:45:00",
    category: "日常",
    tags: "日常,绿植",
    content:
      "<p>上周还蔫蔫的两片叶子,今早顶出了卷起来的小嫩芽。</p>" +
      `<figure class="moment-figure"><img src="${mockPhoto(
        "绿萝",
        "#c8e6c9",
        "#ffe3ec"
      )}" alt="绿萝新芽" /><figcaption>第 41 天,终于发芽了</figcaption></figure>` +
      "<p>你说要给它取名,想了半小时,最后决定叫<em>「十三」</em>。理由是随口编的,我居然觉得很可爱。</p>"
  },
  {
    id: "7",
    title: "跨年的第一场雪",
    userId: "3",
    username: "su",
    nickname: "小素",
    qq: "673822943",
    avatar: mockPhoto("su", "#e8f0fe", "#c7d9f7"),
    recordDate: "2025-06-01",
    updateTime: "2025-06-01 00:35:00",
    category: "旅行",
    tags: "旅行,冬天",
    content:
      "<p>零点刚过,雪就落下来了,像是提前约好的烟花。</p>" +
      "<p>你把围巾摘下来绕在我脖子上,说:<strong>这样两个人都冷不到</strong>。明明就是一条围巾的距离,却暖了一整年。</p>" +
      "<p>新年快乐,我的雪。</p>"
  },
  {
    id: "8",
    title: "周末拍的小短片",
    userId: "3",
    username: "su",
    nickname: "小素",
    qq: "673822943",
    avatar: mockPhoto("su", "#e8f0fe", "#c7d9f7"),
    recordDate: "2025-06-08",
    updateTime: "2025-06-08 15:00:00",
    category: "日常",
    tags: "日常,影像",
    content:
      "<p>把周六剪成了一支两分钟的小片子,镜头清单如下:</p>" +
      "<ul><li>赖床的逆光(你乱翘的头发)</li><li>早餐的热气</li><li>巷口那只再见面的橘猫</li><li>黄昏时的背影,四分半的那个长镜头</li></ul>" +
      "<p>剪到一半你凑过来看,说<em>「下次拍我拍久一点」</em>。好,都听你的。</p>"
  },
  {
    id: "9",
    title: "写给未来的旅行清单",
    userId: "2",
    username: "li",
    nickname: "小栗",
    qq: "2623669948",
    avatar: mockPhoto("li", "#fdeef0", "#fbcfe8"),
    recordDate: "2025-06-18",
    updateTime: "2025-06-18 20:10:00",
    category: "纪念",
    tags: "旅行,清单",
    content:
      "<p>趁记性还好,把说走就走的念头先记下来:</p>" +
      "<ol><li>去敦煌看一次星空</li><li>冬天去东北玩雪、泡温泉</li><li>攒够假就去一次海岛,这次要住海景房</li><li>学会一支舞,在婚礼上跳那种</li></ol>" +
      "<p>清单会越来越长,而我们要做的事只有一件:<strong>一直在一起</strong>。</p>"
  }
];

export default defineFakeRoute([
  // 文章分页(GET /portal/moments/page;仅显示状态,对齐后端过滤语义)
  {
    url: "/portal/moments/page",
    method: "get",
    response: ({ query }) => fakePageResponse(moments, query)
  },
  // 文章详情(GET /portal/moments/detail/:id)
  {
    url: "/portal/moments/detail/:id",
    method: "get",
    response: ({ params }) => {
      const item =
        moments.find(m => m.id === String(params?.id ?? "")) ?? null;
      return {
        success: true,
        code: 200,
        msg: "操作成功",
        timestamp: Date.now(),
        data: item
      };
    }
  }
]);
