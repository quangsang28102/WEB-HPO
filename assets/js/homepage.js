/* HPO digital hero — replay animation chữ bên trái mỗi khi video lặp lại */
(function () {
  function replayTextAnimation(stage) {
    if (!stage) return;
    stage.classList.remove('is-playing');
    void stage.offsetWidth;
    stage.classList.add('is-playing');
  }
  var hero = document.querySelector('.hpo-digital-hero');
  if (!hero) return;
  var stage = hero.querySelector('.hpo-slide-stage');
  var video = hero.querySelector('.hpo-digital-video');
  replayTextAnimation(stage);
  if (!video) return;
  video.muted = true; video.loop = true; video.playsInline = true;
  function safePlay() {
    if (hero.inert || document.hidden) return;
    var p = video.play();
    if (p !== undefined) p.catch(function () { });
  }
  safePlay();
  var lastTime = 0;
  video.addEventListener('timeupdate', function () {
    if (video.currentTime < lastTime) replayTextAnimation(stage);
    lastTime = video.currentTime;
  });
  video.addEventListener('ended', function () {
    replayTextAnimation(stage);
    video.currentTime = 0; safePlay();
  });
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) safePlay();
  });
})();

/* Company banner: swipe navigation and replay entrance effects. */
(() => {
  const root = document.querySelector('.company-slider');
  if (!root) return;
  const track = root.querySelector('.company-slider-track');
  const slides = Array.from(track.children);
  const banner = root.querySelector('.company-banner');
  const sheet = root.querySelector('.company-banner-sheet');
  const video = root.querySelector('video');
  let active = 0;
  let visible = true;
  let pending = false;
  const AUTO_SLIDE_MS = 8000;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let autoTimer = null;
  let hovered = false;
  let touching = false;
  function scheduleAutoSlide() {
    clearTimeout(autoTimer);
    if (!visible || document.hidden || hovered || touching ||
        root.contains(document.activeElement) || reducedMotion.matches) return;
    autoTimer = setTimeout(() => {
      go(active + 1);
      scheduleAutoSlide();
    }, AUTO_SLIDE_MS);
  }
  function media() {
    if (!video) return;
    if (active === 0 && visible && !document.hidden) video.play().catch(() => {});
    else video.pause();
  }
  function update() {
    pending = false;
    active = Math.max(0, Math.min(slides.length - 1, Math.round(track.scrollLeft / track.clientWidth)));
    slides.forEach((slide, index) => {
      slide.inert = index !== active;
      slide.classList.toggle('is-active', index === active);
    });
    media();
    fitBanner();
  }
  function go(index) {
    const target = (index + slides.length) % slides.length;
    track.scrollTo({ left: target * track.clientWidth, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }
  root.querySelectorAll('[data-company-step]').forEach(button => button.addEventListener('click', () => go(active + Number(button.dataset.companyStep))));
  track.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    go(active + (event.key === 'ArrowRight' ? 1 : -1));
  });
  track.addEventListener('scroll', () => {
    scheduleAutoSlide();
    if (!pending) { pending = true; requestAnimationFrame(update); }
  }, { passive: true });
  root.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
      hovered = true;
      scheduleAutoSlide();
    }
  });
  root.addEventListener('pointerleave', () => { hovered = false; scheduleAutoSlide(); });
  root.addEventListener('pointerdown', () => { touching = true; scheduleAutoSlide(); });
  window.addEventListener('pointerup', () => { touching = false; scheduleAutoSlide(); });
  window.addEventListener('pointercancel', () => { touching = false; scheduleAutoSlide(); });
  root.addEventListener('focusin', scheduleAutoSlide);
  root.addEventListener('focusout', () => requestAnimationFrame(scheduleAutoSlide));
  reducedMotion.addEventListener('change', scheduleAutoSlide);
  let trackWidth = track.clientWidth;
  new ResizeObserver(() => {
    if (track.clientWidth === trackWidth) return;
    trackWidth = track.clientWidth;
    track.scrollTo({ left: active * trackWidth, behavior: 'instant' });
    fitBanner();
  }).observe(track);
  function fitBanner() {
    if (matchMedia('(max-width: 1000px)').matches) {
      banner.style.removeProperty('height');
      sheet.style.removeProperty('--company-scale');
      track.style.height = `${slides[active].offsetHeight}px`;
      return;
    }
    track.style.removeProperty('height');
    const height = slides[0].getBoundingClientRect().height;
    banner.style.height = `${height}px`;
    const style = getComputedStyle(banner);
    const available = height - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    sheet.style.setProperty('--company-scale', Math.min(1, available / sheet.offsetHeight));
  }
  const sizeObserver = new ResizeObserver(fitBanner);
  sizeObserver.observe(slides[0]);
  sizeObserver.observe(sheet);
  fitBanner();
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting && entry.intersectionRatio >= 0.25;
    media();
    scheduleAutoSlide();
  }, { threshold: [0, 0.25] }).observe(root);
  document.addEventListener('visibilitychange', () => { media(); scheduleAutoSlide(); });
  update();
})();

/* Course tier picker — tabs, vehicle swap, and price cycle */
(() => {
  const root = document.querySelector('.tier-pick');
  if (!root) return;

  const stage = root.querySelector('#courseTierStage');
  const tabs = root.querySelectorAll('.tier-tab');
  const valueEls = {
    base: root.querySelector('.rate-value[data-field="base"]'),
    promo: root.querySelector('.rate-value[data-field="promo"]'),
    local: root.querySelector('.rate-value[data-field="local"]'),
  };
  const rates = root.querySelector('.tier-rates-h');
  const carImage = root.querySelector('#courseCarImage');
  const truckImage = root.querySelector('#courseTruckImage');

  if (!stage || !tabs.length || !rates || !carImage || !truckImage || !valueEls.base || !valueEls.local) return;

  const PRICES = {
    bauto: { base: '<s>23.000.000đ</s>', promo: '18.000.000đ', local: '18.000.000đ' },
    bmanual: { base: '<s>23.000.000đ</s>', promo: '18.000.000đ', local: '18.000.000đ' },
    c1: { base: '<s>25.000.000đ</s>', promo: '20.000.000đ', local: '20.000.000đ' },
  };

  const STATES = ['bauto', 'bmanual', 'c1'];
  const CYCLE_MS = 3000;
  const MANUAL_HOLD_MS = 10000;

  let currentIndex = 0;
  let timer = null;
  let ratesAnimTimer = null;
  let visible = true;
  let isPaused = false;
  let previousMode = 'bauto';

  const isB = (mode) => mode === 'bauto' || mode === 'bmanual';

  function replayAnim(el, cls) {
    el.classList.remove('animate-pop', 'animate-swap-r', 'animate-swap-l');
    void el.offsetWidth;
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), 950);
  }

  function replayRatesAnim() {
    if (ratesAnimTimer) clearTimeout(ratesAnimTimer);
    rates.classList.remove('is-switching');
    void rates.offsetWidth;
    rates.classList.add('is-switching');
    ratesAnimTimer = setTimeout(() => {
      rates.classList.remove('is-switching');
      ratesAnimTimer = null;
    }, 820);
  }

  function updatePrices(mode) {
    const prices = PRICES[mode];
    if (!prices) return;

    Object.keys(valueEls).forEach((key) => {
      const el = valueEls[key];
      if (!el || !Object.prototype.hasOwnProperty.call(prices, key)) return;

      el.classList.remove('is-changing');
      void el.offsetWidth;
      el.innerHTML = prices[key];
      el.classList.add('is-changing');
      setTimeout(() => el.classList.remove('is-changing'), 600);
    });
    replayRatesAnim();
  }

  function setMode(mode) {
    tabs.forEach((tab) => {
      const active = tab.dataset.mode === mode;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    if (isB(mode)) {
      stage.dataset.mode = 'b';
      if (isB(previousMode) && previousMode !== mode) {
        replayAnim(carImage, mode === 'bmanual' ? 'animate-swap-r' : 'animate-swap-l');
      } else {
        replayAnim(carImage, 'animate-pop');
      }
    } else if (mode === 'c1') {
      stage.dataset.mode = 'c1';
      replayAnim(truckImage, 'animate-pop');
    }

    updatePrices(mode);
    previousMode = mode;
    currentIndex = STATES.indexOf(mode);
  }

  function clearTimer() {
    if (!timer) return;
    clearTimeout(timer);
    timer = null;
  }

  function scheduleNext(delay) {
    clearTimer();
    if (!visible || isPaused) return;

    timer = setTimeout(() => {
      currentIndex = (currentIndex + 1) % STATES.length;
      setMode(STATES[currentIndex]);
      scheduleNext(CYCLE_MS);
    }, delay);
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      setMode(tab.dataset.mode);
      scheduleNext(MANUAL_HOLD_MS);
    });
  });

  ['mouseenter', 'focusin', 'touchstart'].forEach((eventName) => {
    stage.addEventListener(eventName, () => {
      isPaused = true;
      clearTimer();
    }, { passive: true });
  });

  ['mouseleave', 'focusout', 'touchend'].forEach((eventName) => {
    stage.addEventListener(eventName, () => {
      isPaused = false;
      scheduleNext(CYCLE_MS);
    }, { passive: true });
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        visible = entry.isIntersecting;
        if (visible) scheduleNext(CYCLE_MS);
        else clearTimer();
      });
    }, { threshold: 0.25 }).observe(stage);
  } else {
    scheduleNext(CYCLE_MS);
  }

  setMode('bauto');
})();
/* Platform v1 — .pfeat hover preview + click lock đổi ảnh .platform-phone */
(() => {
  const pfeats = document.querySelectorAll('.pfeat');
  const platformImg = document.querySelector('.platform-phone img');
  if (!pfeats.length || !platformImg) return;
  let lockedImg = platformImg.getAttribute('src');
  const swapImg = (src) => {
    if (!src || platformImg.getAttribute('src') === src) return;
    platformImg.style.opacity = '0';
    platformImg.style.transform = 'scale(0.97)';
    setTimeout(() => {
      platformImg.src = src;
      platformImg.style.opacity = '1';
      platformImg.style.transform = 'scale(1)';
    }, 180);
  };
  pfeats.forEach((card) => {
    const img = card.dataset.img;
    card.addEventListener('mouseenter', () => { if (img) swapImg(img); });
    card.addEventListener('mouseleave', () => swapImg(lockedImg));
    card.addEventListener('focus', () => { if (img) swapImg(img); });
    card.addEventListener('blur', () => swapImg(lockedImg));
    card.addEventListener('click', () => {
      pfeats.forEach(c => c.classList.remove('is-active'));
      card.classList.add('is-active');
      if (img) { lockedImg = img; swapImg(img); }
    });
  });
})();

/* Platform: accordion list — click để đổi ảnh (không hover preview) */
document.querySelectorAll('.platform-acc').forEach((accGroup) => {
  const items = accGroup.querySelectorAll('.pacc-item');
  const section = accGroup.closest('section');
  if (!section || !items.length) return;
  const platformImg = section.querySelector('.platform-circle img');
  if (!platformImg) return;
  const swap = (src) => {
    if (!src || platformImg.getAttribute('src') === src) return;
    platformImg.style.opacity = '0';
    platformImg.style.transform = 'scale(0.97)';
    setTimeout(() => {
      platformImg.src = src;
      platformImg.style.opacity = '1';
      platformImg.style.transform = 'scale(1)';
    }, 180);
  };
  items.forEach((item) => {
    const img = item.dataset.img;
    item.addEventListener('click', () => {
      const wasActive = item.classList.contains('is-active');
      items.forEach(c => c.classList.remove('is-active'));
      if (!wasActive) {
        item.classList.add('is-active');
        swap(img);
      }
    });
  });
});

/* Spotlight — 4 Mini Albums + Lightbox per category */
(() => {
  /* ────────────────────────────────────────────────
     DỮ LIỆU 4 ALBUM — Thêm/sửa ảnh tại đây.
     Lightbox sẽ duyệt chỉ trong NHÓM tương ứng.
     ──────────────────────────────────────────────── */
  const albumsData = {
    'vinh-danh': [
      { img: 'top%205.png', caption: 'Top 5 ASEAN Strong Brand', sub: 'Vinh danh tại Singapore · 04/2026' },
      { img: 'cup%20va%20bang.png', caption: 'Cúp & bằng khen', sub: 'Kỷ niệm chương vinh danh' },
      // TODO: thay 3 ảnh sau bằng ảnh thật khi có
      { img: 'top%205.png', caption: 'Chứng nhận ASEAN', sub: 'Hiep Phat Automobile Company Limited' },
      { img: 'cup%20va%20bang.png', caption: 'Vinh danh thương hiệu', sub: 'Top 5 ASEAN Strong Brand 2026' },
      { img: 'top%205.png', caption: 'Bằng chứng nhận chính thức', sub: 'Singapore · 18/04/2026' },
    ],
    'hop-bao': [
      { img: 'hop%20bao.png', caption: 'Tặng 40 suất học · 1 tỷ đồng', sub: 'Họp báo trao tặng Bộ Tư lệnh TP.HCM · 15/08/2025' },
      { img: 'hop%20bao%202.png', caption: 'Hội nghị đào tạo Hiệp Phát', sub: 'Đồng hành cùng lực lượng vũ trang' },
      // TODO: thay 3 ảnh sau bằng ảnh thật
      { img: 'hop%20bao.png', caption: 'Trao tặng 40 suất học', sub: 'Bộ Tư lệnh Thành phố Hồ Chí Minh' },
      { img: 'hop%20bao%202.png', caption: 'Hội nghị triển khai', sub: 'Hiệp Phát đồng hành cùng lực lượng vũ trang' },
      { img: 'hop%20bao.png', caption: 'Khoảnh khắc trao tặng', sub: 'Hợp tác phát triển nhân lực lái xe' },
    ],
    'co-so': [
      { img: 'toa%20nha.png', caption: 'Tòa nhà trung tâm Hiệp Phát', sub: 'Cơ sở vật chất khang trang, hiện đại' },
      { img: 'https://hpo.edu.vn/wp-content/uploads/2026/01/cong1.jpg', caption: 'Cổng trung tâm Hiệp Phát', sub: '176 Thế Lữ, TP. Hồ Chí Minh' },
      { img: '35k%20m2.png', caption: 'Sân tập lái 35.000m²', sub: 'Toàn cảnh sân chuẩn QCVN 40:2024' },
      { img: 'tt%20s%C3%A1t%20h%E1%BA%A1ch.png', caption: 'Sân sát hạch chuẩn Loại 1', sub: 'Thiết bị chấm điểm tự động' },
      // TODO: thay ảnh sau
      { img: 'toa%20nha.png', caption: 'Khuôn viên trung tâm', sub: 'Không gian rộng rãi, xanh mát' },
    ],
    'hoat-dong': [
      { img: 'IT.png', caption: 'Phòng học lý thuyết', sub: 'Trang bị máy tính, học trên nền tảng số' },
      { img: 'https://hpo.edu.vn/wp-content/uploads/2026/01/cabin.png', caption: 'Cabin học lái mô phỏng', sub: 'Công nghệ thực tế ảo' },
      { img: 'xe%20tap%20lai-Photoroom.png', caption: 'Xe tập lái Toyota Vios', sub: 'Toyota Vios & Isuzu đời mới' },
      // TODO: thay 2 ảnh sau
      { img: 'IT.png', caption: 'Học trên nền tảng số', sub: 'Nền tảng đa thiết bị · Windows · iOS · Android' },
      { img: 'https://hpo.edu.vn/wp-content/uploads/2026/01/cabin.png', caption: 'Thực hành cabin mô phỏng', sub: 'Rèn luyện kỹ năng lái xe' },
    ],
    // 'all' = tất cả ảnh gộp lại, dùng cho phương án B (classic stack)
    'all': [
      { img: 'top%205.png', caption: 'Top 5 ASEAN Strong Brand', sub: 'Vinh danh tại Singapore · 04/2026' },
      { img: 'cup%20va%20bang.png', caption: 'Cúp & bằng khen', sub: 'Kỷ niệm chương vinh danh' },
      { img: 'hop%20bao.png', caption: 'Tặng 40 suất học · 1 tỷ đồng', sub: 'Họp báo trao tặng Bộ Tư lệnh TP.HCM · 15/08/2025' },
      { img: 'hop%20bao%202.png', caption: 'Hội nghị đào tạo Hiệp Phát', sub: 'Đồng hành cùng lực lượng vũ trang' },
      { img: 'toa%20nha.png', caption: 'Tòa nhà trung tâm Hiệp Phát', sub: 'Cơ sở vật chất khang trang' },
      { img: 'https://hpo.edu.vn/wp-content/uploads/2026/01/cong1.jpg', caption: 'Cổng trung tâm Hiệp Phát', sub: '176 Thế Lữ, TP. Hồ Chí Minh' },
      { img: '35k%20m2.png', caption: 'Sân tập lái 35.000m²', sub: 'Toàn cảnh sân chuẩn QCVN 40:2024' },
      { img: 'tt%20s%C3%A1t%20h%E1%BA%A1ch.png', caption: 'Sân sát hạch chuẩn Loại 1', sub: 'Thiết bị chấm điểm tự động' },
      { img: 'IT.png', caption: 'Phòng học lý thuyết', sub: 'Trang bị máy tính, học trên nền tảng số' },
      { img: 'https://hpo.edu.vn/wp-content/uploads/2026/01/cabin.png', caption: 'Cabin học lái mô phỏng', sub: 'Công nghệ thực tế ảo' },
      { img: 'xe%20tap%20lai-Photoroom.png', caption: 'Xe tập lái Toyota Vios', sub: 'Toyota Vios & Isuzu đời mới' },
    ],
  };

  const lb = document.getElementById('spotLightbox');
  const lbImg = document.getElementById('lbImg');
  const lbCap = document.getElementById('lbCap');
  const lbClose = document.getElementById('lbClose');
  const lbPrev = document.getElementById('lbPrev');
  const lbNext = document.getElementById('lbNext');
  if (!lb) return;

  // Cập nhật count cho mỗi nhóm tự động
  Object.keys(albumsData).forEach((key) => {
    const el = document.querySelector(`[data-count-of="${key}"]`);
    if (el) el.textContent = albumsData[key].length;
  });

  let currentCat = null;
  let idx = 0;
  const list = () => albumsData[currentCat] || [];
  const render = () => {
    const item = list()[idx];
    if (!item) return;
    lbImg.src = item.img;
    lbImg.alt = item.caption || '';
    lbCap.innerHTML = `${item.caption || ''}<small>${(idx + 1)}/${list().length}${item.sub ? ' · ' + item.sub : ''}</small>`;
  };
  const openLb = (cat, i = 0) => {
    if (!albumsData[cat] || !albumsData[cat].length) return;
    currentCat = cat;
    idx = ((i % list().length) + list().length) % list().length;
    render();
    lb.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  };
  const closeLb = () => {
    lb.classList.remove('is-open');
    document.body.style.overflow = '';
    currentCat = null;
  };
  const nav = (delta) => {
    if (!currentCat) return;
    idx = (idx + delta + list().length) % list().length;
    render();
  };

  document.querySelectorAll('.spot-mini-stack').forEach((stack) => {
    const cat = stack.dataset.cat;
    stack.addEventListener('click', () => openLb(cat, 0));
    stack.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLb(cat, 0); }
    });
  });

  // Classic stack (phương án B Khoảnh khắc) — mở album 'all'
  const classicStack = document.getElementById('classicStack');
  if (classicStack) {
    classicStack.addEventListener('click', () => openLb('all', 0));
    classicStack.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLb('all', 0); }
    });
  }

  // Expose để marquee gọi: window.openMarqueeImage(idx)
  window.openMarqueeImage = (i) => openLb('all', i || 0);

  lbClose.addEventListener('click', closeLb);
  lbPrev.addEventListener('click', () => nav(-1));
  lbNext.addEventListener('click', () => nav(1));
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') nav(-1);
    if (e.key === 'ArrowRight') nav(1);
  });
})();

