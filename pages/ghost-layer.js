// Ghosted background for every page of the journey.
// Quiet reminders only: it sits behind the page, never covers or changes content, cannot be clicked,
// is hidden from screen readers, stops in Calm mode or when the device asks for less motion,
// and steps aside in High contrast. Nothing is stored or sent.
(function () {
  const NS = "http://www.w3.org/2000/svg";

  // One drawing per idea. Red ring and slash = the classic "not here" sign.
  const SYMBOLS = {
    "no-judgement": '<circle cx="50" cy="50" r="42" fill="none" stroke="#c8102e" stroke-width="8"/>' +
      '<g fill="currentColor"><rect x="54" y="16" width="16" height="30" rx="3" transform="rotate(-45 62 31)"/>' +
      '<rect x="44.5" y="28" width="7" height="40" rx="3" transform="rotate(45 48 48)"/><rect x="54" y="70" width="26" height="8" rx="2"/></g>' +
      '<line x1="21" y1="21" x2="79" y2="79" stroke="#c8102e" stroke-width="8"/>',
    "no-money": '<circle cx="50" cy="50" r="42" fill="none" stroke="#c8102e" stroke-width="8"/>' +
      '<text x="50" y="68" text-anchor="middle" font-size="52" font-weight="700" font-family="system-ui,sans-serif" fill="currentColor">$</text>' +
      '<line x1="21" y1="21" x2="79" y2="79" stroke="#c8102e" stroke-width="8"/>',
    "no-faces": '<circle cx="50" cy="50" r="42" fill="none" stroke="#c8102e" stroke-width="8"/>' +
      '<g fill="none" stroke="currentColor" stroke-width="4"><circle cx="50" cy="50" r="22"/><path d="M40 57 q10 8 20 0"/></g>' +
      '<g fill="currentColor"><circle cx="42" cy="44" r="3"/><circle cx="58" cy="44" r="3"/></g>' +
      '<line x1="21" y1="21" x2="79" y2="79" stroke="#c8102e" stroke-width="8"/>',
    "pause": '<circle cx="50" cy="50" r="42" fill="none" stroke="#b36b00" stroke-width="8"/>' +
      '<g fill="currentColor"><rect x="36" y="32" width="9" height="36" rx="2"/><rect x="55" y="32" width="9" height="36" rx="2"/></g>',
    "plus": '<g fill="currentColor"><rect x="42" y="18" width="16" height="64" rx="4"/><rect x="18" y="42" width="64" height="16" rx="4"/></g>',
    "u": '<path d="M28 20 v36 a22 22 0 0 0 44 0 v-36" fill="none" stroke="currentColor" stroke-width="12" stroke-linecap="round"/>',
    "plus-u": '<g fill="currentColor"><rect x="14" y="40" width="8" height="28" rx="2"/><rect x="4" y="50" width="28" height="8" rx="2"/></g>' +
      '<path d="M46 30 v26 a18 18 0 0 0 36 0 v-26" fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round"/>',
    // Hands held together, cupped, with crumbs and a + spilling over the edge.
    "hands": '<g fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">' +
      // left hand, palm up: fingers to the left, thumb toward the middle
      '<path d="M50 84 C34 84 16 76 8 62 M8 62 l-2 -6 M14 68 l-6 -8 M20 72 l-5 -9 M50 84 C46 72 42 66 34 62 l-6 -2"/>' +
      // right hand, mirrored, held against the left
      '<path d="M50 84 C66 84 84 76 92 62 M92 62 l2 -6 M86 68 l6 -8 M80 72 l5 -9 M50 84 C54 72 58 66 66 62 l6 -2"/></g>' +
      // what they hold spills over: crumbs and a +
      '<g fill="currentColor"><circle cx="40" cy="56" r="4.5"/><circle cx="55" cy="52" r="5"/><circle cx="64" cy="58" r="3.5"/>' +
      '<circle cx="96" cy="72" r="2.5"/><circle cx="4" cy="74" r="2.5"/><circle cx="98" cy="84" r="2"/>' +
      '<rect x="46" y="24" width="7" height="22" rx="1.5"/><rect x="38.5" y="31.5" width="22" height="7" rx="1.5"/></g>',
    "arrow": '<path d="M14 50 h56 M54 30 l22 20 l-22 20" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>',
    // Stick figures for the silent loop: emotions, personas, directions, diversity, rising beyond.
    "figure-calm": figure('<path d="M50 40 l-16 18 M50 40 l16 18"/>'),
    "figure-hope": figure('<path d="M50 40 l-18 -14 M50 40 l18 -14"/>'),
    "figure-cane": figure('<path d="M50 40 l-14 16 M50 40 l14 12 l2 40"/>'),
    "figure-chair": '<g fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"><circle cx="46" cy="18" r="8"/>' +
      '<path d="M46 26 v24 h20 v22 M46 36 l14 8"/><circle cx="46" cy="74" r="16"/><path d="M30 50 h4"/></g>',
    "figure-rise": figure('<path d="M50 40 l-20 -18 M50 40 l20 -18"/>') ,
    "figure-together": '<g fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round">' +
      '<circle cx="30" cy="16" r="7"/><circle cx="70" cy="16" r="7"/><path d="M30 23 v32 M70 23 v32 M30 32 l20 10 l20 -10 M30 55 l-8 26 M30 55 l8 26 M70 55 l-8 26 M70 55 l8 26"/></g>'
  };

  function figure(arms) {
    return '<g fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"><circle cx="50" cy="16" r="8"/>' +
      '<path d="M50 24 v38 M50 62 l-12 26 M50 62 l12 26"/>' + arms + "</g>";
  }

  // Only where it makes sense: each page names which reminders belong to it.
  const PAGES = {
    home: ["no-judgement", "no-money", "no-faces", "hands", "plus", "u", "arrow", "plus-u"],
    table: ["no-judgement", "no-money", "hands", "plus", "u"],
    counter: ["no-judgement", "pause", "hands", "arrow"],
    path: ["pause", "no-judgement", "hands", "figure-rise"],
    guide: ["no-money", "no-faces", "plus-u", "hands"],
    // pages that ask for support or sell things: no "No $" sign there, it would not make sense
    store: ["no-judgement", "hands", "plus", "u"],
    foundation: ["no-judgement", "hands", "plus-u", "arrow"],
    feelings: ["no-judgement", "hands", "plus", "u"]
  };
  const LOOP = ["figure-calm", "figure-hope", "figure-cane", "figure-chair", "arrow", "figure-together", "figure-rise", "plus-u"];

  // Spots kept near the edges so the reminders frame the page instead of sitting under the reading line.
  const SPOTS = [[4, 12], [84, 8], [6, 46], [88, 40], [3, 78], [86, 74], [44, 92], [70, 22], [20, 26], [62, 60]];

  function build(page) {
    const names = PAGES[page] || PAGES.home;
    const layer = document.createElement("div");
    layer.className = "ghost-layer";
    layer.setAttribute("aria-hidden", "true");
    names.forEach(function (name, i) {
      const spot = SPOTS[i % SPOTS.length];
      layer.appendChild(item(name, spot[0], spot[1], i));
    });
    const loop = item(LOOP[0], 74, 52, names.length);
    loop.classList.add("ghost-loop");
    layer.appendChild(loop);
    return { layer: layer, loop: loop };
  }

  function item(name, x, y, i) {
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("class", "ghost-item ghost-" + name);
    svg.setAttribute("focusable", "false");
    svg.style.left = x + "vw";
    svg.style.top = y + "vh";
    svg.style.animationDelay = (-i * 3.7) + "s";
    svg.innerHTML = SYMBOLS[name];
    svg.dataset.symbol = name;
    return svg;
  }

  function stillWanted() {
    const html = document.documentElement;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return !reduce && !html.classList.contains("a11y-calm");
  }

  function start() {
    const page = document.body.getAttribute("data-ghost") || "home";
    const built = build(page);
    document.body.insertBefore(built.layer, document.body.firstChild);
    let step = 0;
    setInterval(function () {
      if (!stillWanted()) return;
      step = (step + 1) % LOOP.length;
      built.loop.innerHTML = SYMBOLS[LOOP[step]];
      built.loop.dataset.symbol = LOOP[step];
    }, 5000);
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { SYMBOLS: SYMBOLS, PAGES: PAGES, LOOP: LOOP };
  }
  if (typeof document === "undefined") return;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
