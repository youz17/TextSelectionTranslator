import {
  load_settings,
  save_deepseek_key,
  save_source,
  save_target,
  TARGET_LANGUAGES,
} from "./settings";
import { TranslateSource } from "./types";

const key_input = document.getElementById("deepseek-key") as HTMLInputElement;
const source_select = document.getElementById("source") as HTMLSelectElement;
const target_select = document.getElementById("target") as HTMLSelectElement;
const save_button = document.getElementById("save") as HTMLButtonElement;
const status = document.getElementById("status") as HTMLSpanElement;

function show_status(text: string) {
  status.textContent = text;
  setTimeout(() => {
    if (status.textContent === text) status.textContent = "";
  }, 1500);
}

// 目标语言下拉直接按 TARGET_LANGUAGES 生成，省得 html 和代码里两份清单对不上。
function fill_target_options() {
  for (const language of TARGET_LANGUAGES) {
    const option = document.createElement("option");
    option.value = language.code;
    option.textContent = language.label;
    target_select.appendChild(option);
  }
}

save_button.addEventListener("click", async () => {
  await save_deepseek_key(key_input.value);
  const source: TranslateSource =
    source_select.value === "deepseek" ? "deepseek" : "google";
  await save_source(source);
  await save_target(target_select.value);
  show_status("已保存");
});

(async () => {
  fill_target_options();
  const settings = await load_settings();
  key_input.value = settings.deepseek_key;
  source_select.value = settings.source;
  target_select.value = settings.target;
})();
