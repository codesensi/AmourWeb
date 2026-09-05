import { defineStore } from "pinia";
import { getSysConfig, type SysConfigData } from "@/api/sysConfig";

interface SysConfigState {
  /** 站点公共配置(GET /sys/config;接口就绪前为空对象,消费方按缺失安全降级) */
  data: Partial<SysConfigData>;
  /** 已成功拉取标记:同一页面生命周期内只请求一次 */
  loaded: boolean;
}

export const useSysConfigStore = defineStore("sysConfig", {
  state: (): SysConfigState => ({
    data: {},
    loaded: false
  }),
  actions: {
    /**
     * 拉取站点公共配置。
     * <p>
     * 同一页面生命周期内只请求一次:已成功拉取则直接复用,
     * 失败(或尚未拉取)时重新请求,保证可重试。
     */
    async fetch() {
      if (this.loaded) return;
      try {
        const res = await getSysConfig();
        if (res.success) {
          this.data = res.data;
          this.loaded = true;
        }
      } catch {
        // 请求失败:静默保留上次数据,下次调用可重试
      }
    }
  }
});
