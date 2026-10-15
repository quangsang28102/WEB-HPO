/**
 * courses-demo-stage-renderer.js
 * Dựng "sân khấu" chuyển động trong mỗi thẻ khoá học, gồm các lớp (dưới → trên):
 *   1. Bầu trời + skyline trôi chậm (parallax)
 *   2. Road base: mặt đường phối cảnh 3D (CSS perspective + rotateX)
 *   3. Lane markings: dải vạch kẻ + vệt nhựa đường trôi liên tục
 *   4. Contact shadow: bóng tiếp xúc dưới thân + dưới từng bánh
 *   5. Vehicle: thân xe (nhún) + bánh/mâm xe (quay)
 *   6. Highlight: lớp ánh sáng phủ nhẹ
 *
 * Ba cách khai báo xe ngay trong HTML:
 *   <div data-stage data-photo="hang-b-vios">                    → ẢNH THẬT 3/4, mâm quay (cấu hình: courses-demo-vehicle-config.js)
 *   <div data-stage data-vehicle="sedan|truck" data-paint="pearl|blue"> → xe vector nhìn ngang, bánh quay
 *   <div data-stage data-image="assets/images/ten-anh.png">       → ảnh PNG bất kỳ (không quay bánh)
 */
(function (global) {
  'use strict';

  const SKY = '<div class="stage__sky"><div class="stage__skyline"></div></div>';
  // Đường ngang (xe nhìn ngang)
  const ROAD_STRAIGHT = '<div class="road"><div class="road__plane"><div class="road__strip"></div></div></div>';
  // Đường chéo (xe góc 3/4): lớp __yaw xoay làn đường trên mặt đất cho song song hướng xe
  const ROAD_ANGLED = `<div class="road road--angled"><div class="road__plane"><div class="road__yaw">
      <div class="road__surface"></div><div class="road__strip"></div></div></div></div>`;

  let counter = 0;

  /** Thoát ký tự đặc biệt trước khi đưa giá trị vào HTML (chống chèn mã) */
  const escapeAttr = (value) => String(value).replace(/[&"'<>]/g, (ch) => `&#${ch.charCodeAt(0)};`);
  const num = (value) => Number(value) || 0;

  /** Xe vector: thân + bánh tách lớp, bóng bánh đặt theo toạ độ bánh của model */
  function vectorVehicle(stage) {
    const art = global.VehicleArtwork;
    const model = Object.hasOwn(art.MODELS, stage.dataset.vehicle || '') ? stage.dataset.vehicle : 'sedan';
    const m = art.MODELS[model];
    const id = `veh${++counter}`;
    const tyreShadows = m.wheels
      .map((w) => `<span class="vehicle__tyre-shadow" style="left:${((w.x / m.w) * 100).toFixed(2)}%"></span>`)
      .join('');
    return `${ROAD_STRAIGHT}
      <div class="course-demo-vehicle vehicle--${model}" style="--vehicle-ratio:${m.w} / ${m.h}">
        <span class="vehicle__shadow"></span>${tyreShadows}
        ${art.body(model, stage.dataset.paint, id)}
        ${art.wheels(model, id)}
      </div>`;
  }

  /** Xe ảnh thật góc 3/4: thân xe + mâm (ảnh tròn) được ép về elip phối cảnh rồi quay trong mặt phẳng bánh */
  function photoVehicle(stage, cfg) {
    stage.style.setProperty('--road-yaw', `${num(cfg.roadYaw)}deg`);
    const [rear, front] = cfg.tyres;
    const span = Math.hypot((front.x - rear.x) * cfg.w, (front.y - rear.y) * cfg.h) / cfg.w; // % theo chiều rộng
    const bodyShadow = `left:${(rear.x + front.x) / 2}%;top:${(rear.y + front.y) / 2}%;width:${span * 1.5}%;--shadow-rot:${num(cfg.yaw)}deg`;
    const tyres = cfg.tyres
      .map((t) => `<span class="vehicle__tyre-shadow" style="left:${num(t.x)}%;top:${num(t.y)}%"></span>`).join('');
    const rims = cfg.wheels.map((w) => {
      const [a, b, c, d] = w.m.map(num);
      return `<span class="vehicle__rim" style="left:${num(w.x)}%;top:${num(w.y)}%;width:${num(w.d)}%;--rim-matrix:matrix(${a},${b},${c},${d},0,0)">
          <img class="vehicle__rim-spin" src="${escapeAttr(w.src)}" alt="" decoding="async"></span>`;
    }).join('');
    const src = escapeAttr(cfg.body);
    return `${ROAD_ANGLED}
      <div class="course-demo-vehicle vehicle--photo" style="--vehicle-ratio:${num(cfg.w)} / ${num(cfg.h)};--photo-spin:${num(cfg.spin) || 2.2};--photo-scale:${num(cfg.scale) || 1}">
        <span class="vehicle__shadow" style="${bodyShadow}"></span>${tyres}
        <div class="vehicle__body">
          <img class="vehicle__img" src="${src}" alt="${escapeAttr(cfg.alt || '')}" decoding="async">
          <img class="vehicle__img vehicle__img--shine" src="${src}" alt="" aria-hidden="true">
          ${rims}
        </div>
      </div>`;
  }

  /** Xe ảnh PNG đơn (không quay bánh): bản sao thứ 2 làm sáng + cắt dải chéo → Car Shine bám hình xe */
  function imageVehicle(stage) {
    const src = escapeAttr(stage.dataset.image);
    const alt = escapeAttr(stage.dataset.imageAlt || '');
    return `${ROAD_STRAIGHT}
      <div class="course-demo-vehicle vehicle--image">
        <span class="vehicle__shadow"></span>
        <div class="vehicle__body">
          <img class="vehicle__img" src="${src}" alt="${alt}" decoding="async">
          <img class="vehicle__img vehicle__img--shine" src="${src}" alt="" aria-hidden="true">
        </div>
      </div>`;
  }

  function render(stage) {
    if (!stage || stage.dataset.rendered === 'true') return;
    try {
      const photos = global.VehiclePhotos || {};
      const photoKey = stage.dataset.photo || '';
      let vehicle;
      if (Object.hasOwn(photos, photoKey)) {
        stage.classList.add('stage--photo');
        vehicle = photoVehicle(stage, photos[photoKey]);
      } else if (stage.dataset.image) {
        vehicle = imageVehicle(stage);
      } else {
        vehicle = vectorVehicle(stage);
      }
      stage.insertAdjacentHTML('beforeend', `${SKY}${vehicle}<div class="stage__glare"></div>`);
      stage.dataset.rendered = 'true';
    } catch (err) {
      // Không để lỗi đồ hoạ làm hỏng phần nội dung học phí
      console.error('[CourseScene] Không dựng được sân khấu xe:', err);
    }
  }

  global.CourseScene = { render };
})(window);
