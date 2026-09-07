/**
 * 个人中心 mock(VITE_USE_MOCK=true 时由 vite-plugin-fake-server 按路由粒度拦截)。
 * 响应结构与后端 Result<T> 对齐(见 src/api/types.ts 的 ApiResult);
 * 后端对应端点落地后,关闭 VITE_USE_MOCK 即可无缝切换真接口。
 * 资料回显不走 mock:页面直接复用 /sys/user/current-user 现有接口。
 */

/** 对齐 ApiResult<T> 的成功响应 */
const ok = (data = null, msg = "操作成功") => ({
  success: true,
  code: 200,
  msg,
  data,
  timestamp: Date.now()
});

/** 对齐 ApiResult<T> 的失败响应 */
const fail = (msg: string) => ({
  success: false,
  code: 400,
  msg,
  data: null,
  timestamp: Date.now()
});

export default [
  {
    url: "/sys/user/profile",
    method: "put",
    response: () => ok(null, "资料更新成功")
  },
  {
    url: "/sys/user/password",
    method: "put",
    response: ({ body }) => {
      if (!body?.oldPassword) return fail("原密码错误");
      if (body?.newPassword === body?.oldPassword) {
        return fail("新密码不能与原密码相同");
      }
      return ok(null, "密码修改成功");
    }
  },
  {
    url: "/file/upload/avatar",
    method: "post",
    response: ({ body }) => {
      // mock 不落盘:直接回传裁剪产物的 base64,页面即时可见
      const url = body?.file?.base64;
      if (!url) return fail("上传内容为空");
      return ok({ url });
    }
  }
];
