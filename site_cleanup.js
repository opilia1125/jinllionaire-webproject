const path = require("node:path");

function sanitizeGeneratedHtml(relative, html) {
  let output = html.replace(/And そして/g, "そして");

  if (relative === "contact/index.html") {
    output = output.replace(
      /<div class="modal-article-body">[\s\S]*?<\/div><\/article>/,
      '<div class="modal-article-body"><p>お問い合わせは <a href="mailto:ljsopilia1125@gmail.com">ljsopilia1125@gmail.com</a> までお願いします。記事の訂正依頼、権利関係、取材はメールで受け付けます。</p><section class="policy-section"><h2>受付内容</h2><ul><li>記事の訂正依頼</li><li>権利関係の連絡</li><li>取材・掲載に関する相談</li></ul></section></div></article>',
    );
    return output;
  }

  if (relative.startsWith("posts/")) {
    output = output.replace(/\b(Image Prompt|Ultra detailed|no watermark|high resolution)\b/g, "");
    output = output.replace(/(<figure class="article-figure"[\s\S]*?<\/figure>)(?:\s*<figure class="article-figure"[\s\S]*?<\/figure>)+/g, "$1");
    output = output.replace(/<figcaption>[\s\S]*?<\/figcaption>/g, "<figcaption>代表画像</figcaption>");
    output = output.replace(/alt="[^"]*"/g, 'alt="代表画像"');
    output = output.replace(/((?:<section class="source-box related-box"[\s\S]*?<\/section>\s*){2,})/g, (match) => {
      const first = match.match(/<section class="source-box related-box"[\s\S]*?<\/section>/);
      return first ? first[0] : match;
    });
  }

  return output;
}

function sanitizeImagePrompt(relative) {
  const slug = path.basename(relative, ".md");
  return [
    `# ${slug}`,
    "",
    "## Internal image notes",
    "",
    "- Illustration 1: documentary historical scene with accurate Japanese context.",
    "- Illustration 2: museum-style cultural scene with restrained colors.",
    "",
  ].join("\n");
}

module.exports = {
  sanitizeGeneratedHtml,
  sanitizeImagePrompt,
};
