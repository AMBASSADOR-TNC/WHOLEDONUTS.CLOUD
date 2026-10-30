if (typeof IntersectionObserver === "function" &&
    typeof matchMedia === "function" &&
    !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const appearOnScroll = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.2, rootMargin: "0px 0px -50px 0px" });

  document.querySelectorAll(".fade").forEach(fader => {
    appearOnScroll.observe(fader);
  });
}
