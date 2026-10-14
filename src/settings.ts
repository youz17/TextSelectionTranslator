import { TranslateSource } from "./types";

interface LanguageOption {
  code: string;
  label: string;
  prompt: string;
}

// 目标语言：code 传给翻译接口，prompt 用在 DeepSeek 的提示词里。
export const TARGET_LANGUAGES: LanguageOption[] = [
  { code: "zh-CN", label: "中文（简体）", prompt: "简体中文" },
  { code: "zh-TW", label: "中文（繁體）", prompt: "繁體中文" },
  { code: "en", label: "英语", prompt: "英语" },
  { code: "ja", label: "日语", prompt: "日语" },
  { code: "ko", label: "韩语", prompt: "韩语" },
  { code: "fr", label: "法语", prompt: "法语" },
  { code: "de", label: "德语", prompt: "德语" },
  { code: "es", label: "西班牙语", prompt: "西班牙语" },
  { code: "ru", label: "俄语", prompt: "俄语" },
];

export interface Settings {
  source: TranslateSource;
  target: string;
  pin: boolean;
  deepseek_key: string;
}

const DEFAULTS: Settings = {
  source: "google",
  target: "zh-CN",
  pin: false,
  deepseek_key: "",
};

function is_translate_source(value: unknown): value is TranslateSource {
  return value === "google" || value === "deepseek";
}

function is_target_language(value: unknown): value is string {
  return (
    typeof value === "string" &&
    TARGET_LANGUAGES.some((item) => item.code === value)
  );
}

export function target_prompt(target: string): string {
  return (
    TARGET_LANGUAGES.find((item) => item.code === target)?.prompt ?? "简体中文"
  );
}

// 设置统一放在 chrome.storage.sync，content script / background / 设置页共用。
export async function load_settings(): Promise<Settings> {
  const stored = await chrome.storage.sync.get(DEFAULTS);
  return {
    source: is_translate_source(stored.source) ? stored.source : DEFAULTS.source,
    target: is_target_language(stored.target) ? stored.target : DEFAULTS.target,
    pin: stored.pin === true,
    deepseek_key:
      typeof stored.deepseek_key === "string" ? stored.deepseek_key : "",
  };
}

export async function save_source(source: TranslateSource): Promise<void> {
  if (!is_translate_source(source)) return;
  await chrome.storage.sync.set({ source });
}

export async function save_target(target: string): Promise<void> {
  if (!is_target_language(target)) return;
  await chrome.storage.sync.set({ target });
}

export async function save_pin(pin: boolean): Promise<void> {
  await chrome.storage.sync.set({ pin: pin === true });
}

export async function save_deepseek_key(key: string): Promise<void> {
  await chrome.storage.sync.set({ deepseek_key: key.trim() });
}
