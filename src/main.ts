// @ts-nocheck
import App from "./App.vue";
import router from "./router";
import { setupStore } from "@/store";
import { getConfig, siteTitle } from "@/config";
import { fetchSysConfig } from "@/utils/sysConfig";
import { getPlatformConfig } from "./config";
import { MotionPlugin } from "@vueuse/motion";
import { createApp, type Directive } from "vue";
import { useElementPlus } from "@/plugins/elementPlus";
import { injectResponsiveStorage } from "@/utils/responsive";

import Table from "@pureadmin/table";
import PureDescriptions from "@pureadmin/descriptions";

// 引入重置样式
import "./style/reset.scss";
// 导入公共样式
import "./style/index.scss";
// 一定要在main.ts中导入tailwind.css，防止vite每次hmr都会请求src/style/index.scss整体css文件导致热更新慢的问题
import "./style/tailwind.css";
// element-plus 按需样式:模板中的 el-* 由 unplugin-vue-components 自动注入,
// 此处仅兜底「API 直调 / tsx 渲染函数 / @pureadmin 包装组件内部」使用的组件样式
import "element-plus/es/components/col/style/css";
import "element-plus/es/components/descriptions/style/css";
import "element-plus/es/components/divider/style/css";
import "element-plus/es/components/dropdown/style/css";
import "element-plus/es/components/image/style/css";
import "element-plus/es/components/loading/style/css";
import "element-plus/es/components/message-box/style/css";
import "element-plus/es/components/message/style/css";
import "element-plus/es/components/pagination/style/css";
import "element-plus/es/components/popover/style/css";
import "element-plus/es/components/scrollbar/style/css";
import "element-plus/es/components/space/style/css";
import "element-plus/es/components/switch/style/css";
import "element-plus/es/components/table/style/css";
import "element-plus/es/components/tag/style/css";
import "element-plus/es/components/upload/style/css";
// 导入字体图标
import "./assets/iconfont/iconfont.js";
import "./assets/iconfont/iconfont.css";

const app = createApp(App);

// 自定义指令
import * as directives from "@/directives";
Object.keys(directives).forEach(key => {
  app.directive(key, (directives as { [key: string]: Directive })[key]);
});

// 全局注册@iconify/vue图标库
import {
  IconifyIconOffline,
  IconifyIconOnline,
  FontIcon
} from "./components/ReIcon";
app.component("IconifyIconOffline", IconifyIconOffline);
app.component("IconifyIconOnline", IconifyIconOnline);
app.component("FontIcon", FontIcon);

// 全局注册按钮级别权限组件
import { Auth } from "@/components/ReAuth";
import { Perms } from "@/components/RePerms";
app.component("Auth", Auth);
app.component("Perms", Perms);

// 全局注册vue-tippy
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";
import VueTippy from "vue-tippy";
app.use(VueTippy);

getPlatformConfig(app).then(async config => {
  setupStore(app);
  // 站点标题:出厂值取 platform-config 的 Title,再由后端系统配置覆盖(GET /portal/config/list-by-keys 免登录,失败时保持出厂值)
  siteTitle.value = getConfig().Title ?? siteTitle.value;
  const { name } = await fetchSysConfig("name");
  if (name) siteTitle.value = name;
  app.use(router);
  await router.isReady();
  injectResponsiveStorage(app, config);
  // echarts 体积大且仅 welcome/cache 监控页使用,动态加载为独立 chunk,
  // 缩小首屏依赖图(不再进入入口 chunk 的静态依赖链)
  const { useEcharts } = await import("@/plugins/echarts");
  app
    .use(MotionPlugin)
    .use(useElementPlus)
    .use(Table)
    .use(PureDescriptions)
    .use(useEcharts);
  app.mount("#app");
});
