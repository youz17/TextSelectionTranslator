import { get_shadow_root, is_our_ui } from "./dom";
import { remove_panel_from, render_panel_into } from "./panel";
import { save_pin } from "./settings";
import { TranslateResult, TranslateSource } from "./types";

export interface TransPanelHandlers {
  on_source_change: (source: TranslateSource) => void;
}

interface PanelState {
  phase: "loading" | "result" | "error";
  result: TranslateResult | null;
  error: string;
  source: TranslateSource;
  cached: boolean;
  pinned: boolean;
}

let g_container: HTMLDivElement | null = null;
let g_state: PanelState | null = null;
let g_handlers: TransPanelHandlers | null = null;
let g_dragged = false;

export function is_panel_open(): boolean {
  return g_container !== null;
}

// UI 全部由 Preact 渲染（panel.tsx），这里只负责状态、挂载和拖拽。
function render_current() {
  if (g_container === null || g_state === null || g_handlers === null) return;

  render_panel_into(g_container, {
    phase: g_state.phase,
    result: g_state.result,
    error: g_state.error,
    source: g_state.source,
    cached: g_state.cached,
    pinned: g_state.pinned,
    on_source_change: (source) => g_handlers?.on_source_change(source),
    on_toggle_pin: () => {
      if (g_state === null) return;
      g_state.pinned = !g_state.pinned;
      save_pin(g_state.pinned).catch(() => {});
      render_current();
    },
    on_open_settings: () => {
      chrome.runtime.openOptionsPage();
    },
    on_close: () => close_trans_panel(),
  });
}

// 面板顶部拖动。和参考项目一样，只有按在标题栏本身（不是按钮/下拉）才开始拖。
function install_drag(container: HTMLDivElement) {
  let start_x = 0;
  let start_y = 0;
  let start_left = 0;
  let start_top = 0;

  const on_move = (event: MouseEvent) => {
    container.style.left = `${start_left + event.clientX - start_x}px`;
    container.style.top = `${start_top + event.clientY - start_y}px`;
  };

  const on_up = () => {
    document.removeEventListener("mousemove", on_move);
    document.removeEventListener("mouseup", on_up);
  };

  container.addEventListener("mousedown", (event) => {
    const head = container.querySelector(".tst-head");
    if (head === null || event.target !== head) return;

    g_dragged = true;
    start_x = event.clientX;
    start_y = event.clientY;
    start_left = container.offsetLeft;
    start_top = container.offsetTop;
    document.addEventListener("mousemove", on_move);
    document.addEventListener("mouseup", on_up);
  });
}

// 点面板外面关闭。用 mousedown 而不是 click：按钮是在 mousedown 里开面板的，
// 若用 click 监听，紧接着那个 click 会立刻把面板关掉。
function on_document_mousedown(event: MouseEvent) {
  if (g_container === null) return;
  if (is_our_ui(event)) return;
  if (g_state?.pinned) return; // 固定住了就不自动关
  close_trans_panel();
}

// 内容变长后重新贴回视口内；用户拖动过就不再干预。
function clamp_into_view() {
  if (g_container === null || g_dragged) return;
  const max_left = Math.max(window.innerWidth - g_container.offsetWidth, 0);
  const max_top = Math.max(window.innerHeight - g_container.offsetHeight, 0);
  g_container.style.left = `${Math.min(Math.max(g_container.offsetLeft, 0), max_left)}px`;
  g_container.style.top = `${Math.min(Math.max(g_container.offsetTop, 0), max_top)}px`;
}

export function open_trans_panel(
  x: number,
  y: number,
  options: { source: TranslateSource; pinned: boolean },
  handlers: TransPanelHandlers
) {
  close_trans_panel();
  g_handlers = handlers;
  g_dragged = false;
  g_state = {
    phase: "loading",
    result: null,
    error: "",
    source: options.source,
    cached: false,
    pinned: options.pinned,
  };

  const container = document.createElement("div");
  container.className = "tst-panel";
  get_shadow_root().appendChild(container);
  g_container = container;
  render_current();
  install_drag(container);

  // 优先放在鼠标位置上方，上面放不下就落到下面
  const above = y - container.offsetHeight;
  container.style.left = `${x}px`;
  container.style.top = `${Math.max(above > 0 ? above : y, 0)}px`;
  clamp_into_view();

  document.addEventListener("mousedown", on_document_mousedown);
}

export function set_panel_loading(source: TranslateSource) {
  if (g_state === null) return;
  g_state.phase = "loading";
  g_state.result = null;
  g_state.error = "";
  g_state.source = source;
  g_state.cached = false;
  render_current();
  clamp_into_view();
}

export function set_panel_result(result: TranslateResult, cached: boolean) {
  if (g_state === null) return;
  g_state.phase = "result";
  g_state.result = result;
  g_state.error = "";
  g_state.source = result.source;
  g_state.cached = cached;
  render_current();
  clamp_into_view();
}

export function set_panel_error(message: string, source: TranslateSource) {
  if (g_state === null) return;
  g_state.phase = "error";
  g_state.result = null;
  g_state.error = message;
  g_state.source = source;
  g_state.cached = false;
  render_current();
  clamp_into_view();
}

export function close_trans_panel() {
  document.removeEventListener("mousedown", on_document_mousedown);
  if (g_container !== null) {
    remove_panel_from(g_container);
    g_container.remove();
  }
  g_container = null;
  g_state = null;
  g_handlers = null;
}
