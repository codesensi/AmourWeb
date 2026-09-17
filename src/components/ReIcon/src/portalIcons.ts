// 门户导航图标注册(lucide 线描集):在 main.ts 全局执行,
// 门户路由不经管理端 layout(offlineIcon.ts 的注册时机),故 portal/* 独立在此注册。
// key 与门户路由 meta 的 icon 语义名对齐,PortalHeader/home 经
// IconifyIconOffline 以 "portal/<name>" 引用。
import { getSvgInfo } from "@pureadmin/utils";
import { addIcon } from "@iconify/vue/dist/offline";

// https://icon-sets.iconify.design/lucide/?keyword=lucide
// (lucide 为 Feather 社区延续版,24×24 圆头线描,与门户杂志线框风同源)
import LucideHouse from "~icons/lucide/house?raw";
import LucidePenLine from "~icons/lucide/pen-line?raw";
import LucideImage from "~icons/lucide/image?raw";
import LucideList from "~icons/lucide/list?raw";
import LucideMail from "~icons/lucide/mail?raw";
import LucideCalendar from "~icons/lucide/calendar?raw";
import LucideClock from "~icons/lucide/clock?raw";
import LucideBook from "~icons/lucide/book?raw";
import LucideMapPin from "~icons/lucide/map-pin?raw";

const icons = [
  ["portal/home", LucideHouse],
  ["portal/moments", LucidePenLine],
  ["portal/photo", LucideImage],
  ["portal/list", LucideList],
  ["portal/message", LucideMail],
  ["portal/calendar", LucideCalendar],
  ["portal/capsule", LucideClock],
  ["portal/diary", LucideBook],
  ["portal/footprint", LucideMapPin]
];

icons.forEach(([name, icon]) => {
  addIcon(name as string, getSvgInfo(icon as string));
});
