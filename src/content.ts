import { get_shadow_root } from "./dom";
import { load_settings } from "./settings";
import {
  is_panel_open,
  open_trans_panel,
  set_panel_error,
  set_panel_loading,
  set_panel_result,
} from "./trans_panel";
import { TranslateReply, TranslateSource } from "./types";

const BUTTON_SIZE = 32;
const BUTTON_GAP = 6;

let g_button: HTMLButtonElement | null = null;
// 按钮出现时就把选中的文本记下来：点到按钮时选区往往已经被点没了。
let g_selection_text = "";
let g_request_id = 0;

// 选区可能在页面自己的 shadow root 里，getClientRects 返回的仍是视口坐标，可以直接用。
function get_selection_rect(): DOMRect | null {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const rects = range.getClientRects();
  // 取最后一个矩形：多行选中时它最靠近用户松开鼠标的位置。
  const rect =
    rects.length > 0 ? rects[rects.length - 1] : range.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return null;
  return rect;
}

function create_button(): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "tst-button";
  button.title = "翻译选中文本";

  const icon = document.createElement("img");
  icon.src = chrome.runtime.getURL("res/popup_icon.svg");
  icon.alt = "译";
  // 页面 CSP 可能拦掉扩展图片，退化成文字按钮。
  icon.addEventListener("error", () => {
    icon.remove();
    const text = document.createElement("span");
    text.className = "tst-button-text";
    text.textContent = "译";
    button.appendChild(text);
  });
  button.appendChild(icon);

  // 用 mousedown 而不是 click：点按钮会让页面选区 collapse，
  // 从而触发 selectionchange 把按钮移除，click 就永远等不到了。
  button.addEventListener("mousedown", (event) => {
    event.preventDefault();
    event.stopPropagation();
    void open_panel_for_selection(event.clientX, event.clientY);
  });

  get_shadow_root().appendChild(button);
  return button;
}

function hide_button() {
  g_button?.remove();
  g_button = null;
}

function position_button() {
  if (g_button === null) return;
  const rect = get_selection_rect();
  if (!rect) return;

  let left = rect.left;
  let top = rect.top - BUTTON_SIZE - BUTTON_GAP;
  if (top < 0) top = rect.bottom + BUTTON_GAP; // 选区贴顶时翻到下方
  left = Math.min(Math.max(left, 0), window.innerWidth - BUTTON_SIZE);
  top = Math.min(Math.max(top, 0), window.innerHeight - BUTTON_SIZE);

  g_button.style.left = `${left}px`;
  g_button.style.top = `${top}px`;
}

function update_button() {
  // 面板开着的时候不再显示浮动按钮。
  if (is_panel_open()) {
    hide_button();
    return;
  }

  const selection = window.getSelection();
  const text =
    selection && !selection.isCollapsed ? selection.toString().trim() : "";
  if (text === "" || get_selection_rect() === null) {
    hide_button();
    return;
  }

  g_selection_text = text;
  if (g_button === null) g_button = create_button();
  position_button();
}

function request_translation(text: string, source: TranslateSource) {
  g_request_id += 1;
  const request_id = g_request_id;
  set_panel_loading(source);

  try {
    chrome.runtime
      .sendMessage({ action: "translate", text, source, requestId: request_id })
      .catch(() => {
        // background 用 chrome.tabs.sendMessage 回推结果，这个 promise 不需要有响应。
      });
  } catch {
    // 扩展重新加载后，旧页面里的 content script 会失效。
    set_panel_error("扩展已更新，请刷新页面后重试", source);
  }
}

async function open_panel_for_selection(x: number, y: number) {
  const text = g_selection_text.trim();
  if (text === "") return;

  // 先读设置：面板一打开就该显示正确的翻译源和图钉状态，否则会闪一下。
  const settings = await load_settings();

  // 读设置是异步的，这期间 mouseup 可能又把浮动按钮建了回来，这里再清一次。
  hide_button();
  open_trans_panel(
    x,
    y,
    { source: settings.source, pinned: settings.pin },
    {
      on_source_change: (source) => {
        // 记住用户的选择，后续划词直接用这个源。
        chrome.runtime
          .sendMessage({ action: "set_source", source })
          .catch(() => {});
        request_translation(text, source);
      },
    }
  );
  request_translation(text, settings.source);
}

// 只注册一次监听，按 requestId 丢弃过期响应（原来每次弹窗都加一个监听，会越积越多）。
chrome.runtime.onMessage.addListener((message) => {
  if (message?.action !== "translation") return;
  if (!is_panel_open() || message.requestId !== g_request_id) return;

  const reply = message as TranslateReply;
  if (reply.ok) {
    set_panel_result(reply, reply.cached === true);
  } else {
    set_panel_error(reply.error || "翻译失败", reply.source);
  }
});

document.addEventListener("selectionchange", update_button);
// shadow root 内的选区不一定触发 document 的 selectionchange，鼠标松开时兜一次。
document.addEventListener("mouseup", update_button);

// 用捕获阶段，才能收到页面内部滚动容器（不只是 window）的滚动事件。
document.addEventListener(
  "scroll",
  () => {
    if (g_button !== null) position_button();
  },
  true
);
