/* Native scroll story: video circle wipe, then the awards journey. */
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
  runway.className = 'award-story circle-story';
  const pin = document.createElement('div');
  pin.className = 'award-story__pin';
  const hint = document.createElement('p');
  hint.className = 'award-story__hint';
  const wipe = document.createElement('div');
  wipe.className = 'hero-circle-wipe';
  wipe.setAttribute('aria-hidden', 'true');
  const snapshot = document.createElement('canvas');
  wipe.append(snapshot);
  let enabled = false, frame = 0, distance = 1, introDistance = 1, top = 88;
  let frozen = false, captured = false, showingAwards = false;
  const clamp = value => Math.max(0, Math.min(1, value));
  const smooth = value => { const x = clamp(value); return x * x * (3 - 2 * x); };

  function freezeVideo(freeze) {
    if (!video || frozen === freeze) return;
    frozen = freeze;
    if (freeze) {
      video.dataset.scrollFrozen = 'true';
      video.pause();
      if (video.readyState >= 2) {
        snapshot.width = video.videoWidth;
        snapshot.height = video.videoHeight;
        snapshot.getContext('2d').drawImage(video, 0, 0);
        captured = true;
      }
    } else {
      delete video.dataset.scrollFrozen;
      captured = false;
      if (!hero.inert && !document.hidden) video.play().catch(() => {});
    }
  }
  function update() {
    frame = 0;
    if (!enabled) return;
    const travel = Math.max(0, top - runway.getBoundingClientRect().top);
    const intro = clamp(travel / introDistance);
    const growing = smooth(intro / 0.65);
    const awardsEntrance = smooth((intro - 0.22) / 0.7);
    const reveal = smooth((intro - 0.52) / 0.42);
    const nextAwards = intro >= 0.72;
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
    runway.style.setProperty('--awards-intro-opacity', String(smooth((intro - 0.25) / 0.42)));
    runway.style.setProperty('--company-intro-y', `${intro * -90}px`);
    runway.style.setProperty('--company-intro-opacity', String(1 - smooth((intro - 0.38) / 0.45)));
    const rect = video.getBoundingClientRect();
    // The blue circuit circle occupies the left portion of the 886 × 582 video.
    const cx = rect.left + rect.width * 0.307;
    const cy = rect.top + rect.height * 0.5;
    const startRadius = rect.height * 0.44;
    const fullRadius = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy)) + 8;
    const radius = startRadius + (fullRadius - startRadius) * growing;
    wipe.style.clipPath = `circle(${radius}px at ${cx}px ${cy}px)`;
    wipe.style.opacity = String(clamp(intro / 0.06) * (1 - reveal));
    wipe.style.visibility = intro > 0 && intro < 1 ? 'visible' : 'hidden';
    snapshot.style.width = `${rect.width}px`;
    snapshot.style.height = `${rect.height}px`;
    snapshot.style.left = `${rect.left}px`;
    snapshot.style.top = `${rect.top}px`;
    snapshot.style.transformOrigin = '30.7% 50%';
    snapshot.style.transform = `scale(${radius / Math.max(1, startRadius)})`;
    snapshot.style.opacity = captured ? String(1 - smooth(growing / 0.8)) : '0';
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
      document.body.append(wipe);
      showingAwards = false;
      runway.classList.remove('is-showing-awards');
      awards.inert = true;
      measure();
    } else {
      companyHome.after(company);
      awardsHome.after(awards);
      runway.remove();
      wipe.remove();
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
  video?.addEventListener('loadeddata', () => { if (frozen && !captured) { frozen = false; requestUpdate(); } });
  configure();
})();
