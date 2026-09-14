// @ts-nocheck
// element-plus 按需引入的兜底注册:仅保留「tsx 渲染函数中直接使用、无法被
// unplugin-vue-components 解析」的组件,以及 v-loading 指令。
// .vue 模板中的 el-* 组件由构建期插件自动解析并注入按需样式,无需在此注册。
// 若后续在 tsx 中新用了其他 el-* 组件,请同步补充到下方 components 列表,
// 并在 main.ts 的按需样式兜底清单中补充对应样式。
import type { App, Component } from "vue";
import {
  ElButton,
  ElCheckbox,
  ElCheckboxGroup,
  ElDivider,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElImage,
  ElLoading, // v-loading 指令
  ElPopover,
  ElScrollbar,
  ElSpace,
  ElSwitch,
  ElTag
} from "element-plus";

const components = [
  ElImage,
  ElSwitch,
  ElTag,
  ElDropdown,
  ElDropdownMenu,
  ElDropdownItem,
  ElDivider,
  ElPopover,
  ElCheckbox,
  ElCheckboxGroup,
  ElButton,
  ElScrollbar,
  ElSpace
];

/** 按需引入 element-plus(tsx 渲染部分) */
export function useElementPlus(app: App) {
  // 全局注册组件
  components.forEach((component: Component) => {
    app.component(component.name, component);
  });
  // 全局注册 v-loading 指令
  app.use(ElLoading);
}
