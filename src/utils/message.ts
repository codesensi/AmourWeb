import type { VNode } from "vue";
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
 * 关闭所有 `Message` 消息提示函数
 */
const closeAllMessage = (): void => ElMessage.closeAll();

/**
 * 危险操作确认框(系统提示 + 警告图标 + 可拖拽)。
 * <p>
 * 收敛各管理页删除/状态切换等确认弹窗的重复配置;取消或关闭时返回 `false`。
 *
 * @param message 确认内容
 * @param options.html 内容是否按 HTML 片段渲染(含加粗主色样式的文案传 `true`;
 * 纯文本内容(如文件名)勿传,避免业务数据被当作 HTML 解析)
 * @param options.confirmButtonText 确认按钮文案,缺省「确定」
 */
const confirmAction = (
  message: string,
  options?: { html?: boolean; confirmButtonText?: string }
): Promise<boolean> => {
  return ElMessageBox.confirm(message, "系统提示", {
    confirmButtonText: options?.confirmButtonText ?? "确定",
    cancelButtonText: "取消",
    type: "warning",
    dangerouslyUseHTMLString: options?.html ?? false,
    draggable: true
  })
    .then(() => true)
    .catch(() => false);
};

export { message, closeAllMessage, confirmAction };
