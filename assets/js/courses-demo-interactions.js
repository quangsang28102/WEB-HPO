/**
 * courses-demo-interactions.js — Tương tác khu vực "KHÓA HỌC CỦA CHÚNG TÔI"
 *
 * Trạng thái được điều khiển bằng 1 class duy nhất: .course-demo-active trên thẻ đang chọn.
 * Toàn bộ hiệu ứng (mở rộng, glow, Light Sweep, Car Shine, Price Highlight) nằm trong courses-demo.css.
 *
 *  - Desktop (chuột): rê chuột vào thẻ → thẻ mở rộng; rời khỏi khu vực 3 thẻ → về bằng nhau.
 *    Khoảng hở giữa 2 thẻ không làm reset (tránh giật khi lướt chuột sang thẻ bên cạnh).
 *  - Cảm ứng / Mobile: chạm để mở rộng, chạm lại để thu gọn, chạm thẻ khác để chuyển.
 *  - Bàn phím: Tab tới tên hạng (desktop: tự mở rộng) + Enter/Space để mở/thu.
 */
(() => {
  'use strict';

  const section = document.getElementById('khoa-hoc');
  const list = section?.querySelector('[data-courses]');
  if (!section || !list) return;

  const cards = Array.from(list.querySelectorAll('[data-course]'));
  const accordionMode = window.matchMedia('(max-width: 767px)'); // khớp breakpoint mobile trong CSS
  const KEYBOARD_HOVER_GUARD_MS = 600; // sau thao tác phím, bỏ qua hover "giả" do bố cục dịch dưới con trỏ
  let lastPointerType = 'mouse';
  let ignoreHoverUntil = 0;

  // 1) Dựng sân khấu xe + mặt đường cho từng thẻ
  list.querySelectorAll('[data-stage]').forEach((stage) => window.CourseScene?.render(stage));

  // 2) Quản lý trạng thái active + ARIA
  const getActive = () => cards.find((card) => card.classList.contains('course-demo-active')) || null;

  // aria-expanded/aria-controls chỉ có nghĩa ở chế độ accordion (mobile), nơi giá thực sự bị ẩn/hiện
  function syncAria() {
    cards.forEach((card) => {
      const toggle = card.querySelector('[data-toggle]');
      if (!toggle) return;
      if (accordionMode.matches) {
        toggle.setAttribute('aria-expanded', String(card.classList.contains('course-demo-active')));
        toggle.setAttribute('aria-controls', card.querySelector('.price-list').id);
      } else {
        toggle.removeAttribute('aria-expanded');
        toggle.removeAttribute('aria-controls');
      }
    });
  }

  function setActive(target) {
    if (target === getActive()) return; // giữ nguyên → không chạy lại Light Sweep
    cards.forEach((card) => card.classList.toggle('course-demo-active', card === target));
    syncAria();
  }

  // 3) Desktop: hover bằng chuột
  list.addEventListener('pointerover', (event) => {
    if (event.pointerType !== 'mouse' || accordionMode.matches) return;
    if (performance.now() < ignoreHoverUntil) return;
    const card = event.target.closest('[data-course]');
    if (card) setActive(card); // vào khoảng hở giữa thẻ → card = null → giữ nguyên
  });
  list.addEventListener('pointerleave', (event) => {
    if (event.pointerType !== 'mouse' || accordionMode.matches) return;
    setActive(null);
  });

  // Bàn phím trên desktop: focus vào tên hạng → mở rộng như hover
  list.addEventListener('focusin', (event) => {
    if (accordionMode.matches || !event.target.matches(':focus-visible')) return;
    setActive(event.target.closest('[data-course]'));
  });
  list.addEventListener('focusout', (event) => {
    if (accordionMode.matches || list.contains(event.relatedTarget) || list.matches(':hover')) return;
    setActive(null);
  });

  // 4) Click: chuột ở desktop → đảm bảo thẻ đang trỏ được mở; còn lại (chạm, accordion, phím) → bật/tắt
  document.addEventListener('pointerdown', (event) => { lastPointerType = event.pointerType; });
  list.addEventListener('click', (event) => {
    const card = event.target.closest('[data-course]');
    if (!card) return;
    const viaKeyboard = event.detail === 0;
    if (viaKeyboard) ignoreHoverUntil = performance.now() + KEYBOARD_HOVER_GUARD_MS;
    if (!accordionMode.matches && lastPointerType === 'mouse' && !viaKeyboard) {
      setActive(card);
      return;
    }
    setActive(card === getActive() ? null : card);
  });

  // Cảm ứng ở bố cục ngang (tablet): chạm ra ngoài → 3 thẻ về bằng nhau (dùng click để không bắt nhầm thao tác cuộn)
  document.addEventListener('click', (event) => {
    if (lastPointerType === 'mouse' || accordionMode.matches) return;
    if (!list.contains(event.target)) setActive(null);
  });

  // Đổi bố cục (xoay màn hình / resize qua breakpoint) → reset trạng thái
  accordionMode.addEventListener('change', () => {
    cards.forEach((card) => card.classList.remove('course-demo-active'));
    syncAria();
  });
  syncAria();

  // 5) Tối ưu hiệu suất: dừng animation khi section không còn trên màn hình
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      section.classList.toggle('is-paused', !entry.isIntersecting);
    }).observe(section);
  }
})();
