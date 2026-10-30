const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const script = fs.readFileSync(path.join(root, "js/identity-engine.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "css/identity.css"), "utf8");
const sharedScript = fs.readFileSync(path.join(root, "../pages/local-journey.js"), "utf8");

function makeElement(dataset = {}, tagName = "div") {
  const listeners = {};
  const classes = new Set();
  const attributes = {};
  return {
    dataset,
    tagName,
    children: [],
    textContent: "",
    value: "",
    hidden: false,
    disabled: false,
    focused: false,
    attributes,
    listeners,
    appendChild(child) { this.children.push(child); },
    querySelectorAll(selector) { return this.children.filter(child => child.tagName === selector); },
    focus() { this.focused = true; },
    setAttribute: (name, value) => { attributes[name] = value; },
    classList: {
      add: name => classes.add(name),
      remove: name => classes.delete(name),
      contains: name => classes.has(name)
    },
    addEventListener: (name, callback) => {
      listeners[name] = callback;
    },
    click() {
      if (!this.disabled) listeners.click();
    }
  };
}

function createPage(math = Math, entry = true, storeWhispers = false) {
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
  const journeyButtons = ["notice", "imagine", "reflect"].map(theme => makeElement({ journey: theme }));
  const journeyElements = Object.fromEntries([
    "journey", "journeyHeading", "journeyMessage", "journeyPrompt",
    "journeyChoices", "journeyNext", "journeyRestart", "journeySkip", "journeyStart", "journeyExperience"
  ].map(id => [id, makeElement()]));
  journeyElements.journey.hidden = entry;
  journeyElements.journey.dataset.localJourney = storeWhispers ? "store-whispers" : "";
  journeyElements.journeyExperience.hidden = true;
  const panel = makeElement();
  const panelElements = {
    h2: journeyElements.journeyHeading,
    '[data-action="start"]': journeyElements.journeyStart,
    '[data-part="experience"]': journeyElements.journeyExperience,
    '[data-part="message"]': journeyElements.journeyMessage,
    '[data-part="prompt"]': journeyElements.journeyPrompt,
    '[data-part="choices"]': journeyElements.journeyChoices,
    '[data-action="next"]': journeyElements.journeyNext,
    '[data-action="restart"]': journeyElements.journeyRestart,
    '[data-action="skip"]': journeyElements.journeySkip
  };
  panel.querySelector = selector => panelElements[selector];
  panel.querySelectorAll = () => journeyButtons;

  const groups = {
    ".figure-card": figures,
    "#present-emotions .emotion-card": present,
    "#future-emotions .emotion-card": future,
    "[data-local-journey]": [journeyElements.journey]
  };
  const elementsById = { entryMessage, gradYear: gradInput, routeButton, routeMessage, ...journeyElements };
  const document = {
    querySelectorAll: selector => groups[selector] || [],
    getElementById: id => elementsById[id],
    createElement: () => panel
  };
  const context = vm.createContext({ document, Math: math });
  for (const api of ["fetch", "XMLHttpRequest", "localStorage", "sessionStorage", "location", "navigator", "indexedDB"]) {
    Object.defineProperty(context, api, {
      get() {
        throw new Error(`Unexpected use of ${api}`);
      }
    });
  }
  vm.runInContext(sharedScript, context);
  if (entry) vm.runInContext(script, context);

  return { context, figures, present, future, entryMessage, gradInput, routeButton, routeMessage, journeyButtons, ...journeyElements };
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
  assert.deepEqual(
    [...homepage.matchAll(/<a class="room" href="([^"]+)">/g)].map(match => match[1]),
    ["counter.html", "table.html", "store.html", "movement.html", "foundation.html", "pages/donor.html", "pages/identity-law.html"]
  );
  assert.doesNotMatch(homepage, /onclick=|location\.href|<div class="room"/);
  assert.match(homepage, /\.room\s*\{\s*display: block;\s*color: inherit;\s*text-decoration: none;/);
  assert.match(html, /name="viewport"/);
  assert.doesNotMatch(html + script, /whnutz/i);
  assert.equal(fs.readFileSync(path.join(root, "../CNAME"), "utf8").trim(), "wholedonuts.cloud");
});

test("each figure reveals an equal, optional branching journey with meaningful advancement", () => {
  for (let figure = 0; figure < 4; figure += 1) {
    const page = createPage();
    assert.equal(page.journey.hidden, true);
    page.figures[figure].click();
    assert.equal(page.journey.hidden, false);
    assert.equal(page.journeyHeading.focused, true);
    assert.match(page.journeyMessage.textContent, /Discovery 1 of 3/);
    assert.equal(page.figures[figure].attributes["aria-pressed"], "true");
    for (let step = 0; step < 3; step += 1) {
      page.journeyButtons[step].click();
      const theme = page.journeyButtons[step].dataset.journey;
      const themes = {
        notice: /shapes|detail|texture/,
        imagine: /doorway|cloud|bridge/,
        reflect: /appreciated|pace|note/
      };
      assert.match(page.journeyPrompt.textContent, themes[theme]);
      assert.match(page.journeyMessage.textContent, new RegExp(`Discovery ${step + 1} of 3`));
      assert.equal(page.journeyChoices.hidden, true);
      assert.equal(page.journeyNext.hidden, false);
      assert.equal(page.journeyNext.focused, true);
      const prompt = page.journeyPrompt.textContent;
      page.journeyButtons[(step + 1) % 3].click();
      page.figures[figure].click();
      assert.equal(page.journeyPrompt.textContent, prompt, "hidden choices and same-figure clicks must not advance");
      page.journeyNext.click();
    }
    assert.match(page.journeyMessage.textContent, /journey is complete/);
    assert.equal(page.journeyNext.hidden, true);
    assert.equal(page.journeySkip.hidden, true);
    assert.equal(page.journeyRestart.hidden, false);
    assert.equal(page.journeyRestart.focused, true);
  }
});

test("journey prompts never repeat across restart, figure switches, skip, and bounded exhaustion", () => {
  for (const random of [() => 0, () => 0.5, () => 0.999999]) {
    const math = Object.create(Math);
    math.random = random;
    const page = createPage(math);
    page.figures[0].click();
    const seen = [];
    for (let theme = 0; theme < 3; theme += 1) {
      for (let step = 0; step < 3; step += 1) {
        page.journeyButtons[theme].click();
        seen.push(page.journeyPrompt.textContent);
        assert.equal(new Set(seen).size, seen.length);
        page.journeyNext.click();
      }
      if (theme < 2) {
        const welcome = page.entryMessage.textContent;
        page.journeyRestart.click();
        assert.equal(page.entryMessage.textContent, welcome);
        assert.equal(page.journeyButtons[theme].disabled, true);
      }
    }
    assert.equal(seen.length, 9);
    assert.match(page.journeyMessage.textContent, /all nine activities/);
    assert.equal(page.journeyRestart.hidden, true);
    const done = page.journeyMessage.textContent;
    page.journeyRestart.click();
    assert.equal(page.journeyMessage.textContent, done);
    page.figures[1].click();
    assert.match(page.journeyMessage.textContent, /all nine activities/);
    assert.equal(page.journeyChoices.hidden, true);
  }
});

test("skip and restart preserve emotion choices and visited prompts while figure switches reset only journey progress", () => {
  const page = createPage();
  page.figures[0].click();
  page.present[0].click();
  page.future[0].click();
  page.journeyButtons[0].click();
  const first = page.journeyPrompt.textContent;
  page.journeySkip.click();
  assert.match(page.journeyMessage.textContent, /Journey skipped/);
  assert.equal(page.journeyPrompt.textContent, "");
  page.journeyRestart.click();
  assert.match(page.journeyMessage.textContent, /Discovery 1 of 3/);
  page.journeyButtons[0].click();
  assert.notEqual(page.journeyPrompt.textContent, first);
  page.figures[1].click();
  assert.match(page.journeyMessage.textContent, /Discovery 1 of 3/);
  page.journeyButtons[0].click();
  assert.notEqual(page.journeyPrompt.textContent, first);
  page.journeyNext.click();
  assert.equal(page.journeyButtons[0].disabled, true);
  page.journeySkip.click();
  page.gradInput.value = "2000";
  page.routeButton.click();
  assert.match(page.routeMessage.textContent, /Adult lane locally/);
  assert.match(page.routeMessage.textContent, /External routing is blocked/);
  assert.equal(page.present[0].attributes["aria-pressed"], "true");
  assert.equal(page.future[0].attributes["aria-pressed"], "true");
  assert.match(sharedScript, /<div role="status" aria-live="polite" aria-atomic="true">\s*<p data-part="message"><\/p>\s*<p data-part="prompt"><\/p>\s*<\/div>/);
  assert.equal((sharedScript.match(/aria-live=/g) || []).length, 1, "announce progress and activity together, not through duplicate live regions");
  assert.match(sharedScript, /<h2 tabindex="-1"/);
  assert.equal([...sharedScript.matchAll(/<button type="button" data-journey=/g)].length, 3);
  assert.doesNotMatch(html, /<textarea/);
});

test("existing CI covers entry paths and runs protocol regression only once", () => {
  const workflow = fs.readFileSync(path.join(root, "../.github/workflows/wd-protocol.yml"), "utf8");
  for (const path of ["entry/**", "index.html", "CNAME", "pages/**", "counter.html", "table.html", "store.html", "movement.html", "foundation.html", "emotional-periodic-table.html"]) {
    assert.equal(workflow.split(`- '${path}'`).length - 1, 2);
  }
  assert.match(workflow, /node-version: 22/);
  assert.match(workflow, /node --check entry\/js\/identity-engine.js/);
  assert.match(workflow, /node --test entry\/tests\/identity-engine.test.js tools\/wd-protocol\/triage.test.mjs/);
  assert.equal(workflow.split("triage.test.mjs").length - 1, 1);
});

const roomPages = [
  "counter.html", "table.html", "store.html", "movement.html", "foundation.html",
  "pages/identity-law.html", "pages/donor.html", "emotional-periodic-table.html"
];

test("maintained rooms load one shared local experience with working return links and original content", () => {
  for (const name of roomPages) {
    const file = path.join(root, "..", name);
    const source = fs.readFileSync(file, "utf8");
    assert.equal((source.match(/data-local-journey/g) || []).length, 1, name);
    assert.equal((source.match(/src="[^"]*local-journey.js"/g) || []).length, 1, name);
    assert.match(source, /href="[^"]*entry\/"/, name);
    assert.match(source, /href="[^"]*entry\/status.html"/, name);
    assert.doesNotMatch(source, /(?:href|src)="(?:https?:|\/\/)/i, `${name}: unverified outbound destination must not be enabled`);
    for (const [, target] of source.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/^(?:[a-z]+:|\/\/)/i.test(target)) continue;
      const resolved = path.resolve(path.dirname(file), target);
      assert.equal(fs.existsSync(resolved), true, `${name}: ${target}`);
      if (fs.statSync(resolved).isDirectory()) {
        assert.equal(fs.existsSync(path.join(resolved, "index.html")), true, target);
      }
    }
    const page = createPage(Math, false, name === "store.html");
    assert.equal(page.journeyExperience.hidden, true);
    page.journeyStart.click();
    assert.equal(page.journeyExperience.hidden, false);
    for (let step = 0; step < 3; step += 1) {
      page.journeyButtons[step].click();
      assert.ok(page.journeyPrompt.textContent);
      page.journeyNext.click();
    }
    assert.match(page.journeyMessage.textContent, /journey is complete/);
    page.journeyRestart.click();
    page.journeySkip.click();
    assert.match(page.journeyMessage.textContent, /Journey skipped|Whispers dismissed/);
  }
  assert.match(fs.readFileSync(path.join(root, "../store.html"), "utf8"), /opening soon/);
  assert.match(fs.readFileSync(path.join(root, "../pages/donor.html"), "utf8"), /No payment or provider service is activated/);
});

test("store whispers reveal curated branch ideas, dismiss safely, and exhaust without simulated live trends", () => {
  const page = createPage(Math, false, true);
  assert.equal(page.journeyHeading.textContent, "Optional store whispers");
  assert.equal(page.journeyStart.textContent, "Reveal curated store whispers");
  assert.equal(page.journeySkip.textContent, "Dismiss whispers");
  page.journeyStart.click();
  const prompts = [];
  for (let theme = 0; theme < 3; theme += 1) {
    for (let step = 0; step < 3; step += 1) {
      page.journeyButtons[theme].click();
      const prompt = page.journeyPrompt.textContent;
      assert.match(prompt, /Curated|Possible gap to review later/);
      assert.match(prompt, /No |not |no /);
      prompts.push(prompt);
      page.journeyNext.click();
    }
    if (theme < 2) {
      page.journeyRestart.click();
      page.journeySkip.click();
      assert.match(page.journeyMessage.textContent, /Whispers dismissed/);
      assert.equal(page.journeyPrompt.textContent, "");
      page.journeyRestart.click();
    }
  }
  assert.equal(new Set(prompts).size, 9);
  assert.equal(page.journeyRestart.hidden, true);
  const store = fs.readFileSync(path.join(root, "../store.html"), "utf8");
  assert.match(store, /opening soon/);
  assert.match(store, /not live trend detection/);
  assert.match(store, /Future live\s+inputs would require explicit configuration and review/);
});

test("each emotional table selection reveals its actual description through native buttons without side effects", () => {
  const table = fs.readFileSync(path.join(root, "../emotional-periodic-table.html"), "utf8");
  const inlineScript = [...table.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];
  const grid = makeElement();
  const selection = makeElement();
  const document = {
    createElement: tag => makeElement({}, tag),
    getElementById: id => ({ emotionGrid: grid, emotionSelection: selection })[id]
  };
  const context = vm.createContext({ document });
  for (const api of ["fetch", "XMLHttpRequest", "localStorage", "sessionStorage", "location", "navigator", "indexedDB"]) {
    Object.defineProperty(context, api, { get() { throw new Error(`Unexpected use of ${api}`); } });
  }
  vm.runInContext(inlineScript, context);
  const emotions = vm.runInContext("emotions", context);
  assert.ok(emotions.length >= 100);
  assert.equal(grid.children.length, emotions.length);
  grid.children.forEach((card, index) => {
    assert.equal(card.tagName, "button");
    assert.equal(card.type, "button");
    assert.equal(card.children[0].textContent, emotions[index].name);
    assert.equal(card.children[1].textContent, emotions[index].desc);
    card.click();
    assert.equal(selection.textContent, `${emotions[index].name}: ${emotions[index].desc} This is a reflection description, not a diagnosis or treatment.`);
    assert.equal(selection.focused, true);
    assert.equal(grid.children.filter(button => button.attributes["aria-pressed"] === "true").length, 1);
    assert.equal(card.attributes["aria-pressed"], "true");
  });
  assert.match(table, /id="emotionSelection" role="status" aria-live="polite" tabindex="-1"/);
});

test("business support boundaries and unavailable legacy destinations remain explicit", () => {
  for (const name of ["store.html", "foundation.html", "pages/donor.html"]) {
    const source = fs.readFileSync(path.join(root, "..", name), "utf8");
    assert.match(source, /Whole Donuts LLC is a business, not a nonprofit charity/);
    assert.match(source, /not a tax-deductible charitable donation, purchase, investment, or automatic reward/);
    assert.match(source, /No verified payment channel or checkout is active here/);
  }
  for (const name of ["counter.html", "store.html", "foundation.html"]) {
    const source = fs.readFileSync(path.join(root, "..", name), "utf8");
    assert.match(source, /thenurturedchef.com/);
    assert.match(source, /unavailable pending destination/);
    assert.doesNotMatch(source, /href="https:\/\/thenurturedchef.com/);
  }
  const donor = fs.readFileSync(path.join(root, "../pages/donor.html"), "utf8");
  assert.match(donor, /Cash App \+ Chime — unavailable/);
  assert.match(donor, /Chase Business — unavailable/);
  assert.match(donor, /plans, not verified live programs/);
  assert.doesNotMatch(fs.readFileSync(path.join(root, "../movement.html"), "utf8"), /href="donations\/"/);
});

test("room content is visible without scripts and reduced-motion users do not receive fade animation", () => {
  const style = fs.readFileSync(path.join(root, "../pages/style.css"), "utf8");
  const motion = fs.readFileSync(path.join(root, "../pages/motion.js"), "utf8");
  assert.match(style, /\.fade\s*\{\s*opacity: 1;\s*transform: none;/);
  assert.match(style, /@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.fade.visible \{ animation: none;/);
  assert.doesNotThrow(() => vm.runInNewContext(motion, {}), "no observer support must not hide content or throw");
  vm.runInNewContext(motion, {
    matchMedia: () => ({ matches: true }),
    IntersectionObserver: function () { throw new Error("Reduced motion must not initialize animation"); }
  });
  const fader = makeElement();
  const observed = [];
  const unobserved = [];
  let callback;
  const context = {
    matchMedia: () => ({ matches: false }),
    document: { querySelectorAll: () => [fader] },
    IntersectionObserver: class {
      constructor(handler) { callback = handler; }
      observe(element) { observed.push(element); }
      unobserve(element) { unobserved.push(element); }
    }
  };
  vm.runInNewContext(motion, context);
  assert.deepEqual(observed, [fader]);
  const observer = { unobserve: element => unobserved.push(element) };
  callback([{ target: fader, isIntersecting: false }], observer);
  assert.equal(fader.classList.contains("visible"), false);
  callback([{ target: fader, isIntersecting: true }], observer);
  assert.equal(fader.classList.contains("visible"), true);
  assert.deepEqual(unobserved, [fader]);
});
