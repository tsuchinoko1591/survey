// 爆サイ MQTT 通知 (mqtt_newres.js) の payload から投稿データを取り出す。
// thr_cp/usp=... は投稿送信用エンドポイントで本文を含まない。投稿の中身は
// MQTT で配信される newres メッセージに乗ってくる。

const MQTT_PAYLOAD = {
  rrid: 65,
  date: "2026/05/08 14:40",
  body: '<span class="resOverlay tipso_style"><a href="/thr_res_show/acode=1/ctgid=136/bid=3342/tid=10459647/rrid=0/" target="_blank">&gt;&gt;0</a></span>\r\nああああ',
  name: "",
};

const THREAD_URL = "https://bakusai.com/thr_cp/usp=a1c136b3342t10459647uq54018206/";

function parseUsp(url) {
  const m = url.match(/usp=a(\d+)c(\d+)b(\d+)t(\d+)uq(\d+)/);
  if (!m) return null;
  const [, acode, ctgid, bid, tid, uq] = m;
  return { acode, ctgid, bid, tid, uq };
}

function decodeEntities(s) {
  return s
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

function extractQuotes(html) {
  const re = /href="\/thr_res_show\/acode=\d+\/ctgid=\d+\/bid=\d+\/tid=\d+\/rrid=(\d+)\/"/g;
  const out = [];
  let m;
  while ((m = re.exec(html)) !== null) out.push(Number(m[1]));
  return out;
}

function extract(payload, threadUrl) {
  const ctx = parseUsp(threadUrl);
  const quotes = extractQuotes(payload.body);
  const text = decodeEntities(payload.body.replace(/<[^>]+>/g, "")).trim();
  return {
    ...ctx,
    rrid: payload.rrid,
    date: payload.date,
    name: payload.name || "（無記名）",
    quotes,
    text,
  };
}

const post = extract(MQTT_PAYLOAD, THREAD_URL);
console.log(JSON.stringify(post, null, 2));
