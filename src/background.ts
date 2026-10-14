import { is_single_word, lookup_word, store_word } from "./dict_cache";
import { load_settings, save_source, target_prompt } from "./settings";
import {
  DefinitionEntry,
  DetailedMeaning,
  ExampleEntry,
  TranslateReply,
  TranslateResult,
  TranslateSource,
} from "./types";

interface TranslateRequest {
  action: "translate";
  text: string;
  // 面板上手动切换翻译源时带上；不带就用设置里的默认值。
  source?: TranslateSource;
  requestId: number;
}

interface SetSourceRequest {
  action: "set_source";
  source: TranslateSource;
}

// 翻译结果用 chrome.tabs.sendMessage 主动回推，并且只发给发起请求的那个 frame，
// 否则开了 all_frames 之后每个 frame 都会弹出一个面板。
function reply(sender: chrome.runtime.MessageSender, payload: TranslateReply) {
  const tab_id = sender.tab?.id;
  if (tab_id === undefined) return;
  chrome.tabs
    .sendMessage(
      tab_id,
      { action: "translation", ...payload },
      { frameId: sender.frameId ?? 0 }
    )
    .catch(() => {
      // 发起请求的页面/iframe 可能已经关掉了。
    });
}

// examples 的 text 里带 <b> 这类标签，而且整份响应都来自外部接口：
// 一律按纯文本处理（Preact 默认转义），这里先把标签和常见实体还原掉。
function clean_text(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
}

// Google 免 key 接口，交给 background 代请求，绕开页面的 CORS 限制。
// dj=1 才有结构化结果：dt=t 译文、bd 词性释义、ex 例句、md 释义、rm 音标。
async function translate_with_google(
  text: string,
  target: string
): Promise<TranslateResult> {
  const params = new URLSearchParams({
    client: "gtx",
    sl: "auto",
    tl: target,
    q: text,
    dj: "1",
  });
  // dt 需要重复出现，URLSearchParams 的构造参数表达不了，只能逐个 append。
  for (const dt of ["t", "bd", "ex", "md", "rm"]) params.append("dt", dt);

  const response = await fetch(
    `https://translate.googleapis.com/translate_a/single?${params.toString()}`
  );
  if (!response.ok) {
    throw new Error(`Google 翻译请求失败（HTTP ${response.status}）`);
  }

  const data = await response.json();
  const sentences: any[] = Array.isArray(data?.sentences) ? data.sentences : [];
  // 译文由多个 sentence 拼起来；音标那一条没有 trans，必须过滤掉。
  const translated = sentences
    .filter((item) => typeof item?.trans === "string" && item.trans !== "")
    .map((item) => item.trans as string)
    .join("");
  if (translated === "") {
    throw new Error("Google 翻译没有返回译文");
  }

  const result: TranslateResult = {
    original: text,
    text: translated,
    source: "google",
    target,
  };

  // 音标只对单词有意义：句子的 translit 是整句拼音/罗马字，纯属噪音。
  if (is_single_word(text)) {
    const s_phonetic = sentences.find(
      (item) => typeof item?.src_translit === "string" && item.src_translit !== ""
    );
    const t_phonetic = sentences.find(
      (item) => typeof item?.translit === "string" && item.translit !== ""
    );
    if (s_phonetic) result.s_phonetic = s_phonetic.src_translit;
    if (t_phonetic) result.t_phonetic = t_phonetic.translit;
  }

  const detailed: DetailedMeaning[] = (Array.isArray(data?.dict)
    ? data.dict
    : []
  )
    .map((item: any) => ({
      pos: typeof item?.pos === "string" ? item.pos : "",
      terms: (Array.isArray(item?.terms) ? item.terms : [])
        .filter((term: unknown): term is string => typeof term === "string")
        .slice(0, 8),
    }))
    .filter((item: DetailedMeaning) => item.terms.length > 0);
  if (detailed.length > 0) result.detailed_meanings = detailed;

  const definitions: DefinitionEntry[] = (Array.isArray(data?.definitions)
    ? data.definitions
    : []
  )
    .map((item: any) => {
      const entries: any[] = Array.isArray(item?.entry) ? item.entry : [];
      const glosses = entries
        .map((entry) =>
          typeof entry?.gloss === "string" ? entry.gloss.trim() : ""
        )
        .filter((gloss) => gloss !== "");
      const example = entries
        .map((entry) =>
          typeof entry?.example === "string" ? clean_text(entry.example) : ""
        )
        .find((text) => text !== "");

      const definition: DefinitionEntry = {
        pos: typeof item?.pos === "string" ? item.pos : "",
        // 长词条（例如 run 的 verb）能有十几条释义，全铺开会顶满整个面板：
        // 参考项目用 DrawerBlock 折叠处理，这里没有折叠区，只取前两条。
        meaning: glosses.slice(0, 2).join("；"),
      };
      if (example) definition.example = example;
      return definition;
    })
    .filter((item: DefinitionEntry) => item.meaning !== "");
  if (definitions.length > 0) result.definitions = definitions;

  const examples: ExampleEntry[] = (Array.isArray(data?.examples?.example)
    ? data.examples.example
    : []
  )
    .map((item: any) => ({
      source: typeof item?.text === "string" ? clean_text(item.text) : "",
    }))
    .filter((item: ExampleEntry) => item.source !== "")
    .slice(0, 3);
  if (examples.length > 0) result.examples = examples;

  return result;
}

async function translate_with_deepseek(
  text: string,
  api_key: string,
  target: string
): Promise<TranslateResult> {
  if (api_key === "") {
    throw new Error("还没有配置 DeepSeek API Key，请在扩展设置里填写");
  }

  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${api_key}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: `你是一个翻译助手，把用户选中的文本翻译为${target_prompt(
            target
          )}。只输出译文本身，不要加解释、引号或额外说明。`,
        },
        { role: "user", content: text },
      ],
      temperature: 0.3,
    }),
  });
  if (!response.ok) {
    throw new Error(`DeepSeek 请求失败（HTTP ${response.status}）`);
  }

  const data = await response.json();
  const translation = data?.choices?.[0]?.message?.content;
  if (typeof translation !== "string" || translation.trim() === "") {
    throw new Error("DeepSeek 没有返回译文");
  }
  // DeepSeek 只有纯文本，没有音标/词性/例句，词典区块自然不显示。
  return { original: text, text: translation.trim(), source: "deepseek", target };
}

async function handle_translate(
  request: TranslateRequest,
  sender: chrome.runtime.MessageSender
) {
  const text = request.text.trim();
  if (text === "") return;

  let source: TranslateSource = "google";
  let target = "zh-CN";
  try {
    const settings = await load_settings();
    source = request.source ?? settings.source;
    target = settings.target;
    const word = is_single_word(text);

    // 单个英文单词先查本地词典缓存，命中就不用花 api 了。
    if (word) {
      const cached = await lookup_word(source, target, text);
      if (cached) {
        reply(sender, {
          ...cached,
          ok: true,
          requestId: request.requestId,
          cached: true,
        });
        return;
      }
    }

    const result =
      source === "deepseek"
        ? await translate_with_deepseek(text, settings.deepseek_key, target)
        : await translate_with_google(text, target);
    if (word) await store_word(source, target, text, result);

    reply(sender, {
      ...result,
      ok: true,
      requestId: request.requestId,
      cached: false,
    });
  } catch (error) {
    console.error("translate failed:", error);
    reply(sender, {
      ok: false,
      requestId: request.requestId,
      source,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

chrome.runtime.onMessage.addListener((request, sender) => {
  if (request?.action === "translate") {
    handle_translate(request as TranslateRequest, sender);
  } else if (request?.action === "set_source") {
    save_source((request as SetSourceRequest).source).catch((error) =>
      console.error("save source failed:", error)
    );
  }
  // 结果由 reply() 用 chrome.tabs.sendMessage 推送，这里不需要 sendResponse。
  return false;
});
