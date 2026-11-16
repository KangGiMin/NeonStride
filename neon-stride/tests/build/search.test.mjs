import test from "node:test";
import assert from "node:assert/strict";
import { addSearchMetadata, canonicalURL } from "../../scripts/lib/search.mjs";

const site = {
  name: "NEON STRIDE",
  alternateName: ["네온 스트라이드"],
  title: "NEON STRIDE | 웹 게임",
  description: "설치 없이 즐기는 게임",
  url: "https://game.example/play",
};
const html =
  '<title>{{site-title}}</title><meta name="description" content="{{site-description}}"><!-- site:metadata -->';

test("search metadata uses the public canonical URL and factual game information", () => {
  const output = addSearchMetadata(html, site);
  assert.equal(canonicalURL(site), "https://game.example/play/");
  assert.match(output, /rel="canonical" href="https:\/\/game.example\/play\/"/);
  const structured = JSON.parse(
    output.match(/<script type="application\/ld\+json">(.*?)<\/script>/)[1],
  );
  assert.deepEqual(structured["@type"], ["VideoGame", "WebApplication"]);
  assert.equal(structured.url, canonicalURL(site));
  assert.equal(structured.offers.price, "0");
  assert.doesNotMatch(output, /\{\{site-|<!-- site:metadata -->/);
});

test("metadata omits unknown URLs and safely escapes description content", () => {
  const output = addSearchMetadata(html, {
    ...site,
    url: null,
    description: '</script><b>"&',
  });
  assert.doesNotMatch(output, /rel="canonical"|<b>/);
  assert.match(output, /&lt;\/script&gt;/);
  assert.throws(() => canonicalURL({ url: "http://game.example/" }), /HTTPS/);
});

test("ownership tags appear only when the owner supplies verification codes", () => {
  assert.doesNotMatch(addSearchMetadata(html, site), /-site-verification/);
  const output = addSearchMetadata(html, {
    ...site,
    verification: { google: "test-google", naver: "test-naver" },
  });
  assert.match(output, /name="google-site-verification" content="test-google"/);
  assert.match(output, /name="naver-site-verification" content="test-naver"/);
});
