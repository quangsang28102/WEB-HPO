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
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateOnScroll);
  };

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

    const showContent = (key) => {
      contents.forEach((el) => {
        el.hidden = el.dataset.monContent !== key;
      });
    };

    const openModal = (key, title) => {
      showContent(key);
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
        openModal(cell.dataset.monModal, cell.dataset.monTitle);
      };
      cell.addEventListener("click", open);
      cell.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") open(e);
      });
    });

    closeTriggers.forEach((t) => t.addEventListener("click", closeModal));

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && monModal.classList.contains("is-open")) {
        closeModal();
      }
    });
  }

  /* ────────────────────────────────────────
     Training tabs (mobile): chọn hạng GPLX
     ──────────────────────────────────────── */
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
})();
