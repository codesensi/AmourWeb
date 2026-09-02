// @ts-check
import prefixer from "postcss-prefix-selector";

/** @type {import('postcss-load-config').Config} */
export default {
  plugins: {
    // 门户样式统一加 .portal 前缀(layui/portal 的全局重置不再泄漏到管理端);
    // 仅作用于门户样式文件,管理端样式不受影响
    "postcss-prefix-selector": {
      prefix: ".portal",
      includeFiles: [/assets[\\/](portal|layui)[\\/]/]
    },
    ...(process.env.NODE_ENV === "production" ? { cssnano: {} } : {})
  }
};
