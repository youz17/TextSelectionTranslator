# Text Selection Translator

划词翻译扩展：选中文本后出现翻译按钮，点击弹出翻译面板。

## 编译

```bash
npm install
npm run build
```

产物在 `dist/`，用 Chrome 的「加载已解压的扩展程序」选择 `dist/` 目录即可。
`dist/` 下的 `*.js` 是构建产物，不会提交到仓库；`dist/manifest.json`、
`dist/options.html`、`dist/res/` 是直接提交的静态文件。

面板用 Preact 渲染（`preact` + `preact/hooks`，走 `jsx: react-jsx` +
`jsxImportSource: preact`，不需要 babel）。生产构建不含 sourcemap。

## 配置

在扩展的「选项」页里配置（不需要手动建 `api_key.ts`）：

- **DeepSeek API Key**：选择 DeepSeek 翻译源时必填。
- **默认翻译源**：Google 或 DeepSeek。
- **目标语言**：中文（简/繁）、英语、日语、韩语、法语、德语、西班牙语、俄语。

## 翻译源

| 翻译源 | 是否需要 Key | 说明 |
| --- | --- | --- |
| Google | 否 | 由 background 代请求 `translate.googleapis.com`，绕开页面 CORS |
| DeepSeek | 是 | `deepseek-chat`，只输出译文 |

面板上可以直接切换翻译源，切换后会被记住，作为下次划词的默认值。

> Google 走的是免 Key 的 `translate_a/single?client=gtx&dj=1` 接口，需要网络能
> 直连 `translate.googleapis.com`。暂不支持自定义代理。
>
> 只有 Google 会返回结构化词典数据（`dj=1` 的 `dict` / `definitions` /
> `examples` / `src_translit`），所以词性释义、音标、例句这些区块只在
> Google 源 + 单词的情况下出现；DeepSeek 只有主译文。

## 面板 UI

结构对齐参考项目 EdgeTranslate：**没有 footer**，只有

```
shadow root
└── .tst-panel            固定定位，8px 圆角，0 8px 12px 5px rgba(0,0,0,.25) 阴影
    ├── .tst-head         拖动把手（只有按在标题栏本身才能拖，按按钮/下拉不拖）
    │   ├── 翻译源下拉     文字 + 箭头，展开是绝对定位的菜单
    │   └── 三个图标按钮   设置（打开选项页）/ 图钉 / 关闭，24x24 圆形白底
    └── .tst-body         可滚动内容区，滚动条 8px
        ├── 主译文 + 复制按钮 + 目标语言音标
        ├── 原文 + 源语言音标
        ├── 词性释义         圆点 #00bfa5，词性 + 词条胶囊
        ├── 英文释义         圆点 #ff4081
        └── 例句             圆点 #3d5afe，有序列表
```

区块顺序与参考项目的 `ContentDisplayOrder` 默认值一致
（`mainMeaning → originalText → detailedMeanings → definitions → examples`），
哪一块没有数据就不渲染，所以句子只会显示前两块。

图钉固定后点面板外面不会自动关闭，状态存在 `chrome.storage.sync`。

样式全部在 shadow root 内（`shadow_css.ts`），数值取自参考项目的
styled-components 与 `select.styl`。图标是内联 SVG（不受页面 CSP 的
`img-src` 限制），用的是简化的描边造型，不是原项目的 svg 资源。

## 单词语典缓存

单个纯英文单词（`^[a-zA-Z][a-zA-Z'-]*$`，长度 ≤ 32）的**整份结构化结果**
（含音标 / 词性释义 / 英文释义 / 例句）会写入 `chrome.storage.local`，永久有效；
再次翻译同一个单词直接命中缓存，不再请求翻译接口，面板上会标注「词典缓存」。

缓存 key 是 `dict:<源>:<目标语言>:<小写单词>`，所以换源或换语言后同一个单词会
重新翻译，不会拿另一个引擎、另一种语言的旧结果糊弄。

## Shadow DOM

- 扩展自己的按钮和面板挂在一个 `attachShadow({ mode: "open" })` 的宿主节点里，
  页面样式影响不到面板内部，面板样式也不会泄漏到页面。
- 宿主节点用自定义标签名 + 内联 `!important`，尽量避免被页面样式干扰。
- 判断「是否点到自己人」统一走 `event.composedPath()`：shadow root 里的
  事件 target 会被重定向成宿主节点，用 `contains(target)` 判断会失效。
- 页面自身的 shadow root 里的选区同样支持：选区矩形用
  `range.getClientRects()` 取视口坐标，跨 shadow 边界依然有效。
- 内容脚本以 `all_frames: true` 注入 iframe，翻译结果只回推给发起请求的那个
  frame（`chrome.tabs.sendMessage` 的 `frameId`），否则每个 frame 都会弹一个面板。

## 与参考项目相比没做的部分

面板交互已经对齐，但参考项目还有这些功能没有实现：

1. 8 向拖拽缩放，以及浮动 ↔ 左右停靠的切换（含停靠高亮预览）
2. 发音朗读（Google `translate_tts`）——音标已经显示，只差播放按钮
3. 原文就地编辑后重新翻译
4. 区块显隐与顺序的配置项（`TranslateResultFilter` / `ContentDisplayOrder`）
5. 站点黑名单、快捷键命令、长内容折叠（`DrawerBlock`）
6. 加载动画是简化版（4 个圆点脉冲），不是原项目的 `lds-ellipsis`

## TODO

1. 继续优化 ui
