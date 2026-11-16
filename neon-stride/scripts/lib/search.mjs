import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[character],
  );

export function canonicalURL(site) {
  if (!site.url) return null;
  const url = new URL(site.url);
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new Error(
      "The public site URL must be an HTTPS address without credentials.",
    );
  }
  url.hash = "";
  url.search = "";
  if (!url.pathname.endsWith("/")) url.pathname += "/";
  return url.href;
}

export async function readSiteConfig(sourceRoot) {
  return JSON.parse(
    await readFile(path.join(sourceRoot, "config/site.json"), "utf8"),
  );
}

export function addSearchMetadata(html, site) {
  const url = canonicalURL(site);
  const metadata = [
    '<meta name="robots" content="index, follow, max-image-preview:large" />',
    `<meta property="og:title" content="${escape(site.title)}" />`,
    `<meta property="og:description" content="${escape(site.description)}" />`,
    `<meta property="og:site_name" content="${escape(site.name)}" />`,
    '<meta property="og:type" content="website" />',
    '<meta property="og:locale" content="ko_KR" />',
    '<meta name="twitter:card" content="summary" />',
    `<meta name="twitter:title" content="${escape(site.title)}" />`,
    `<meta name="twitter:description" content="${escape(site.description)}" />`,
  ];
  if (url)
    metadata.push(
      `<link rel="canonical" href="${escape(url)}" />`,
      `<meta property="og:url" content="${escape(url)}" />`,
    );
  for (const provider of ["google", "naver"]) {
    const token = site.verification?.[provider];
    if (token)
      metadata.push(
        `<meta name="${provider}-site-verification" content="${escape(token)}" />`,
      );
  }
  const game = {
    "@context": "https://schema.org",
    "@type": ["VideoGame", "WebApplication"],
    name: site.name,
    alternateName: site.alternateName,
    description: site.description,
    applicationCategory: "GameApplication",
    operatingSystem: "Web",
    gamePlatform: "Web browser",
    inLanguage: "ko-KR",
    isAccessibleForFree: true,
    genre: ["Endless runner", "Arcade"],
    offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
    ...(url ? { url } : {}),
  };
  const structured = JSON.stringify(game).replace(/</g, "\\u003c");
  metadata.push(`<script type="application/ld+json">${structured}</script>`);
  return html
    .replace("{{site-title}}", escape(site.title))
    .replace("{{site-description}}", escape(site.description))
    .replace("<!-- site:metadata -->", metadata.join("\n"));
}

export async function writeSearchFiles(outputRoot, site) {
  const url = canonicalURL(site);
  const sitemap = url ? `Sitemap: ${new URL("sitemap.xml", url).href}\n` : "";
  await writeFile(
    path.join(outputRoot, "robots.txt"),
    `User-agent: *\nAllow: /\n${sitemap}`,
  );
  if (url) {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${escape(url)}</loc></url>\n</urlset>\n`;
    await writeFile(path.join(outputRoot, "sitemap.xml"), xml);
  }
}
