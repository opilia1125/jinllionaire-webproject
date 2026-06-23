const fs = require("fs");
const path = require("path");

const siteUrl = "https://gachi-labs.xyz";
const sourceDir = path.join(__dirname, "content", "posts");
const postsDir = path.join(__dirname, "posts");
const siteName = "日本文化と歴史を読む";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function parseFrontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error("Missing frontmatter");
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (value.startsWith("[") && value.endsWith("]")) {
      data[key] = [...value.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    } else {
      data[key] = value.replace(/^"|"$/g, "");
    }
  }
  return { data, body: match[2].trim() };
}

function inlineMarkdown(text) {
  return escapeHtml(text)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function renderMarkdown(markdown) {
  const lines = markdown.split(/\r?\n/);
  const out = [];
  let paragraph = [];
  let list = [];

  function flushParagraph() {
    if (!paragraph.length) return;
    out.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
    paragraph = [];
  }

  function flushList() {
    if (!list.length) return;
    out.push(`<ul>${list.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</ul>`);
    list = [];
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    if (trimmed.startsWith("## ")) {
      flushParagraph();
      flushList();
      out.push(`<h2>${escapeHtml(trimmed.slice(3))}</h2>`);
      continue;
    }

    if (trimmed.startsWith("# ")) {
      continue;
    }

    if (trimmed.startsWith("- ")) {
      flushParagraph();
      list.push(trimmed.slice(2));
      continue;
    }

    if (trimmed === "References") {
      flushParagraph();
      flushList();
      out.push(`<p class="article-note">${inlineMarkdown(trimmed)}</p>`);
      continue;
    }

    paragraph.push(trimmed);
  }

  flushParagraph();
  flushList();
  return out.join("\n");
}

function imageFigures(post) {
  const images = [
    {
      src: `/images/posts/${post.slug}/image-01.webp`,
      alt: `${post.title}の歴史的背景を示す教育用イラスト`,
    },
    {
      src: `/images/posts/${post.slug}/image-02.webp`,
      alt: `${post.title}と現代の文化的つながりを示す資料風イラスト`,
    },
  ];
  return `<h2>Images</h2>
${images.map((image) => `<figure class="article-figure"><img src="${image.src}" alt="${escapeHtml(image.alt)}" title="${escapeHtml(image.alt)}" loading="lazy" width="1200" height="675"><figcaption>${escapeHtml(image.alt)}</figcaption></figure>`).join("\n")}`;
}

function articleHtml(post) {
  const beforeImages = post.body.split("## Images")[0].trim();
  const referencesPart = post.body.includes("## References")
    ? `## References${post.body.split("## References")[1]}`
    : "";
  return `${renderMarkdown(beforeImages)}
${imageFigures(post)}
${renderMarkdown(referencesPart)}`;
}

function layout(post, html) {
  const canonical = `${siteUrl}/posts/${post.slug}/`;
  const tags = Array.isArray(post.tags) ? post.tags : [];
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="index, follow">
  <title>${escapeHtml(post.title)} | ${siteName}</title>
  <meta name="description" content="${escapeHtml(post.description)}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="${siteName}">
  <meta property="og:title" content="${escapeHtml(post.title)} | ${siteName}">
  <meta property="og:description" content="${escapeHtml(post.description)}">
  <meta property="og:url" content="${canonical}">
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <header class="site-header">
    <div class="container header-wrap">
      <a href="/" class="header-logo"><span class="live-indicator"></span><span>${siteName}</span></a>
      <nav class="header-nav" aria-label="Primary navigation">
        <a href="/">Home</a>
        <a href="/about/">About</a>
        <a href="/categories/">Categories</a>
        <a href="/contact/">Contact</a>
      </nav>
    </div>
  </header>
  <main class="container">
    <article class="article-detail">
      <div class="modal-article-meta">
        <a class="modal-category" href="/categories/">${escapeHtml(post.category)}</a>
        <span class="modal-date">${escapeHtml(post.date)}</span>
        <span>${tags.map((tag) => `#${escapeHtml(tag)}`).join(" ")}</span>
      </div>
      <h1 class="modal-article-title">${escapeHtml(post.title)}</h1>
      <div class="modal-article-body">
${html}
      </div>
    </article>
  </main>
  <footer>
    <div class="container footer-wrap">
      <div class="footer-links">
        <a href="/privacy-policy/">Privacy Policy</a>
        <a href="/terms/">Terms</a>
        <a href="/contact/">Contact</a>
      </div>
      <div class="copyright-text">&copy; 2026 ${siteName}. All rights reserved.</div>
    </div>
  </footer>
</body>
</html>
`;
}

function card(post) {
  return `<article class="article-card">
          <div class="card-header">
            <a class="category-tag" href="/categories/">${escapeHtml(post.category)}</a>
            <span class="meta-date">${escapeHtml(post.date)}</span>
          </div>
          <h2 class="card-title"><a href="/posts/${post.slug}/">${escapeHtml(post.title)}</a></h2>
          <p class="card-snippet">${escapeHtml(post.description)}</p>
          <div class="card-footer">
            <span class="meta-views">${(post.tags || []).map((tag) => `#${escapeHtml(tag)}`).join(" ")}</span>
            <a class="read-more-btn" href="/posts/${post.slug}/">続きを読む →</a>
          </div>
        </article>`;
}

const posts = fs.readdirSync(sourceDir)
  .filter((name) => name.endsWith(".md"))
  .sort()
  .map((name) => {
    const source = fs.readFileSync(path.join(sourceDir, name), "utf8");
    const parsed = parseFrontmatter(source);
    return { ...parsed.data, body: parsed.body };
  });

for (const post of posts) {
  const html = articleHtml(post);
  const dir = path.join(postsDir, post.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), layout(post, html), "utf8");
}

let index = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
index = index.replace(/<span class="feed-count">.*?<\/span>/, '<span class="feed-count">全 40 記事掲載中</span>');
if (!index.includes("/posts/nijushi-sekki-seasonal-culture/")) {
  const insertion = "\n" + posts.map(card).join("\n");
  index = index.replace(/(<\/article><\/div>\s*<\/section>)/, `</article>${insertion}</div>\n      </section>`);
}
fs.writeFileSync(path.join(__dirname, "index.html"), index, "utf8");

let sitemap = fs.readFileSync(path.join(__dirname, "sitemap.xml"), "utf8");
if (!sitemap.includes("/posts/nijushi-sekki-seasonal-culture/")) {
  const urls = posts.map((post) => `  <url>
    <loc>${siteUrl}/posts/${post.slug}/</loc>
    <lastmod>${post.date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>`).join("\n");
  sitemap = sitemap.replace("</urlset>", `${urls}\n</urlset>`);
  fs.writeFileSync(path.join(__dirname, "sitemap.xml"), sitemap, "utf8");
}

let css = fs.readFileSync(path.join(__dirname, "styles.css"), "utf8");
if (!css.includes(".article-figure")) {
  css += `
.article-figure { margin: 2rem 0; }
.article-figure img { display: block; width: 100%; height: auto; border-radius: 6px; border: 1px solid var(--border-color); }
.article-figure figcaption { color: var(--text-muted); font-family: var(--font-sans); font-size: 0.82rem; margin-top: 0.5rem; }
.article-note { color: var(--text-muted); font-family: var(--font-sans); font-size: 0.86rem; }
`;
  fs.writeFileSync(path.join(__dirname, "styles.css"), css, "utf8");
}

console.log(JSON.stringify({ rendered: posts.length, first: `/posts/${posts[0].slug}/` }, null, 2));
