import { inject, provide, ref, type InjectionKey, type Ref } from "vue";
import type { SysConfig } from "@/utils/sysConfig";

/** 门户站点配置的注入键(带类型约束,替代字符串 key 与 props 双通道下发) */
const PORTAL_SYS_CONFIG_KEY: InjectionKey<Ref<Partial<SysConfig>>> =
  Symbol("portalSysConfig");

/** PortalLayout 提供站点公共配置(唯一提供方) */
export function providePortalSysConfig(sysConfig: Ref<Partial<SysConfig>>) {
  provide(PORTAL_SYS_CONFIG_KEY, sysConfig);
}

/** 门户子组件读取站点公共配置(布局外调用时返回空配置,消费侧按需兜底) */
export function usePortalSysConfig(): Ref<Partial<SysConfig>> {
  return inject(PORTAL_SYS_CONFIG_KEY) ?? ref({});
}
