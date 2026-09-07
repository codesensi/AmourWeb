import dictSelect from "./src/index.vue";
import { withInstall } from "@pureadmin/utils";

/** 字典下拉框组件(按 dict-code 自动加载并渲染选项) */
export const DictSelect = withInstall(dictSelect);

export default DictSelect;
