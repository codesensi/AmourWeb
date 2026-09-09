// 缓存监控 mock(对齐后端 CacheController:GET /cache/list-all,时点快照)
// 数据契约对齐 CacheResponse:cacheName/expireAfterWrite/expireAfterAccess/maximumSize/entries/stats
// stats 对齐 CacheStatsResponse:hitCount/missCount/hitRate/evictionCount/loadSuccessCount/loadFailureCount/averageLoadPenaltyMillis
import { defineFakeRoute } from "vite-plugin-fake-server/client";

// 与后端 app.cache.caches 注册的 8 个缓存同源(cacheName 含「项目名_运行环境」前缀)
const caches = [
  {
    cacheName: "amour_dev_captcha",
    expireAfterWrite: 300,
    expireAfterAccess: null,
    maximumSize: 1000,
    entries: [
      {
        key: "3f2a9c8e-7d1b-4a2f",
        value: "8f3k",
        remainExpire: 213
      }
    ],
    stats: {
      hitCount: 41,
      missCount: 12,
      hitRate: 0.7736,
      evictionCount: 0,
      loadSuccessCount: 12,
      loadFailureCount: 0,
      averageLoadPenaltyMillis: 0.31
    }
  },
  {
    cacheName: "amour_dev_config",
    expireAfterWrite: 2592000,
    expireAfterAccess: null,
    maximumSize: 1000,
    entries: [
      {
        key: "site.title",
        value: "Amour 运维平台",
        remainExpire: 2591745
      },
      {
        key: "site.portalEnabled",
        value: "true",
        remainExpire: 2591745
      }
    ],
    stats: {
      hitCount: 96,
      missCount: 4,
      hitRate: 0.96,
      evictionCount: 0,
      loadSuccessCount: 4,
      loadFailureCount: 0,
      averageLoadPenaltyMillis: 2.15
    }
  },
  {
    cacheName: "amour_dev_role",
    expireAfterWrite: 2592000,
    expireAfterAccess: null,
    maximumSize: 1000,
    entries: [
      {
        key: "1",
        value: [{ id: 1, name: "超级管理员", code: "admin" }],
        remainExpire: 2592100
      }
    ],
    stats: {
      hitCount: 18,
      missCount: 3,
      hitRate: 0.8571,
      evictionCount: 0,
      loadSuccessCount: 3,
      loadFailureCount: 0,
      averageLoadPenaltyMillis: 1.87
    }
  },
  {
    cacheName: "amour_dev_perm",
    expireAfterWrite: 2592000,
    expireAfterAccess: null,
    maximumSize: 1000,
    entries: [
      {
        key: "1",
        value: [
          "system:user:page",
          "system:user:insert",
          "system:role:page",
          "system:menu:page"
        ],
        remainExpire: 2591900
      }
    ],
    stats: {
      hitCount: 57,
      missCount: 3,
      hitRate: 0.95,
      evictionCount: 0,
      loadSuccessCount: 3,
      loadFailureCount: 0,
      averageLoadPenaltyMillis: 3.42
    }
  },
  {
    cacheName: "amour_dev_menu",
    expireAfterWrite: 2592000,
    expireAfterAccess: null,
    maximumSize: 1000,
    entries: [
      {
        key: "1",
        value: [
          { path: "/admin/system/user", title: "用户管理" },
          { path: "/admin/system/role", title: "角色管理" }
        ],
        remainExpire: 2591800
      }
    ],
    stats: {
      hitCount: 52,
      missCount: 3,
      hitRate: 0.9455,
      evictionCount: 0,
      loadSuccessCount: 3,
      loadFailureCount: 0,
      averageLoadPenaltyMillis: 4.06
    }
  },
  {
    cacheName: "amour_dev_user",
    expireAfterWrite: 2592000,
    expireAfterAccess: null,
    maximumSize: 1000,
    entries: [
      {
        key: "1",
        value: {
          id: 1,
          username: "admin",
          nickname: "超级管理员",
          email: "admin@amour.cn"
        },
        remainExpire: 2591500
      },
      {
        key: "2",
        value: {
          id: 2,
          username: "hero",
          nickname: "门户主角",
          email: "hero@amour.cn"
        },
        remainExpire: 2591400
      },
      {
        key: "3",
        value: null,
        remainExpire: 2591300
      }
    ],
    stats: {
      hitCount: 63,
      missCount: 9,
      hitRate: 0.875,
      evictionCount: 0,
      loadSuccessCount: 9,
      loadFailureCount: 1,
      averageLoadPenaltyMillis: 5.63
    }
  },
  {
    cacheName: "amour_dev_qq",
    expireAfterWrite: 900,
    expireAfterAccess: null,
    maximumSize: 1000,
    entries: [
      {
        key: "openid_a8f3",
        value: { nickname: "IT老王", figureurl: "https://qq.cn/a.png" },
        remainExpire: 786
      }
    ],
    stats: {
      hitCount: 7,
      missCount: 5,
      hitRate: 0.5833,
      evictionCount: 2,
      loadSuccessCount: 5,
      loadFailureCount: 0,
      averageLoadPenaltyMillis: 326.75
    }
  },
  {
    cacheName: "amour_dev_dict",
    expireAfterWrite: 2592000,
    expireAfterAccess: null,
    maximumSize: 1000,
    entries: [
      {
        key: "gender",
        value: [
          { dictValue: "U", dictLabel: "未知", sort: 1 },
          { dictValue: "M", dictLabel: "男", sort: 2 },
          { dictValue: "F", dictLabel: "女", sort: 3 }
        ],
        remainExpire: 2591600
      },
      {
        key: "enable",
        value: [
          { dictValue: "0", dictLabel: "启用", sort: 1 },
          { dictValue: "1", dictLabel: "禁用", sort: 2 }
        ],
        remainExpire: 2591600
      },
      {
        key: "not-exists",
        value: null,
        remainExpire: 2591600
      }
    ],
    stats: {
      hitCount: 132,
      missCount: 6,
      hitRate: 0.9565,
      evictionCount: 0,
      loadSuccessCount: 6,
      loadFailureCount: 0,
      averageLoadPenaltyMillis: 1.94
    }
  }
];

export default defineFakeRoute([
  // 缓存内容列表(GET /cache/list-all,时点快照)
  {
    url: "/cache/list-all",
    method: "get",
    response: () => ({
      success: true,
      code: 200,
      msg: "操作成功",
      timestamp: Date.now(),
      data: caches
    })
  }
]);
