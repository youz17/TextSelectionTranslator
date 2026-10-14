export type TranslateSource = "google" | "deepseek";

// 词性释义：Google 的 dict[].pos + terms
export interface DetailedMeaning {
  pos: string;
  terms: string[];
}

// 英文释义：Google 的 definitions[].entry[].gloss
export interface DefinitionEntry {
  pos: string;
  meaning: string;
  example?: string;
}

// 例句：Google 的 examples.example[].text
export interface ExampleEntry {
  source: string;
}

// 一次翻译的完整结果。词典字段只有单词才会有，句子拿不到。
export interface TranslateResult {
  original: string;
  text: string;
  source: TranslateSource;
  target: string;
  s_phonetic?: string;
  t_phonetic?: string;
  detailed_meanings?: DetailedMeaning[];
  definitions?: DefinitionEntry[];
  examples?: ExampleEntry[];
}

export interface TranslateSuccess extends TranslateResult {
  ok: true;
  requestId: number;
  cached: boolean;
}

export interface TranslateFailure {
  ok: false;
  requestId: number;
  source: TranslateSource;
  error: string;
}

export type TranslateReply = TranslateSuccess | TranslateFailure;
