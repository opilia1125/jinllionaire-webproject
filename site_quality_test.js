const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = __dirname;
const buildDate = "2026-06-24";

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function collectFiles(directory, predicate) {
  const files = [];
  const visit = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        visit(absolute);
        continue;
      }
      if (entry.isFile() && predicate(entry.name, absolute)) files.push(absolute);
    }
  };
  visit(directory);
  return files;
}

test("home excludes future-dated posts and reports the visible count", () => {
  const html = read("index.html");
  const dates = [...html.matchAll(/<(?:span|time)[^>]*class="meta-date"[^>]*>(\d{4}-\d{2}-\d{2})</g)]
    .map((match) => match[1]);

  assert.ok(dates.length > 0);
  assert.ok(dates.every((date) => date <= buildDate));
  assert.match(html, /<span class="feed-count">/);
});

test("sitemap excludes future posts and duplicate tag archives", () => {
  const xml = read("sitemap.xml");
  const futureDates = [...xml.matchAll(/<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/g)]
    .map((match) => match[1])
    .filter((date) => date > buildDate);

  assert.deepEqual(futureDates, []);
  assert.doesNotMatch(xml, /https:\/\/gachi-labs\.xyz\/tags\//);
});

test("scheduled posts are noindex and current posts expose trust metadata", () => {
  const scheduled = read("posts/bon-odori-community-culture/index.html");
  const current = read("posts/nijushi-sekki-seasonal-culture/index.html");

  assert.match(scheduled, /name="robots" content="noindex, follow"/);
  assert.match(current, /name="author" content="Gachi Labs /);
  assert.match(current, /application\/ld\+json/);
  assert.match(current, /class="author-box"/);
});

test("generated posts require an explicit editorial publish status", () => {
  const expected = new Set([
    "nijushi-sekki-seasonal-culture",
    "furoshiki-wrap-culture",
    "hashi-table-culture",
    "bonsai-cultivation-aesthetics",
    "chochin-light-culture",
    "tatami-living-space",
  ]);
  const sources = collectFiles(path.join(root, "content", "posts"), (name) => name.endsWith(".md"))
    .map((file) => fs.readFileSync(file, "utf8"));
  const publishedSlugs = sources.flatMap((source) => {
    if (!/^status:\s*"published"/m.test(source)) return [];
    const match = source.match(/^slug:\s*"([^"]+)"/m);
    return match ? [match[1]] : [];
  });

  assert.equal(publishedSlugs.length, expected.size);
  assert.deepEqual(new Set(publishedSlugs), expected);
});

test("contact page exposes a real email contact path", () => {
  const html = read("contact/index.html");

  assert.doesNotMatch(html, /準備中|確認中|フォームを停止/);
  assert.match(html, /mailto:ljsopilia1125@gmail\.com/);
});

test("trust pages identify editorial responsibility and revision dates", () => {
  const about = read("about/index.html");
  const privacy = read("privacy-policy/index.html");
  const terms = read("terms/index.html");

  assert.match(about, /Gachi Labs /);
  assert.match(privacy, /2026/);
  assert.match(terms, /2026/);
});

test("responsive CSS prevents vertical logo collapse and respects reduced motion", () => {
  const css = read("styles.css");

  assert.match(css, /\.header-logo\s*\{[^}]*flex-shrink:\s*0/s);
  assert.match(css, /white-space:\s*nowrap/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /\.skip-link/);
});

test("published article exposes specific references and internal links", () => {
  const html = read("posts/nijushi-sekki-seasonal-culture/index.html");
  const internalLinks = [...html.matchAll(/href="(\/posts\/[^"]+)"/g)];
  const externalLinks = [...html.matchAll(/href="(https:\/\/[^"]+)"/g)];

  assert.ok(internalLinks.length >= 3);
  assert.ok(externalLinks.length >= 3);
  assert.match(html, /<section class="source-box" aria-labelledby="research-heading">/);
  assert.ok((html.match(/<figure class="article-figure"/g) || []).length <= 1);
  assert.doesNotMatch(html, /And そして|Image Prompt|Ultra detailed|no watermark/);
});

test("posts pages stay free from internal prompt leakage and repeated related sections", () => {
  const htmlFiles = collectFiles(path.join(root, "posts"), (name) => name.endsWith(".html"));

  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, "utf8");
    assert.doesNotMatch(html, /準備中|確認中|フォームを停止|Image Prompt|Ultra detailed|no watermark|And そして/);
    assert.ok((html.match(/<section class="source-box related-box"/g) || []).length <= 1, file);
    assert.ok((html.match(/<figure class="article-figure"/g) || []).length <= 1, file);
  }
});

test("internal image prompt notes do not leak generator phrases", () => {
  const mdFiles = collectFiles(path.join(root, "data", "image-prompts"), (name) => name.endsWith(".md"));

  assert.ok(mdFiles.length > 0);
  for (const file of mdFiles) {
    const markdown = fs.readFileSync(file, "utf8");
    assert.doesNotMatch(markdown, /Image Prompt|Ultra detailed|no watermark|high resolution/);
  }
});

test("every root-relative HTML link resolves to a generated file", () => {
  const htmlFiles = collectFiles(root, (name) => name.endsWith(".html"));
  const missing = [];

  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, "utf8");
    for (const match of html.matchAll(/href="(\/[^"#?]*)"/g)) {
      const target = match[1] === "/" ? path.join(root, "index.html") : path.join(root, match[1], "index.html");
      if (!fs.existsSync(target) && !fs.existsSync(path.join(root, match[1]))) {
        missing.push(`${path.relative(root, file)} -> ${match[1]}`);
      }
    }
  }

  assert.deepEqual(missing, []);
});
