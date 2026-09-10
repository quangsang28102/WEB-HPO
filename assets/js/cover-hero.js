/* Entrance and scroll-linked parallax for the opening image hero. */
(() => {
  const hero = document.querySelector('.homepage-cover-hero');
  if (!hero) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;

  const clamp = (value) => Math.max(0, Math.min(1, value));
  function update() {
    frame = 0;
    if (reducedMotion.matches) {
      hero.style.removeProperty('--cover-bg-shift');
      hero.style.removeProperty('--cover-car-x');
      hero.style.removeProperty('--cover-car-y');
      hero.style.removeProperty('--cover-car-scale');
      return;
    }

    const rect = hero.getBoundingClientRect();
    const scrolledThroughHero = Math.max(0, -rect.top);
    const transitionStart = rect.height * 0.65;
    const transitionDistance = Math.max(1, rect.height - transitionStart);
    const progress = clamp(
      (scrolledThroughHero - transitionStart) / transitionDistance,
    );
    // Keep the scene still until half of the hero has moved above the viewport.
    // After that point, map the remaining scroll distance directly to the exit.
    const exit = progress;

    hero.style.setProperty('--cover-scroll', progress.toFixed(4));
    hero.style.setProperty('--cover-bg-shift', `${progress * 90}px`);
    hero.style.setProperty('--cover-car-x', `${exit * -92}vw`);
    hero.style.setProperty('--cover-car-y', `${exit * -34}px`);
    hero.style.setProperty('--cover-car-scale', String(1 + exit * 0.06));
  }

  function requestUpdate() {
    if (!frame) frame = requestAnimationFrame(update);
  }

  requestAnimationFrame(() => {
    hero.classList.add('is-ready');
    update();
  });

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  reducedMotion.addEventListener('change', requestUpdate);
})();
