const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = __dirname;
const buildDate = "2026-06-24";

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("home excludes future-dated posts and reports the visible count", () => {
  const html = read("index.html");
  const dates = [...html.matchAll(/<(?:span|time)[^>]*class="meta-date"[^>]*>(\d{4}-\d{2}-\d{2})</g)]
    .map((match) => match[1]);

  assert.ok(dates.length > 0);
  assert.ok(dates.every((date) => date <= buildDate));
  assert.match(html, new RegExp(`全 ${dates.length} 記事掲載中`));
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
  assert.match(current, /name="author" content="Gachi Labs 編集部"/);
  assert.match(current, /application\/ld\+json/);
  assert.match(current, /class="author-box"/);
});

test("generated posts require an explicit editorial publish status", () => {
  const sources = fs.readdirSync(path.join(root, "content", "posts"))
    .filter((name) => name.endsWith(".md"))
    .map((name) => read(path.join("content", "posts", name)));
  const publishedSources = sources.filter((source) => /^status:\s*"published"/m.test(source));

  assert.equal(publishedSources.length, 1);
  assert.match(publishedSources[0], /slug:\s*"nijushi-sekki-seasonal-culture"/);
});

test("contact page never claims to submit through an undefined handler", () => {
  const html = read("contact/index.html");

  assert.doesNotMatch(html, /handleContactSubmit/);
  assert.doesNotMatch(html, /送信が完了/);
  assert.match(html, /お問い合わせ窓口の準備状況/);
});

test("trust pages identify editorial responsibility and revision dates", () => {
  const about = read("about/index.html");
  const privacy = read("privacy-policy/index.html");
  const terms = read("terms/index.html");

  assert.match(about, /Gachi Labs 編集部/);
  assert.match(about, /編集方針/);
  assert.match(privacy, /最終改定日：2026年6月24日/);
  assert.match(terms, /最終改定日：2026年6月24日/);
});

test("responsive CSS prevents vertical logo collapse and respects reduced motion", () => {
  const css = read("styles.css");

  assert.match(css, /\.header-logo\s*\{[^}]*flex-shrink:\s*0/s);
  assert.match(css, /white-space:\s*nowrap/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /\.skip-link/);
});

test("published article exposes specific references and multiple internal links", () => {
  const html = read("posts/nijushi-sekki-seasonal-culture/index.html");
  const internalLinks = [...html.matchAll(/href="(\/posts\/[^"]+)"/g)];
  const externalLinks = [...html.matchAll(/href="(https:\/\/[^"]+)"/g)];

  assert.ok(internalLinks.length >= 3);
  assert.ok(externalLinks.length >= 3);
  assert.match(html, /国立天文台/);
});

test("every root-relative HTML link resolves to a generated file", () => {
  const htmlFiles = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      if (entry.isFile() && entry.name.endsWith(".html")) htmlFiles.push(absolute);
    }
  };
  visit(root);

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
