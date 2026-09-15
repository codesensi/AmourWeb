// @ts-check

/** @type {import('postcss-load-config').Config} */
export default {
  plugins: {
    // 门户样式统一加 .portal 前缀(门户的全局重置不再泄漏到管理端);
    // 仅作用于门户样式文件,管理端样式不受影响
    "postcss-prefix-selector": {
      prefix: ".portal",
      includeFiles: [/assets[\\/]portal[\\/]/],
      // html / html: 开头的选择器豁免前缀:门户滚动条防抖需作用于真实滚动容器
      // (html), 加前缀会被整体替换为 .portal 而失效。其余 :root/body/html 开头的
      // 规则复刻库内部逻辑——整体替换为 .portal,维持门户样式隔离
      transform: (_prefix, selector, prefixedSelector) => {
        if (selector === "html" || selector.startsWith("html:")) {
          return selector;
        }
        // :root 令牌定义保持全局:主题切换依赖 <html data-amour-theme>
        // 属性选择器,加前缀会被改写成 .portal[data-...] 而永远无法命中。
        // 令牌均为 --am-* 命名空间的自定义属性,对管理端无副作用
        if (selector.startsWith(":root")) {
          return selector;
        }
        if (
          ["body", "html"].some(globalSel => selector.startsWith(globalSel))
        ) {
          return selector.replace(/(html\s+body|html|body)/gm, _prefix);
        }
        return prefixedSelector;
      }
    },
    ...(process.env.NODE_ENV === "production" ? { cssnano: {} } : {})
  }
};
