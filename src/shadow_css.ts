// 全部注入到 shadow root 里的样式。数值基本照搬参考项目
// (EdgeTranslate Panel.jsx / Result.jsx 的 styled-components 与 select.styl)。
export const SHADOW_CSS = `
/* ---------- 划词浮动按钮（参考 select.styl） ---------- */
.tst-button {
  position: fixed;
  box-sizing: content-box;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 50%;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0px 0px 2px 2px #dddddd;
  cursor: pointer;
  z-index: 2147483647;
  transition: box-shadow 200ms ease-in-out, transform 300ms ease;
  animation: tst-fade-in 300ms ease-in-out;
}

.tst-button:hover {
  box-shadow: 0px 0px 8px 3px #bbbbbb;
  transform: rotate(180deg);
}

.tst-button img {
  width: 20px;
  height: 20px;
  object-fit: contain;
  pointer-events: none;
}

.tst-button .tst-button-text {
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
  font-size: 16px;
  color: #4f3d3b;
}

@keyframes tst-fade-in {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

/* ---------- 面板外壳（参考 Panel.jsx 的 styled.div） ---------- */
.tst-panel {
  position: fixed;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: 320px;
  max-height: min(70vh, 560px);
  border-radius: 8px;
  background: rgba(235, 235, 235, 1);
  box-shadow: 0px 8px 12px 5px rgba(0, 0, 0, 0.25);
  color: black;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial,
    sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
  font-size: 16px;
  font-weight: normal;
  line-height: 1;
  tab-size: 4;
  z-index: 2147483647;
}

/* 图标统一用描边绘制，颜色跟随 currentColor */
.tst-panel svg {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.tst-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 0 0 auto;
  padding: 4px;
  overflow: visible;
  cursor: grab;
}

.tst-head-icons {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
}

/* 图标按钮：24x24 圆形白底，图标 16x16（参考 HeadIcon 的数值） */
.tst-icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin: 2px;
  padding: 0;
  border: none;
  border-radius: 15px;
  background-color: rgba(255, 255, 255, 0.8);
  color: #8e8e93;
  cursor: pointer;
}

.tst-icon-button svg {
  width: 16px;
  height: 16px;
  display: block;
  transition: color 0.2s linear;
}

.tst-icon-button:hover {
  color: dimgray;
}

/* 图钉：未固定时旋转 45 度（参考 StyledPinIcon） */
.tst-icon-button.tst-pin svg {
  transition: color 0.2s linear, transform 0.2s linear;
  transform: rotate(45deg);
}

.tst-icon-button.tst-pin.tst-pinned svg {
  transform: rotate(0deg);
}

/* ---------- 翻译源下拉（参考 Dropdown.jsx） ---------- */
.tst-dropdown {
  position: relative;
  max-width: 45%;
}

.tst-dropdown-title {
  display: flex;
  align-items: center;
  padding: 2px 8px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: gray;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  white-space: nowrap;
  user-select: none;
  cursor: pointer;
  transition: color 0.2s linear, background-color 0.3s linear;
}

.tst-dropdown-title:hover {
  color: #575757;
  background: #e4e4e4;
}

.tst-dropdown-title svg {
  width: 16px;
  height: 16px;
  margin-left: 4px;
  color: #8e8e93;
}

.tst-dropdown-menu {
  position: absolute;
  left: 0;
  top: 100%;
  z-index: 6;
  min-width: 100px;
  margin: 0;
  padding: 6px 0;
  border-radius: 6px;
  background-color: #ffffff;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.06), 0 4px 4px rgba(0, 0, 0, 0.12);
}

.tst-dropdown-item {
  display: block;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: transparent;
  color: #575757;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.4;
  text-align: left;
  white-space: nowrap;
  cursor: pointer;
}

.tst-dropdown-item:hover {
  background-color: #f2faff;
}

.tst-dropdown-item.tst-active {
  color: #1675e0;
  font-weight: 700;
  background-color: rgba(242, 250, 255, 0.5);
}

/* ---------- 内容区（参考 Body + SimpleBar 的滚动条数值） ---------- */
.tst-body {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-grow: 1;
  flex-shrink: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  font-size: medium;
  word-break: break-word;
}

.tst-body::-webkit-scrollbar {
  width: 8px;
}

.tst-body::-webkit-scrollbar-thumb {
  border-radius: 8px;
  background-color: rgba(150, 150, 150, 0.8);
}

.tst-body::-webkit-scrollbar-track {
  background: transparent;
}

/* ---------- 结果区块（参考 Block） ---------- */
.tst-block {
  box-sizing: border-box;
  width: calc(100% - 16px);
  padding: 10px;
  margin: 8px;
  margin-top: 0;
  border-radius: 10px;
  background-color: rgb(250, 250, 250);
  line-height: 120%;
  letter-spacing: 0.02em;
}

.tst-block:first-child {
  margin-top: 8px;
}

.tst-line {
  width: 100%;
  display: flex;
  margin: 5px 0;
  justify-content: space-between;
  align-items: center;
}

.tst-text {
  flex-grow: 1;
  white-space: pre-wrap;
  user-select: text;
}

.tst-position {
  margin: 5px 0;
  color: #919191;
  font-size: smaller;
}

.tst-note {
  margin-top: 5px;
  color: #919191;
  font-size: smaller;
}

.tst-copy {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  margin-left: 2px;
  padding: 0;
  border: none;
  background: transparent;
  color: #919191;
  cursor: pointer;
}

.tst-copy svg {
  width: 20px;
  height: 20px;
  display: block;
}

.tst-copy:hover {
  color: dimgray;
}

.tst-copy.tst-copied {
  color: #4a8cf7;
}

.tst-block-head {
  display: flex;
  align-items: center;
}

.tst-spot {
  flex: 0 0 auto;
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.tst-block-title {
  margin-left: 10px;
  font-size: small;
}

.tst-split {
  width: 100%;
  height: 1px;
  margin: 5px 0;
  background: rgba(0, 0, 0, 0.25);
}

.tst-detail-meaning {
  padding: 5px 0;
  margin-left: 10px;
}

.tst-pos-label {
  color: #919191;
  font-size: smaller;
}

.tst-chips {
  display: flex;
  flex-wrap: wrap;
  margin-top: 2px;
}

/* 词条胶囊（参考 SynonymWord） */
.tst-chip {
  padding: 2px 10px;
  margin: 0 2px 3px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 32px;
  font-size: small;
  user-select: text;
}

.tst-def-example {
  margin-top: 2px;
  color: #5f6368;
  font-size: small;
}

/* 例句列表（参考 ExampleList / ExampleItem） */
.tst-examples {
  margin: 0;
  padding-left: 1.5rem;
  list-style-type: decimal;
}

.tst-examples li {
  padding: 5px 0;
  font-size: medium;
  user-select: text;
}

/* ---------- 加载中（参考 Loading 的配色） ---------- */
.tst-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 0;
}

.tst-dots {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tst-dots span {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  animation: tst-dot 1.7s cubic-bezier(0, 0.5, 0.5, 1) infinite;
}

.tst-dots span:nth-child(1) {
  background: rgba(255, 205, 66, 0.9);
  animation-delay: -0.48s;
}

.tst-dots span:nth-child(2) {
  background: rgba(221, 81, 69, 0.9);
  animation-delay: -0.32s;
}

.tst-dots span:nth-child(3) {
  background: rgba(25, 161, 95, 0.9);
  animation-delay: -0.16s;
}

.tst-dots span:nth-child(4) {
  background: rgba(75, 139, 244, 0.9);
}

@keyframes tst-dot {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* ---------- 出错（参考 Error 的配色） ---------- */
.tst-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 24px 16px;
  text-align: center;
}

.tst-error svg {
  width: 56px;
  height: 56px;
  color: #dd5145;
}

.tst-error-text {
  color: #dd5145;
  font-size: small;
  line-height: 140%;
  user-select: text;
}
`;
