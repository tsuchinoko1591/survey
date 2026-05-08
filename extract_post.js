// 爆サイの投稿通信から投稿データを取り出す。
//
// 投稿は POST https://bakusai.com/thr_cp/usp=a<acode>c<ctgid>b<bid>t<tid>uq<uq>/
// に対して 2 回送られる:
//   1) クッション(確認)ページ生成   ... recaptcha_response / cushion_at なし
//   2) 本送信                       ... recaptcha_response / cushion_at あり
// 投稿本文は両方ともフォームデータの `body` フィールドに入っている。
// MQTT (mqtt_newres) は送信成功後に他クライアント向けへ配信される通知。

const SUBMIT_URL = "https://bakusai.com/thr_cp/usp=a1c136b3342t10459647uq54018206/";

// DevTools の「ペイロード」→「ソースを表示」でコピーできる application/x-www-form-urlencoded
// 形式の文字列を想定。ここでは値オブジェクトを直接渡す例。
const FORM_DATA = {
  recaptcha_response: "",
  admin_delete_btn: "",
  bid: "3342",
  tid: "10459647",
  ctgid: "136",
  acode: "1",
  tp: "1",
  prof_flg: "2",
  ctrid: "",
  loaded_at: "1778211225.8607",
  stamp_data: "",
  body: ">>0\nああああ",
  name: "",
  mailaddr: "",
  cushion_at: "1778218827.4418",
};

// 参考: MQTT 側の通知ペイロード（任意）
const MQTT_PAYLOAD = {
  rrid: 65,
  date: "2026/05/08 14:40",
  body: '<span class="resOverlay tipso_style"><a href="/thr_res_show/acode=1/ctgid=136/bid=3342/tid=10459647/rrid=0/" target="_blank">&gt;&gt;0</a></span>\r\nああああ',
  name: "",
};

function parseUsp(url) {
  const m = url.match(/usp=a(\d+)c(\d+)b(\d+)t(\d+)uq(\d+)/);
  if (!m) return null;
  const [, acode, ctgid, bid, tid, uq] = m;
  return { acode, ctgid, bid, tid, uq };
}

function parseBody(body) {
  const quotes = [];
  const re = /^>>(\d+)/gm;
  let m;
  while ((m = re.exec(body)) !== null) quotes.push(Number(m[1]));
  return { text: body, quotes };
}

function extractFromForm(form, submitUrl) {
  const ctx = parseUsp(submitUrl);
  const { text, quotes } = parseBody(form.body || "");
  const isFinalSubmit = Boolean(form.recaptcha_response || form.cushion_at);
  return {
    phase: isFinalSubmit ? "submit" : "cushion",
    ...ctx,
    tp: form.tp,
    prof_flg: form.prof_flg,
    name: form.name || "（無記名）",
    mailaddr: form.mailaddr || null,
    body: text,
    quotes,
    loaded_at: form.loaded_at ? Number(form.loaded_at) : null,
    cushion_at: form.cushion_at ? Number(form.cushion_at) : null,
    dwell_seconds:
      form.loaded_at && form.cushion_at
        ? Number(form.cushion_at) - Number(form.loaded_at)
        : null,
  };
}

const post = extractFromForm(FORM_DATA, SUBMIT_URL);
console.log("[from form data]");
console.log(JSON.stringify(post, null, 2));

// MQTT からの確認用（rrid を取りたい時）
function extractFromMqtt(payload) {
  const text = payload.body
    .replace(/<[^>]+>/g, "")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&")
    .trim();
  return { rrid: payload.rrid, date: payload.date, name: payload.name || "（無記名）", text };
}
console.log("\n[from mqtt notification]");
console.log(JSON.stringify(extractFromMqtt(MQTT_PAYLOAD), null, 2));
