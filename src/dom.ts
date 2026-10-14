import { SHADOW_CSS } from "./shadow_css";

// 扩展自己的按钮和翻译面板统一挂在一个 shadow root 里：
// 页面样式影响不到面板内部，面板样式也不会泄漏到页面里。
const HOST_TAG = "text-selection-translator-root";

let g_host: HTMLElement | null = null;
let g_shadow: ShadowRoot | null = null;

// 用自定义标签名 + inline !important，尽量不让页面样式干扰宿主节点本身。
function create_host(): HTMLElement {
  const host = document.createElement(HOST_TAG);
  host.style.setProperty("all", "initial", "important");
  host.style.setProperty("position", "fixed", "important");
  host.style.setProperty("left", "0", "important");
  host.style.setProperty("top", "0", "important");
  host.style.setProperty("width", "0", "important");
  host.style.setProperty("height", "0", "important");
  host.style.setProperty("display", "block", "important");
  host.style.setProperty("z-index", "2147483647", "important");
  return host;
}

export function get_shadow_root(): ShadowRoot {
  if (g_shadow && g_host?.isConnected) return g_shadow;

  const host = create_host();
  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = SHADOW_CSS;
  shadow.appendChild(style);
  document.documentElement.appendChild(host);

  g_host = host;
  g_shadow = shadow;
  return shadow;
}

// 我们的 UI 在自己的 shadow root 里，事件 target 会被重定向成宿主节点，
// 所以判断"是否点到自己人"必须走 composedPath。
export function is_our_ui(event: Event): boolean {
  return g_host !== null && event.composedPath().includes(g_host);
}
