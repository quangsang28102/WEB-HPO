(() => {
    const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    ).matches;
    const reveals = document.querySelectorAll("[data-reveal]");
    if (reduceMotion || !("IntersectionObserver" in window))
        reveals.forEach((el) => el.classList.add("is-visible"));
    else {
        const observer = new IntersectionObserver(
            (entries) =>
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                        observer.unobserve(entry.target);
                    }
                }),
            { threshold: 0.12 },
        );
        reveals.forEach((el) => observer.observe(el));
    }
    const burger = document.getElementById("burger"),
        menu = document.getElementById("mobileMenu"),
        close = document.getElementById("mobileClose");
    const toggle = (open) => {
        menu?.classList.toggle("is-open", open);
        document.body.style.overflow = open ? "hidden" : "";
    };
    burger?.addEventListener("click", () => toggle(true));
    close?.addEventListener("click", () => toggle(false));
    const hero = [...document.querySelectorAll(".hero-bg")];
    let heroIndex = 0;
    if (!reduceMotion && hero.length > 1)
        setInterval(() => {
            hero[heroIndex].classList.remove("is-active");
            heroIndex = (heroIndex + 1) % hero.length;
            hero[heroIndex].classList.add("is-active");
        }, 6000);
    const modal = document.getElementById("imageModal"),
        modalImage = modal.querySelector(".image-modal__image"),
        modalCaption = modal.querySelector(".image-modal__caption"),
        modalDots = modal.querySelector(".image-modal__dots");
    let modalSlides = [],
        modalIndex = 0;
    const renderModal = () => {
        const img = modalSlides[modalIndex];
        modalImage.src = img.currentSrc || img.src;
        modalImage.alt = img.alt;
        modalCaption.textContent = img.alt;
        [...modalDots.children].forEach((d, i) =>
            d.classList.toggle("is-active", i === modalIndex),
        );
    };
    const show = (i) => {
        modalIndex = (i + modalSlides.length) % modalSlides.length;
        renderModal();
    };
    const open = (slides, index) => {
        modalSlides = slides;
        modalIndex = index;
        modalDots.replaceChildren();
        slides.forEach((_, i) => {
            const d = document.createElement("button");
            d.className = `image-modal__dot${i === index ? " is-active" : ""}`;
            d.ariaLabel = `Xem ảnh ${i + 1}`;
            d.onclick = () => show(i);
            modalDots.append(d);
        });
        renderModal();
        modal.classList.add("is-open");
        modal.ariaHidden = "false";
        document.body.style.overflow = "hidden";
    };
    const closeModal = () => {
        modal.classList.remove("is-open");
        modal.ariaHidden = "true";
        modalImage.src = "";
        document.body.style.overflow = "";
    };
    document.querySelectorAll("[data-carousel]").forEach((carousel) => {
        const slides = [...carousel.querySelectorAll(".carousel-track img")],
            dots = carousel.querySelector(".carousel-dots");
        let index = 0,
            timer;
        const go = (i) => {
            index = (i + slides.length) % slides.length;
            slides.forEach((s, n) => s.classList.toggle("is-active", n === index));
            [...dots.children].forEach((d, n) =>
                d.classList.toggle("is-active", n === index),
            );
        };
        slides.forEach((img, i) => {
            const dot = document.createElement("button");
            dot.className = `carousel-dot${i ? "" : " is-active"}`;
            dot.onclick = () => go(i);
            dots.append(dot);
            img.onclick = () => open(slides, i);
        });
        carousel.querySelector(".carousel-prev").onclick = () => go(index - 1);
        carousel.querySelector(".carousel-next").onclick = () => go(index + 1);
        if (!reduceMotion) timer = setInterval(() => go(index + 1), 3500);
        carousel.onmouseenter = () => clearInterval(timer);
    });
    document.querySelectorAll("[data-team-carousel]").forEach((carousel) => {
        const track = carousel.querySelector(".team-track"),
            slides = [...carousel.querySelectorAll(".team-slide")],
            count = carousel.querySelector(".team-count strong"),
            progress = carousel.querySelector(".team-progress span");
        let index = 0;
        const visible = () => (innerWidth <= 620 ? 1 : innerWidth <= 900 ? 2 : 3),
            max = () => slides.length - visible(),
            render = () => {
                index = Math.min(index, max());
                const w = slides[0].getBoundingClientRect().width,
                    g = parseFloat(getComputedStyle(track).gap) || 0;
                track.style.transform = `translateX(-${index * (w + g)}px)`;
                count.textContent = String(index + 1).padStart(2, "0");
                progress.style.width = `${100 / (max() + 1)}%`;
                progress.style.transform = `translateX(${index * 100}%)`;
            },
            go = (i) => {
                index = i > max() ? 0 : i < 0 ? max() : i;
                render();
            };
        carousel.querySelector(".team-prev").onclick = () => go(index - 1);
        carousel.querySelector(".team-next").onclick = () => go(index + 1);
        slides.forEach(
            (s, i) =>
            (s.querySelector("img").onclick = () =>
                open(
                    slides.map((x) => x.querySelector("img")),
                    i,
                )),
        );
        addEventListener("resize", render);
        render();
        if (!reduceMotion) setInterval(() => go(index + 1), 3500);
    });
    modal.querySelector(".image-modal__prev").onclick = () =>
        show(modalIndex - 1);
    modal.querySelector(".image-modal__next").onclick = () =>
        show(modalIndex + 1);
    modal
        .querySelectorAll("[data-modal-close]")
        .forEach((el) => (el.onclick = closeModal));
    addEventListener("keydown", (e) => {
        if (!modal.classList.contains("is-open")) return;
        if (e.key === "Escape") closeModal();
        if (e.key === "ArrowLeft") show(modalIndex - 1);
        if (e.key === "ArrowRight") show(modalIndex + 1);
    });
    document.getElementById("backToTop").onclick = () => {
        document.documentElement.style.scrollBehavior = "auto";
        scrollTo(0, 0);
        requestAnimationFrame(
            () => (document.documentElement.style.scrollBehavior = ""),
        );
    };
})();
