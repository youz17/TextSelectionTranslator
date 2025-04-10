interface PopupPanel {
  element: HTMLDivElement;
  updateTranslation: (text: string) => string;
  destroy: () => void;
}

let g_trans_panel: PopupPanel | null = null;

export function popup_trans_panel(
  x: number,
  y: number,
  selection_text: string
) {
  // 清理旧弹窗
  if (g_trans_panel) {
    g_trans_panel.destroy();
    g_trans_panel = null;
  }

  g_trans_panel = create_tran_panel(x, y);

  chrome.runtime.sendMessage({ action: "translate", text: selection_text });
  chrome.runtime.onMessage.addListener((message) => {
    console.log("get message: ", message);
    if (message.translation) {
      g_trans_panel?.updateTranslation(message.translation);
    }
  });

  // 点击外部关闭
  setTimeout(() => {
    const clickHandler = (e: MouseEvent) => {
      if (!g_trans_panel!.element.contains(e.target as Node)) {
        g_trans_panel!.destroy();
        g_trans_panel = null;
        document.removeEventListener("click", clickHandler);
      }
    };
    document.addEventListener("click", clickHandler);
  }, 0);
}

// 创建样式
const style = document.createElement("style");
style.textContent = `
.translation-popup {
    position: absolute;
    background: white;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    min-width: 200px;
    max-width: 300px;
    z-index: 9999;
    user-select: none;
}

.popup-header {
    padding: 8px;
    background: #f5f5f5;
    border-bottom: 1px solid #ddd;
    cursor: move;
    border-radius: 4px 4px 0 0;
}

.popup-content {
    padding: 12px;
    min-height: 60px;
    color: #333;
}

.popup-footer {
    padding: 8px;
    border-top: 1px solid #eee;
    text-align: right;
}

.copy-btn {
    background: #2196F3;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 3px;
    cursor: pointer;
    font-size: 12px;
}

.copy-btn:hover {
    background: #1976D2;
}
`;
document.head.appendChild(style);

function create_tran_panel(x: number, y: number) {
  // 创建容器元素
  const popup = document.createElement("div");
  popup.className = "translation-popup";
  popup.style.cssText = `left:${x}px;top:${y}px;`;

  // 构建内部结构
  popup.innerHTML = `
        <div class="popup-header">翻译</div>
        <div class="popup-content">翻译中...</div>
        <div class="popup-footer">
            <button class="copy-btn">复制</button>
        </div>
    `;

  // 元素引用
  const content = popup.querySelector(".popup-content")!;
  const copyBtn = popup.querySelector(".copy-btn")!;
  const header = popup.querySelector(".popup-header")!;

  // 添加到文档
  document.body.appendChild(popup);

  // 拖动逻辑
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    popup.style.left = startLeft + dx + "px";
    popup.style.top = startTop + dy + "px";
  };

  header.addEventListener("mousedown", (e) => {
    isDragging = true;
    startX = (e as MouseEvent).clientX;
    startY = (e as MouseEvent).clientY; // todo: fix
    startLeft = parseInt(popup.style.left) || 0;
    startTop = parseInt(popup.style.top) || 0;
    document.addEventListener("mousemove", handleMouseMove);
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
    document.removeEventListener("mousemove", handleMouseMove);
  });

  // 复制功能
  copyBtn.addEventListener("click", () => {
    if (!content.textContent) return;
    navigator.clipboard.writeText(content.textContent).then(() => {
      copyBtn.textContent = "已复制!";
      setTimeout(() => (copyBtn.textContent = "复制"), 1500);
    });
  });

  // 暴露更新方法
  return {
    element: popup,
    updateTranslation: (text: string) => (content.textContent = text),
    destroy: () => popup.remove(),
  };
}
