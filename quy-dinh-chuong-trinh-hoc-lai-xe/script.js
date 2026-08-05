(() => {
  document.documentElement.classList.add("reveal-ready");

  const root = document.documentElement;
  const siteNav = document.getElementById("navbar");
  const subnav = document.querySelector(".process-subnav");
  const subnavLinks = Array.from(document.querySelectorAll(".process-subnav__link"));
  const sections = subnavLinks
    .map((link) => document.querySelector(link.hash))
    .filter(Boolean);

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let ticking = false;
  let subnavHideTimer = 0;

  const isSubnavSticky = () => {
    if (!subnav) return false;
    const navHeight = siteNav?.offsetHeight || 0;
    return window.scrollY > 0 && subnav.getBoundingClientRect().top <= navHeight + 1;
  };

  const showSubnavTemporarily = () => {
    if (!subnav) return;
    window.clearTimeout(subnavHideTimer);
    subnav.classList.remove("is-auto-hidden");
    subnav.classList.add("is-scroll-active");

    subnavHideTimer = window.setTimeout(() => {
      subnav.classList.remove("is-scroll-active");
      if (isSubnavSticky() && !subnav.matches(":hover, :focus-within")) {
        subnav.classList.add("is-auto-hidden");
      }
    }, 1200);
  };

  const setStickyOffset = () => {
    if (!siteNav) return;
    root.style.setProperty("--nav-height", `${siteNav.offsetHeight}px`);
  };

  const setActiveLink = (id) => {
    subnavLinks.forEach((link) => {
      const isActive = link.hash === `#${id}`;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  const getCurrentSectionId = () => {
    const navHeight = siteNav?.offsetHeight || 0;
    const subnavHeight = subnav?.offsetHeight || 0;
    const activationLine = Math.max(
      navHeight + subnavHeight + 150,
      window.innerHeight * 0.34,
    );
    let currentId = sections[0]?.id;

    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= activationLine && rect.bottom > activationLine) {
        currentId = section.id;
      }
    });

    return currentId;
  };

  const updateOnScroll = () => {
    ticking = false;
    siteNav?.classList.toggle("is-scrolled", window.scrollY > 12);

    const currentId = getCurrentSectionId();
    if (currentId) {
      setActiveLink(currentId);
    }
  };

  const requestScrollUpdate = () => {
    showSubnavTemporarily();
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateOnScroll);
  };

  subnav?.addEventListener("mouseenter", showSubnavTemporarily);
  subnav?.addEventListener("mouseleave", showSubnavTemporarily);
  subnav?.addEventListener("focusin", showSubnavTemporarily);
  document.addEventListener("pointermove", (event) => {
    if (!subnav?.classList.contains("is-auto-hidden")) return;
    const revealEdge = (siteNav?.offsetHeight || 0) + 28;
    if (event.clientY <= revealEdge) showSubnavTemporarily();
  });

  subnavLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = document.querySelector(link.hash);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
      setActiveLink(target.id);
    });
  });

  const revealItems = Array.from(document.querySelectorAll("[data-reveal]"));
  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.14 },
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  const autoDemoCards = [
    document.querySelector(".cccd-stack")?.closest(".admission-card"),
    document.querySelector(".vneid-container")?.closest(".admission-card"),
    document.querySelector(".gplx-stack")?.closest(".admission-card"),
    document.querySelector(".sdt-container")?.closest(".admission-card"),
    document.querySelector(".photo-stack-container")?.closest(".admission-card"),
  ].filter(Boolean);

  if (autoDemoCards.length && !prefersReducedMotion) {
    const AUTO_START_DELAY = 2200;
    const AUTO_STAGGER = 650;
    const AUTO_ACTIVE_DURATION = 2200;
    const AUTO_GAP = 4200;
    const AUTO_INTERACTION_DELAY = 900;

    const createAutoDemo = (card, index) => {
      let isVisible = false;
      let startTimer = null;
      let finishTimer = null;

      const clearStartTimer = () => {
        if (startTimer === null) return;
        window.clearTimeout(startTimer);
        startTimer = null;
      };

      const clearFinishTimer = () => {
        if (finishTimer === null) return;
        window.clearTimeout(finishTimer);
        finishTimer = null;
      };

      const deactivate = () => {
        card.classList.remove("is-auto-active");
      };

      const pause = () => {
        clearStartTimer();
        clearFinishTimer();
        deactivate();
      };

      const isInteracting = () =>
        card.matches(":hover") || card.contains(document.activeElement);

      const schedule = (delay = AUTO_GAP) => {
        if (
          startTimer !== null ||
          finishTimer !== null ||
          document.hidden ||
          !isVisible ||
          isInteracting()
        ) {
          return;
        }

        startTimer = window.setTimeout(run, delay);
      };

      const finish = () => {
        finishTimer = null;
        deactivate();
        schedule(AUTO_GAP);
      };

      function run() {
        startTimer = null;
        if (document.hidden || !isVisible || isInteracting()) {
          schedule(AUTO_INTERACTION_DELAY);
          return;
        }

        card.classList.add("is-auto-active");
        finishTimer = window.setTimeout(finish, AUTO_ACTIVE_DURATION);
      }

      card.addEventListener("mouseenter", pause);
      card.addEventListener("mouseleave", () => schedule(AUTO_INTERACTION_DELAY));
      card.addEventListener("focusin", pause);
      card.addEventListener("focusout", (event) => {
        if (!card.contains(event.relatedTarget)) {
          window.setTimeout(() => schedule(AUTO_INTERACTION_DELAY), 0);
        }
      });

      return {
        setVisible(nextVisible) {
          if (isVisible === nextVisible) return;
          isVisible = nextVisible;
          pause();
          if (isVisible) schedule(AUTO_START_DELAY + index * AUTO_STAGGER);
        },
        pause,
        restart() {
          pause();
          schedule(AUTO_START_DELAY + index * AUTO_STAGGER);
        },
      };
    };

    const autoDemoControllers = autoDemoCards.map(createAutoDemo);

    if ("IntersectionObserver" in window) {
      const autoDemoObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const controller = autoDemoControllers[autoDemoCards.indexOf(entry.target)];
            controller?.setVisible(entry.isIntersecting && entry.intersectionRatio >= 0.25);
          });
        },
        { threshold: [0, 0.25, 0.6] },
      );
      autoDemoCards.forEach((card) => autoDemoObserver.observe(card));
    } else {
      autoDemoControllers.forEach((controller) => controller.setVisible(true));
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        autoDemoControllers.forEach((controller) => controller.pause());
      } else {
        autoDemoControllers.forEach((controller) => controller.restart());
      }
    });
  }

  setStickyOffset();
  updateOnScroll();
  window.addEventListener("resize", setStickyOffset);
  window.addEventListener("scroll", requestScrollUpdate, { passive: true });

  /* ────────────────────────────────────────
     Modal: Chương trình khung môn học
     Click ô .mon-cell → mở modal tương ứng
     ──────────────────────────────────────── */
  const monModal = document.getElementById("monModal");
  if (monModal) {
    const monCells = document.querySelectorAll(".mon-cell[data-mon-modal]");
    const closeTriggers = monModal.querySelectorAll("[data-mon-modal-close]");
    const contents = monModal.querySelectorAll("[data-mon-content]");
    const titleEl = document.getElementById("monModalTitle");
    let lastFocused = null;

    const showContent = (key, sectionFilter = "") => {
      contents.forEach((el) => {
        el.hidden = el.dataset.monContent !== key;
      });

      const activeContent = Array.from(contents).find(
        (el) => el.dataset.monContent === key,
      );
      if (!activeContent) return;

      const allowedSections = sectionFilter
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      activeContent.querySelectorAll("[data-mon-section]").forEach((section) => {
        section.hidden =
          allowedSections.length > 0 &&
          !allowedSections.includes(section.dataset.monSection);
      });
    };

    const openModal = (key, title, sectionFilter) => {
      showContent(key, sectionFilter);
      if (titleEl && title) titleEl.textContent = title;
      monModal.hidden = false;
      // Force reflow để transition chạy
      void monModal.offsetWidth;
      monModal.classList.add("is-open");
      document.body.classList.add("mon-modal-open");
      const closeBtn = monModal.querySelector(".mon-modal__close");
      if (closeBtn) closeBtn.focus({ preventScroll: true });
    };

    const closeModal = () => {
      monModal.classList.remove("is-open");
      document.body.classList.remove("mon-modal-open");
      const onEnd = () => {
        monModal.hidden = true;
        monModal.removeEventListener("transitionend", onEnd);
      };
      monModal.addEventListener("transitionend", onEnd);
      // Fallback nếu transitionend không bắn (vd hidden trước khi animate)
      setTimeout(() => {
        if (!monModal.classList.contains("is-open")) monModal.hidden = true;
      }, 400);
      if (lastFocused && typeof lastFocused.focus === "function") {
        lastFocused.focus({ preventScroll: true });
      }
    };

    monCells.forEach((cell) => {
      const open = (e) => {
        e.preventDefault();
        lastFocused = cell;
        openModal(
          cell.dataset.monModal,
          cell.dataset.monTitle,
          cell.dataset.monSections,
        );
      };
      cell.addEventListener("click", open);
      cell.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") open(e);
      });
    });

    closeTriggers.forEach((t) => t.addEventListener("click", closeModal));

    document.addEventListener("keydown", (e) => {
      if (document.getElementById("bbDetailModal")?.classList.contains("is-open")) {
        return;
      }
      if (e.key === "Escape" && monModal.classList.contains("is-open")) {
        closeModal();
      }
    });
  }

  /* ────────────────────────────────────────
     Training tabs (mobile): chọn hạng GPLX
     ──────────────────────────────────────── */
  const bbDetailModal = document.getElementById("bbDetailModal");
  const bbDetailFrame = document.getElementById("bbDetailFrame");
  const bbDetailTitle = document.getElementById("bbDetailTitle");
  const bbDetailTriggers = document.querySelectorAll("[data-bb-detail]");

  if (bbDetailModal && bbDetailFrame && bbDetailTriggers.length) {
    const bbTitles = {
      "bien-cam": "Biển báo cấm",
      "nguy-hiem": "Biển nguy hiểm",
      "hieu-lenh": "Biển hiệu lệnh",
      "chi-dan": "Biển chỉ dẫn",
      "bien-phu": "Biển phụ",
    };
    let bbHtmlPromise = null;
    let bbLastFocused = null;
    const bbSharedStyleUrl = new URL("../style.css", window.location.href).href;

    const createBbDocument = (content, target) => `<!doctype html>
      <html lang="vi">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <link rel="stylesheet" href="${bbSharedStyleUrl}">
          <style>
            html,body,#bbViewModal{height:100%;margin:0;background:#f8fafc}
            html,body{overflow:hidden}
            #bbViewModal{display:flex;flex-direction:column;min-height:0}
            #bbViewModal>.bb-view-scroll{height:100%;min-height:0;overflow-y:auto}
          </style>
        </head>
        <body>
          <div id="bbViewModal">
            <div class="bb-view-scroll">
              ${content}
            </div>
          </div>
          <script>
            (() => {
              const target = ${JSON.stringify(target)};
              const goTo = (id, behavior = 'auto') => {
                document.querySelectorAll('[data-hpo-tab]').forEach((tab) => {
                  tab.classList.toggle('is-active', tab.getAttribute('data-hpo-tab') === id);
                });
                document.querySelector('[data-hpo-pane="' + id + '"]')
                  ?.scrollIntoView({ behavior, block: 'start' });
              };
              requestAnimationFrame(() => goTo(target));
              document.querySelectorAll('[data-hpo-tab]').forEach((tab) => {
                tab.addEventListener('click', (event) => {
                  event.preventDefault();
                  goTo(tab.getAttribute('data-hpo-tab'), 'smooth');
                });
              });
            })();
          <\/script>
        </body>
      </html>`;

    const openBbDetail = async (target, trigger) => {
      bbLastFocused = trigger;
      if (bbDetailTitle) bbDetailTitle.textContent = bbTitles[target] || "Chi tiết biển báo";
      bbDetailModal.classList.add("is-open");
      bbDetailModal.setAttribute("aria-hidden", "false");

      try {
        bbHtmlPromise ||= fetch("../assets/data/bien-bao-view.html").then((response) => {
          if (!response.ok) throw new Error("Không tải được nội dung biển báo");
          return response.text();
        });
        bbDetailFrame.srcdoc = createBbDocument(await bbHtmlPromise, target);
      } catch (_) {
        bbDetailFrame.srcdoc = "<p style='padding:24px;font-family:sans-serif'>Không tải được nội dung biển báo.</p>";
      }

      bbDetailModal.querySelector("[data-bb-detail-close]")?.focus({ preventScroll: true });
    };

    const closeBbDetail = () => {
      bbDetailModal.classList.remove("is-open");
      bbDetailModal.setAttribute("aria-hidden", "true");
      bbLastFocused?.focus({ preventScroll: true });
    };

    bbDetailTriggers.forEach((trigger) => {
      trigger.addEventListener("click", () => openBbDetail(trigger.dataset.bbDetail, trigger));
    });
    bbDetailModal.querySelector("[data-bb-detail-close]")?.addEventListener("click", closeBbDetail);
    bbDetailModal.addEventListener("click", (event) => {
      if (event.target === bbDetailModal) closeBbDetail();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && bbDetailModal.classList.contains("is-open")) {
        closeBbDetail();
      }
    });
  }

  const trainingTabs = document.querySelectorAll("[data-training-tab]");
  const trainingTable = document.querySelector(".training-table");
  const mobileHangLabel = document.querySelector("[data-mobile-hang-label]");
  const HANG_LABELS = {
    bauto: "Hạng B số tự động",
    bmanual: "Hạng B cơ khí",
    c1: "Hạng C1",
  };

  if (trainingTabs.length && trainingTable) {
    trainingTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const hang = tab.dataset.trainingTab;
        if (!hang) return;
        trainingTabs.forEach((t) => {
          const isActive = t === tab;
          t.classList.toggle("is-active", isActive);
          t.setAttribute("aria-selected", isActive ? "true" : "false");
        });
        trainingTable.dataset.hang = hang;
        if (mobileHangLabel && HANG_LABELS[hang]) {
          mobileHangLabel.textContent = HANG_LABELS[hang];
        }
      });
    });
  }

  /* ────────────────────────────────────────
     Photo stack dynamic cloning
     ──────────────────────────────────────── */
  const photoStack = document.querySelector(".photo-stack");
  if (photoStack) {
    const mainImg = photoStack.querySelector(".photo-main");
    if (mainImg) {
      // Create left clone
      const leftImg = mainImg.cloneNode(true);
      leftImg.className = "photo-item photo-left";

      // Create right clone
      const rightImg = mainImg.cloneNode(true);
      rightImg.className = "photo-item photo-right";

      // Modify the original main image to be the center one
      mainImg.className = "photo-item photo-center";

      // Insert the clones into the DOM so that the stacking order is correct
      photoStack.insertBefore(leftImg, mainImg);
      photoStack.insertBefore(rightImg, mainImg);
    }
  }

  /* Bài 4 - Kỹ thuật lái xe view modal */
  (() => {
    const modal = document.getElementById('kyThuatLaiXeViewModal');
    const scroller = document.getElementById("kyThuatLaiXeViewScroll");
    const closeBtn = document.getElementById("kyThuatLaiXeViewClose");
    const title = document.getElementById("kyThuatLaiXeViewTitle");
    const triggers = document.querySelectorAll('.chap-7-button');
    const frame = document.getElementById("KyThuatLaiXeModelDetailFrame");

    if (!modal || !frame || !scroller || !closeBtn || !triggers.length) return;

    const DATA_URL = '../assets/data/ky-thuat-lai-xe-view.html';
    const TITLES = {
      'chap-7-content-1': 'Xuất phát',
      'chap-7-content-2': 'Dừng xe nhường đường cho người đi bộ',
      'chap-7-content-3': 'Dừng xe và khởi hành ngang dốc',
      'chap-7-content-4': 'Qua vệt bánh xe và đường hẹp vuông góc',
      'chap-7-content-5': 'Qua ngã tư có đèn tín hiệu giao thông',
      'chap-7-content-6': 'Đường vòng quanh co',
      'chap-7-content-7': 'Ghép xe dọc vào nơi đỗ',
      'chap-7-content-8': 'Tạm dừng ở nơi có đường sắt chạy qua',
      'chap-7-content-9': 'Thay đổi số trên đường bằng',
      'chap-7-content-10': 'Ghép xe ngang vào nơi đỗ',
      'chap-7-content-11': 'Bài kết thúc'
    };

    let htmlPromise = null;
    let loaded = false;
    let spy = null;
    let lastFocus = null;
    let previousBodyOverflow = '';

    function updateModalTitle(activeId) {
      if (title) title.textContent = TITLES[activeId];
    }

    // async function loadContent() {
    //   if (loaded) return;

    //   if (!htmlPromise) {
    //     htmlPromise = fetch(DATA_URL)
    //       .then((response) => {
    //         if (!response.ok) throw new Error('Không tải được nội dung kỹ thuật lái xe');
    //         return response.text();
    //       });
    //   }

    //   try {
    //     scroller.innerHTML = await htmlPromise;
    //     loaded = true;
    //   } catch (error) {
    //     scroller.innerHTML = '<div class="bb-view-loading">Không tải được nội dung kỹ thuật lái xe.</div>';
    //     throw error;
    //   }
    // }

    // function initSpy() {
    //   const page = scroller.querySelector('#hpo-sign-page');
    //   if (!page || !window.HPOStickyScrollSpy) return null;

    //   spy = window.HPOStickyScrollSpy.init(page, {
    //     scrollContainer: scroller,
    //     linksSelector: '#hpo-sign-tabs a[data-hpo-tab]',
    //     panesSelector: '[data-hpo-pane]',
    //     stickyWrapSelector: '#hpo-sign-sidebar-wrap',
    //     linkId: (link) => link.getAttribute('data-hpo-tab'),
    //     paneId: (pane) => pane.getAttribute('data-hpo-pane'),
    //     getOffset: () => (window.matchMedia('(max-width: 900px)').matches ? 0 : 16),
    //     onActiveChange: updateModalTitle,
    //   });

    //   return spy;
    // }

    // function waitForImages(root) {
    //   const images = Array.from(root.querySelectorAll('img'));
    //   if (!images.length) return Promise.resolve();

    //   return Promise.allSettled(images.map((img) => {
    //     if (img.complete) return Promise.resolve();

    //     return new Promise((resolve) => {
    //       img.addEventListener('load', resolve, { once: true });
    //       img.addEventListener('error', resolve, { once: true });
    //     });
    //   }));
    // }

    async function openSignView(target = 'xuat-phat') {
      lastFocus = document.activeElement;
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');

      updateModalTitle(target);

      const KTSharedStyleUrl = new URL("../style.css", window.location.href).href;

      const createBbDocument = (content, target) => `<!doctype html>
      <html lang="vi">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <link rel="stylesheet" href="${KTSharedStyleUrl}">
          <style>
            html,body,#bbViewModal{height:100%;margin:0;background:#f8fafc}
            html,body{overflow:hidden}
            #bbViewModal{display:flex;flex-direction:column;min-height:0}
            #bbViewModal>.bb-view-scroll{height:100%;min-height:0;overflow-y:auto}
          </style>
        </head>
        <body>
          <div id="bbViewModal">
            <div class="bb-view-scroll">
              ${content}
            </div>
          </div>
          <script>
            (() => {
              const target = ${JSON.stringify(target)};
              const goTo = (id, behavior = 'auto') => {
                document.querySelectorAll('[data-hpo-tab]').forEach((tab) => {
                  tab.classList.toggle('is-active', tab.getAttribute('data-hpo-tab') === id);
                });
                document.querySelector('[data-hpo-pane="' + id + '"]')
                  ?.scrollIntoView({ behavior, block: 'start' });
              };
              requestAnimationFrame(() => goTo(target));
              document.querySelectorAll('[data-hpo-tab]').forEach((tab) => {
                tab.addEventListener('click', (event) => {
                  event.preventDefault();
                  goTo(tab.getAttribute('data-hpo-tab'), 'smooth');
                });
              });
            })();
          <\/script>
        </body>
      </html>`;

      frame.srcdoc = createBbDocument(await fetch(DATA_URL).then((response) => {
        if (!response.ok) throw new Error('Không tải được nội dung kỹ thuật lái xe');
        return response.text();
      }), target);

      try {
        await loadContent();
      } catch (_) {
        return;
      }

      frame.onload = () => {

        const doc = frame.contentDocument;

        if (!doc) return;

        const target = doc.getElementById(target);

        if (!target) return;

        target.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

        target.classList.add("is-highlight");

        setTimeout(() => {
          target.classList.remove("is-highlight");
        }, 2000);

        closeBtn.focus({ preventScroll: true });
      };

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
        openSignView(trigger.dataset.target);
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

  const body = document.querySelector(".lesson-modal__body");
  const modal = document.querySelector('.lesson-modal')
  const mon360Wrapper = document.querySelector('.mon-360-wrapper')
  const asideLeft = document.getElementById('lesson-panel-left')
  const asideRight = document.getElementById('lesson-panel-right')
  const btnAsideLeft = document.getElementById('lesson-panel-button-left')
  const btnAsideRight = document.getElementById('lesson-panel-button-right')
  const lessonButtonLeft = document.getElementById('lesson-button-left')
  const lessonButtonRight = document.getElementById('lesson-button-right')
  const buttonModalClose = document.getElementById('lessonClose')
  const video = document.getElementById('lessonFrame')

  if (!modal || !mon360Wrapper) return;

  const VIDEO_360_URL = "https://www.youtube.com/embed/8DGmYr3N-DI?autoplay=1"

  mon360Wrapper.addEventListener("click", () => {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    video.src = VIDEO_360_URL
  });

  btnAsideLeft.addEventListener('click', () => {
    body.classList.toggle("hide-left");
    asideLeft.classList.add('hide')
    lessonButtonLeft.classList.add('is-open')
  })

  btnAsideRight.addEventListener('click', () => {
    body.classList.toggle("hide-right");
    asideRight.classList.add('hide')
    lessonButtonRight.classList.add('is-open')
  })

  lessonButtonLeft.addEventListener('click', () => {
    body.classList.remove("hide-left");
    asideLeft.classList.remove('hide')
    lessonButtonLeft.classList.remove('is-open')
  })

  lessonButtonRight.addEventListener('click', () => {
    body.classList.remove("hide-right");
    asideRight.classList.remove('hide')
    lessonButtonRight.classList.remove('is-open')
  })

  buttonModalClose.addEventListener('click', () => {
    modal.classList.remove('is-open')

    body.classList.remove("hide-left");
    body.classList.remove("hide-right");

    asideLeft.classList.remove('hide')
    asideRight.classList.remove('hide')

    lessonButtonLeft.classList.remove('is-open')
    lessonButtonRight.classList.remove('is-open')

    video.src = ''
  })

})();
