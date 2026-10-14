import { TranslateResult } from "./types";

// 单词语典缓存：只缓存纯英文单词，存在 chrome.storage.local 里，永久有效。
// 命中时直接返回整份结构化结果（音标 / 词性释义 / 例句），不再请求翻译 api。
// key 里带上翻译源和目标语言：换了源或换了语言必须重新翻，
// 否则会拿另一个引擎、另一种语言的旧结果糊弄用户。
const WORD_PATTERN = /^[a-zA-Z][a-zA-Z'-]*$/;
const MAX_WORD_LENGTH = 32;
const KEY_PREFIX = "dict:";

export function is_single_word(text: string): boolean {
  return text.length <= MAX_WORD_LENGTH && WORD_PATTERN.test(text);
}

function entry_key(source: string, target: string, word: string): string {
  return `${KEY_PREFIX}${source}:${target}:${word.toLowerCase()}`;
}

export async function lookup_word(
  source: string,
  target: string,
  word: string
): Promise<TranslateResult | null> {
  const key = entry_key(source, target, word);
  const stored = await chrome.storage.local.get(key);
  const entry = stored[key] as TranslateResult | undefined;
  if (!entry || typeof entry.text !== "string") return null;
  return entry;
}

export async function store_word(
  source: string,
  target: string,
  word: string,
  result: TranslateResult
): Promise<void> {
  await chrome.storage.local.set({
    [entry_key(source, target, word)]: result,
  });
}
