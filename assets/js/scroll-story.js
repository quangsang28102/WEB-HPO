/* Native scroll story: the training car leads into the awards journey. */
(() => {
  const hero = document.querySelector('.hpo-digital-hero');
  const company = document.querySelector('.company-slider');
  const awards = document.getElementById('awardSlider');
  if (!hero || !company || !awards) return;
  const video = hero.querySelector('video');
  const companyTrack = company.querySelector('.company-slider-track');
  const desktop = matchMedia('(min-width: 1100px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)');
  const slideCount = awards.querySelectorAll('.award-slider__dots button').length;
  const companyHome = document.createComment('Company banner position');
  const awardsHome = document.createComment('Awards position');
  company.before(companyHome);
  awards.before(awardsHome);
  const runway = document.createElement('div');
  runway.className = 'award-story car-story';
  const pin = document.createElement('div');
  pin.className = 'award-story__pin';
  const hint = document.createElement('p');
  hint.className = 'award-story__hint';
  const transition = document.createElement('div');
  transition.className = 'hero-car-transition';
  transition.setAttribute('aria-hidden', 'true');
  const trail = document.createElement('span');
  trail.className = 'hero-car-transition__trail';
  const car = document.createElement('img');
  car.className = 'hero-car-transition__car';
  car.src = new URL('assets/images/courses/carImage.png', document.baseURI).href;
  car.alt = '';
  transition.append(trail, car);
  let enabled = false, frame = 0, distance = 1, introDistance = 1, top = 88;
  let frozen = false, showingAwards = false;
  const clamp = value => Math.max(0, Math.min(1, value));
  const smooth = value => { const x = clamp(value); return x * x * (3 - 2 * x); };

  function freezeVideo(freeze) {
    if (!video || frozen === freeze) return;
    frozen = freeze;
    if (freeze) {
      video.dataset.scrollFrozen = 'true';
      video.pause();
    } else {
      delete video.dataset.scrollFrozen;
      if (!hero.inert && !document.hidden) video.play().catch(() => {});
    }
  }
  function update() {
    frame = 0;
    if (!enabled) return;
    const travel = Math.max(0, top - runway.getBoundingClientRect().top);
    const intro = clamp(travel / introDistance);
    const carTravel = smooth(intro / 0.95);
    const awardsEntrance = smooth((intro - 0.22) / 0.7);
    const titleEntrance = smooth((intro - 0.26) / 0.36);
    const frameEntrance = smooth((intro - 0.4) / 0.46);
    const transitionFade = smooth((intro - 0.72) / 0.22);
    const nextAwards = intro >= 0.68;
    if (intro > 0 && companyTrack.scrollLeft > 1) companyTrack.scrollTo({ left: 0, behavior: 'instant' });
    freezeVideo(intro > 0.001);
    if (nextAwards !== showingAwards) {
      showingAwards = nextAwards;
      runway.classList.toggle('is-showing-awards', showingAwards);
      company.inert = showingAwards;
      awards.inert = !showingAwards;
    }
    hint.textContent = showingAwards
      ? 'Cuộn để khám phá hành trình · Cuộn ngược để xem lại'
      : 'Cuộn xuống để khám phá dấu ấn Hiệp Phát';
    runway.style.setProperty('--awards-intro-y', `${(1 - awardsEntrance) * innerHeight * 0.82}px`);
    runway.style.setProperty('--award-title-opacity', String(titleEntrance));
    runway.style.setProperty('--award-title-y', `${(1 - titleEntrance) * 56}px`);
    runway.style.setProperty('--award-frame-opacity', String(frameEntrance));
    runway.style.setProperty('--award-frame-y', `${(1 - frameEntrance) * 90}px`);
    runway.style.setProperty('--company-intro-y', `${intro * -90}px`);
    runway.style.setProperty('--company-intro-opacity', String(1 - smooth((intro - 0.38) / 0.45)));
    const carWidth = Math.min(430, innerWidth * 0.32);
    const carX = -carWidth * 1.05 + carTravel * (innerWidth + carWidth * 1.15);
    transition.style.setProperty('--car-x', `${carX}px`);
    transition.style.setProperty('--car-y', `${innerHeight * (0.58 - carTravel * 0.08)}px`);
    transition.style.setProperty('--trail-y', `${innerHeight * (0.58 - carTravel * 0.08) + carWidth * 0.28}px`);
    transition.style.setProperty('--car-width', `${carWidth}px`);
    transition.style.setProperty('--trail-width', `${Math.max(0, carX + carWidth * 0.55)}px`);
    transition.style.setProperty('--curtain-edge', `${carTravel * 112 - 6}%`);
    transition.style.setProperty('--car-tilt', `${(0.5 - carTravel) * 2.5}deg`);
    transition.style.opacity = String(clamp(intro / 0.04) * (1 - transitionFade));
    transition.style.visibility = intro > 0 && intro < 0.98 ? 'visible' : 'hidden';
    const progress = clamp((travel - introDistance) / distance);
    awards.dispatchEvent(new CustomEvent('award-story-progress', { detail: { enabled: true, progress } }));
    awards.style.setProperty('--story-background-drift', `${(progress - 0.5) * 50}px`);
  }
  function requestUpdate() {
    if (enabled && !frame) frame = requestAnimationFrame(update);
  }
  function measure() {
    if (!enabled) return;
    const nav = document.getElementById('navbar');
    top = Math.max(24, (nav?.getBoundingClientRect().height || 72) + 12);
    const available = Math.max(300, innerHeight - top - 48);
    const scale = Math.min(1, available / Math.max(1, awards.offsetHeight));
    const heroScale = Math.min(1, available / Math.max(1, company.offsetHeight));
    runway.style.setProperty('--story-top', `${top}px`);
    runway.style.setProperty('--story-scale', String(scale));
    runway.style.setProperty('--hero-frame-scale', String(heroScale));
    runway.style.setProperty('--story-frame-height', `${available}px`);
    introDistance = innerHeight * 1.6;
    distance = Math.max(1, slideCount - 1) * innerHeight * 0.55;
    runway.style.height = `${introDistance + distance + innerHeight - top}px`;
    requestUpdate();
  }
  function configure() {
    if (enabled === desktop.matches) { measure(); return; }
    enabled = desktop.matches;
    document.body.classList.toggle('has-scroll-story', enabled);
    awards.classList.toggle('is-scroll-story', enabled);
    if (enabled) {
      companyHome.after(runway);
      runway.append(pin);
      pin.append(company, awards, hint);
      document.body.append(transition);
      showingAwards = false;
      runway.classList.remove('is-showing-awards');
      awards.inert = true;
      measure();
    } else {
      companyHome.after(company);
      awardsHome.after(awards);
      runway.remove();
      transition.remove();
      company.inert = false;
      awards.inert = false;
      freezeVideo(false);
      awards.dispatchEvent(new CustomEvent('award-story-progress', { detail: { enabled: false } }));
    }
  }
  awards.addEventListener('award-story-navigate', event => {
    if (!enabled) return;
    const fraction = event.detail.index / Math.max(1, slideCount - 1);
    window.scrollTo({ top: scrollY + runway.getBoundingClientRect().top - top + introDistance + fraction * distance, behavior: 'smooth' });
  });
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', measure);
  desktop.addEventListener('change', configure);
  const sizes = new ResizeObserver(measure);
  sizes.observe(awards);
  sizes.observe(company);
  configure();
})();
