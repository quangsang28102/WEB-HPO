/* Detailed awards banner slider */
(() => {
  const slider = document.getElementById('awardSlider');
  if (!slider) return;

  const track = slider.querySelector('.award-slider__track');
  const slides = [...slider.querySelectorAll('.award-slide')];
  const dots = [...slider.querySelectorAll('.award-slider__dots button')];
  const prev = slider.querySelector('.award-slider__prev');
  const next = slider.querySelector('.award-slider__next');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const DURATION = 6500;
  let current = 0;
  let timer = null;
  let pointerStartX = null;
  let paused = false;

  if (!track || slides.length < 2 || !prev || !next) return;

  const restartProgress = () => {
    slider.classList.remove('is-running');
    void slider.offsetWidth;
    if (!paused && !reducedMotion.matches && !document.hidden) {
      slider.classList.add('is-running');
    }
  };

  const schedule = () => {
    window.clearTimeout(timer);
    timer = null;
    restartProgress();
    if (paused || reducedMotion.matches || document.hidden) return;
    timer = window.setTimeout(() => goTo(current + 1), DURATION);
  };

  const goTo = (index) => {
    current = (index + slides.length) % slides.length;
    track.style.transform = `translate3d(-${current * 100}%, 0, 0)`;

    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === current;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', String(!active));
      if ('inert' in slide) slide.inert = !active;
    });

    dots.forEach((dot, dotIndex) => {
      const active = dotIndex === current;
      dot.classList.toggle('is-active', active);
      if (active) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });

    schedule();
  };

  const setPaused = (value) => {
    paused = value;
    schedule();
  };

  prev.addEventListener('click', () => goTo(current - 1));
  next.addEventListener('click', () => goTo(current + 1));
  dots.forEach((dot, index) => dot.addEventListener('click', () => goTo(index)));

  slider.addEventListener('mouseenter', () => setPaused(true));
  slider.addEventListener('mouseleave', () => setPaused(false));
  slider.addEventListener('focusin', () => setPaused(true));
  slider.addEventListener('focusout', (event) => {
    if (!slider.contains(event.relatedTarget)) setPaused(false);
  });
  slider.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goTo(current - 1);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goTo(current + 1);
    }
  });
  slider.addEventListener('pointerdown', (event) => {
    pointerStartX = event.clientX;
  });
  slider.addEventListener('pointerup', (event) => {
    if (pointerStartX === null) return;
    const distance = event.clientX - pointerStartX;
    pointerStartX = null;
    if (Math.abs(distance) < 45) return;
    goTo(current + (distance < 0 ? 1 : -1));
  });
  slider.addEventListener('pointercancel', () => { pointerStartX = null; });
  document.addEventListener('visibilitychange', schedule);
  reducedMotion.addEventListener('change', schedule);

  goTo(0);
})();

/* Mobile menu */
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');
const mobileClose = document.getElementById('mobileClose');
if (burger && mobileMenu && mobileClose) {
  function openMenu() { mobileMenu.classList.add('is-open'); document.body.style.overflow = 'hidden'; }
  function closeMenu() { mobileMenu.classList.remove('is-open'); document.body.style.overflow = ''; }
  burger.addEventListener('click', openMenu);
  mobileClose.addEventListener('click', closeMenu);
  mobileMenu.addEventListener('click', (e) => { if (e.target === mobileMenu) closeMenu(); });
  document.querySelectorAll('.mobile-menu-list a').forEach(a => a.addEventListener('click', closeMenu));
}


