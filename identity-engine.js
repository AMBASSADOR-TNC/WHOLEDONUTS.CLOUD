
// Identity Engine – Whole Donuts
// Pot of Positivity + Four Unified Figures

(function () {
  const pot = document.getElementById("pot");
  const figuresRow = document.getElementById("figuresRow");
  if (!pot || !figuresRow) return;

  const figures = Array.from(figuresRow.querySelectorAll(".figure"));

  let activeIndex = 0;
  let lockedIndex = null;

  function setActive(index) {
    figures.forEach((fig, i) => {
      fig.classList.toggle("active", i === index);
    });
  }

  // Initialize
  setActive(activeIndex);

  // Hover over Pot of Positivity → move focus between figures
  pot.addEventListener("mousemove", (e) => {
    if (lockedIndex !== null) return;

    const rect = pot.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;

    const idx = Math.min(
      figures.length - 1,
      Math.max(0, Math.floor(relX * figures.length))
    );

    if (idx !== activeIndex) {
      activeIndex = idx;
      setActive(activeIndex);
    }
  });

  // Leave pot → keep current or locked figure
  pot.addEventListener("mouseleave", () => {
    if (lockedIndex !== null) {
      setActive(lockedIndex);
    } else {
      setActive(activeIndex);
    }
  });

  // Click pot → lock current figure
  pot.addEventListener("click", () => {
    lockedIndex = activeIndex;
  });

  // Click figure → lock that figure
  figures.forEach((fig, i) => {
    fig.addEventListener("click", () => {
      lockedIndex = i;
      activeIndex = i;
      setActive(i);
    });
  });
})();
