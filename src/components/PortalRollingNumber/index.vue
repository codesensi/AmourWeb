<!-- 门户滚轮数字:里程表式滚动;每位按取值范围定制循环轮(如秒十位 0-5),只向前进位;个位自动补 0 -->
<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";

defineOptions({ name: "PortalRollingNumber" });

const props = withDefaults(
  defineProps<{
    /** 数值(整数,负数按 0 处理;计时场景不会出现,防御处理) */
    value: number;
    /** 最小位数,不足左侧补 0(默认 2) */
    pad?: number;
    /** 数值上界(如秒 59、时 23):高位轮只刻到该位最大数字;不传=无界十进制轮 */
    max?: number;
  }>(),
  { pad: 2 }
);

/** 补零后的位数序列(仅用于确定位数) */
const digits = computed(() => {
  const safe = Math.max(0, Math.floor(props.value || 0));
  return String(safe).padStart(props.pad, "0").split("");
});

/** 第 i 位(模板从左到右)的位权:最右位是个位 */
const placeOf = (index: number): number =>
  10 ** (digits.value.length - 1 - index);

/** 第 i 位轮子的周期:有界数值的最高位轮只刻到 max 的该位数字
 *  (如秒十位 0-5 → 周期 6),其余位满 0-9;无上界时一律 10 */
const cycleOf = (index: number): number => {
  if (props.max === undefined) return 10;
  const place = placeOf(index);
  return place * 10 > props.max ? Math.floor(props.max / place) + 1 : 10;
};

/** 第 i 位轮子在数值 v 下对应的格位(0..周期-1) */
const wheelIndex = (index: number, v: number): number => {
  const cycle = cycleOf(index);
  const digit = Math.floor(Math.max(0, v) / placeOf(index)) % 10;
  return ((digit % cycle) + cycle) % cycle;
};

/** 第 i 位轮子上的数字序列:两轮拼接,末轮为首格克隆(回绕用) */
const stripOf = (index: number): number[] => {
  const cycle = cycleOf(index);
  return Array.from({ length: cycle * 2 }, (_, n) => n % cycle);
};

/** 每位轮子状态:offset=带上游标(em,负值前进;可越过轮尾克隆格),frozen=归位帧 */
const wheels = ref(
  digits.value.map((_, i) => ({
    offset: -wheelIndex(i, props.value),
    frozen: false
  }))
);

watch(
  () => props.value,
  next => {
    wheels.value = Array.from({ length: digits.value.length }, (_, i) => {
      const cycle = cycleOf(i);
      const target = wheelIndex(i, next);
      const wheel = wheels.value[i];
      // 新增位(位数变长)直接落位
      if (!wheel) return { offset: -target, frozen: false };
      const cur = ((-wheel.offset % cycle) + cycle) % cycle;
      const delta = (target - cur + cycle) % cycle;
      // 无变化时保持原位
      if (delta === 0) return wheel;
      // 里程表核心:位移只累加(向前),回绕时滚到轮尾克隆首格
      const rolled = wheel.offset - delta;
      // 防御:异常高频跳变导致未归位累积出界时,直接落位放弃动画
      if (rolled < -(cycle * 2 - 1)) {
        return { offset: -target, frozen: true };
      }
      return { offset: rolled, frozen: false };
    });
  }
);

/** 滚动结束:瞬间归位到真实格位,下一拍继续向前滚 */
const settle = (index: number) => {
  const wheel = wheels.value[index];
  const target = -wheelIndex(index, props.value);
  if (!wheel || wheel.offset === target) return;
  wheel.frozen = true;
  wheel.offset = target;
  nextTick(() => {
    requestAnimationFrame(() => {
      if (wheels.value[index]) wheels.value[index].frozen = false;
    });
  });
};
</script>

<template>
  <!-- 纯视觉滚动,读屏语义由容器 aria-label 提供 -->
  <span class="roll-group" aria-hidden="true">
    <span
      v-for="(d, i) in digits"
      :key="`${digits.length}-${i}`"
      class="roll-digit"
    >
      <span
        class="roll-strip"
        :class="{ 'roll-strip--frozen': wheels[i]?.frozen }"
        :style="{ transform: `translateY(${wheels[i]?.offset ?? 0}em)` }"
        @transitionend="settle(i)"
      >
        <span v-for="(n, k) in stripOf(i)" :key="k">{{ n }}</span>
      </span>
    </span>
  </span>
</template>

<style scoped>
.roll-group {
  display: inline-flex;
}

/* 每位一根纵向数字带:固定 1em 高裁切,位移按 em 计,随字号缩放 */
.roll-digit {
  display: inline-block;
  height: 1em;
  overflow: hidden;
  line-height: 1;
}

.roll-strip {
  display: flex;
  flex-direction: column;
  transition: transform 0.6s var(--am-ease);
}

/* 归位帧:关闭过渡实现无感复位 */
.roll-strip--frozen {
  transition: none;
}

.roll-strip span {
  height: 1em;
  line-height: 1;
  text-align: center;
}

@media (prefers-reduced-motion: reduce) {
  .roll-strip {
    transition: none;
  }
}
</style>
