/**
 * courses-demo-vehicle-config.js
 * Cấu hình xe ẢNH THẬT (đã tách nền) cho từng thẻ. Dùng trong HTML: <div data-stage data-photo="hang-b-vios">
 *
 * Toạ độ đều tính theo % kích thước ảnh thân xe nên xe co giãn bao nhiêu cũng khớp:
 *  - wheels: mâm xe đã được "nắn" từ elip (phối cảnh 3/4) về hình tròn để quay.
 *      x, y = tâm mâm (% rộng, % cao) · d = đường kính ảnh mâm (% rộng thân xe)
 *      m    = ma trận CSS matrix(a, b, c, d) ép hình tròn trở lại đúng elip phối cảnh
 *  - tyres: điểm lốp chạm đất (đặt bóng tiếp xúc)
 *  - yaw:   góc nghiêng của đường nối 2 bánh cùng bên trên ảnh (độ) → xoay bóng gầm xe
 *  - roadYaw: góc xoay làn đường trên mặt phẳng đất (độ) để vạch kẻ chạy song song hướng xe
 *  - spin:  hệ số thời gian quay mâm so với chu kỳ mặt đường (lớn hơn = quay chậm hơn)
 *  - scale: hệ số kích thước hiển thị so với chuẩn (xe tải cao hơn nên thu nhỏ để vừa khung)
 * Số liệu được đo tự động từ ảnh gốc 01_Source (Vision tách nền + fit elip mâm).
 */
window.VehiclePhotos = {
  'hang-b-vios': {
    body: 'assets/images/courses-demo/vehicles/hang-b-vios-than-xe.webp',
    alt: 'Xe tập lái hạng B – Toyota Vios',
    w: 2959, h: 1564,
    wheels: [
      { src: 'assets/images/courses-demo/vehicles/hang-b-vios-mam-sau.webp', x: 6.887, y: 59.405, d: 10.958, m: [0.0391, 0.9992, -0.4249, 0.0166] },
      { src: 'assets/images/courses-demo/vehicles/hang-b-vios-mam-truoc.webp', x: 44.454, y: 79.425, d: 14.9, m: [0.1239, 0.9923, -0.5352, 0.0668] },
    ],
    tyres: [{ x: 6.887, y: 73.849 }, { x: 44.454, y: 99.233 }],
    yaw: 19.65,
    roadYaw: 24,
    spin: 2.4,
    scale: 1,
  },
  'hang-c1-kia-k200': {
    body: 'assets/images/courses-demo/vehicles/hang-c1-kia-k200-than-xe.webp',
    alt: 'Xe tập lái hạng C1 – Kia K200 thùng mui bạt',
    w: 3088, h: 2369,
    wheels: [
      { src: 'assets/images/courses-demo/vehicles/hang-c1-kia-k200-mam-sau.webp', x: 10.826, y: 76.45, d: 7.834, m: [0.0264, 0.9997, -0.3313, 0.0087] },
      { src: 'assets/images/courses-demo/vehicles/hang-c1-kia-k200-mam-truoc.webp', x: 38.578, y: 85.749, d: 13.499, m: [0.0976, 0.9952, -0.4454, 0.0437] },
    ],
    tyres: [{ x: 10.826, y: 84.339 }, { x: 38.578, y: 99.451 }],
    yaw: 22.67,
    roadYaw: 27,
    spin: 2.2,
    scale: 0.74,
  },
};
