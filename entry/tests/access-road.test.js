const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const root = path.join(__dirname, "..", "..");
const read = p => fs.readFileSync(path.join(root, p), "utf8");
const { validateRequest } = require("../../pages/counter-path.js");

test("every room and entry page loads the access bar and its styles", () => {
  for (const p of ["index.html", "table.html", "counter.html", "store.html", "vault.html", "foundation.html", "movement.html",
                   "emotional-periodic-table.html", "pages/donor.html", "pages/identity-law.html", "entry/index.html",
                   "entry/status.html", "counter-path.html"]) {
    const html = read(p);
    assert.match(html, /access\.js/, `${p} needs the access bar`);
    assert.match(html, /access\.css/, `${p} needs the access styles`);
  }
});

test("The Table offers the earned road, not a direct door to The Counter", () => {
  const table = read("table.html");
  assert.match(table, /href="counter-path\.html"/);
  assert.doesNotMatch(table, /href="counter\.html"/);
});

test("the road accepts any way of showing growth, always with a trusted adult", () => {
  assert.deepEqual(validateRequest({ mode: "other", otherWay: "Video", adultKnows: true }), []);
  assert.ok(validateRequest({ mode: "other", otherWay: "Video", adultKnows: false }).length);
});

test("the road and access bar keep the no-storage promise", () => {
  for (const p of ["pages/counter-path.js", "pages/access.js"]) {
    const js = read(p);
    for (const bad of [/fetch\(/, /XMLHttpRequest/, /localStorage/, /sessionStorage/, /document\.cookie/, /sendBeacon/]) {
      assert.doesNotMatch(js, bad, p);
    }
  }
});
