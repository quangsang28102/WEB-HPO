/* Entrance and scroll-linked parallax for the opening image hero. */
(() => {
  const hero = document.querySelector('.homepage-cover-hero');
  if (!hero) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;

  const clamp = (value) => Math.max(0, Math.min(1, value));
  const easeIn = (value) => value * value;

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
    const progress = clamp(-rect.top / Math.max(1, rect.height * 0.78));
    const exit = easeIn(progress);

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
