import { h, type VNode } from "vue";
import { isFunction } from "@pureadmin/utils";
import { type MessageHandler, ElMessage, ElMessageBox } from "element-plus";

type messageStyle = "el" | "antd";
type messageTypes = "info" | "success" | "warning" | "error";
type messagePlacement =
  "top" | "top-left" | "top-right" | "bottom" | "bottom-left" | "bottom-right";

interface MessageParams {
  /** 消息类型，可选 `info` 、`success` 、`warning` 、`error` ，默认 `info` */
  type?: messageTypes;
  /** 是否纯色，默认 `false` */
  plain?: boolean;
  /** 自定义图标，该属性会覆盖 `type` 的图标 */
  icon?: any;
  /** 是否将 `message` 属性作为 `HTML` 片段处理，默认 `false` */
  dangerouslyUseHTMLString?: boolean;
  /** 消息风格，可选 `el` 、`antd` ，默认 `antd` */
  customClass?: messageStyle;
  /** 显示时间，单位为毫秒。设为 `0` 则不会自动关闭，`element-plus` 默认是 `3000` ，平台改成默认 `2000` */
  duration?: number;
  /** 是否显示关闭按钮，默认值 `false` */
  showClose?: boolean;
  /** `Message` 消息距离窗口边缘的偏移量，默认 `16` */
  offset?: number;
  /** `Message` 消息放置位置，默认 `top` */
  placement?: messagePlacement;
  /** 设置组件的根元素，默认 `document.body` */
  appendTo?: string | HTMLElement;
  /** 合并内容相同的消息，不支持 `VNode` 类型的消息，默认值 `false` */
  grouping?: boolean;
  /** 重复次数，类似于 `Badge` 。当和 `grouping` 属性一起使用时作为初始数量使用，默认值 `1` */
  repeatNum?: number;
  /** 关闭时的回调函数, 参数为被关闭的 `message` 实例 */
  onClose?: Function | null;
}

/** 用法非常简单，参考 src/views/components/message/index.vue 文件 */

/**
 * `Message` 消息提示函数
 */
const message = (
  message: string | VNode | (() => VNode),
  params?: MessageParams
): MessageHandler => {
  if (!params) {
    return ElMessage({
      message,
      customClass: "pure-message"
    });
  } else {
    const {
      icon,
      type = "info",
      plain = false,
      dangerouslyUseHTMLString = false,
      customClass = "antd",
      duration = 2000,
      showClose = false,
      offset = 16,
      placement = "top",
      appendTo = document.body,
      grouping = false,
      repeatNum = 1,
      onClose
    } = params;

    return ElMessage({
      message,
      icon,
      type,
      plain,
      dangerouslyUseHTMLString,
      duration,
      showClose,
      offset,
      placement,
      appendTo,
      grouping,
      repeatNum,
      // 全局搜 pure-message 即可知道该类的样式位置
      customClass: customClass === "antd" ? "pure-message" : "",
      onClose: () => (isFunction(onClose) ? onClose() : null)
    });
  }
};

/**
 * 危险操作确认框(系统提示 + 警告图标 + 可拖拽)。
 * <p>
 * 收敛各管理页删除/状态切换等确认弹窗的重复配置;取消或关闭时返回 `false`。
 *
 * @param message 确认内容:纯文本直接传字符串;含加粗/主色等样式的富文本传 VNode
 *                (`h("span", [...])` 构造,文本子节点由 Vue 按纯文本转义,杜绝 HTML 注入)。
 *                不再支持 HTML 字符串 + `dangerouslyUseHTMLString` 的拼接方式
 * @param options.confirmButtonText 确认按钮文案,缺省「确定」
 */
const confirmAction = (
  message: string | VNode,
  options?: { confirmButtonText?: string }
): Promise<boolean> => {
  return ElMessageBox.confirm(message, "系统提示", {
    confirmButtonText: options?.confirmButtonText ?? "确定",
    cancelButtonText: "取消",
    type: "warning",
    // 内容恒以纯文本/VNode 挂载:VNode 的文本子节点由 Vue 转义,HTML 注入面归零
    dangerouslyUseHTMLString: false,
    draggable: true
  })
    .then(() => true)
    .catch(() => false);
};

/**
 * 确认框/提示文案中的业务数据强调节点(主色加粗) —— 全项目强调样式单点维护。
 * <p>
 * 用法:`h("span", ["确认要删除", emphasize(row.username), "用户吗?"])`,
 * 与 `confirmAction` / `message` 的 VNode 内容参数配合使用。
 *
 * @param content 需要强调的业务数据(用户名/角色名等,以纯文本渲染)
 */
export const emphasize = (content: string) =>
  h("strong", { style: "color: var(--el-color-primary)" }, content);

export { message, confirmAction };
