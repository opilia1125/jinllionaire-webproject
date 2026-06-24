const fs = require("node:fs");
const path = require("node:path");
const { categorySlugs, researchLinks } = require("./site_config");

const ROOT = __dirname;
const SITE_URL = "https://gachi-labs.xyz";
const SITE_NAME = "日本歴史と文化探訪";
const AUTHOR = "Gachi Labs 編集部";
const BUILD_DATE = process.env.SITE_BUILD_DATE || new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());
const SOURCE_DIR = path.join(ROOT, "content", "posts");

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function write(relativePath, value) {
  const output = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, value, "utf8");
}

function parseFrontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error("Missing frontmatter");
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim();
    const raw = line.slice(separator + 1).trim();
    data[key] = raw.startsWith("[")
      ? [...raw.matchAll(/"([^"]+)"/g)].map((item) => item[1])
      : raw.replace(/^"|"$/g, "");
  }
  return { ...data, body: match[2].trim() };
}

function inlineMarkdown(text) {
  return escapeHtml(text)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+|\/[^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function renderMarkdown(markdown) {
  const output = [];
  let paragraph = [];
  let list = [];
  const flush = () => {
    if (paragraph.length) output.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
    if (list.length) output.push(`<ul>${list.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</ul>`);
    paragraph = [];
    list = [];
  };
  for (const line of markdown.split(/\r?\n/)) {
    const value = line.trim();
    if (!value) { flush(); continue; }
    if (value.startsWith("## ")) { flush(); output.push(`<h2>${escapeHtml(value.slice(3))}</h2>`); continue; }
    if (value.startsWith("# ")) continue;
    if (value.startsWith("- ")) { if (paragraph.length) flush(); list.push(value.slice(2)); continue; }
    if (/^(Caption:|Image file path:)/.test(value) || value.startsWith("![")) continue;
    paragraph.push(value);
  }
  flush();
  return output.join("\n");
}

function researchSection(category) {
  const slug = categorySlugs[category] || "japanese-culture";
  const links = researchLinks[slug] || researchLinks["japanese-culture"];
  return `<section class="source-box" aria-labelledby="research-heading">
<h2 id="research-heading">参考資料・調査先</h2>
<p>本文の確認と追加調査には、次の公的機関・学術情報基盤を参照しています。</p>
<ul>${links.map(([label, url]) => `<li><a href="${url}" rel="noopener noreferrer">${label}</a></li>`).join("")}</ul>
</section>`;
}

function articlePage(post) {
  const published = post.status === "published" && post.date <= BUILD_DATE;
  const canonical = `${SITE_URL}/posts/${post.slug}/`;
  const categorySlug = categorySlugs[post.category] || "japanese-culture";
  const body = post.body.split("## Images")[0].split("## References")[0].trim();
  const references = post.body.includes("## References")
    ? `## 参考文献${post.body.split("## References")[1]}`
    : "";
  const tags = Array.isArray(post.tags) ? post.tags : [];
  const images = post.slug === "nijushi-sekki-seasonal-culture"
    ? [
      ["seasonal-wheel.webp", "二十四節気を四季の循環として表した図版", "太陽の周期と四季の移り変わりを示す編集図版"],
      ["seasonal-life.webp", "季節の観察と農事や暮らしの関係を描いた図版", "暦、農事、食、年中行事のつながりを示す編集図版"],
    ]
    : [
      ["image-01.webp", `${post.title}の要点を示す図版`, `${post.title}の理解を補助する図版`],
      ["image-02.webp", `${post.title}の背景を示す図版`, `${post.title}の背景を補足する図版`],
    ];
  const schema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Organization", name: AUTHOR, url: `${SITE_URL}/about/` },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    mainEntityOfPage: canonical,
  }).replaceAll("<", "\\u003c");
  return `<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="${published ? "index, follow" : "noindex, follow"}">
<meta name="author" content="${AUTHOR}"><title>${escapeHtml(post.title)} | ${SITE_NAME}</title>
<meta name="description" content="${escapeHtml(post.description)}"><link rel="canonical" href="${canonical}">
<meta property="og:type" content="article"><meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:title" content="${escapeHtml(post.title)} | ${SITE_NAME}">
<meta property="og:description" content="${escapeHtml(post.description)}"><meta property="og:url" content="${canonical}">
<script type="application/ld+json">${schema}</script><link rel="stylesheet" href="/styles.css"></head>
<body><a class="skip-link" href="#main-content">本文へ移動</a>
<header class="site-header"><div class="container header-wrap"><a href="/" class="header-logo"><span class="live-indicator"></span><span>${SITE_NAME}</span></a>
<nav class="header-nav" aria-label="主要ナビゲーション"><a href="/">ホーム</a><a href="/about/">概要</a><a href="/categories/">論考一覧</a><a href="/contact/">お問い合わせ</a></nav></div></header>
<main class="container" id="main-content"><article class="article-detail">
${published ? "" : '<div class="status-notice">この記事は公開予定日まで検索結果と一覧には表示されません。</div>'}
<div class="modal-article-meta"><a class="modal-category" href="/categories/${categorySlug}/">${escapeHtml(post.category)}</a><time class="modal-date" datetime="${post.date}">${post.date}</time><span>${tags.map((tag) => `#${escapeHtml(tag)}`).join(" ")}</span></div>
<h1 class="modal-article-title">${escapeHtml(post.title)}</h1>
<aside class="author-box"><strong>${AUTHOR}</strong><span>文化史・美術史の公的資料を照合し、読者向けに編集しています。<a href="/about/">編集方針を見る</a></span></aside>
<div class="modal-article-body">${renderMarkdown(body)}
<h2>図版</h2>${images.map(([file, alt, caption]) => `<figure class="article-figure"><img src="/images/posts/${post.slug}/${file}" alt="${escapeHtml(alt)}" loading="lazy" width="1200" height="675"><figcaption>${escapeHtml(caption)}</figcaption></figure>`).join("")}
${renderMarkdown(references)}${researchSection(post.category)}</div></article></main>${footer()}</body></html>`;
}

function footer() {
  return `<footer><div class="container footer-wrap"><div class="footer-links"><a href="/about/">編集方針</a><a href="/privacy-policy/">プライバシーポリシー</a><a href="/terms/">利用規約</a><a href="/contact/">お問い合わせ</a></div><div class="copyright-text">&copy; 2026 ${SITE_NAME}. All rights reserved.</div></div></footer>`;
}

function card(post) {
  const categorySlug = categorySlugs[post.category] || "japanese-culture";
  return `<article class="article-card"><div class="card-header"><a class="category-tag" href="/categories/${categorySlug}/">${escapeHtml(post.category)}</a><time class="meta-date" datetime="${post.date}">${post.date}</time></div><h2 class="card-title"><a href="/posts/${post.slug}/">${escapeHtml(post.title)}</a></h2><p class="card-snippet">${escapeHtml(post.description)}</p><div class="card-footer"><span class="meta-views">${(post.tags || []).map((tag) => `#${escapeHtml(tag)}`).join(" ")}</span><a class="read-more-btn" href="/posts/${post.slug}/">続きを読む →</a></div></article>`;
}

function enrichLegacyPosts() {
  const sourceSlugs = new Set(posts.map((post) => post.slug));
  const legacyFiles = fs.readdirSync(path.join(ROOT, "posts"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !sourceSlugs.has(entry.name))
    .map((entry) => `posts/${entry.name}/index.html`);
  const legacy = legacyFiles.map((file) => {
    const html = read(file);
    return {
      file,
      slug: file.split("/")[1],
      title: (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1]?.replace(/<[^>]+>/g, "") || SITE_NAME,
      category: (html.match(/class="modal-category"[^>]*>([^<]+)/) || [])[1] || "日本文化",
    };
  });
  for (const item of legacy) {
    const file = item.file;
    let html = read(file);
    const canonical = (html.match(/rel="canonical" href="([^"]+)/) || [])[1] || SITE_URL;
    if (!html.includes('name="author"')) html = html.replace("</title>", `</title>\n  <meta name="author" content="${AUTHOR}">`);
    if (!html.includes("application/ld+json")) {
      const schema = JSON.stringify({ "@context": "https://schema.org", "@type": "Article", headline: item.title, author: { "@type": "Organization", name: AUTHOR }, mainEntityOfPage: canonical }).replaceAll("<", "\\u003c");
      html = html.replace("</head>", `  <script type="application/ld+json">${schema}</script>\n</head>`);
    }
    if (!html.includes("class=\"author-box\"")) html = html.replace(/(<h1[^>]*>[\s\S]*?<\/h1>)/, `$1\n      <aside class="author-box"><strong>${AUTHOR}</strong><span>公的資料を基に編集し、必要に応じて内容を更新します。<a href="/about/">編集方針を見る</a></span></aside>`);
    if (!html.includes("class=\"related-box\"")) {
      const related = legacy.filter((candidate) => candidate.category === item.category && candidate.slug !== item.slug).slice(0, 3);
      const relatedHtml = related.length
        ? `<section class="source-box related-box"><h2>関連する論考</h2><ul>${related.map((candidate) => `<li><a href="/posts/${candidate.slug}/">${escapeHtml(candidate.title)}</a></li>`).join("")}</ul></section>`
        : "";
      const researchHtml = html.includes("class=\"source-box\"") ? "" : researchSection(item.category);
      html = html.replace(/(\s*<\/div>\s*<\/article>)/, `\n${relatedHtml}${researchHtml}$1`);
    }
    if (!html.includes("class=\"skip-link\"")) html = html.replace("<body>", '<body><a class="skip-link" href="#main-content">本文へ移動</a>').replace("<main ", '<main id="main-content" ');
    write(file, html);
  }
}

function archivePage(title, description, archivePosts) {
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="index, follow"><title>${title} | ${SITE_NAME}</title><meta name="description" content="${description}"><link rel="canonical" href="${SITE_URL}/categories/japanese-culture/"><link rel="stylesheet" href="/styles.css"></head><body><a class="skip-link" href="#main-content">本文へ移動</a><header class="site-header"><div class="container header-wrap"><a href="/" class="header-logo"><span class="live-indicator"></span><span>${SITE_NAME}</span></a><nav class="header-nav" aria-label="主要ナビゲーション"><a href="/">ホーム</a><a href="/about/">概要</a><a href="/categories/">論考一覧</a><a href="/contact/">お問い合わせ</a></nav></div></header><main class="container single-column" id="main-content"><div class="feed-header"><h1>${title}</h1><span class="feed-count">全 ${archivePosts.length} 記事</span></div><div class="articles-feed">${archivePosts.map(card).join("")}</div></main>${footer()}</body></html>`;
}

const posts = fs.readdirSync(SOURCE_DIR).filter((name) => name.endsWith(".md")).sort()
  .map((name) => parseFrontmatter(fs.readFileSync(path.join(SOURCE_DIR, name), "utf8")));
const published = posts.filter((post) => post.status === "published" && post.date <= BUILD_DATE);
for (const post of posts) write(`posts/${post.slug}/index.html`, articlePage(post));
enrichLegacyPosts();

let home = read("index.html");
for (const post of posts) home = home.replace(new RegExp(`<article class="article-card">(?:(?!<article class="article-card">)[\\s\\S])*?href="/posts/${post.slug}/"(?:(?!<article class="article-card">)[\\s\\S])*?</article>`, "g"), "");
home = home.replace(/(<div class="articles-feed">)/, `$1${published.map(card).join("")}`);
const visibleCount = (home.match(/<article class="article-card">/g) || []).length;
home = home.replace(/<span class="feed-count">.*?<\/span>/, `<span class="feed-count">全 ${visibleCount} 記事掲載中</span>`);
write("index.html", home);

let categories = read("categories/index.html");
for (const post of posts) categories = categories.replace(new RegExp(`<article class="article-card">(?:(?!<article class="article-card">)[\\s\\S])*?href="/posts/${post.slug}/"(?:(?!<article class="article-card">)[\\s\\S])*?</article>`, "g"), "");
categories = categories.replace(/(<div class="articles-feed">)/, `$1${published.map(card).join("")}`);
categories = categories.replace(/<span class="feed-count">.*?<\/span>/, `<span class="feed-count">全 ${(categories.match(/<article class="article-card">/g) || []).length} 記事</span>`);
write("categories/index.html", categories);
write("categories/japanese-culture/index.html", archivePage("日本文化の記事一覧", "暦、民俗、建築、食文化など、日本の生活文化に関する論考一覧です。", published));

let sitemap = read("sitemap.xml");
const generatedPaths = posts.map((post) => `/posts/${post.slug}/`);
sitemap = sitemap.replace(/\s*<url>[\s\S]*?<\/url>/g, (block) => {
  const remove = block.includes(`${SITE_URL}/tags/`)
    || block.includes(`${SITE_URL}/categories/japanese-culture/`)
    || generatedPaths.some((item) => block.includes(item));
  return remove ? "" : block;
});
const additions = published.map((post) => `  <url><loc>${SITE_URL}/posts/${post.slug}/</loc><lastmod>${post.date}</lastmod><changefreq>monthly</changefreq><priority>0.9</priority></url>`).join("\n");
sitemap = sitemap.replace("</urlset>", `  <url><loc>${SITE_URL}/categories/japanese-culture/</loc><lastmod>${BUILD_DATE}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>\n${additions}\n</urlset>`);
write("sitemap.xml", sitemap);

for (const file of fs.readdirSync(path.join(ROOT, "tags"), { withFileTypes: true })) {
  const relative = file.isDirectory() ? `tags/${file.name}/index.html` : file.name === "index.html" ? "tags/index.html" : "";
  if (!relative) continue;
  let html = read(relative).replace('content="index, follow"', 'content="noindex, follow"');
  const canonical = file.isDirectory() ? `${SITE_URL}/categories/${file.name}/` : `${SITE_URL}/categories/`;
  html = html.replace(/<link rel="canonical" href="[^"]+">/, `<link rel="canonical" href="${canonical}">`);
  write(relative, html);
}

const htmlFiles = [];
const collectHtml = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) collectHtml(absolute);
    if (entry.isFile() && entry.name.endsWith(".html")) htmlFiles.push(absolute);
  }
};
collectHtml(ROOT);
for (const file of htmlFiles) {
  const relative = path.relative(ROOT, file);
  const html = read(relative);
  if (!html.includes('rel="icon"')) {
    write(relative, html.replace("</head>", '  <link rel="icon" href="/favicon.svg" type="image/svg+xml">\n</head>'));
  }
}

console.log(JSON.stringify({ buildDate: BUILD_DATE, rendered: posts.length, published: published.length, visibleCount }, null, 2));
