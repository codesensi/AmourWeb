import type { Directive } from "vue";

/** 携带观察者句柄的元素类型(内部标记,不进入业务代码) */
interface RevealHTMLElement extends HTMLElement {
  __revealObserver?: IntersectionObserver;
  __revealed?: boolean;
}

/**
 * v-reveal 滚动涌现指令 —— 进入视口后为元素追加 is-visible 类(tokens.css 定义过渡)。
 * <p>
 * 用法:元素加 class="reveal"(可选绑定值控制 stagger 延迟,单位秒,如 v-reveal="0.08"),
 * 指令负责监听一次进入视口并写入 is-visible。
 * prefers-reduced-motion 下 CSS 侧直接可见,指令行为不受影响。
 */
const reveal: Directive<HTMLElement, number | undefined> = {
  mounted(el, binding) {
    // stagger 延迟:v-reveal="0.08" 表示延迟 80ms(与同批元素按序排布)
    if (binding.value) {
      el.style.setProperty("--reveal-delay", `${binding.value}s`);
    }
    // IntersectionObserver 不可用(极端环境)时直接可见,保证内容可达
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-visible");
      return;
    }
    const io = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add("is-visible");
            (el as RevealHTMLElement).__revealed = true;
            io.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );
    io.observe(el);
    // 元素卸载时断开监听,避免泄漏
    (el as RevealHTMLElement).__revealObserver = io;
  },
  updated(el) {
    // KeepAlive 页面切换回渗时 Vue 会整体重写 class 属性,把指令外部追加的
    // is-visible 抹掉;已涌现的元素必须在补丁后补写,否则内容永久隐没
    if ((el as RevealHTMLElement).__revealed) {
      el.classList.add("is-visible");
    }
  },
  unmounted(el) {
    (el as RevealHTMLElement).__revealObserver?.disconnect();
  }
};

export default reveal as Directive<HTMLElement, number | undefined>;
