/* Biển báo modal view */
(() => {
  const modal = document.getElementById('bbViewModal');
  const scroller = document.getElementById('bbViewScroll');
  const closeBtn = document.getElementById('bbViewClose');
  const title = document.getElementById('bbViewTitle');
  const triggers = document.querySelectorAll('.bb-card[data-bb-view]');
  if (!modal || !scroller || !closeBtn || !triggers.length) return;

  const DATA_URL = 'assets/data/bien-bao-view.html';
  const TITLES = {
    'bien-cam': 'Biển báo cấm',
    'nguy-hiem': 'Biển nguy hiểm',
    'hieu-lenh': 'Biển hiệu lệnh',
    'chi-dan': 'Biển chỉ dẫn',
    'bien-phu': 'Biển phụ',
  };

  let htmlPromise = null;
  let loaded = false;
  let spy = null;
  let lastFocus = null;
  let previousBodyOverflow = '';

  function updateModalTitle(activeId) {
    if (title) title.textContent = TITLES[activeId] || '5 loại biển báo';
  }

  async function loadContent() {
    if (loaded) return;

    if (!htmlPromise) {
      htmlPromise = fetch(DATA_URL)
        .then((response) => {
          if (!response.ok) throw new Error('Không tải được nội dung biển báo');
          return response.text();
        });
    }

    try {
      scroller.innerHTML = await htmlPromise;
      loaded = true;
    } catch (error) {
      scroller.innerHTML = '<div class="bb-view-loading">Không tải được nội dung biển báo. Vui lòng kiểm tra file assets/data/bien-bao-view.html.</div>';
      throw error;
    }
  }

  function initSpy() {
    const page = scroller.querySelector('#hpo-sign-page');
    if (!page || !window.HPOStickyScrollSpy) return null;

    spy = window.HPOStickyScrollSpy.init(page, {
      scrollContainer: scroller,
      linksSelector: '#hpo-sign-tabs a[data-hpo-tab]',
      panesSelector: '[data-hpo-pane]',
      stickyWrapSelector: '#hpo-sign-sidebar-wrap',
      linkId: (link) => link.getAttribute('data-hpo-tab'),
      paneId: (pane) => pane.getAttribute('data-hpo-pane'),
      getOffset: () => (window.matchMedia('(max-width: 900px)').matches ? 0 : 16),
      onActiveChange: updateModalTitle,
    });

    return spy;
  }

  function waitForImages(root) {
    const images = Array.from(root.querySelectorAll('img'));
    if (!images.length) return Promise.resolve();

    return Promise.allSettled(images.map((img) => {
      if (img.complete) return Promise.resolve();

      return new Promise((resolve) => {
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
      });
    }));
  }

  async function openSignView(target = 'bien-cam') {
    lastFocus = document.activeElement;
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    updateModalTitle(target);

    try {
      await loadContent();
    } catch (_) {
      return;
    }

    const api = initSpy();

    const alignToTarget = () => {
      if (!modal.classList.contains('is-open')) return;
      if (api) api.scrollTo(target, 'auto');
    };

    requestAnimationFrame(() => {
      scroller.scrollTop = 0;
      requestAnimationFrame(() => {
        alignToTarget();
        closeBtn.focus({ preventScroll: true });
      });
    });

    setTimeout(alignToTarget, 250);
    waitForImages(scroller).then(alignToTarget);
  }

  function closeSignView() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = previousBodyOverflow;
    if (lastFocus && typeof lastFocus.focus === 'function') {
      lastFocus.focus({ preventScroll: true });
    }
  }

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      openSignView(trigger.dataset.bbView);
    });
  });

  closeBtn.addEventListener('click', closeSignView);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeSignView();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) {
      closeSignView();
    }
  });

  window.openBienBaoView = openSignView;
})();

/* Sa hình modal view */
(() => {
  const modal = document.getElementById('shViewModal');
  const scroller = document.getElementById('shViewScroll');
  const closeBtn = document.getElementById('shViewClose');
  const title = document.getElementById('shViewTitle');
  const triggers = document.querySelectorAll('.sa-card[data-sh-view]');
  if (!modal || !scroller || !closeBtn || !triggers.length) return;

  const DATA_URL = 'assets/data/sa-hinh-view.html';
  const TITLES = {
    'nguyen-tac-1': 'Xe có đường riêng',
    'nguyen-tac-2': 'Quyền bình đẳng xe vào nơi đường giao nhau',
    'nguyen-tac-3': 'Xe ưu tiên theo luật giao thông đường bộ',
    'nguyen-tac-4': 'Xe ở đường ưu tiên',
    'nguyen-tac-5': 'Xe có quyền ưu tiên bên phải',
    'nguyen-tac-6': 'Quyền ưu tiên đối với xe đi cùng đoàn, cùng hướng',
    'nguyen-tac-7': 'Xe phải nhường đường khi rẽ trái',
  };

  let htmlPromise = null;
  let loaded = false;
  let spy = null;
  let lastFocus = null;
  let previousBodyOverflow = '';

  function updateModalTitle(activeId) {
    if (title) title.textContent = TITLES[activeId] || 'Nguyên tắc đi sa hình';
  }

  async function loadContent() {
    if (loaded) return;

    if (!htmlPromise) {
      htmlPromise = fetch(DATA_URL)
        .then((response) => {
          if (!response.ok) throw new Error('Không tải được nội dung sa hình');
          return response.text();
        });
    }

    try {
      scroller.innerHTML = await htmlPromise;
      loaded = true;
    } catch (error) {
      scroller.innerHTML = '<div class="sh-view-loading">Không tải được nội dung sa hình. Vui lòng kiểm tra file assets/data/sa-hinh-view.html.</div>';
      throw error;
    }
  }

  function initSpy() {
    const page = scroller.querySelector('#hpo-sh-page');
    if (!page || !window.HPOStickyScrollSpy) return null;

    spy = window.HPOStickyScrollSpy.init(page, {
      scrollContainer: scroller,
      linksSelector: '#hpo-sh-tabs [data-sh-tab]',
      panesSelector: '[data-sh-pane]',
      stickyWrapSelector: '#hpo-sh-sidebar-wrap',
      linkId: (link) => link.getAttribute('data-sh-tab'),
      paneId: (pane) => pane.getAttribute('data-sh-pane'),
      getOffset: () => (window.matchMedia('(max-width: 900px)').matches ? 0 : 16),
      onActiveChange: updateModalTitle,
    });

    return spy;
  }

  function waitForImages(root) {
    const images = Array.from(root.querySelectorAll('img'));
    if (!images.length) return Promise.resolve();

    return Promise.allSettled(images.map((img) => {
      if (img.complete) return Promise.resolve();

      return new Promise((resolve) => {
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
      });
    }));
  }

  async function openSaHinhView(target = 'nguyen-tac-1') {
    lastFocus = document.activeElement;
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    updateModalTitle(target);

    try {
      await loadContent();
    } catch (_) {
      return;
    }

    const api = initSpy();

    const alignToTarget = () => {
      if (!modal.classList.contains('is-open')) return;
      if (api) api.scrollTo(target, 'auto');
    };

    requestAnimationFrame(() => {
      scroller.scrollTop = 0;
      requestAnimationFrame(() => {
        alignToTarget();
        closeBtn.focus({ preventScroll: true });
      });
    });

    setTimeout(alignToTarget, 250);
    waitForImages(scroller).then(alignToTarget);
  }

  function closeSaHinhView() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = previousBodyOverflow;
    scroller.querySelectorAll('iframe').forEach((frame) => {
      frame.src = frame.src;
    });
    if (lastFocus && typeof lastFocus.focus === 'function') {
      lastFocus.focus({ preventScroll: true });
    }
  }

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      openSaHinhView(trigger.dataset.shView);
    });
  });

  closeBtn.addEventListener('click', closeSaHinhView);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeSaHinhView();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) {
      closeSaHinhView();
    }
  });

  window.openSaHinhView = openSaHinhView;
})();

/* Lỗi sa hình modal view */
(() => {
  const modal = document.getElementById('lshViewModal');
  const scroller = document.getElementById('lshViewScroll');
  const closeBtn = document.getElementById('lshViewClose');
  const title = document.getElementById('lshViewTitle');
  const triggers = document.querySelectorAll('.sa-card[data-lsh-view]');
  if (!modal || !scroller || !closeBtn || !triggers.length) return;

  const DATA_URL = 'assets/data/loi-sa-hinh-view.html';
  const TITLES = {
    'bai-1': 'Bài thi Xuất phát',
    'bai-2': 'Dừng xe nhường đường cho người đi bộ',
    'bai-3': 'Dừng xe và khởi hành ngang dốc',
    'bai-4': 'Qua vệt bánh xe và đường hẹp vuông góc',
    'bai-5': 'Qua ngã tư có đèn tín hiệu giao thông',
    'bai-6': 'Đường vòng quanh co',
    'bai-7': 'Ghép xe dọc vào nơi đỗ',
    'bai-8': 'Tạm dừng ở nơi có đường sắt chạy qua',
    'bai-9': 'Thay đổi số trên đường bằng',
    'bai-10': 'Ghép xe ngang vào nơi đỗ',
    'bai-11': 'Bài kết thúc',
  };

  let htmlPromise = null;
  let loaded = false;
  let videosReady = false;
  let videoObserver = null;
  let lastFocus = null;
  let previousBodyOverflow = '';

  function updateModalTitle(activeId) {
    if (title) title.textContent = TITLES[activeId] || '11 bài thi sa hình';
  }

  async function loadContent() {
    if (loaded) return;

    if (!htmlPromise) {
      htmlPromise = fetch(DATA_URL)
        .then((response) => {
          if (!response.ok) throw new Error('Không tải được nội dung lỗi sa hình');
          return response.text();
        });
    }

    try {
      scroller.innerHTML = await htmlPromise;
      loaded = true;
    } catch (error) {
      scroller.innerHTML = '<div class="lsh-view-loading">Không tải được nội dung lỗi sa hình. Vui lòng kiểm tra file assets/data/loi-sa-hinh-view.html.</div>';
      throw error;
    }
  }

  function initSpy() {
    const page = scroller.querySelector('#hpo-shl-page');
    if (!page || !window.HPOStickyScrollSpy) return null;

    return window.HPOStickyScrollSpy.init(page, {
      scrollContainer: scroller,
      linksSelector: '#hpo-shl-tabs a[data-shl-tab]',
      panesSelector: '[data-shl-pane]',
      stickyWrapSelector: '#hpo-shl-sidebar-wrap',
      linkId: (link) => link.getAttribute('data-shl-tab'),
      paneId: (pane) => pane.getAttribute('data-shl-pane'),
      getOffset: () => (window.matchMedia('(max-width: 900px)').matches ? 0 : 16),
      onActiveChange: updateModalTitle,
    });
  }

  function initVideos() {
    if (videosReady) return;
    const videos = Array.from(scroller.querySelectorAll('.hpo-shl__video video'));
    if (!videos.length) return;

    videos.forEach((video) => {
      try {
        video.muted = true;
        video.loop = true;
        video.autoplay = true;
        video.playsInline = true;
        video.setAttribute('muted', '');
        video.setAttribute('loop', '');
        video.setAttribute('autoplay', '');
        video.setAttribute('playsinline', '');
        video.preload = video.preload || 'metadata';
      } catch (_) { }
    });

    if ('IntersectionObserver' in window) {
      videoObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (entry.isIntersecting && entry.intersectionRatio >= 0.55) {
            video.play?.().catch(() => { });
          } else {
            video.pause?.();
          }
        });
      }, {
        root: scroller,
        threshold: [0, 0.25, 0.55, 0.75, 1],
      });

      videos.forEach((video) => videoObserver.observe(video));
    } else {
      videos.forEach((video) => video.play?.().catch(() => { }));
    }

    videosReady = true;
  }

  function pauseVideos() {
    scroller.querySelectorAll('.hpo-shl__video video').forEach((video) => {
      try {
        video.pause();
      } catch (_) { }
    });
  }

  function playVisibleVideo() {
    const videos = Array.from(scroller.querySelectorAll('.hpo-shl__video video'));
    const scrollerRect = scroller.getBoundingClientRect();

    videos.forEach((video) => {
      const rect = video.getBoundingClientRect();
      const visible = Math.min(rect.bottom, scrollerRect.bottom) - Math.max(rect.top, scrollerRect.top);
      const ratio = rect.height ? visible / rect.height : 0;
      if (ratio >= 0.55) video.play?.().catch(() => { });
      else video.pause?.();
    });
  }

  async function openLoiSaHinhView(target = 'bai-1') {
    lastFocus = document.activeElement;
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    updateModalTitle(target);

    try {
      await loadContent();
    } catch (_) {
      return;
    }

    const api = initSpy();
    initVideos();

    const alignToTarget = () => {
      if (!modal.classList.contains('is-open')) return;
      if (api) api.scrollTo(target, 'auto');
      setTimeout(playVisibleVideo, 80);
    };

    requestAnimationFrame(() => {
      scroller.scrollTop = 0;
      requestAnimationFrame(() => {
        alignToTarget();
        closeBtn.focus({ preventScroll: true });
      });
    });

    setTimeout(alignToTarget, 250);
  }

  function closeLoiSaHinhView() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = previousBodyOverflow;
    pauseVideos();
    if (lastFocus && typeof lastFocus.focus === 'function') {
      lastFocus.focus({ preventScroll: true });
    }
  }

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      openLoiSaHinhView(trigger.dataset.lshView);
    });
  });

  closeBtn.addEventListener('click', closeLoiSaHinhView);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeLoiSaHinhView();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) {
      closeLoiSaHinhView();
    }
  });

  window.openLoiSaHinhView = openLoiSaHinhView;
})();

/* Động cơ 4 kỳ modal view */
(() => {
  const modal = document.getElementById('engineViewModal');
  const scroller = document.getElementById('engineViewScroll');
  const closeBtn = document.getElementById('engineViewClose');
  const triggers = document.querySelectorAll('.chap[data-engine-view]');
  if (!modal || !scroller || !closeBtn || !triggers.length) return;

  const DATA_URL = 'assets/data/engine-4ky-view.html';
  let htmlPromise = null;
  let loaded = false;
  let lastFocus = null;
  let previousBodyOverflow = '';

  async function loadContent() {
    if (loaded) return;

    if (!htmlPromise) {
      htmlPromise = fetch(DATA_URL)
        .then((response) => {
          if (!response.ok) throw new Error('Không tải được nội dung động cơ 4 kỳ');
          return response.text();
        });
    }

    try {
      scroller.innerHTML = await htmlPromise;
      loaded = true;
    } catch (error) {
      scroller.innerHTML = '<div class="engine-view-loading">Không tải được nội dung động cơ 4 kỳ. Vui lòng kiểm tra file assets/data/engine-4ky-view.html.</div>';
      throw error;
    }
  }

  async function openEngineView() {
    lastFocus = document.activeElement;
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');

    try {
      await loadContent();
    } catch (_) {
      return;
    }

    requestAnimationFrame(() => {
      scroller.scrollTop = 0;
      closeBtn.focus({ preventScroll: true });
    });
  }

  function closeEngineView() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = previousBodyOverflow;
    scroller.querySelectorAll('iframe').forEach((frame) => {
      frame.src = frame.src;
    });
    if (lastFocus && typeof lastFocus.focus === 'function') {
      lastFocus.focus({ preventScroll: true });
    }
  }

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      openEngineView();
    });
  });

  closeBtn.addEventListener('click', closeEngineView);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeEngineView();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) {
      closeEngineView();
    }
  });

  window.openEngine4KyView = openEngineView;
})();

/* Chap video modal — inline player cho bài giảng */
(function () {
  let _chapData = null;
  const DATA_PATH = 'assets/data/bai_14_17_co_dap_an.json';

  function extractYoutubeId(url) {
    try {
      const parsed = new URL(url, window.location.href);
      let id = null;
      if (parsed.hostname.includes('youtu.be')) id = parsed.pathname.replace(/^\//, '').split(/[?&]/)[0];
      else if (/\/shorts\//i.test(parsed.pathname)) id = parsed.pathname.split('/shorts/')[1].split(/[?&]/)[0];
      else if (/\/embed\//i.test(parsed.pathname)) id = parsed.pathname.split('/embed/')[1].split(/[?&]/)[0];
      else if (/\/v\//i.test(parsed.pathname)) id = parsed.pathname.split('/v/')[1].split(/[?&]/)[0];
      else id = parsed.searchParams.get('v');
      if (!id) {
        const parts = parsed.pathname.replace(/\/$/, '').split('/');
        const last = parts.pop();
        if (last && /^[A-Za-z0-9_-]{6,}$/.test(last)) id = last;
      }
      return id;
    } catch (_) { return null; }
  }

  function toEmbedUrl(url) {
    const id = extractYoutubeId(url);
    if (!id) return url;
    return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
  }

  async function loadChapData() {
    if (_chapData) return _chapData;
    try {
      const res = await fetch(DATA_PATH);
      if (!res.ok) throw new Error('not found');
      _chapData = await res.json();
      return _chapData;
    } catch (e) {
      _chapData = null;
      return null;
    }
  }

  function findLessonByVideoId(data, id, title) {
    if (!data) return null;
    // If top-level key by id
    if (data[id]) return data[id];
    // check lessons array
    const arr = Array.isArray(data.lessons) ? data.lessons : (Array.isArray(data.items) ? data.items : null);
    if (!arr) return null;
    const loweredTitle = (title || '').toLowerCase();
    for (const lesson of arr) {
      // common fields
      if (lesson.video && lesson.video === id) return lesson;
      if (lesson.video_id && lesson.video_id === id) return lesson;
      if (lesson.youtube && typeof lesson.youtube === 'string' && lesson.youtube.includes(id)) return lesson;
      if (lesson.video_ids && Array.isArray(lesson.video_ids) && lesson.video_ids.includes(id)) return lesson;
      // match by title
      if (lesson.title && loweredTitle.includes(lesson.title.toLowerCase())) return lesson;
      if (lesson.name && loweredTitle.includes(lesson.name.toLowerCase())) return lesson;
    }
    // fallback: keyword mapping for lessons 14-17 based on title text
    const keywordMap = {
      'động cơ': 14,
      'hộp số': 15,
      'điều hòa': 16,
      'hệ thống điện': 16,
      'hệ thống lái': 17,
      'lái': 17,
      'treo': 17
    };
    for (const kw in keywordMap) {
      if (loweredTitle.includes(kw)) {
        const targetNum = keywordMap[kw];
        const found = arr.find(ls => ls.lessonNumber === targetNum || ls.title === `Bài ${targetNum}`);
        if (found) return found;
      }
    }
    return null;
  }

  function renderSummary(lesson, container) {
    if (!container) return;
    if (!lesson) { container.innerHTML = '<p>Không tìm thấy nội dung tóm tắt.</p>'; return; }
    let html = `<h3>Tóm tắt nội dung bài học</h3>`;
    const sums = lesson.summary || lesson.summaries || [];
    if (typeof sums === 'string') {
      html += `<div class="chap-summary">${sums}</div>`;
    } else if (Array.isArray(sums) && sums.length) {
      sums.forEach(s => {
        html += `<div class="chap-summary-item"><strong>${s.title || ''}</strong>`;
        if (s.causes && s.causes.length) html += '<div><em>Nguyên nhân:</em><ul class="chap-points">' + s.causes.map(c => `<li>${c}</li>`).join('') + '</ul></div>';
        if (s.solutions && s.solutions.length) html += '<div><em>Biện pháp:</em><ul class="chap-points">' + s.solutions.map(c => `<li>${c}</li>`).join('') + '</ul></div>';
        html += '</div>';
      });
    }
    container.innerHTML = html || '<p>Không có nội dung tóm tắt.</p>';
  }

  function isCorrectAnswer(q, val) {
    const a = q.answer;
    if (a === undefined || a === null) return false;
    if (Array.isArray(a)) return a.map(x => String(x).toUpperCase()).includes(String(val).toUpperCase());
    return String(a).toUpperCase() === String(val).toUpperCase();
  }

  function renderQuestions(lesson, container) {
    if (!container) return;
    const qs = (lesson && (lesson.questions || lesson.quiz)) || [];
    if (!lesson || !qs.length) { container.innerHTML = '<p>Không có câu hỏi trắc nghiệm.</p>'; return; }
    const qHtml = qs.map((q, i) => {
      const opts = (q.options || []).map((opt, j) => {
        const val = opt.label || String(j);
        const text = opt.text || opt;
        return `<button type="button" class="q-opt" data-q="${i}" data-val="${val}"><span class="q-opt-key">${val}</span><span class="q-opt-text">${text}</span></button>`;
      }).join('');
      return `<div class="q-item" data-q="${i}"><div class="q-title"><strong>Câu ${i + 1}.</strong> ${q.question}</div><div class="q-opts">${opts}</div></div>`;
    }).join('');
    container.innerHTML = '<h3>Câu hỏi trắc nghiệm</h3>' + qHtml;

    container.querySelectorAll('.q-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        const qi = +btn.dataset.q;
        const qItem = container.querySelector(`.q-item[data-q="${qi}"]`);
        if (!qItem || qItem.classList.contains('is-answered')) return; // đã chọn → khóa
        qItem.classList.add('is-answered');
        const q = qs[qi];
        const correct = isCorrectAnswer(q, btn.dataset.val);
        qItem.querySelectorAll('.q-opt').forEach(o => {
          o.classList.add('is-locked');
          o.setAttribute('aria-disabled', 'true');
          if (isCorrectAnswer(q, o.dataset.val)) o.classList.add('is-correct');
        });
        if (!correct) btn.classList.add('is-wrong');
      });
    });
  }

  window.openChapVideo = async function (src, title) {
    const modal = document.getElementById('chapVideoModal');
    const video = document.getElementById('chapVideoEl');
    const frame = document.getElementById('chapVideoFrame');
    const titleEl = document.getElementById('chapVideoTitle');
    const sumEl = document.getElementById('chapVideoSummary');
    const qEl = document.getElementById('chapVideoQuestions');
    if (!modal || !video || !frame) return;

    const isYoutube = /(?:youtube\.com|youtu\.be)/i.test(src);
    if (isYoutube) {
      frame.src = toEmbedUrl(src);
      // defensively show iframe and hide <video>
      try { frame.style.display = ''; frame.hidden = false; } catch (_) { }
      try { video.style.display = 'none'; video.hidden = true; video.pause(); video.currentTime = 0; } catch (_) { }
      // pause any other HTML5 videos on the page
      document.querySelectorAll('video').forEach(v => { try { if (v !== video) { v.pause(); v.currentTime = 0; } } catch (_) { } });
    } else {
      const source = video.querySelector('source');
      source.src = src;
      video.load();
      // defensively show video and hide iframe
      try { video.style.display = ''; video.hidden = false; } catch (_) { }
      try { frame.style.display = 'none'; frame.hidden = true; frame.src = ''; } catch (_) { }
    }

    if (titleEl) titleEl.textContent = title || '';
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';

    // load lesson data and render panels
    try {
      const data = await loadChapData();
      const id = extractYoutubeId(src);
      const lesson = findLessonByVideoId(data, id, title);
      renderSummary(lesson, sumEl);
      renderQuestions(lesson, qEl);
    } catch (e) {
      if (sumEl) sumEl.innerHTML = '<p>Không thể tải nội dung.</p>';
      if (qEl) qEl.innerHTML = '<p>Không thể tải câu hỏi.</p>';
    }

    if (!isYoutube) setTimeout(() => { video.play().catch(() => { }); }, 120);
  };

  function toggleCollapse(side) {
    const grid = document.querySelector('.chap-video-grid');
    if (!grid) return;
    const isLeft = side === 'left';
    const panel = document.getElementById(isLeft ? 'chapVideoSummary' : 'chapVideoQuestions');
    const btn = document.getElementById(isLeft ? 'chapToggleSummary' : 'chapToggleQuestions');
    const cls = isLeft ? 'left-collapsed' : 'right-collapsed';
    const collapsed = !grid.classList.contains(cls);
    grid.classList.toggle(cls, collapsed);
    if (panel) panel.classList.toggle('is-collapsed', collapsed);
    if (btn) {
      btn.classList.toggle('is-collapsed', collapsed);
      btn.setAttribute('aria-expanded', String(!collapsed));
      btn.title = collapsed
        ? (isLeft ? 'Mở phần tóm tắt' : 'Mở phần câu hỏi')
        : (isLeft ? 'Thu gọn tóm tắt' : 'Thu gọn câu hỏi');
    }
  }

  // Bind 1 lần — chỉ đổi khi người dùng chủ động bấm, không tự động
  const _btnSum = document.getElementById('chapToggleSummary');
  const _btnQ = document.getElementById('chapToggleQuestions');
  if (_btnSum) _btnSum.addEventListener('click', (e) => { e.stopPropagation(); toggleCollapse('left'); });
  if (_btnQ) _btnQ.addEventListener('click', (e) => { e.stopPropagation(); toggleCollapse('right'); });
})();

window.closeChapVideo = function (e) {
  if (e && e.target && e.target.id !== 'chapVideoModal' && !e.target.classList.contains('chap-video-close')) return;
  const modal = document.getElementById('chapVideoModal');
  const video = document.getElementById('chapVideoEl');
  const frame = document.getElementById('chapVideoFrame');
  const sumEl = document.getElementById('chapVideoSummary');
  const qEl = document.getElementById('chapVideoQuestions');
  const titleEl = document.getElementById('chapVideoTitle');
  if (!modal || !video || !frame) return;
  try { video.pause(); video.currentTime = 0; } catch (_) { }
  frame.src = '';
  if (sumEl) sumEl.innerHTML = '';
  if (qEl) qEl.innerHTML = '';
  if (titleEl) titleEl.textContent = '';
  modal.classList.remove('is-open');
  document.body.style.overflow = '';
};
document.addEventListener('keydown', function (e) {
  if (e.key !== 'Escape') return;
  const modal = document.getElementById('chapVideoModal');
  if (modal && modal.classList.contains('is-open')) window.closeChapVideo();
});

/* Mon 01-04 nested accordion — togglePhan (global) */
window.togglePhan = function (id) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('is-open');
};

/* Chapter accordion: mặc định đóng các item con, bấm tiêu đề chương để mở. */
document.querySelectorAll('.syll-list--chapters .chap.is-featured').forEach((chapter) => {
  const row = chapter.querySelector(':scope > .chap-row');
  const content = chapter.querySelector(
    ':scope > .chap-content-pad, :scope > .bb-grid, :scope > .sa-grid'
  );
  if (!row || !content) return;

  const collapse = document.createElement('div');
  collapse.className = 'chap-collapse';
  chapter.insertBefore(collapse, content);
  collapse.appendChild(content);

  chapter.classList.remove('is-open');
  collapse.style.height = '0px';
  collapse.setAttribute('aria-hidden', 'true');
  row.setAttribute('role', 'button');
  row.setAttribute('tabindex', '0');
  row.setAttribute('aria-expanded', 'false');

  const toggleChapter = () => {
    const willOpen = !chapter.classList.contains('is-open');
    if (!willOpen) {
      collapse.style.height = collapse.scrollHeight + 'px';
      collapse.offsetHeight;
    }
    chapter.classList.toggle('is-open', willOpen);
    row.setAttribute('aria-expanded', String(willOpen));
    collapse.setAttribute('aria-hidden', String(!willOpen));
    collapse.style.height = willOpen ? collapse.scrollHeight + 'px' : '0px';
  };

  collapse.addEventListener('transitionend', (event) => {
    if (
      event.target === collapse &&
      event.propertyName === 'height' &&
      chapter.classList.contains('is-open')
    ) {
      collapse.style.height = 'auto';
    }
  });

  row.addEventListener('click', toggleChapter);
  row.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    toggleChapter();
  });
});

/* Event blocks — "Xem thêm" / "Thu gọn" toggle ẩn/hiện mục 3-8 */
(function () {
  var btn = document.getElementById('eventBlocksToggle');
  var blocks = document.querySelector('.event-blocks');
  if (!btn || !blocks) return;
  var label = btn.querySelector('.event-blocks-toggle-label');
  var anchor = document.querySelector('.programs-title') || blocks;
  btn.addEventListener('click', function () {
    var willExpand = !blocks.classList.contains('is-expanded');
    if (willExpand) {
      blocks.classList.add('is-expanded');
      btn.setAttribute('aria-expanded', 'true');
      if (label) label.textContent = 'Thu gọn';
    } else {
      // Animation thu gọn: cuộn về anchor trước rồi mới collapse để cảm giác kéo lên mượt
      var top = anchor.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top: top, behavior: 'smooth' });
      setTimeout(function () {
        blocks.classList.remove('is-expanded');
        btn.setAttribute('aria-expanded', 'false');
        if (label) label.textContent = 'Xem thêm';
      }, 420);
    }
  });
})();

