import type { ComponentChildren } from "preact";
import { render } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import {
  ChevronDownIcon,
  CloseIcon,
  CopyIcon,
  ErrorIcon,
  PinIcon,
  SettingsIcon,
} from "./icons";
import {
  DefinitionEntry,
  DetailedMeaning,
  ExampleEntry,
  TranslateResult,
  TranslateSource,
} from "./types";

const SOURCE_LABELS: Record<TranslateSource, string> = {
  google: "Google",
  deepseek: "DeepSeek",
};

export interface PanelProps {
  phase: "loading" | "result" | "error";
  result: TranslateResult | null;
  error: string;
  source: TranslateSource;
  cached: boolean;
  pinned: boolean;
  on_source_change: (source: TranslateSource) => void;
  on_toggle_pin: () => void;
  on_open_settings: () => void;
  on_close: () => void;
}

// 区块顺序与参考项目的 ContentDisplayOrder 默认值一致
type BlockKey =
  | "mainMeaning"
  | "originalText"
  | "detailedMeanings"
  | "definitions"
  | "examples";

const CONTENT_ORDER: BlockKey[] = [
  "mainMeaning",
  "originalText",
  "detailedMeanings",
  "definitions",
  "examples",
];

// 区块外壳（参考 Block + BlockHeadSpot/Title/SplitLine）
function Block(props: {
  spot?: string;
  title?: string;
  children: ComponentChildren;
}) {
  return (
    <div class="tst-block">
      {props.title ? (
        <div class="tst-block-head">
          <div class="tst-spot" style={{ background: props.spot }} />
          <div class="tst-block-title">{props.title}</div>
        </div>
      ) : null}
      {props.title ? <div class="tst-split" /> : null}
      {props.children}
    </div>
  );
}

function TargetBlock(props: {
  result: TranslateResult;
  cached: boolean;
  copied: boolean;
  on_copy: () => void;
}) {
  return (
    <Block>
      <div class="tst-line">
        <div class="tst-text">{props.result.text}</div>
        <button
          type="button"
          class={props.copied ? "tst-copy tst-copied" : "tst-copy"}
          title="复制译文"
          onClick={props.on_copy}
        >
          <CopyIcon />
        </button>
      </div>
      {props.result.t_phonetic ? (
        <div class="tst-position">{props.result.t_phonetic}</div>
      ) : null}
      {props.cached ? <div class="tst-note">词典缓存</div> : null}
    </Block>
  );
}

function SourceBlock(props: { result: TranslateResult }) {
  return (
    <Block>
      <div class="tst-line">
        <div class="tst-text">{props.result.original}</div>
      </div>
      {props.result.s_phonetic ? (
        <div class="tst-position">{props.result.s_phonetic}</div>
      ) : null}
    </Block>
  );
}

function DetailBlock(props: { meanings: DetailedMeaning[] }) {
  return (
    <Block spot="#00bfa5" title="词性释义">
      {props.meanings.map((item, index) => (
        <div class="tst-detail-meaning" key={index}>
          {item.pos ? <div class="tst-pos-label">{item.pos}</div> : null}
          <div class="tst-chips">
            {item.terms.map((term, term_index) => (
              <span class="tst-chip" key={term_index}>
                {term}
              </span>
            ))}
          </div>
        </div>
      ))}
    </Block>
  );
}

function DefinitionBlock(props: { definitions: DefinitionEntry[] }) {
  return (
    <Block spot="#ff4081" title="英文释义">
      {props.definitions.map((item, index) => (
        <div class="tst-detail-meaning" key={index}>
          {item.pos ? <div class="tst-pos-label">{item.pos}</div> : null}
          <div class="tst-text">{item.meaning}</div>
          {item.example ? (
            <div class="tst-def-example">{item.example}</div>
          ) : null}
        </div>
      ))}
    </Block>
  );
}

function ExampleBlock(props: { examples: ExampleEntry[] }) {
  return (
    <Block spot="#3d5afe" title="例句">
      <ol class="tst-examples">
        {props.examples.map((item, index) => (
          <li key={index}>{item.source}</li>
        ))}
      </ol>
    </Block>
  );
}

function Loading() {
  return (
    <div class="tst-loading">
      <div class="tst-dots">
        <span />
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

function ErrorBlock(props: { message: string }) {
  return (
    <div class="tst-error">
      <ErrorIcon />
      <div class="tst-error-text">{props.message}</div>
    </div>
  );
}

function render_block(
  key: BlockKey,
  result: TranslateResult,
  cached: boolean,
  copied: boolean,
  on_copy: () => void
) {
  switch (key) {
    case "mainMeaning":
      return (
        <TargetBlock
          key={key}
          result={result}
          cached={cached}
          copied={copied}
          on_copy={on_copy}
        />
      );
    case "originalText":
      return <SourceBlock key={key} result={result} />;
    case "detailedMeanings":
      return result.detailed_meanings && result.detailed_meanings.length > 0 ? (
        <DetailBlock key={key} meanings={result.detailed_meanings} />
      ) : null;
    case "definitions":
      return result.definitions && result.definitions.length > 0 ? (
        <DefinitionBlock key={key} definitions={result.definitions} />
      ) : null;
    case "examples":
      return result.examples && result.examples.length > 0 ? (
        <ExampleBlock key={key} examples={result.examples} />
      ) : null;
  }
}

export function Panel(props: PanelProps) {
  const [menu_open, set_menu_open] = useState(false);
  const [copied, set_copied] = useState(false);
  const dropdown_ref = useRef<HTMLDivElement | null>(null);

  // 点下拉菜单以外的任何地方都收起菜单
  useEffect(() => {
    if (!menu_open) return;
    const on_mousedown = (event: MouseEvent) => {
      const element = dropdown_ref.current;
      if (element && event.composedPath().includes(element)) return;
      set_menu_open(false);
    };
    document.addEventListener("mousedown", on_mousedown);
    return () => document.removeEventListener("mousedown", on_mousedown);
  }, [menu_open]);

  const on_copy = () => {
    const text = props.result?.text;
    if (!text) return;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        set_copied(true);
        setTimeout(() => set_copied(false), 1200);
      })
      .catch(() => {
        // 页面没有剪贴板权限时什么都不做
      });
  };

  return (
    <>
      <div class="tst-head">
        <div class="tst-dropdown" ref={dropdown_ref}>
          <button
            type="button"
            class="tst-dropdown-title"
            title="切换翻译源"
            onClick={() => set_menu_open(!menu_open)}
          >
            {SOURCE_LABELS[props.source]}
            <ChevronDownIcon />
          </button>
          {menu_open ? (
            <div class="tst-dropdown-menu">
              {(Object.keys(SOURCE_LABELS) as TranslateSource[]).map((source) => (
                <button
                  type="button"
                  key={source}
                  class={
                    source === props.source
                      ? "tst-dropdown-item tst-active"
                      : "tst-dropdown-item"
                  }
                  onClick={() => {
                    set_menu_open(false);
                    props.on_source_change(source);
                  }}
                >
                  {SOURCE_LABELS[source]}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div class="tst-head-icons">
          <button
            type="button"
            class="tst-icon-button"
            title="设置"
            onClick={props.on_open_settings}
          >
            <SettingsIcon />
          </button>
          <button
            type="button"
            class={
              props.pinned
                ? "tst-icon-button tst-pin tst-pinned"
                : "tst-icon-button tst-pin"
            }
            title={props.pinned ? "取消固定" : "固定面板（点击外部不关闭）"}
            onClick={props.on_toggle_pin}
          >
            <PinIcon />
          </button>
          <button
            type="button"
            class="tst-icon-button"
            title="关闭"
            onClick={props.on_close}
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      <div class="tst-body">
        {props.phase === "loading" ? <Loading /> : null}
        {props.phase === "error" ? <ErrorBlock message={props.error} /> : null}
        {props.phase === "result" && props.result
          ? CONTENT_ORDER.map((key) =>
              render_block(key, props.result!, props.cached, copied, on_copy)
            )
          : null}
      </div>
    </>
  );
}

// 控制器（trans_panel.ts）只管挂载/卸载和拖拽，UI 全部交给 Preact。
export function render_panel_into(container: HTMLElement, props: PanelProps) {
  render(<Panel {...props} />, container);
}

export function remove_panel_from(container: HTMLElement) {
  render(null, container);
}
