import Cookies from "js-cookie";
import {useUserStoreHook} from "@/store/modules/user";
import {isIncludeAllChildren, isString, storageLocal} from "@pureadmin/utils";

export interface DataInfo<T> {
  /** token */
  accessToken: string;
  /** `accessToken`的过期时间（毫秒时间戳） */
  expires: T;
  /** 头像 */
  avatar?: string;
  /** 用户名 */
  username?: string;
  /** 昵称 */
  nickname?: string;
  /** 当前登录用户的角色 */
  roles?: Array<string>;
  /** 当前登录用户的按钮级别权限 */
  permissions?: Array<string>;
  /** 登录页「记住密码」标记:勾选时持久化,前端不过期,失效由后端 401 判定 */
  remembered?: boolean;
}

export const userKey = "user-info";
export const TokenKey = "authorized-token";

/**
 * 读取 localStorage 中 key 为 `user-info` 的当前登录用户信息快照。
 * 不存在时返回 `null`,字段兜底由消费侧按需处理
 * (统一入口,避免各处重复 `storageLocal().getItem(userKey)` 调用链)。
 */
export function getStoredUserInfo(): DataInfo<number> | null {
  return storageLocal().getItem<DataInfo<number>>(userKey);
}
/**
 * 通过`multiple-tabs`是否在`cookie`中，判断用户是否已经登录系统，
 * 从而支持多标签页打开已经登录的系统后无需再登录。
 * 浏览器完全关闭后`multiple-tabs`将自动从`cookie`中销毁，
 * 再次打开浏览器需要重新登录系统
 * */
export const multipleTabsKey = "multiple-tabs";

/**
 * 获取`token`。
 * cookie 缺失、内容被篡改(JSON 解析失败)或本地快照不存在时返回 `null`,
 * 调用方(请求拦截器等)按未登录态降级,避免脏数据导致全部请求连锁失败
 */
export function getToken(): DataInfo<number> | null {
  // 此处与`TokenKey`相同，此写法解决初始化时`Cookies`中不存在`TokenKey`报错
  const token = Cookies.get(TokenKey);
  if (token) {
    try {
      return JSON.parse(token);
    } catch {
      // cookie 格式异常时移除脏数据,回落 localStorage 快照(通常同样为空,即未登录态)
      Cookies.remove(TokenKey);
    }
  }
  return storageLocal().getItem<DataInfo<number>>(userKey);
}

/**
 * @description 设置`token`以及一些必要信息
 * 登录成功后将`accessToken`与`expires`（过期时间，毫秒时间戳）写入 key 值为 authorized-token 的 cookie
 * （`expires`大于 0 时按剩余有效期设置 cookie 过期自动销毁，小于等于 0 时为会话 cookie），
 * 并将`avatar`、`username`、`nickname`、`roles`、`permissions`、`expires`写入 key 值为`user-info`的 localStorage
 * （利用`multipleTabsKey`当浏览器完全关闭后自动销毁）。
 * 项目无`refreshToken`无感刷新机制：token 失效由后端 401 判定，前端收到 401 后统一登出
 */
export function setToken(data: DataInfo<number>) {
  let expires = 0;
  const { accessToken } = data;
  const { isRemembered } = useUserStoreHook();
  // 后端直接返回毫秒时间戳
  expires = Number(data.expires);
  const cookieString = JSON.stringify({ accessToken, expires });

  expires > 0
    ? Cookies.set(TokenKey, cookieString, {
        expires: (expires - Date.now()) / 86400000
      })
    : Cookies.set(TokenKey, cookieString);

  // 「记住密码」语义分离:勾选 → 不写 cookie,登录标记随 user-info 持久化
  // (localStorage,前端永不过期,失效由后端 401 判定);
  // 不勾选 → 会话 cookie(不设 expires,浏览器关闭即销毁)
  if (isRemembered) {
    Cookies.remove(multipleTabsKey);
  } else {
    Cookies.set(multipleTabsKey, "true");
  }

  function setUserKey(data: {
    avatar: string;
    username: string;
    nickname: string;
    roles: string[];
    permissions: string[];
  }) {
    useUserStoreHook().SET_AVATAR(data.avatar);
    useUserStoreHook().SET_USERNAME(data.username);
    useUserStoreHook().SET_NICKNAME(data.nickname);
    useUserStoreHook().SET_ROLES(data.roles);
    useUserStoreHook().SET_PERMS(data.permissions);
    storageLocal().setItem(userKey, {
      expires,
      avatar: data.avatar,
      username: data.username,
      nickname: data.nickname,
      roles: data.roles,
      permissions: data.permissions,
      // 「记住密码」标记:勾选时 true,配合路由守卫实现长期免登录
      remembered: isRemembered
    });
  }

  if (data.username && data.roles) {
    const { username, roles } = data;
    setUserKey({
      avatar: data?.avatar ?? "",
      username,
      nickname: data?.nickname ?? "",
      roles,
      permissions: data?.permissions ?? []
    });
  } else {
    const storedUserInfo = getStoredUserInfo();
    setUserKey({
      avatar: storedUserInfo?.avatar ?? "",
      username: storedUserInfo?.username ?? "",
      nickname: storedUserInfo?.nickname ?? "",
      roles: storedUserInfo?.roles ?? [],
      permissions: storedUserInfo?.permissions ?? []
    });
  }
}

/** 删除`token`以及key值为`user-info`的localStorage信息 */
export function removeToken() {
  Cookies.remove(TokenKey);
  Cookies.remove(multipleTabsKey);
  storageLocal().removeItem(userKey);
}

/** 格式化token（jwt格式） */
export const formatToken = (token: string): string => {
  return "Bearer " + token;
};

/** 是否有按钮级别的权限（根据登录接口返回的`permissions`字段进行判断）*/
export const hasPerms = (value: string | Array<string>): boolean => {
  if (!value) return false;
  const allPerms = "*:*:*";
  const { permissions } = useUserStoreHook();
  if (!permissions) return false;
  if (permissions.length === 1 && permissions[0] === allPerms) return true;
  return isString(value)
    ? permissions.includes(value)
    : isIncludeAllChildren(value, permissions);
};
