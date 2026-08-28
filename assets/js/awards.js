/* Detailed awards banner slider */
(() => {
  const slider = document.getElementById('awardSlider');
  if (!slider) return;

  const track = slider.querySelector('.award-slider__track');
  const viewport = slider.querySelector('.award-slider__viewport');
  const slides = [...slider.querySelectorAll('.award-slide')];
  const dots = [...slider.querySelectorAll('.award-slider__dots button')];
  const prev = slider.querySelector('.award-slider__prev');
  const next = slider.querySelector('.award-slider__next');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const DURATION = 6500;
  let current = 0;
  let timer = null;
  let pointerStartX = null;
  let pointerStartTime = 0;
  let pointerId = null;
  let dragged = false;
  let physicalPosition = 1;
  let boundaryReset = null;
  let paused = false;

  if (!track || !viewport || slides.length < 2 || !prev || !next) return;

  const firstClone = slides[0].cloneNode(true);
  const lastClone = slides[slides.length - 1].cloneNode(true);
  [firstClone, lastClone].forEach((clone) => {
    clone.classList.remove('is-active');
    clone.setAttribute('aria-hidden', 'true');
    clone.setAttribute('tabindex', '-1');
    clone.removeAttribute('data-img-open-group');
    clone.querySelectorAll('[data-img-group]').forEach((el) => {
      el.removeAttribute('data-img-group');
    });
    if ('inert' in clone) clone.inert = true;
  });
  track.prepend(lastClone);
  track.append(firstClone);

  const setTrackPosition = (position, animate = true) => {
    physicalPosition = position;
    if (!animate) track.style.transition = 'none';
    track.style.transform = `translate3d(-${position * 100}%, 0, 0)`;
    if (!animate) {
      void track.offsetWidth;
      track.style.transition = '';
    }
  };

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

  const goTo = (index, animate = true) => {
    boundaryReset = null;
    if (index < 0) {
      current = slides.length - 1;
      boundaryReset = slides.length;
      physicalPosition = 0;
    } else if (index >= slides.length) {
      current = 0;
      boundaryReset = 1;
      physicalPosition = slides.length + 1;
    } else {
      current = index;
      physicalPosition = current + 1;
    }
    slider.classList.toggle(
      'is-asean-pair',
      slides[current].classList.contains('award-slide--asean-custom')
    );
    slider.classList.toggle(
      'is-global-pair',
      slides[current].classList.contains('award-slide--global-custom')
    );
    setTrackPosition(physicalPosition, animate);

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

  track.addEventListener('transitionend', (event) => {
    if (event.propertyName !== 'transform' || boundaryReset === null) return;
    const resetPosition = boundaryReset;
    boundaryReset = null;
    setTrackPosition(resetPosition, false);
  });

  const setPaused = (value) => {
    paused = value;
    schedule();
  };

  prev.addEventListener('click', () => goTo(current - 1));
  next.addEventListener('click', () => goTo(current + 1));
  dots.forEach((dot, index) => dot.addEventListener('click', () => goTo(index)));

  viewport.addEventListener('dragstart', (event) => event.preventDefault());
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
  viewport.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || event.target.closest('button')) return;
    pointerStartX = event.clientX;
    pointerStartTime = performance.now();
    pointerId = event.pointerId;
    dragged = false;
    window.clearTimeout(timer);
    slider.classList.remove('is-running');
    viewport.setPointerCapture(pointerId);
    viewport.classList.add('is-dragging');
  });
  viewport.addEventListener('pointermove', (event) => {
    if (pointerStartX === null || event.pointerId !== pointerId) return;
    const distance = event.clientX - pointerStartX;
    if (Math.abs(distance) > 8) dragged = true;
    track.style.transition = 'none';
    track.style.transform = `translate3d(calc(-${physicalPosition * 100}% + ${distance}px), 0, 0)`;
  });
  viewport.addEventListener('pointerup', (event) => {
    if (pointerStartX === null) return;
    const distance = event.clientX - pointerStartX;
    const elapsed = Math.max(performance.now() - pointerStartTime, 1);
    const velocity = Math.abs(distance) / elapsed;
    pointerStartX = null;
    pointerId = null;
    viewport.classList.remove('is-dragging');
    track.style.transition = '';
    if (Math.abs(distance) < 28 && velocity < 0.28) goTo(current);
    else goTo(current + (distance < 0 ? 1 : -1));
  });
  viewport.addEventListener('pointercancel', () => {
    pointerStartX = null;
    pointerId = null;
    viewport.classList.remove('is-dragging');
    track.style.transition = '';
    goTo(current);
  });
  viewport.addEventListener('click', (event) => {
    if (!dragged) return;
    event.preventDefault();
    event.stopPropagation();
    dragged = false;
  }, true);
  document.addEventListener('visibilitychange', schedule);
  reducedMotion.addEventListener('change', schedule);

  goTo(0, false);
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


