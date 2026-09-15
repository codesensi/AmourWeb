import type { Directive } from "vue";

/** 携带观察者句柄的元素类型(内部标记,不进入业务代码) */
interface RevealHTMLElement extends HTMLElement {
  __revealObserver?: IntersectionObserver;
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
  unmounted(el) {
    (el as RevealHTMLElement).__revealObserver?.disconnect();
  }
};

export default reveal as Directive<HTMLElement, number | undefined>;
