import App from "./App.vue";
import router from "./router";
import { setupStore } from "@/store";
import { getConfig, siteTitle } from "@/config";
import { fetchSysConfig } from "@/utils/sys-config";
import { getPlatformConfig } from "./config";
import { MotionPlugin } from "@vueuse/motion";
import { VueQueryPlugin } from "@tanstack/vue-query";
import { queryClient } from "@/plugins/vue-query";
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

const app = createApp(App);

// 服务端数据查询层(@tanstack/vue-query):缓存、新鲜度(staleTime)、失效与
// KeepAlive 激活校验统一由 QueryClient 承担;页面代码只声明 key + 拉取函数。
// 实例经 plugins/vue-query 单例导出,非组件上下文(sysConfig 站点配置)共享同一缓存

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
// 门户导航图标注册(portal/*):全局执行,门户/管理端共享同一注册时机
import "./components/ReIcon/src/portal-icons";
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

getPlatformConfig(app)
  .then(async config => {
    setupStore(app);
    // 站点标题:出厂值取 platform-config 的 Title,再由后端系统配置覆盖(GET /portal/config/list-by-keys 免登录,失败时保持出厂值)
    siteTitle.value = getConfig().Title ?? siteTitle.value;
    app.use(router);
    await router.isReady();
    injectResponsiveStorage(app, config);
    app
      .use(MotionPlugin)
      .use(VueQueryPlugin, { queryClient })
      .use(useElementPlus)
      .use(Table)
      .use(PureDescriptions);
    app.mount("#app");

    // 站点名异步刷新:挂载完成后再拉取 sys_config,失败保持出厂标题。
    // 不可放在 mount 之前 await——该请求失败时(后端不可用/超时/返回失败体)异常会
    // 中断本回调,导致 app.mount 永远不执行,整站(含登录页)白屏
    fetchSysConfig("name")
      .then(({ name }) => {
        if (name) siteTitle.value = name;
      })
      .catch(() => {
        /* 后端不可用:保持出厂标题 */
      });
  })
  .catch(error => {
    // platform-config.json 缺失/损坏:给出白屏前的明确提示,而非静默失败
    console.error(error);
    document.body.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:center;height:100vh;color:#f56c6c;font-size:14px;">' +
      "平台配置加载失败,请确认 public/platform-config.json 是否存在后刷新重试</div>";
  });
