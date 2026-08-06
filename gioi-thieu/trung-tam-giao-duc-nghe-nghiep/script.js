(() => {
  const revealItems = document.querySelectorAll("[data-reveal]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px" });
    revealItems.forEach((item) => observer.observe(item));
  }

  const burger = document.getElementById("burger");
  const mobileMenu = document.getElementById("mobileMenu");
  const mobileClose = document.getElementById("mobileClose");
  const toggleMenu = (open) => {
    mobileMenu?.classList.toggle("is-open", open);
    document.body.style.overflow = open ? "hidden" : "";
    burger?.setAttribute("aria-expanded", String(open));
  };
  burger?.addEventListener("click", () => toggleMenu(true));
  mobileClose?.addEventListener("click", () => toggleMenu(false));
  mobileMenu?.addEventListener("click", (event) => {
    if (event.target === mobileMenu || event.target.closest("a")) toggleMenu(false);
  });

  document.querySelectorAll("[data-carousel]").forEach((carousel) => {
    const slides = [...carousel.querySelectorAll(".carousel-track img")];
    const dotsWrap = carousel.querySelector(".carousel-dots");
    const previous = carousel.querySelector(".carousel-prev");
    const next = carousel.querySelector(".carousel-next");
    let activeIndex = 0;
    let autoplayId;

    const dots = slides.map((_, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = `carousel-dot${index === 0 ? " is-active" : ""}`;
      dot.setAttribute("aria-label", `Xem ảnh ${index + 1}`);
      dot.addEventListener("click", () => {
        showSlide(index);
        restartAutoplay();
      });
      dotsWrap.append(dot);
      return dot;
    });

    const showSlide = (index) => {
      activeIndex = (index + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        const isActive = slideIndex === activeIndex;
        slide.classList.toggle("is-active", isActive);
        slide.setAttribute("aria-hidden", String(!isActive));
      });
      dots.forEach((dot, dotIndex) => dot.classList.toggle("is-active", dotIndex === activeIndex));
    };
    const stopAutoplay = () => window.clearInterval(autoplayId);
    const startAutoplay = () => {
      stopAutoplay();
      if (!reduceMotion && !document.hidden && slides.length > 1) {
        autoplayId = window.setInterval(() => showSlide(activeIndex + 1), 3500);
      }
    };
    const restartAutoplay = () => {
      stopAutoplay();
      startAutoplay();
    };

    previous.addEventListener("click", () => { showSlide(activeIndex - 1); restartAutoplay(); });
    next.addEventListener("click", () => { showSlide(activeIndex + 1); restartAutoplay(); });
    carousel.addEventListener("mouseenter", stopAutoplay);
    carousel.addEventListener("mouseleave", startAutoplay);
    carousel.addEventListener("focusin", stopAutoplay);
    carousel.addEventListener("focusout", startAutoplay);
    document.addEventListener("visibilitychange", () => document.hidden ? stopAutoplay() : startAutoplay());
    showSlide(0);
    startAutoplay();
  });

  document.querySelectorAll("[data-team-carousel]").forEach((carousel) => {
    const track = carousel.querySelector(".team-track");
    const slides = [...carousel.querySelectorAll(".team-slide")];
    const previous = carousel.querySelector(".team-prev");
    const next = carousel.querySelector(".team-next");
    const current = carousel.querySelector(".team-count strong");
    const progress = carousel.querySelector(".team-progress span");
    let activeIndex = 0;
    let autoplayId;

    const visibleCount = () => window.innerWidth <= 620 ? 1 : window.innerWidth <= 900 ? 2 : 3;
    const maxIndex = () => Math.max(0, slides.length - visibleCount());
    const render = () => {
      activeIndex = Math.min(activeIndex, maxIndex());
      const slideWidth = slides[0].getBoundingClientRect().width;
      const gap = parseFloat(getComputedStyle(track).gap) || 0;
      track.style.transform = `translateX(-${activeIndex * (slideWidth + gap)}px)`;
      current.textContent = String(activeIndex + 1).padStart(2, "0");
      const positions = maxIndex() + 1;
      progress.style.width = `${100 / positions}%`;
      progress.style.transform = `translateX(${activeIndex * 100}%)`;
    };
    const goTo = (index) => {
      activeIndex = index > maxIndex() ? 0 : index < 0 ? maxIndex() : index;
      render();
    };
    const stopAutoplay = () => window.clearInterval(autoplayId);
    const startAutoplay = () => {
      stopAutoplay();
      if (!reduceMotion && !document.hidden) autoplayId = window.setInterval(() => goTo(activeIndex + 1), 3500);
    };
    const restartAutoplay = () => { stopAutoplay(); startAutoplay(); };

    previous.addEventListener("click", () => { goTo(activeIndex - 1); restartAutoplay(); });
    next.addEventListener("click", () => { goTo(activeIndex + 1); restartAutoplay(); });
    carousel.addEventListener("mouseenter", stopAutoplay);
    carousel.addEventListener("mouseleave", startAutoplay);
    carousel.addEventListener("focusin", stopAutoplay);
    carousel.addEventListener("focusout", startAutoplay);
    window.addEventListener("resize", render);
    document.addEventListener("visibilitychange", () => document.hidden ? stopAutoplay() : startAutoplay());
    render();
    startAutoplay();
  });

  const modal = document.getElementById("imageModal");
  const modalImage = modal?.querySelector(".image-modal__image");
  const modalCaption = modal?.querySelector(".image-modal__caption");
  const modalDots = modal?.querySelector(".image-modal__dots");
  const modalPrevious = modal?.querySelector(".image-modal__prev");
  const modalNext = modal?.querySelector(".image-modal__next");
  const modalClose = modal?.querySelector(".image-modal__close");
  let modalSlides = [];
  let modalIndex = 0;
  let lastFocusedElement = null;

  const renderModal = () => {
    const slide = modalSlides[modalIndex];
    if (!slide) return;
    modalImage.src = slide.currentSrc || slide.src;
    modalImage.alt = slide.alt || "Hình ảnh Hiệp Phát";
    modalCaption.textContent = slide.alt || "";
    [...modalDots.children].forEach((dot, index) => dot.classList.toggle("is-active", index === modalIndex));
  };
  const showModalSlide = (index) => {
    modalIndex = (index + modalSlides.length) % modalSlides.length;
    renderModal();
  };
  const openModal = (slides, index) => {
    modalSlides = slides;
    modalIndex = index;
    lastFocusedElement = document.activeElement;
    modalDots.replaceChildren();
    modalSlides.forEach((_, dotIndex) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = `image-modal__dot${dotIndex === modalIndex ? " is-active" : ""}`;
      dot.setAttribute("aria-label", `Xem hình ảnh ${dotIndex + 1}`);
      dot.addEventListener("click", () => showModalSlide(dotIndex));
      modalDots.append(dot);
    });
    renderModal();
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    modalClose.focus();
  };
  const closeModal = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    modalImage.src = "";
    document.body.style.overflow = "";
    lastFocusedElement?.focus();
  };

  document.querySelectorAll("[data-carousel], [data-team-carousel]").forEach((carousel) => {
    const images = [...carousel.querySelectorAll(".carousel-track img, .team-slide img")];
    images.forEach((image, index) => image.addEventListener("click", () => openModal(images, index)));
  });
  modalPrevious?.addEventListener("click", () => showModalSlide(modalIndex - 1));
  modalNext?.addEventListener("click", () => showModalSlide(modalIndex + 1));
  modal?.querySelectorAll("[data-modal-close]").forEach((button) => button.addEventListener("click", closeModal));
  document.addEventListener("keydown", (event) => {
    if (!modal?.classList.contains("is-open")) return;
    if (event.key === "Escape") closeModal();
    if (event.key === "ArrowLeft") showModalSlide(modalIndex - 1);
    if (event.key === "ArrowRight") showModalSlide(modalIndex + 1);
  });
  document.getElementById("backToTop")?.addEventListener("click", () => {
    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    window.requestAnimationFrame(() => { root.style.scrollBehavior = previousBehavior; });
  });
})();
