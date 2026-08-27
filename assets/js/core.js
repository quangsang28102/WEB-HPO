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

