# Robot Hiệp Phát

Model 3D được tạo bằng Three.js trong `robot.ts`. `main.ts` gắn widget vào trang,
`style.css` cố định robot ở góc dưới bên trái và giảm kích thước trên điện thoại.
Chạm hoặc nhấn Enter/Space để vẫy tay. Tôn trọng cài đặt giảm chuyển động và dừng
animation khi tab bị ẩn. Nếu WebGL không khả dụng, hiển thị robot SVG thay thế.

Website tĩnh tải `dist/companion.js` và `dist/companion.css` qua
`assets/js/site-footer.js` trên tất cả các trang dùng footer chung. Các file dist
đã bao gồm thư viện, không cần CDN hay build khi triển khai.

Sau khi sửa nguồn, build lại:

```sh
cd robot
npm install
npm run build
```

`wander.ts` là hành vi đi dạo của demo gốc, không được dùng trong widget cố định.
