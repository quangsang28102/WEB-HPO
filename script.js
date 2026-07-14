    /* Sticky navbar shadow */
    const navbar = document.getElementById('navbar');
    const onScroll = () => navbar.classList.toggle('is-scrolled', window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* Reveal on scroll */
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          revealObserver.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('[data-reveal]').forEach(el => revealObserver.observe(el));

    /* Count-up */
    function formatNumber(n) {
      if (n >= 1000) return Math.round(n / 1000) + '.000';
      return n.toString();
    }
    function countUp(el, target, duration = 1800) {
      const start = performance.now();
      const step = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const v = Math.round(eased * target);
        el.textContent = formatNumber(v);
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = formatNumber(target);
      };
      requestAnimationFrame(step);
    }
    const countObserver = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const el = e.target;
          countUp(el, parseInt(el.dataset.count, 10));
          countObserver.unobserve(el);
        }
      });
    }, { threshold: 0.4 });
    document.querySelectorAll('[data-count]').forEach(el => countObserver.observe(el));

    /* Accordion */
    const accordionImages = [
      'https://hpo.edu.vn/wp-content/uploads/2026/01/xacthuc.png',
      'https://hpo.edu.vn/wp-content/uploads/2026/01/danentang.png',
      'https://hpo.edu.vn/wp-content/uploads/2026/01/server.jpg',
      'https://hpo.edu.vn/wp-content/uploads/2026/01/mophong.png',
      'https://hpo.edu.vn/wp-content/uploads/2026/01/cabin.png',
      'https://hpo.edu.vn/wp-content/uploads/2026/01/dat.png',
    ];
    const accordionBtns = document.querySelectorAll('.accordion-btn');
    const accordionPanels = document.querySelectorAll('.accordion-panel');
    const smartImg = document.getElementById('smartImg');

    function openAccordion(idx) {
      accordionBtns.forEach((b, i) => {
        const isActive = i === idx;
        b.classList.toggle('is-active', isActive);
        b.setAttribute('aria-expanded', isActive ? 'true' : 'false');
        const panel = accordionPanels[i];
        if (isActive) {
          panel.style.maxHeight = panel.scrollHeight + 'px';
        } else {
          panel.style.maxHeight = '0px';
        }
      });
      if (smartImg && accordionImages[idx]) {
        smartImg.style.opacity = '0';
        smartImg.style.transform = 'scale(0.97)';
        setTimeout(() => {
          smartImg.src = accordionImages[idx];
          smartImg.style.opacity = '1';
          smartImg.style.transform = 'scale(1)';
        }, 220);
      }
    }
    accordionBtns.forEach((btn, i) => {
      btn.addEventListener('click', () => {
        if (btn.classList.contains('is-active')) {
          btn.classList.remove('is-active');
          btn.setAttribute('aria-expanded', 'false');
          accordionPanels[i].style.maxHeight = '0px';
        } else {
          openAccordion(i);
        }
      });
    });
    // Set initial open panel height
    window.addEventListener('load', () => {
      const active = document.querySelector('.accordion-btn.is-active');
      if (active) {
        const i = Array.from(accordionBtns).indexOf(active);
        accordionPanels[i].style.maxHeight = accordionPanels[i].scrollHeight + 'px';
      }
    });

    /* Reusable sticky table-of-contents scroll spy */
    (() => {
      if (window.HPOStickyScrollSpy) return;

      const instances = new WeakMap();

      function getScrollTop(scroller) {
        return scroller === window ? window.scrollY : scroller.scrollTop;
      }

      function getElementTop(el, scroller) {
        const rect = el.getBoundingClientRect();
        if (scroller === window) return rect.top + window.scrollY;

        const scrollerRect = scroller.getBoundingClientRect();
        return rect.top - scrollerRect.top + scroller.scrollTop;
      }

      function scrollTo(scroller, top, behavior) {
        const value = Math.max(0, top);
        if (scroller === window) {
          window.scrollTo({ top: value, behavior });
        } else {
          scroller.scrollTo({ top: value, behavior });
        }
      }

      function initStickyScrollSpy(root, options = {}) {
        if (!root) return null;
        if (instances.has(root)) return instances.get(root);

        const scroller = options.scrollContainer || window;
        const links = Array.from(root.querySelectorAll(options.linksSelector || '[data-scrollspy-link]'));
        const panes = Array.from(root.querySelectorAll(options.panesSelector || '[data-scrollspy-pane]'));
        const linkId = options.linkId || ((link) => link.dataset.scrollspyLink);
        const paneId = options.paneId || ((pane) => pane.dataset.scrollspyPane);
        const getOffset = options.getOffset || (() => options.offset || 0);
        const onActiveChange = typeof options.onActiveChange === 'function' ? options.onActiveChange : null;
        const stickyWrap = options.stickyWrapSelector ? root.querySelector(options.stickyWrapSelector) : null;
        const ids = links.map(linkId).filter(Boolean);

        if (!links.length || !panes.length || !ids.length) return null;

        function applyOffsets() {
          const offset = Math.max(0, Math.round(getOffset() || 0));
          root.style.setProperty('--hpo-scroll-top', offset + 'px');
          if (stickyWrap) stickyWrap.style.setProperty('--hpo-top', offset + 'px');
        }

        let activeId = null;

        function setActive(nextActiveId) {
          links.forEach((link) => {
            const isActive = linkId(link) === nextActiveId;
            link.classList.toggle('is-active', isActive);
            if (isActive) link.setAttribute('aria-current', 'true');
            else link.removeAttribute('aria-current');
          });

          if (activeId !== nextActiveId) {
            activeId = nextActiveId;
            if (onActiveChange) onActiveChange(nextActiveId);
          }
        }

        function findPane(id) {
          return panes.find((pane) => paneId(pane) === id);
        }

        function scrollToPane(id, behavior = 'smooth') {
          const pane = findPane(id);
          if (!pane) return;

          applyOffsets();
          const y = getElementTop(pane, scroller) - getOffset() - 12;
          scrollTo(scroller, y, behavior);
          setActive(id);
        }

        let ticking = false;

        function updateActiveByScroll() {
          applyOffsets();

          const topLine = getScrollTop(scroller) + getOffset() + 40;
          let currentId = ids[0];

          panes.forEach((pane) => {
            const id = paneId(pane);
            if (!id || !ids.includes(id)) return;

            if (getElementTop(pane, scroller) <= topLine) {
              currentId = id;
            }
          });

          setActive(currentId);
        }

        function onScroll() {
          if (ticking) return;
          ticking = true;
          requestAnimationFrame(() => {
            updateActiveByScroll();
            ticking = false;
          });
        }

        links.forEach((link) => {
          link.addEventListener('click', (event) => {
            const id = linkId(link);
            if (!id) return;
            event.preventDefault();
            scrollToPane(id);
          });
        });

        scroller.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', updateActiveByScroll, { passive: true });

        const api = {
          scrollTo: scrollToPane,
          update: updateActiveByScroll,
        };

        instances.set(root, api);
        applyOffsets();
        updateActiveByScroll();
        return api;
      }

      window.HPOStickyScrollSpy = { init: initStickyScrollSpy };
    })();

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
          return `<div class="q-item" data-q="${i}"><div class="q-title"><strong>Câu ${i+1}.</strong> ${q.question}</div><div class="q-opts">${opts}</div></div>`;
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
          try { frame.style.display = ''; frame.hidden = false; } catch (_) {}
          try { video.style.display = 'none'; video.hidden = true; video.pause(); video.currentTime = 0; } catch (_) {}
          // pause any other HTML5 videos on the page
          document.querySelectorAll('video').forEach(v => { try { if (v !== video) { v.pause(); v.currentTime = 0; } } catch(_){} });
        } else {
          const source = video.querySelector('source');
          source.src = src;
          video.load();
          // defensively show video and hide iframe
          try { video.style.display = ''; video.hidden = false; } catch(_){}
          try { frame.style.display = 'none'; frame.hidden = true; frame.src = ''; } catch(_){}
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

        if (!isYoutube) setTimeout(() => { video.play().catch(() => {}); }, 120);
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
      try { video.pause(); video.currentTime = 0; } catch (_) {}
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

    /* Mon 01-04 nested accordion — togglePhan / toggleChap (global) */
    window.togglePhan = function (id) {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('is-open');
    };
    window.toggleChap = function (id) {
      const el = document.getElementById(id);
      if (!el) return;
      const wasOpen = el.classList.contains('is-open');
      el.closest('.chap-list').querySelectorAll('.chap').forEach(c => {
        if (c !== el) c.classList.remove('is-open');
      });
      el.classList.toggle('is-open', !wasOpen);
    };

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
        var p = video.play();
        if (p !== undefined) p.catch(function(){});
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
          { img: 'top%205.png',         caption: 'Top 5 ASEAN Strong Brand',       sub: 'Vinh danh tại Singapore · 04/2026' },
          { img: 'cup%20va%20bang.png', caption: 'Cúp & bằng khen',                sub: 'Kỷ niệm chương vinh danh' },
          // TODO: thay 3 ảnh sau bằng ảnh thật khi có
          { img: 'top%205.png',         caption: 'Chứng nhận ASEAN',               sub: 'Hiep Phat Automobile Company Limited' },
          { img: 'cup%20va%20bang.png', caption: 'Vinh danh thương hiệu',          sub: 'Top 5 ASEAN Strong Brand 2026' },
          { img: 'top%205.png',         caption: 'Bằng chứng nhận chính thức',     sub: 'Singapore · 18/04/2026' },
        ],
        'hop-bao': [
          { img: 'hop%20bao.png',       caption: 'Tặng 40 suất học · 1 tỷ đồng',   sub: 'Họp báo trao tặng Bộ Tư lệnh TP.HCM · 15/08/2025' },
          { img: 'hop%20bao%202.png',   caption: 'Hội nghị đào tạo Hiệp Phát',     sub: 'Đồng hành cùng lực lượng vũ trang' },
          // TODO: thay 3 ảnh sau bằng ảnh thật
          { img: 'hop%20bao.png',       caption: 'Trao tặng 40 suất học',          sub: 'Bộ Tư lệnh Thành phố Hồ Chí Minh' },
          { img: 'hop%20bao%202.png',   caption: 'Hội nghị triển khai',            sub: 'Hiệp Phát đồng hành cùng lực lượng vũ trang' },
          { img: 'hop%20bao.png',       caption: 'Khoảnh khắc trao tặng',          sub: 'Hợp tác phát triển nhân lực lái xe' },
        ],
        'co-so': [
          { img: 'toa%20nha.png',                                                  caption: 'Tòa nhà trung tâm Hiệp Phát',  sub: 'Cơ sở vật chất khang trang, hiện đại' },
          { img: 'https://hpo.edu.vn/wp-content/uploads/2026/01/cong1.jpg',         caption: 'Cổng trung tâm Hiệp Phát',     sub: '176 Thế Lữ, TP. Hồ Chí Minh' },
          { img: '35k%20m2.png',                                                   caption: 'Sân tập lái 35.000m²',         sub: 'Toàn cảnh sân chuẩn QCVN 40:2024' },
          { img: 'tt%20s%C3%A1t%20h%E1%BA%A1ch.png',                                caption: 'Sân sát hạch chuẩn Loại 1',    sub: 'Thiết bị chấm điểm tự động' },
          // TODO: thay ảnh sau
          { img: 'toa%20nha.png',                                                  caption: 'Khuôn viên trung tâm',         sub: 'Không gian rộng rãi, xanh mát' },
        ],
        'hoat-dong': [
          { img: 'IT.png',                                                         caption: 'Phòng học lý thuyết',          sub: 'Trang bị máy tính, học trên nền tảng số' },
          { img: 'https://hpo.edu.vn/wp-content/uploads/2026/01/cabin.png',         caption: 'Cabin học lái mô phỏng',       sub: 'Công nghệ thực tế ảo' },
          { img: 'xe%20tap%20lai-Photoroom.png',                                   caption: 'Xe tập lái Toyota Vios',       sub: 'Toyota Vios & Isuzu đời mới' },
          // TODO: thay 2 ảnh sau
          { img: 'IT.png',                                                         caption: 'Học trên nền tảng số',         sub: 'Nền tảng đa thiết bị · Windows · iOS · Android' },
          { img: 'https://hpo.edu.vn/wp-content/uploads/2026/01/cabin.png',         caption: 'Thực hành cabin mô phỏng',     sub: 'Rèn luyện kỹ năng lái xe' },
        ],
        // 'all' = tất cả ảnh gộp lại, dùng cho phương án B (classic stack)
        'all': [
          { img: 'top%205.png',                                                    caption: 'Top 5 ASEAN Strong Brand',     sub: 'Vinh danh tại Singapore · 04/2026' },
          { img: 'cup%20va%20bang.png',                                            caption: 'Cúp & bằng khen',              sub: 'Kỷ niệm chương vinh danh' },
          { img: 'hop%20bao.png',                                                  caption: 'Tặng 40 suất học · 1 tỷ đồng', sub: 'Họp báo trao tặng Bộ Tư lệnh TP.HCM · 15/08/2025' },
          { img: 'hop%20bao%202.png',                                              caption: 'Hội nghị đào tạo Hiệp Phát',   sub: 'Đồng hành cùng lực lượng vũ trang' },
          { img: 'toa%20nha.png',                                                  caption: 'Tòa nhà trung tâm Hiệp Phát',  sub: 'Cơ sở vật chất khang trang' },
          { img: 'https://hpo.edu.vn/wp-content/uploads/2026/01/cong1.jpg',         caption: 'Cổng trung tâm Hiệp Phát',     sub: '176 Thế Lữ, TP. Hồ Chí Minh' },
          { img: '35k%20m2.png',                                                   caption: 'Sân tập lái 35.000m²',         sub: 'Toàn cảnh sân chuẩn QCVN 40:2024' },
          { img: 'tt%20s%C3%A1t%20h%E1%BA%A1ch.png',                                caption: 'Sân sát hạch chuẩn Loại 1',    sub: 'Thiết bị chấm điểm tự động' },
          { img: 'IT.png',                                                         caption: 'Phòng học lý thuyết',          sub: 'Trang bị máy tính, học trên nền tảng số' },
          { img: 'https://hpo.edu.vn/wp-content/uploads/2026/01/cabin.png',         caption: 'Cabin học lái mô phỏng',       sub: 'Công nghệ thực tế ảo' },
          { img: 'xe%20tap%20lai-Photoroom.png',                                   caption: 'Xe tập lái Toyota Vios',       sub: 'Toyota Vios & Isuzu đời mới' },
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
        lbCap.innerHTML = `${item.caption || ''}<small>${(idx+1)}/${list().length}${item.sub ? ' · ' + item.sub : ''}</small>`;
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

    /* Curriculum — Video lightbox (dùng chung cho 3 phương án) */
    (() => {
      const videos = {
        '01': { src: 'mon-01-phap-luat.mp4',  title: 'Pháp luật về giao thông đường bộ',          tag: 'Lý thuyết' },
        '02': { src: 'mon-02-cau-tao.mp4',     title: 'Cấu tạo và sửa chữa thông thường',           tag: 'Lý thuyết' },
        '03': { src: 'mon-03-dao-duc.mp4',     title: 'Đạo đức, văn hoá giao thông & PCCC',         tag: 'Lý thuyết' },
        '04': { src: 'mon-04-ky-thuat.mp4',    title: 'Kỹ thuật lái xe',                            tag: 'Thực hành' },
        '05': { src: 'mon-05-mo-phong.mp4',    title: 'Phần mềm mô phỏng tình huống giao thông',    tag: 'Mô phỏng' },
        '06': { src: 'mon-06-thuc-hanh.mp4',   title: 'Thực hành lái xe — Sa hình',                 tag: 'Thực hành' },
      };

      const lb = document.getElementById('videoLb');
      const video = document.getElementById('vlbVideo');
      const titleEl = document.getElementById('vlbTitle');
      const subEl = document.getElementById('vlbSub');
      const closeBtn = document.getElementById('vlbClose');
      if (!lb || !video) return;

      const open = (mon) => {
        const v = videos[mon];
        if (!v) return;
        video.src = v.src;
        // Cập nhật title (giữ nguyên <small> trong title element)
        titleEl.firstChild.textContent = v.title;
        subEl.textContent = `Môn ${mon} · ${v.tag}`;
        lb.classList.add('is-open');
        document.body.style.overflow = 'hidden';
        // Bắt đầu phát sau khi modal hiện
        setTimeout(() => video.play().catch(() => {}), 100);
      };
      const close = () => {
        video.pause();
        video.removeAttribute('src');
        video.load();
        lb.classList.remove('is-open');
        document.body.style.overflow = '';
      };

      // Phương án A (.curr-card) + C (.step-item): click cả card mở video
      document.querySelectorAll('.curr-card[data-mon], .step-item[data-mon]').forEach((el) => {
        el.addEventListener('click', () => {
          const mon = el.dataset.mon;
          if (mon) open(mon);
        });
        el.style.cursor = 'pointer';
      });
      // Phương án B (.syll-row): chỉ nút .syll-play mở video
      document.querySelectorAll('.syll-row .syll-play').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const row = btn.closest('[data-mon]');
          if (row && row.dataset.mon) open(row.dataset.mon);
        });
      });

      closeBtn.addEventListener('click', close);
      lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
      document.addEventListener('keydown', (e) => {
        if (lb.classList.contains('is-open') && e.key === 'Escape') close();
      });
    })();

    /* Khoảnh khắc — Marquee JS-driven: auto-scroll + mouse drag + click-to-lightbox */
    (() => {
      const stages = document.querySelectorAll('.marq-stage');
      if (!stages.length) return;

      const DRAG_THRESHOLD = 6; // px

      stages.forEach((stage) => {
        const tracks = Array.from(stage.querySelectorAll('.marq-track, .marq-row'));
        if (!tracks.length) return;

        // Speed per track: row-2 chạy ngược, B (polaroid wall) chậm hơn
        const speeds = tracks.map((t) => {
          if (t.classList.contains('row-2')) return -55;
          if (stage.classList.contains('marq-stage--b')) return 35;
          if (stage.classList.contains('marq-stage--c')) return 50;
          return 55;
        });
        const offsets = tracks.map(() => 0);

        let paused = false;
        let dragging = false;
        let dragStartX = 0;
        let dragStartOffsets = [];
        let movedDistance = 0;
        let lastTs = 0;

        const tick = (ts) => {
          if (!lastTs) lastTs = ts;
          const dt = Math.min((ts - lastTs) / 1000, 0.05);
          lastTs = ts;
          tracks.forEach((track, i) => {
            if (!paused && !dragging) offsets[i] += speeds[i] * dt;
            const halfWidth = track.scrollWidth / 2;
            if (halfWidth > 0) {
              if (offsets[i] >= halfWidth) offsets[i] -= halfWidth;
              if (offsets[i] < 0) offsets[i] += halfWidth;
            }
            track.style.transform = `translate3d(${-offsets[i]}px, 0, 0)`;
          });
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);

        // Hover pause
        stage.addEventListener('mouseenter', () => { paused = true; });
        stage.addEventListener('mouseleave', () => { paused = false; });

        // Mouse drag
        stage.addEventListener('mousedown', (e) => {
          if (e.button !== 0) return;
          dragging = true;
          dragStartX = e.clientX;
          dragStartOffsets = [...offsets];
          movedDistance = 0;
          stage.classList.add('is-dragging');
          e.preventDefault();
        });
        const onMouseMove = (e) => {
          if (!dragging) return;
          const dx = e.clientX - dragStartX;
          movedDistance = Math.abs(dx);
          tracks.forEach((_, i) => { offsets[i] = dragStartOffsets[i] - dx; });
        };
        const onMouseUp = () => {
          if (!dragging) return;
          dragging = false;
          stage.classList.remove('is-dragging');
          // Giữ movedDistance để click handler suppress nếu cần (reset sau timeout)
          setTimeout(() => { movedDistance = 0; }, 60);
        };
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);

        // Touch drag
        stage.addEventListener('touchstart', (e) => {
          dragging = true;
          dragStartX = e.touches[0].clientX;
          dragStartOffsets = [...offsets];
          movedDistance = 0;
          stage.classList.add('is-dragging');
        }, { passive: true });
        stage.addEventListener('touchmove', (e) => {
          if (!dragging) return;
          const dx = e.touches[0].clientX - dragStartX;
          movedDistance = Math.abs(dx);
          tracks.forEach((_, i) => { offsets[i] = dragStartOffsets[i] - dx; });
        }, { passive: true });
        stage.addEventListener('touchend', () => {
          if (!dragging) return;
          dragging = false;
          stage.classList.remove('is-dragging');
          setTimeout(() => { movedDistance = 0; }, 60);
        });

        // Click → lightbox (suppress nếu vừa drag)
        const clickables = stage.querySelectorAll('.marq-img, .marq-polaroid');
        clickables.forEach((item) => {
          item.addEventListener('click', (e) => {
            if (movedDistance > DRAG_THRESHOLD) { e.preventDefault(); e.stopPropagation(); return; }
            const idx = parseInt(item.dataset.idx || '0', 10);
            if (typeof window.openMarqueeImage === 'function') {
              window.openMarqueeImage(idx);
            }
          });
        });
      });
    })();

    /* Syllabus down-arrow accordion (row 01 → Biển báo · row 06 → Sa hình) */
    (() => {
      const arrows = document.querySelectorAll('.syll-down');
      if (!arrows.length) return;
      arrows.forEach((arrow) => {
        arrow.addEventListener('click', (e) => {
          e.stopPropagation();
          const target = arrow.dataset.toggle;
          const detail = document.getElementById('syllDetail-' + target);
          if (!detail) return;
          const isOpen = arrow.getAttribute('aria-expanded') === 'true';
          document.querySelectorAll('.syll-down').forEach(a => a.setAttribute('aria-expanded', 'false'));
          document.querySelectorAll('.syll-detail').forEach(d => d.classList.remove('is-open'));
          if (!isOpen) {
            arrow.setAttribute('aria-expanded', 'true');
            detail.classList.add('is-open');
            // Bỏ auto-scroll: user tự cuộn để xem
          }
        });
      });

      /* Click bất kỳ chỗ nào trên syll-row (trừ play button) cũng toggle accordion */
      document.querySelectorAll('.syll-row').forEach((row) => {
        const arrow = row.querySelector('.syll-down');
        if (!arrow) return; // chỉ row có down arrow mới clickable
        row.style.cursor = 'pointer';
        row.addEventListener('click', (e) => {
          // Bỏ qua nếu click vào nút play (có handler riêng cho video)
          if (e.target.closest('.syll-play')) return;
          // Bỏ qua nếu click chính vào mũi tên (handler arrow đã chạy)
          if (e.target.closest('.syll-down')) return;
          arrow.click();
        });
      });

    })();

    /* Khoảnh khắc — Event Hero Slider */
    (() => {
      const stage = document.getElementById('evtStage');
      const slides = document.getElementById('evtSlides');
      if (!stage || !slides) return;
      const items = slides.querySelectorAll('.evt-slide');
      const total = items.length;
      const dots = stage.querySelectorAll('.evt-dot');
      const prev = document.getElementById('evtPrev');
      const next = document.getElementById('evtNext');
      const counter = document.getElementById('evtCurrent');
      const progress = document.getElementById('evtProgress');
      let idx = 0;
      let timer = null;
      let progressTimer = null;
      let paused = false;
      const AUTO_MS = 6000;

      const go = (i) => {
        idx = (i + total) % total;
        slides.style.transform = `translateX(-${idx * 100}%)`;
        dots.forEach((d, di) => d.classList.toggle('is-active', di === idx));
        if (counter) counter.textContent = String(idx + 1).padStart(2, '0');
        restart();
      };

      const restart = () => {
        clearInterval(timer);
        clearInterval(progressTimer);
        if (progress) progress.style.width = '0%';
        if (paused) return;
        let elapsed = 0;
        progressTimer = setInterval(() => {
          elapsed += 60;
          if (progress) progress.style.width = (elapsed / AUTO_MS * 100) + '%';
        }, 60);
        timer = setTimeout(() => go(idx + 1), AUTO_MS);
      };

      prev.addEventListener('click', () => go(idx - 1));
      next.addEventListener('click', () => go(idx + 1));
      dots.forEach(d => d.addEventListener('click', () => go(+d.dataset.i)));

      // Hover pause
      stage.addEventListener('mouseenter', () => { paused = true; clearInterval(timer); clearInterval(progressTimer); });
      stage.addEventListener('mouseleave', () => { paused = false; restart(); });

      // Swipe
      let sx = 0, dx = 0, dragging = false;
      const onDown = (e) => { dragging = true; sx = (e.touches ? e.touches[0].clientX : e.clientX); dx = 0; };
      const onMove = (e) => { if (!dragging) return; dx = (e.touches ? e.touches[0].clientX : e.clientX) - sx; };
      const onUp = () => {
        if (!dragging) return;
        dragging = false;
        if (Math.abs(dx) > 60) go(idx + (dx < 0 ? 1 : -1));
        dx = 0;
      };
      stage.addEventListener('mousedown', onDown);
      stage.addEventListener('touchstart', onDown, { passive: true });
      window.addEventListener('mousemove', onMove);
      window.addEventListener('touchmove', onMove, { passive: true });
      window.addEventListener('mouseup', onUp);
      window.addEventListener('touchend', onUp);

      // Start
      restart();
    })();

    /* Image lightbox — awards (2 ảnh) + event marquees (mỗi event 2-3 ảnh) */
    (() => {
      const lb = document.getElementById('imgLb');
      const lbImg = document.getElementById('imgLbImg');
      const lbCounter = document.getElementById('imgLbCounter');
      const lbClose = document.getElementById('imgLbClose');
      const lbPrev = document.getElementById('imgLbPrev');
      const lbNext = document.getElementById('imgLbNext');
      if (!lb || !lbImg) return;

      // Build group lookup từ tất cả [data-img-group]
      const groups = {};
      document.querySelectorAll('[data-img-group]').forEach((el) => {
        const g = el.dataset.imgGroup;
        const idx = parseInt(el.dataset.imgIdx || '0', 10);
        if (!groups[g]) groups[g] = [];
        // Lấy src từ <img> hoặc từ <img> con (nếu phần tử là wrapper)
        let src = el.tagName === 'IMG'
          ? el.getAttribute('src')
          : (el.querySelector('img') ? el.querySelector('img').getAttribute('src') : '');
        if (!src) return;
        // Chỉ giữ 1 entry per (group, idx) — tránh duplicate từ marquee copies
        if (!groups[g][idx]) groups[g][idx] = src;
      });

      let currentGroup = null;
      let currentIdx = 0;
      const list = () => (groups[currentGroup] || []).filter(Boolean);

      const render = () => {
        const items = list();
        if (!items.length) return;
        // Fade out → swap → fade in
        lbImg.style.opacity = '0';
        lbImg.style.transform = 'scale(0.97)';
        setTimeout(() => {
          lbImg.src = items[currentIdx];
          lbImg.style.opacity = '1';
          lbImg.style.transform = 'scale(1)';
        }, 180);
        lbCounter.textContent = `${currentIdx + 1} / ${items.length}`;
        // Ẩn nav nếu chỉ có 1 ảnh
        const single = items.length <= 1;
        lbPrev.style.display = single ? 'none' : 'flex';
        lbNext.style.display = single ? 'none' : 'flex';
      };
      const open = (group, idx = 0) => {
        if (!groups[group] || !groups[group].length) return;
        currentGroup = group;
        const items = list();
        currentIdx = ((idx % items.length) + items.length) % items.length;
        render();
        lb.classList.add('is-open');
        document.body.style.overflow = 'hidden';
      };
      const close = () => {
        lb.classList.remove('is-open');
        document.body.style.overflow = '';
        currentGroup = null;
      };
      const nav = (delta) => {
        if (!currentGroup) return;
        const items = list();
        currentIdx = (currentIdx + delta + items.length) % items.length;
        render();
      };

      // Gắn click vào mọi phần tử có [data-img-group]
      document.querySelectorAll('[data-img-group]').forEach((el) => {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          const group = el.dataset.imgGroup;
          const idx = parseInt(el.dataset.imgIdx || '0', 10);
          open(group, idx);
        });
        el.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const group = el.dataset.imgGroup;
            const idx = parseInt(el.dataset.imgIdx || '0', 10);
            open(group, idx);
          }
        });
      });

      lbClose.addEventListener('click', close);
      lbPrev.addEventListener('click', () => nav(-1));
      lbNext.addEventListener('click', () => nav(1));
      lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
      document.addEventListener('keydown', (e) => {
        if (!lb.classList.contains('is-open')) return;
        if (e.key === 'Escape') close();
        if (e.key === 'ArrowLeft') nav(-1);
        if (e.key === 'ArrowRight') nav(1);
      });
    })();

    /* Event blocks — drag-to-scroll (kéo chuột trái/phải, auto-resume) */
    (() => {
      const marqs = document.querySelectorAll('.event-block-marq');
      if (!marqs.length) return;

      marqs.forEach((marq) => {
        const track = marq.querySelector('.event-block-track');
        if (!track) return;

        const DURATION = 38; // giây — phải match CSS animation
        const DRAG_THRESHOLD = 6;
        let dragging = false;
        let startX = 0;
        let startTranslate = 0;
        let currentTranslate = 0;
        let movedDistance = 0;

        const getTranslateX = () => {
          const t = getComputedStyle(track).transform;
          if (!t || t === 'none') return 0;
          const m = new DOMMatrixReadOnly(t);
          return m.m41;
        };

        const onDown = (e) => {
          if (e.touches) {
            startX = e.touches[0].clientX;
          } else {
            if (e.button !== 0) return;
            startX = e.clientX;
          }
          startTranslate = getTranslateX();
          currentTranslate = startTranslate;
          movedDistance = 0;
          dragging = true;
          // Đóng băng vị trí trước khi chuyển sang manual transform
          track.style.transform = `translateX(${startTranslate}px)`;
          marq.classList.add('is-dragging');
          if (!e.touches) e.preventDefault();
        };

        const onMove = (e) => {
          if (!dragging) return;
          const clientX = e.touches ? e.touches[0].clientX : e.clientX;
          const dx = clientX - startX;
          movedDistance = Math.abs(dx);
          currentTranslate = startTranslate + dx;
          track.style.transform = `translateX(${currentTranslate}px)`;
        };

        const onUp = () => {
          if (!dragging) return;
          dragging = false;
          marq.classList.remove('is-dragging');

          // Tính progress để animation resume từ đúng vị trí (tránh nhảy)
          const halfWidth = track.scrollWidth / 2;
          if (halfWidth > 0) {
            let progress = -currentTranslate / halfWidth;
            // Normalize 0-1
            progress = ((progress % 1) + 1) % 1;
            const delay = -(progress * DURATION);
            // Reset inline transform để animation tiếp tục
            track.style.transform = '';
            track.style.animationName = 'none';
            // Force reflow để reset animation
            void track.offsetWidth;
            track.style.animationName = '';
            track.style.animationDelay = `${delay}s`;
          } else {
            track.style.transform = '';
          }

          // Giữ movedDistance 80ms để suppress click ngay sau drag
          setTimeout(() => { movedDistance = 0; }, 80);
        };

        marq.addEventListener('mousedown', onDown);
        marq.addEventListener('touchstart', onDown, { passive: true });
        window.addEventListener('mousemove', onMove);
        window.addEventListener('touchmove', onMove, { passive: true });
        window.addEventListener('mouseup', onUp);
        window.addEventListener('touchend', onUp);

        // Suppress click open lightbox nếu vừa drag
        track.querySelectorAll('img').forEach((img) => {
          img.addEventListener('click', (e) => {
            if (movedDistance > DRAG_THRESHOLD) {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
            }
          }, true); // capture phase để chặn trước handler khác
        });
      });
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
