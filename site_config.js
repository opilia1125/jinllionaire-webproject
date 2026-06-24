const categorySlugs = {
  "歴史": "history",
  "日本史": "history",
  "伝統工芸": "traditional-crafts",
  "芸術": "arts",
  "芸術・美術": "arts",
  "美学": "aesthetics-philosophy",
  "美学・哲学": "aesthetics-philosophy",
  "文学": "literature",
  "日本文化": "japanese-culture",
  "民俗": "japanese-culture",
  "建築": "japanese-culture",
  "食文化": "japanese-culture",
  "日本庭園": "japanese-culture",
};

const researchLinks = {
  history: [
    ["国立国会図書館デジタルコレクション", "https://dl.ndl.go.jp/"],
    ["国立歴史民俗博物館", "https://www.rekihaku.ac.jp/"],
  ],
  "traditional-crafts": [
    ["文化遺産オンライン", "https://bunka.nii.ac.jp/"],
    ["国立文化財機構", "https://www.nich.go.jp/"],
  ],
  arts: [
    ["文化遺産オンライン", "https://bunka.nii.ac.jp/"],
    ["国立文化財機構", "https://www.nich.go.jp/"],
  ],
  "aesthetics-philosophy": [
    ["国立国会図書館リサーチ・ナビ", "https://ndlsearch.ndl.go.jp/rnavi"],
    ["ジャパンサーチ", "https://jpsearch.go.jp/"],
  ],
  literature: [
    ["国文学研究資料館", "https://www.nijl.ac.jp/"],
    ["国立国会図書館デジタルコレクション", "https://dl.ndl.go.jp/"],
  ],
  "japanese-culture": [
    ["文化庁", "https://www.bunka.go.jp/"],
    ["ジャパンサーチ", "https://jpsearch.go.jp/"],
  ],
};

module.exports = { categorySlugs, researchLinks };
