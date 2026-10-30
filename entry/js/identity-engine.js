// Simple state object to keep track of selections
const state = {
  base: null,
  presentEmotion: null,
  futureEmotion: null,
  gradYear: null
};

const welcomeMessages = [
  "Welcome to +U—choose the figure that feels right for this moment.",
  "At +U, every starting point belongs. Pick one of four figures to begin.",
  "Your path, your pace: explore the +U identity choices below.",
  "A small +U check-in starts with the figure you choose.",
  "Welcome in. +U makes room for many ways to show up.",
  "Take a moment with +U; choose any figure that fits today.",
  "Four figures, many stories—begin your +U check-in where you are.",
  "At +U, you can start simply: choose a figure and continue at your pace.",
  "There is no wrong place to begin. Choose a +U figure that feels comfortable.",
  "Your selection is yours. Start your +U check-in with any of the four figures."
];
const remainingWelcomeMessages = [...welcomeMessages];
const entryMessage = document.getElementById("entryMessage");

function showNextWelcomeMessage() {
  if (remainingWelcomeMessages.length === 0) return;

  const index = Math.floor(Math.random() * remainingWelcomeMessages.length);
  entryMessage.textContent = remainingWelcomeMessages.splice(index, 1)[0];
}

function selectCard(group, value) {
  const cards = document.querySelectorAll(group);
  cards.forEach(card => {
    if (card.dataset.base === value ||
        card.dataset.present === value ||
        card.dataset.future === value) {
      card.classList.add("selected");
    } else {
      card.classList.remove("selected");
    }
  });
}

// STEP 1: Base figure
document.querySelectorAll(".figure-card").forEach(card => {
  card.addEventListener("click", () => {
    if (state.base === card.dataset.base) return;

    state.base = card.dataset.base;
    selectCard(".figure-card", state.base);
    showNextWelcomeMessage();
  });
});

showNextWelcomeMessage();

// STEP 2: Present emotion
document.querySelectorAll("#present-emotions .emotion-card").forEach(card => {
  card.addEventListener("click", () => {
    state.presentEmotion = card.dataset.present;
    selectCard("#present-emotions .emotion-card", state.presentEmotion);
  });
});

// STEP 3: Future emotion
document.querySelectorAll("#future-emotions .emotion-card").forEach(card => {
  card.addEventListener("click", () => {
    state.futureEmotion = card.dataset.future;
    selectCard("#future-emotions .emotion-card", state.futureEmotion);
  });
});

// STEP 4: Grad year + local-only lane selection
const gradInput = document.getElementById("gradYear");
const routeButton = document.getElementById("routeButton");
const routeMessage = document.getElementById("routeMessage");

// Adjust this to current year dynamically
const currentYear = new Date().getFullYear();

routeButton.addEventListener("click", () => {
  const year = parseInt(gradInput.value, 10);
  state.gradYear = year;

  if (!state.base || !state.presentEmotion || !state.futureEmotion || !year) {
    routeMessage.textContent = "Finish all four steps first. Your +U identity needs all pieces.";
    return;
  }

  let lane;
  if (year >= currentYear) {
    lane = "youth";
  } else {
    lane = "adult";
  }

  routeMessage.textContent =
    `You selected the ${lane === "youth" ? "Youth" : "Adult"} lane locally. ` +
    "External routing is blocked until its destination is verified for launch.";
});
