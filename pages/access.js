// Access bar for every page: works for every ability. Choices live only in this page's memory.
// Read aloud uses the device's own voice; nothing is sent anywhere.
(function () {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  const options = [
    { key: "big", label: "Bigger text" },
    { key: "contrast", label: "High contrast" },
    { key: "calm", label: "Calm (no motion)" },
    { key: "spacing", label: "Easier reading" }
  ];

  const bar = document.createElement("nav");
  bar.className = "access-bar";
  bar.setAttribute("aria-label", "Access options");

  options.forEach(({ key, label }) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", () => {
      const on = !html.classList.contains("a11y-" + key);
      html.classList.toggle("a11y-" + key, on);
      b.setAttribute("aria-pressed", String(on));
    });
    bar.appendChild(b);
  });

  if ("speechSynthesis" in window) {
    const read = document.createElement("button");
    read.type = "button";
    read.textContent = "Read aloud";
    read.setAttribute("aria-pressed", "false");
    read.addEventListener("click", () => {
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
        read.textContent = "Read aloud";
        read.setAttribute("aria-pressed", "false");
        return;
      }
      const main = document.querySelector("main") || document.body;
      const text = main.innerText.replace(/\s+/g, " ").trim();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95;
      u.onend = () => { read.textContent = "Read aloud"; read.setAttribute("aria-pressed", "false"); };
      speechSynthesis.speak(u);
      read.textContent = "Stop reading";
      read.setAttribute("aria-pressed", "true");
    });
    bar.appendChild(read);
  }

  const target = document.querySelector("#engine, main, [role='main'], .hero, .section, h1");
  if (target && !target.id) target.id = "main-content";
  const skip = document.createElement("a");
  skip.href = "#" + (target ? target.id : "");
  skip.className = "skip-link";
  skip.textContent = "Skip to main content";

  document.body.prepend(bar);
  document.body.prepend(skip);
})();
