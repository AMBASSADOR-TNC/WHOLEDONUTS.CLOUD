// Shared, in-memory discoveries. Restart never refills a visit's prompt collection.
const localJourneys = new Map();

document.querySelectorAll("[data-local-journey]").forEach((container, instance) => {
  const storeWhispers = container.dataset.localJourney === "store-whispers";
  const activities = storeWhispers ? {
    notice: [
      "Curated design idea: consider whether a future product page could explain its materials more clearly. No inventory or customer data has been checked.",
      "Curated accessibility idea: imagine a future store with readable sizing and strong contrast. This is a design prompt, not a finding from an audit.",
      "Curated navigation idea: sketch a simpler route from a collection to its details. There is no checkout to test here yet."
    ],
    imagine: [
      "Curated collection idea: imagine a small black-and-white +U series. This is not a product announcement or a live trend.",
      "Curated storytelling idea: picture a future item with a short note about its creative inspiration. No item or stock is being offered.",
      "Curated display idea: imagine showing one design in several everyday settings. This does not imply those variants are available."
    ],
    reflect: [
      "Possible gap to review later: could future visitors find care instructions easily? This is a question, not a verified missed opportunity.",
      "Possible gap to review later: would a clear opening-status note help someone exploring? No demand, sales, or revenue has been measured.",
      "Possible gap to review later: could a future collection explain who made it and why? This is a curated question, not personalized monitoring."
    ]
  } : {
    notice: [
      "If you like, find three different shapes around you. Which one caught your attention first?",
      "Look for a small detail you had not noticed before: an edge, a pattern, or a patch of light.",
      "Choose an object nearby and silently notice one texture or color. There is nothing to report."
    ],
    imagine: [
      "Imagine your +U figure finding a tiny doorway. Picture what might be on the other side.",
      "Invent a friendly name for an imaginary cloud. Keep it to yourself, or simply picture its shape.",
      "Picture a bridge made from an unexpected material. Where would you choose to place it?"
    ],
    reflect: [
      "Think of one ordinary thing you appreciated recently. You do not need to explain or share it.",
      "Choose a word in your mind for the pace you would like next: slow, steady, or playful.",
      "Imagine leaving yourself a kind two-word note. You can keep it private or let the idea pass."
    ]
  };
  const remaining = Object.fromEntries(
    Object.entries(activities).map(([theme, prompts]) => [theme, [...prompts]])
  );
  const panel = document.createElement("div");
  panel.innerHTML = `
    <h2 tabindex="-1" id="journey-heading-${instance}">Your optional +U discoveries</h2>
    <p>Three small discoveries, at your pace. Choose any direction or skip at any time.
      Nothing is sent or saved. These are optional creative and reflection activities,
      not treatment, a purchase, or activation of a service.</p>
    <button type="button" data-action="start">Start a local discovery</button>
    <div data-part="experience" hidden>
      <p data-part="message" role="status" aria-live="polite" aria-atomic="true"></p>
      <p data-part="prompt"></p>
      <div data-part="choices" class="journey-controls">
        <button type="button" data-journey="notice">Notice something</button>
        <button type="button" data-journey="imagine">Imagine something</button>
        <button type="button" data-journey="reflect">Reflect quietly</button>
      </div>
      <div class="journey-controls">
        <button type="button" data-action="next" hidden>Explore the next choice</button>
        <button type="button" data-action="restart" hidden>Start another short journey</button>
        <button type="button" data-action="skip">Skip journey and keep exploring</button>
      </div>
      <p>Your other page choices and return links remain available.</p>
    </div>`;
  container.appendChild(panel);
  container.setAttribute("aria-labelledby", `journey-heading-${instance}`);
  const heading = panel.querySelector("h2");
  const startButton = panel.querySelector('[data-action="start"]');
  const experience = panel.querySelector('[data-part="experience"]');
  const message = panel.querySelector('[data-part="message"]');
  const prompt = panel.querySelector('[data-part="prompt"]');
  const choices = panel.querySelector('[data-part="choices"]');
  const buttons = Array.from(panel.querySelectorAll("[data-journey]"));
  const next = panel.querySelector('[data-action="next"]');
  const restart = panel.querySelector('[data-action="restart"]');
  const skip = panel.querySelector('[data-action="skip"]');
  if (storeWhispers) {
    heading.textContent = "Optional store whispers";
    startButton.textContent = "Reveal curated store whispers";
    skip.textContent = "Dismiss whispers";
    const labels = ["Explore design", "Imagine a collection", "Consider a possible gap"];
    buttons.forEach((button, index) => { button.textContent = labels[index]; });
  }
  let phase = "idle";
  let stops = 0;

  function hasActivities() {
    return Object.values(remaining).some(prompts => prompts.length > 0);
  }

  function finish(skipped = false) {
    phase = "finished";
    choices.hidden = true;
    next.hidden = true;
    skip.hidden = true;
    restart.hidden = !hasActivities();
    message.textContent = skipped
      ? (storeWhispers ? "Whispers dismissed. Your other page choices are still available."
        : "Journey skipped. Your other page choices are still available.")
      : "This short journey is complete. You can keep exploring this page.";
    if (!hasActivities()) {
      message.textContent += " You have explored all nine activities for this visit; no prompts will repeat.";
    }
    prompt.textContent = "";
    (restart.hidden ? heading : restart).focus();
  }

  function offerChoices() {
    phase = "choosing";
    choices.hidden = false;
    next.hidden = true;
    restart.hidden = true;
    skip.hidden = false;
    prompt.textContent = "";
    message.textContent = `Discovery ${stops + 1} of 3: which direction would you like to uncover?`;
    buttons.forEach(button => {
      button.disabled = remaining[button.dataset.journey].length === 0;
    });
  }

  function start() {
    container.hidden = false;
    startButton.hidden = true;
    experience.hidden = false;
    stops = 0;
    if (!hasActivities()) {
      finish();
      return;
    }
    offerChoices();
    heading.focus();
  }

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      if (phase !== "choosing") return;
      const prompts = remaining[button.dataset.journey];
      if (prompts.length === 0) return;
      const index = Math.floor(Math.random() * prompts.length);
      prompt.textContent = prompts.splice(index, 1)[0];
      stops += 1;
      phase = "activity";
      message.textContent = `Discovery ${stops} of 3. Try this only if you like; no response is needed.`;
      choices.hidden = true;
      next.hidden = false;
      next.textContent = stops === 3 || !hasActivities()
        ? "Finish this journey" : "Explore the next choice";
      next.focus();
    });
  });
  next.addEventListener("click", () => {
    if (phase !== "activity") return;
    if (stops === 3 || !hasActivities()) {
      finish();
    } else {
      offerChoices();
      buttons.find(button => !button.disabled).focus();
    }
  });
  restart.addEventListener("click", () => {
    if (phase === "finished" && hasActivities()) start();
  });
  skip.addEventListener("click", () => {
    if (phase === "choosing" || phase === "activity") finish(true);
  });
  startButton.addEventListener("click", () => {
    if (phase === "idle") start();
  });
  localJourneys.set(container, { start });
});
