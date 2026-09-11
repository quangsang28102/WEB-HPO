/* Curriculum — Video lightbox (dùng chung cho 3 phương án) */
(() => {
  const videos = {
    '01': { src: 'mon-01-phap-luat.mp4', title: 'Pháp luật về giao thông đường bộ', tag: 'Lý thuyết' },
    '02': { src: 'mon-02-cau-tao.mp4', title: 'Cấu tạo và sửa chữa thông thường', tag: 'Lý thuyết' },
    '03': { src: 'mon-03-dao-duc.mp4', title: 'Đạo đức người lái xe, văn hóa GT và phòng chống tác hại của rượu, bia khi tham gia GT, kỹ năng PCCC và CNCH', tag: 'Lý thuyết' },
    '04': { src: 'mon-04-ky-thuat.mp4', title: 'Kỹ thuật lái xe', tag: 'Thực hành' },
    '05': { src: 'mon-05-mo-phong.mp4', title: 'Phần mềm mô phỏng tình huống giao thông', tag: 'Mô phỏng' },
    '06': { src: 'mon-06-thuc-hanh.mp4', title: 'Thực hành lái xe — Sa hình', tag: 'Thực hành' },
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
    setTimeout(() => video.play().catch(() => { }), 100);
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
      const detailId = 'syllDetail-' + target;
      const section = arrow.closest('.syll');
      const detail = Array.from(
        section?.querySelectorAll('.syll-detail') || [],
      ).find(
        (item) => item.id === detailId || item.id.startsWith(detailId + '-'),
      );
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

  // Gắn click vào ảnh nguồn hoặc phần tử chỉ dùng để mở một nhóm ảnh.
  document.querySelectorAll('[data-img-group], [data-img-open-group]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const group = el.dataset.imgOpenGroup || el.dataset.imgGroup;
      const idx = parseInt(el.dataset.imgOpenIdx || el.dataset.imgIdx || '0', 10);
      open(group, idx);
    });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const group = el.dataset.imgOpenGroup || el.dataset.imgGroup;
        const idx = parseInt(el.dataset.imgOpenIdx || el.dataset.imgIdx || '0', 10);
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
