const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const script = fs.readFileSync(path.join(root, "js/identity-engine.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "css/identity.css"), "utf8");

function makeElement(dataset = {}) {
  const listeners = {};
  const classes = new Set();
  return {
    dataset,
    textContent: "",
    value: "",
    listeners,
    classList: {
      add: name => classes.add(name),
      remove: name => classes.delete(name),
      contains: name => classes.has(name)
    },
    addEventListener: (name, callback) => {
      listeners[name] = callback;
    },
    click: () => listeners.click()
  };
}

function createPage(math = Math) {
  const figures = [
    makeElement({ base: "adult-man" }),
    makeElement({ base: "adult-woman" }),
    makeElement({ base: "youth-boy" }),
    makeElement({ base: "youth-girl" })
  ];
  const present = [makeElement({ present: "calm" })];
  const future = [makeElement({ future: "steady" })];
  const entryMessage = makeElement();
  const gradInput = makeElement();
  const routeButton = makeElement();
  const routeMessage = makeElement();

  const groups = {
    ".figure-card": figures,
    "#present-emotions .emotion-card": present,
    "#future-emotions .emotion-card": future
  };
  const elementsById = { entryMessage, gradYear: gradInput, routeButton, routeMessage };
  const document = {
    querySelectorAll: selector => groups[selector] || [],
    getElementById: id => elementsById[id]
  };
  const context = vm.createContext({ document, Math: math });
  for (const api of ["fetch", "XMLHttpRequest", "localStorage", "sessionStorage", "location", "navigator", "indexedDB"]) {
    Object.defineProperty(context, api, {
      get() {
        throw new Error(`Unexpected use of ${api}`);
      }
    });
  }
  vm.runInContext(script, context);

  return { context, figures, present, future, entryMessage, gradInput, routeButton, routeMessage };
}

test("entry messages are unique through exhaustion and the four figures remain unchanged", () => {
  const page = createPage();
  const messageCount = vm.runInContext("welcomeMessages.length", page.context);
  const displayed = [page.entryMessage.textContent];

  assert.equal(page.entryMessage.textContent.includes("+U"), true);
  assert.deepEqual(page.figures.map(figure => figure.dataset.base), [
    "adult-man", "adult-woman", "youth-boy", "youth-girl"
  ]);
  assert.match(html, /id="entryMessage"[^>]*role="status"[^>]*aria-live="polite"/);
  assert.deepEqual(
    [...html.matchAll(/<button class="figure-card" data-base="([^"]+)">/g)].map(match => match[1]),
    ["adult-man", "adult-woman", "youth-boy", "youth-girl"]
  );

  for (let index = 0; index < messageCount + 3; index += 1) {
    page.figures[index % page.figures.length].click();
    displayed.push(page.entryMessage.textContent);
  }

  assert.equal(new Set(displayed).size, messageCount);
  assert.equal(displayed.at(-1), displayed.at(-2));
  assert.equal(page.figures.filter(figure => figure.classList.contains("selected")).length, 1);
  assert.equal(page.figures.find(figure => figure.classList.contains("selected")).dataset.base, "adult-man");
});

test("repeat clicks do not rotate copy and selection plus lane routing stay local", () => {
  const page = createPage();
  page.figures[0].click();
  const selectedMessage = page.entryMessage.textContent;
  page.figures[0].click();
  assert.equal(page.entryMessage.textContent, selectedMessage);

  page.present[0].click();
  page.future[0].click();
  page.routeButton.click();
  assert.match(page.routeMessage.textContent, /Finish all four steps/);

  page.figures[1].click();
  page.gradInput.value = "2000";
  page.routeButton.click();
  assert.match(page.routeMessage.textContent, /Adult lane locally/);
  assert.match(page.routeMessage.textContent, /External routing is blocked/);
});

test("each message appears exactly once before exhaustion for first, middle, and last random choices", () => {
  for (const random of [() => 0, () => 0.5, () => 0.999999]) {
    const math = Object.create(Math);
    math.random = random;
    const page = createPage(math);
    const messages = Array.from(vm.runInContext("welcomeMessages", page.context));
    const displayed = [page.entryMessage.textContent];

    for (let index = 0; index < messages.length - 1; index += 1) {
      page.figures[index % page.figures.length].click();
      displayed.push(page.entryMessage.textContent);
    }

    assert.equal(new Set(displayed).size, messages.length);
    assert.deepEqual([...displayed].sort(), [...messages].sort());
    const lastMessage = page.entryMessage.textContent;
    for (let index = 0; index < messages.length; index += 1) {
      page.figures[index % page.figures.length].click();
      assert.equal(page.entryMessage.textContent, lastMessage);
    }
    assert.equal(vm.runInContext("remainingWelcomeMessages.length", page.context), 0);
  }
});

test("all four figures select adult and youth lanes locally with every external route blocked", () => {
  const currentYear = new Date().getFullYear();
  for (let index = 0; index < 4; index += 1) {
    const page = createPage();
    page.figures[index].click();
    page.present[0].click();
    page.future[0].click();

    for (const [year, lane] of [[currentYear - 1, "Adult"], [currentYear, "Youth"], [currentYear + 1, "Youth"]]) {
      page.gradInput.value = String(year);
      page.routeButton.click();
      assert.match(page.routeMessage.textContent, new RegExp(`${lane} lane locally`));
      assert.match(page.routeMessage.textContent, /External routing is blocked until its destination is verified for launch/);
    }
  }
});

test("all figures have decorative limbs, visible head and body rules, and contrasting hover strokes", () => {
  const figures = [...html.matchAll(/<div class="stick-figure [^"]+" aria-hidden="true">([\s\S]*?)<\/div>/g)];
  assert.equal(figures.length, 10);
  for (const [, markup] of figures) {
    for (const limb of ["arms", "leg-left", "leg-right"]) {
      assert.match(markup, new RegExp(`<span class="${limb}"></span>`));
    }
  }
  assert.match(css, /\.stick-figure::before\s*\{[^}]*width: 22px;[^}]*height: 22px;[^}]*border: 2px solid currentColor;/);
  for (const selector of [".stick-figure::after", ".stick-figure .arms", ".stick-figure .leg-left,\n.stick-figure .leg-right"]) {
    const rule = css.slice(css.indexOf(`${selector} {`)).split("}")[0];
    assert.match(rule, /background: currentColor;/);
  }
});

test("Cloud entry links, scripts, styles, and retained navigation resolve locally", () => {
  for (const page of [path.join(root, "index.html"), path.join(root, "status.html"), path.join(root, "../index.html")]) {
    const source = fs.readFileSync(page, "utf8");
    const references = [...source.matchAll(/(?:href|src)="([^"]+)"|location\.href='([^']+)'/g)];
    for (const [, attribute, navigation] of references) {
      const target = attribute || navigation;
      assert.doesNotMatch(target, /^(?:[a-z]+:|\/\/)/i);
      const resolved = path.resolve(path.dirname(page), target);
      assert.equal(fs.existsSync(resolved), true, `${page}: ${target}`);
      if (fs.statSync(resolved).isDirectory()) {
        assert.equal(fs.existsSync(path.join(resolved, "index.html")), true, target);
      }
    }
  }
  const homepage = fs.readFileSync(path.join(root, "../index.html"), "utf8");
  assert.match(homepage, /<a href="entry\/">Universal four-figure \+U entry<\/a>/);
  assert.match(html, /name="viewport"/);
  assert.doesNotMatch(html + script, /whnutz/i);
  assert.equal(fs.readFileSync(path.join(root, "../CNAME"), "utf8").trim(), "wholedonuts.cloud");
});
