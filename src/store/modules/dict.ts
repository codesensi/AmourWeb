import { defineStore } from "pinia";
import { store } from "../utils";
import { getDictByCodes, type SysDictItem } from "@/api/dict";

interface DictState {
  /** 字典缓存(code → 组内条目;加载失败/未加载的编码不存在) */
  dicts: Record<string, Array<SysDictItem>>;
  /** 加载中的编码(含排队等待与请求进行中) */
  pending: Record<string, true>;
}

/** 待请求队列与刷新定时器(模块级:同一轮事件循环内的多次 load 合并为一次请求) */
let queue: Array<string> = [];
let timer: ReturnType<typeof setTimeout> | undefined;
/** 全局批次序号:refresh 重新入队后,在途旧批次的结果据此判定为过期丢弃 */
let flushSeq = 0;
/** 各编码最近一次入队的批次号 */
const loadSeq = new Map<string, number>();

export const useDictStore = defineStore("pure-dict", {
  state: (): DictState => ({ dicts: {}, pending: {} }),
  getters: {
    /**
     * 取指定编码的条目列表;未加载返回空数组(响应式,数据到达后自动更新)
     */
    group(state) {
      return (code: string): Array<SysDictItem> => state.dicts[code] ?? [];
    }
  },
  actions: {
    /**
     * 批量登记待加载的字典编码(跳过已缓存与加载中的编码)。
     * 不立即发请求:同一轮事件循环内多个组件的 load 会合并进队列,
     * 由定时器在当前 tick 结束后作为一次 list-by-codes 请求下发。
     *
     * @param codes 字典编码集合;空集合直接返回
     */
    load(codes: Array<string>): void {
      for (const code of codes) {
        if (!code || this.dicts[code] || this.pending[code]) continue;
        this.pending[code] = true;
        queue.push(code);
      }
      if (queue.length > 0 && timer == null) {
        timer = setTimeout(() => {
          timer = undefined;
          this.flush();
        }, 0);
      }
    },
    /**
     * 将队列中的编码作为一次请求下发,结果写入缓存。
     * 失败的编码清除加载中标记,保持未加载状态,下次 load 自动重试。
     */
    flush(): void {
      const codes = [...new Set(queue)];
      queue = [];
      if (codes.length === 0) return;
      const seq = ++flushSeq;
      for (const code of codes) loadSeq.set(code, seq);
      getDictByCodes(codes)
        .then(res => {
          for (const code of codes) delete this.pending[code];
          for (const group of res.data ?? []) {
            // 本批发起后该编码又被 refresh 重新入队:本批结果已过期,不写入
            if ((loadSeq.get(group.dictCode) ?? 0) > seq) continue;
            this.dicts[group.dictCode] = group.items;
          }
          // 后端只下发有启用条目的编码,未命中的写空数组占位,避免反复请求
          // (同理跳过已被 refresh 取代的编码)
          for (const code of codes) {
            if (!this.dicts[code] && (loadSeq.get(code) ?? 0) <= seq) {
              this.dicts[code] = [];
            }
          }
        })
        .catch(() => {
          // 失败清除加载中标记,保持未加载状态,下次 load 自动重试
          for (const code of codes) {
            delete this.pending[code];
          }
        });
    },
    /**
     * 强制重拉指定编码(管理侧改动后调用)
     *
     * @param codes 字典编码集合;空集合直接返回
     */
    refresh(...codes: Array<string>): void {
      const todo = codes.filter(Boolean);
      if (todo.length === 0) return;
      for (const code of todo) {
        delete this.dicts[code];
        // 同步清除在途标记:否则 load 被 pending 短路,refresh 后
        // 旧响应照常写入缓存,刷新失效
        delete this.pending[code];
      }
      this.load(todo);
    }
  }
});

export function useDictStoreHook() {
  return useDictStore(store);
}
