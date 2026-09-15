import type { ApiResult, PageQuery, PageResult } from "@/api/types";
import { http } from "@/utils/http";
import { omitEmpty } from "@/utils/params";

/** 门户分页接口工厂:统一默认分页参数(每页 6 条,与原站一致),单点维护 */
const portalPage = <T>(url: string) => {
  return (params?: PageQuery) =>
    http.request<ApiResult<PageResult<T>>>("get", url, {
      params: omitEmpty({ pageNumber: 1, pageSize: 6, ...params })
    });
};

/** 点点滴滴-文章项 */
export type MomentsItem = {
  /**
   * 文章 ID。当前为 mock 自增数字(后端 /portal/moments 尚未落地);
   * 管理端主键经后端序列化为 string(JS Number 精度丢失防护),后端实现该接口时需对齐
   */
  id: number;
  title: string;
  author: string;
  date: string;
};

/** 点点滴滴-文章分页(GET /portal/moments,每页 6 条) */
export const getMoments = portalPage<MomentsItem>("/portal/moments");

/** 恋爱相册-照片项 */
export type LovePhotoItem = {
  /** 照片地址(后端为上传文件 URL;mock 为内联 SVG 占位图) */
  img: string;
  /** 照片文案 */
  text: string;
  /** 拍摄/记录日期 */
  date: string;
};

/** 恋爱相册分页(GET /portal/love-photo,每页 6 张) */
export const getLovePhoto = portalPage<LovePhotoItem>("/portal/love-photo");

/** 恋爱清单-清单项 */
export type LoveListItem = {
  /** 清单文案 */
  text: string;
  /** 是否已完成 */
  done: boolean;
  /** 可选照片(已完成项可带纪念照) */
  img?: string;
};

/** 恋爱清单分页(GET /portal/love-list,每页 6 条) */
export const getLoveList = portalPage<LoveListItem>("/portal/love-list");

/** 留言-留言项 */
export type MessageItem = {
  qq: string;
  nickname: string;
  avatar: string;
  content: string;
  date: string;
  location: string;
};

/** 留言分页(GET /portal/message) */
export const getMessage = portalPage<MessageItem>("/portal/message");

/** 提交留言(POST /portal/message,字段 {qq, name, text}) */
export const sendMessage = (data: {
  qq: string;
  name: string;
  text: string;
}) => {
  return http.request<ApiResult<null>>("post", "/portal/message", { data });
};

/** 纪念日-纪念日项(GET /portal/anniversary,免登录全量列表) */
export type AnniversaryItem = {
  id: number;
  /** 纪念日名称 */
  name: string;
  /** 纪念日类型: 1-生日, 2-纪念日, 3-节日 */
  type: 1 | 2 | 3;
  /** 纪念日日期(每年重复时仅取月/日) */
  anniversaryDate: string;
  /** 是否每年重复 */
  repeatYearly: boolean;
};

/** 纪念日全量列表(GET /portal/anniversary;倒计时需全量排序,不分页) */
export const getAnniversaryList = () => {
  return http.request<ApiResult<AnniversaryItem[]>>(
    "get",
    "/portal/anniversary"
  );
};

/** 时间胶囊-胶囊项(GET /portal/time-capsule 分页) */
export type TimeCapsuleItem = {
  id: number;
  /** 标题 */
  title: string | null;
  /** 信件内容(未到期时服务端裁剪为 null,前端只展示倒计时) */
  content: string | null;
  /** 解锁时间(yyyy-MM-dd HH:mm:ss) */
  openTime: string;
};

/** 时间胶囊分页(GET /portal/time-capsule,每页 6 封) */
export const getTimeCapsule = portalPage<TimeCapsuleItem>(
  "/portal/time-capsule"
);

/** 情侣日记-日记项(GET /portal/diary 分页) */
export type DiaryItem = {
  id: number;
  /** 记录人 ID(双人日记按人分栏) */
  userId: number;
  /** 记录人昵称(展示用) */
  nickname: string;
  /** 记录人头像(空则前端兜底图) */
  avatar: string;
  /** 记录日期(yyyy-MM-dd) */
  diaryDate: string;
  /** 心情标识(sunny/rainy/starry 等枚举,空则不展示) */
  mood: string | null;
  /** 日记内容 */
  content: string;
};

/** 情侣日记分页(GET /portal/diary,每页 6 篇) */
export const getDiary = portalPage<DiaryItem>("/portal/diary");

/** 足迹-足迹项(GET /portal/footprint,免登录全量列表) */
export type FootprintItem = {
  id: number;
  /** 城市/地点名称 */
  city: string;
  /** 经纬度(地图组件接入后启用;当前时间轴视图仅作展示) */
  longitude: number | null;
  latitude: number | null;
  /** 到访日期(yyyy-MM-dd) */
  arrivalDate: string | null;
  /** 关联照片地址(无照片为 null) */
  photoUrl: string | null;
  /** 备注 */
  remark: string | null;
};

/** 足迹全量列表(GET /portal/footprint;地图/时间轴需全量点位,不分页) */
export const getFootprintList = () => {
  return http.request<ApiResult<FootprintItem[]>>("get", "/portal/footprint");
};

/** 访问统计-累计(GET /portal/visit/total) */
export type VisitTotal = {
  /** 累计浏览量(PV) */
  pv: number;
  /** 累计独立访客数(UV) */
  uv: number;
};

/** 查询累计访问统计(GET /portal/visit/total;页脚「已被阅读 N 次」) */
export const getVisitTotal = () => {
  return http.request<ApiResult<VisitTotal>>("get", "/portal/visit/total");
};

/** 门户主角-单个主角信息(对齐后端 PortalHeroUserResponse) */
export type HeroInfoData = {
  /** 用户昵称(用户未维护时为 null,由前端兜底为空串) */
  nickname: string | null;
  /** 用户名称(昵称为空时的展示兜底;未维护时为 null) */
  username: string | null;
  /** 用户上传头像地址(未维护时为 null,由前端兜底为本地兜底图) */
  avatar: string | null;
  /** 用户QQ号码(未维护时为 null,由前端兜底) */
  qq: string | null;
};

/** 门户主角(GET /portal/hero 免登录;对齐后端 PortalHeroResponse) */
export type HeroData = {
  /** 男主信息(暂无启用的男性主角用户时为 null) */
  male: HeroInfoData | null;
  /** 女主信息(暂无启用的女性主角用户时为 null) */
  female: HeroInfoData | null;
};

/** 查询门户男女主(GET /portal/hero,免登录;字段可能为空,由前端兜底) */
export const getHeroes = () => {
  return http.request<ApiResult<HeroData>>("get", "/portal/hero");
};

/** 一言(GET /portal/saying 免登录;后端已降级,content 可能为空) */
export type SayingData = {
  /** 一言文案(随机一言正文,降级时为 uapi-saying 文案;两级上游均不可用时为空) */
  content: string;
  /** 出处(仅随机一言解析成功时返回,降级时为空) */
  source: string;
  /** 作者(仅随机一言解析成功时返回,降级时为空) */
  author: string;
};

/** 查询一言(GET /portal/saying,免登录;content 为空时由前端不展示) */
export const getPortalSaying = () => {
  return http.request<ApiResult<SayingData>>("get", "/portal/saying");
};

/** QQ 信息(GET /qq-info 免登录;后端已降级,头像恒非空,仅后端 qq-avatar 未配置时为空) */
export type QqInfoData = {
  /** QQ 头像地址(qq-api 解析的真实图片地址,强制 https;降级时为 qq-avatar 按 QQ 号拼接地址) */
  avatarUrl: string;
  /** QQ 昵称(仅 qq-api 解析成功时返回,降级时为空) */
  nickname: string;
};

/** 查询 QQ 信息(GET /qq-info,免登录;昵称可能为空,由前端提示手动填写) */
export const getQqInfo = (qq: string) => {
  return http.request<ApiResult<QqInfoData>>("get", "/qq-info", {
    params: { qq }
  });
};
