import reCodeBlock from "./src/index.vue";
import { withInstall } from "@pureadmin/utils";

/** 深色代码块组件(展示 + 一键复制,日志/文件/缓存详情弹窗共用) */
export const ReCodeBlock = withInstall(reCodeBlock);

export default ReCodeBlock;
