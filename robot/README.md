# Robot Hiệp Phát

Widget 3D độc lập được nhúng vào website qua `assets/js/site-footer.js`.

## Tương tác

- Robot đi theo viền màn hình theo chiều kim đồng hồ, lần lượt qua bốn góc, quay thân theo hướng đi và bước chân. Mỗi lượt đi tối đa 3 giây, sau đó quay mặt về người xem và nghỉ 5 giây trước khi đi tiếp.
- Kéo bằng chuột hoặc cảm ứng để đặt robot tại cạnh màn hình gần nhất; thả xong quay về phía trước và nghỉ 5 giây rồi tiếp tục đi. Robot dừng và nhìn về phía trước khi con trỏ chuột nằm trên nó để dễ nhấn.
- Thanh “Tốc độ di chuyển” dưới mô hình điều chỉnh từ 0.5× đến 2.0× (mặc định 1.0× = 60 px/giây). Tốc độ không làm ngắn thời gian nghỉ; tùy chọn được lưu trên trình duyệt nếu bộ nhớ cục bộ khả dụng.
- Nhấn robot hoặc dùng Enter/Space để mở cửa sổ: mô hình 3D bên trái, khu vực chat bên phải. Trên điện thoại hai phần xếp dọc.
- Kéo mô hình để xoay theo hai trục, cuộn/chụm để thu phóng; có nút xoay, thu/phóng, đặt lại góc nhìn và vẫy tay.
- Đóng bằng nút đóng, Escape hoặc nhấn nền bên ngoài. Focus trở về robot.
- Dùng Tab để chọn robot rồi các phím mũi tên để đổi vị trí. Bỏ chọn “Cho robot tự đi dạo” trong cửa sổ để tạm dừng.
- Không tự đi hay chạy hoạt ảnh khi bật giảm chuyển động; vẫn kéo, dùng bàn phím và xoay mô hình thủ công được. Dừng vòng lặp khi tab ẩn.
- Nếu WebGL không khả dụng/mất context, hiển thị SVG thay thế.

Chat hiện chỉ là giao diện chuẩn bị, chưa kết nối dịch vụ và chưa gửi tin nhắn.

## Cấu trúc

- `robot.ts`: mô hình procedural Three.js, biểu cảm, chớp mắt, vẫy tay và hoạt ảnh bước chân.
- `wander.ts`: bám viền và chọn góc kế tiếp, quay theo đường ngắn nhất, tốc độ điều chỉnh và chu kỳ đi/nghỉ nhìn về phía trước.
- `main.ts`: vị trí màn hình, kéo/nhấn, bàn phím, giới hạn viewport, vòng lặp và điều phối cửa sổ.
- `scene.ts`: camera, ánh sáng, renderer, resize, fallback, khôi phục context và giải phóng tài nguyên GPU.
- `viewer.ts`: dialog, OrbitControls và bố cục chat. Renderer của cửa sổ được tạo khi mở và giải phóng khi đóng; robot ngoài trang tạm dừng.
- `style.css`: CSS giới hạn theo ID widget/dialog để tránh ảnh hưởng website.

## Build

```sh
cd robot
npm ci
npm test
npm run build
```

Build tạo `dist/companion.js` và `dist/companion.css`. Hai file chứa đủ thư viện, không cần CDN hay Node.js trên hosting. Khi sửa nguồn cần build và đưa cả hai file dist lên website. Esbuild chuyển TypeScript sang JavaScript, không kiểm tra kiểu.

Để xem toàn website trên máy, chạy `python -m http.server 5180 --bind 127.0.0.1` tại WEB-HPO rồi mở http://127.0.0.1:5180/.

## Nối chat sau này

Giữ phần `.hpo-model-panel` và nối dịch vụ vào `.hpo-chat-form`, thêm tin nhắn bằng `textContent` vào `.hpo-chat-messages`. Chỉ bật ô nhập/nút gửi khi đã nối dịch vụ; xử lý trạng thái gửi/lỗi và đặt khóa API ở backend. Có thể dùng `Robot.setExpression()` và `Robot.wave()` để phản hồi theo trạng thái hội thoại. Chưa có API chat công khai hoặc backend trong phiên bản này.
