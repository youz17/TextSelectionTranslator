import { MD5, sha256 } from "./hash";
import * as api_key from "./api_key";

type Sender = chrome.runtime.MessageSender;
interface Request {
  text: string;
}

function response_translate(result: string, sender: Sender) {
  if (sender.tab?.id) {
    chrome.tabs.sendMessage(sender.tab.id, {
      translation: result,
    });
  }
}

async function translate_with_baidu(request: Request, sender: Sender) {
  console.log("translate with baidu");
  var appid = api_key.baidu_app_id;
  var key = api_key.baidu_key;
  var salt = new Date().getTime();
  var query = request.text;
  // 多个query可以用\n连接  如 query='apple\norange\nbanana\npear'
  var from = "auto";
  var to = "zh";
  var str1 = appid + query + salt + key;
  var sign = MD5(str1);

  const params = new URLSearchParams({
    q: query,
    appid: appid,
    salt: salt.toString(),
    from: from,
    to: to,
    sign: sign,
  });

  try {
    const response = await fetch(
      `http://api.fanyi.baidu.com/api/trans/vip/translate?${params}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(data);
    response_translate(data.trans_result[0].dst, sender);
  } catch (error) {
    console.error("Error:", error);
  }
}

function translate_with_deepseek(request: Request, sender: Sender) {
  console.log("translate with deepseek");
  const apiKey = api_key.deepseek_api_key;
  const apiUrl = "https://api.deepseek.com/v1/chat/completions";
  fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: "你是一个翻译助手，将用户选中的文本翻译为中文。",
        },
        { role: "user", content: request.text },
      ],
      temperature: 0.3,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      const translatedText = data.choices[0].message.content;
      response_translate(translatedText, sender);
    });
}

async function translate_with_youdao(request: any, sender: Sender) {
  console.log("translate with youdao");
  function truncate(q: string) {
    var len = q.length;
    if (len <= 20) return q;
    return q.substring(0, 10) + len + q.substring(len - 10, len);
  }

  const appKey = api_key.youdao_app_key;
  const key = api_key.youdao_key;
  const salt = new Date().getTime();
  const curtime = Math.round(new Date().getTime() / 1000);
  const query = request.text;
  // 多个query可以用\n连接  如 query='apple\norange\nbanana\npear'
  const to = "zh-CHS";
  const from = "auto";
  const str1 = appKey + truncate(query) + salt + curtime + key;
  const sign = await sha256(str1);

  // 构建 URL 参数
  const params = new URLSearchParams({
    q: query,
    appKey: appKey,
    salt: salt.toString(),
    from: from,
    to: to,
    sign: sign,
    signType: "v3",
    curtime: curtime.toString(),
  });

  try {
    const response = await fetch(`https://openapi.youdao.com/api?${params}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    response_translate(data.translation[0], sender);
  } catch (error) {
    console.error("Error:", error);
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("recv message: ", request);
  if (request.action === "translate") {
    translate_with_baidu(request, sender);
  }
});
