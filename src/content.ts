let g_trans_button: null | HTMLDivElement = null;

function get_selection_rect(selection: Selection): DOMRect {
  const range = selection.getRangeAt(0);
  const startNode = range.startContainer; // 起始位置的节点（文本节点或元素）
  const startOffset = range.startOffset; // 在节点内的偏移量

  // 示例：获取文本节点中第一个字符的位置
  if (startNode.nodeType !== Node.TEXT_NODE) {
    alert("sorry, a fucking bug");
  }
  const tempRange = document.createRange();
  tempRange.setStart(startNode, startOffset);
  tempRange.setEnd(startNode, startOffset + 1); // 选中第一个字符
  const rect = tempRange.getBoundingClientRect();
  return rect;
}

function update_trans_button_position() {
  if (g_trans_button === null) return;
  const selection = window.getSelection()!;
  // 获取选中区域位置
  const rect = get_selection_rect(selection);

  // 创建/更新图标位置
  const x = rect.left;
  const y = rect.top - 30;
  console.info("button new pos: " + x + ", " + y);
  g_trans_button.style.left = `${x}px`;
  g_trans_button.style.top = `${y}px`;
}

// 创建浮动图标元素
const create_trans_button = () => {
  const button = document.createElement("div");
  button.style.position = "fixed";
  button.style.width = "16px";
  button.style.height = "16px";
  button.style.backgroundImage = `url(${chrome.runtime.getURL(
    "res/popup_icon.png"
  )})`;
  button.style.cursor = "pointer";
  button.className = "selection-popup-icon";
  document.body.appendChild(button);
  button.addEventListener("click", (e) => {});
  return button;
};

// 监听文本选择变化
document.addEventListener("selectionchange", () => {
  const selection = window.getSelection();

  if (!selection || selection.isCollapsed) {
    // 没有选中内容时移除图标
    if (g_trans_button !== null) {
      g_trans_button.remove();
      g_trans_button = null;
    }
    return;
  }

  if (g_trans_button === null) g_trans_button = create_trans_button();

  console.log("update");
  update_trans_button_position();
});

document.addEventListener("scroll", () => {
  if (g_trans_button) update_trans_button_position();
});
