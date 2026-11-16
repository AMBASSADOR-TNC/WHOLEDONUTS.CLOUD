const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..", "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const { SYMBOLS, PAGES, LOOP } = require("../../pages/ghost-layer.js");

const pages = {
  "index.html": "home", "entry/index.html": "home", "table.html": "table", "counter.html": "counter",
  "counter-path.html": "path", "store.html": "store", "foundation.html": "foundation", "movement.html": "home",
  "vault.html": "guide", "emotional-periodic-table.html": "feelings", "entry/status.html": "guide",
  "pages/donor.html": "store", "pages/identity-law.html": "guide"
};

test("all 13 pages carry the ghosted reminders that fit them", () => {
  for (const [file, page] of Object.entries(pages)) {
    const html = read(file);
    assert.match(html, new RegExp(`data-ghost="${page}"`), file);
    assert.match(html, /ghost-layer\.js"><\/script>/, file);
    for (const n of PAGES[page]) assert.ok(SYMBOLS[n], `${page}: ${n}`);
  }
  for (const n of LOOP) assert.ok(SYMBOLS[n], n);
});

test("pages that ask for support or sell never show the No $ sign", () => {
  for (const page of ["store", "foundation", "feelings"]) assert.ok(!PAGES[page].includes("no-money"), page);
});

test("home states the three promises and The Difference; the road asks for a pause", () => {
  const html = read("index.html");
  for (const words of ["No judgement", "No $", "No faces", "Now become The Difference. Stop feeling different."]) assert.ok(html.includes(words), words);
  assert.match(read("counter-path.html"), /stop and take the night/);
  const css = read("pages/access.css");
  assert.match(css, /\.ghost-layer \{[^}]*z-index: -1;[^}]*pointer-events: none;/);
  assert.match(css, /html\.a11y-contrast \.ghost-layer \{ display: none; \}/);
});
