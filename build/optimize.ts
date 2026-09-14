/**
 * 此文件作用于 `vite.config.ts` 的 `optimizeDeps.include` 依赖预构建配置项
 * 依赖预构建，`vite` 启动时会将下面 include 里的模块，编译成 esm 格式并缓存到 node_modules/.vite 文件夹，页面加载到对应模块时如果浏览器有缓存就读取浏览器缓存，如果没有就按需加载
 * 尤其当您禁用浏览器缓存时（这种情况只应该发生在调试阶段）必须将对应模块加入到 include里，否则会遇到开发环境切换页面卡顿的问题（vite 会认为它是一个新的依赖包会重新加载并强制刷新页面），因为它既无法使用浏览器缓存，又没有在本地 node_modules/.vite 里缓存
 * 温馨提示：如果您使用的第三方库是全局引入，也就是引入到 src/main.ts 文件里，就不需要再添加到 include 里了，因为 vite 会自动将它们缓存到 node_modules/.vite
 */
const include = [
  "qs",
  "mitt",
  "dayjs",
  "axios",
  "pinia",
  "typeit",
  "vue-types",
  "js-cookie",
  "vue-tippy",
  "cropperjs",
  "pinyin-pro",
  "sortablejs",
  "@vueuse/core",
  "@pureadmin/utils",
  "responsive-storage",
  "plus-pro-components",
  // element-plus 按需引入后,各页面模板注入的组件样式子路径在首访时才被发现,
  // 会触发运行中重新预构建并强制整页 reload(首访页面进不去、二次才正常)。
  // rolldown-vite 的优化器不支持 include 中的通配符,故显式枚举——
  // 清单与 src 中实际使用的 el-* 组件一一对应(58 项,已按包内路径校验存在);
  // 新增使用 el-* 组件时,需同步在此补充对应的 style/css 条目
  "element-plus/es",
  "element-plus/es/locale/lang/zh-cn",
  "plus-pro-components/es/locale/lang/zh-cn",
  // echarts 仅 welcome/cache 页动态加载,同样会被首访发现导致 reload
  "echarts",
  "element-plus/es/components/autocomplete/style/css",
  "element-plus/es/components/avatar/style/css",
  "element-plus/es/components/backtop/style/css",
  "element-plus/es/components/badge/style/css",
  "element-plus/es/components/breadcrumb/style/css",
  "element-plus/es/components/breadcrumb-item/style/css",
  "element-plus/es/components/button/style/css",
  "element-plus/es/components/card/style/css",
  "element-plus/es/components/cascader/style/css",
  "element-plus/es/components/checkbox/style/css",
  "element-plus/es/components/checkbox-group/style/css",
  "element-plus/es/components/col/style/css",
  "element-plus/es/components/config-provider/style/css",
  "element-plus/es/components/date-picker/style/css",
  "element-plus/es/components/descriptions/style/css",
  "element-plus/es/components/descriptions-item/style/css",
  "element-plus/es/components/dialog/style/css",
  "element-plus/es/components/divider/style/css",
  "element-plus/es/components/drawer/style/css",
  "element-plus/es/components/dropdown/style/css",
  "element-plus/es/components/dropdown-item/style/css",
  "element-plus/es/components/dropdown-menu/style/css",
  "element-plus/es/components/empty/style/css",
  "element-plus/es/components/form/style/css",
  "element-plus/es/components/form-item/style/css",
  "element-plus/es/components/icon/style/css",
  "element-plus/es/components/image/style/css",
  "element-plus/es/components/input/style/css",
  "element-plus/es/components/input-number/style/css",
  "element-plus/es/components/loading/style/css",
  "element-plus/es/components/menu/style/css",
  "element-plus/es/components/menu-item/style/css",
  "element-plus/es/components/message/style/css",
  "element-plus/es/components/message-box/style/css",
  "element-plus/es/components/option/style/css",
  "element-plus/es/components/pagination/style/css",
  "element-plus/es/components/popconfirm/style/css",
  "element-plus/es/components/popover/style/css",
  "element-plus/es/components/progress/style/css",
  "element-plus/es/components/radio-button/style/css",
  "element-plus/es/components/radio-group/style/css",
  "element-plus/es/components/row/style/css",
  "element-plus/es/components/scrollbar/style/css",
  "element-plus/es/components/select/style/css",
  "element-plus/es/components/skeleton/style/css",
  "element-plus/es/components/space/style/css",
  "element-plus/es/components/sub-menu/style/css",
  "element-plus/es/components/switch/style/css",
  "element-plus/es/components/tab-pane/style/css",
  "element-plus/es/components/tabs/style/css",
  "element-plus/es/components/table/style/css",
  "element-plus/es/components/tag/style/css",
  "element-plus/es/components/text/style/css",
  "element-plus/es/components/timeline/style/css",
  "element-plus/es/components/timeline-item/style/css",
  "element-plus/es/components/tooltip/style/css",
  "element-plus/es/components/tree-v2/style/css",
  "element-plus/es/components/upload/style/css"
];

/**
 * 在预构建中强制排除的依赖项
 * 温馨提示：平台推荐的使用方式是哪里需要哪里引入而且都是单个的引入，不需要预构建，直接让浏览器加载就好
 */
const exclude = ["@iconify/json"];

export { include, exclude };
