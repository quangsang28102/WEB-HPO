(function () {
  const mountFloatingActions = () => {
    // Trang chu da co san cum nut nay trong HTML. Cac trang con dung chung
    // footer se duoc bo sung tai day de luon chi co mot cum nut ho tro.
    if (document.querySelector(".floats")) return;

    document.querySelectorAll(".back-to-top").forEach((button) => button.remove());

    document.body.insertAdjacentHTML(
      "beforeend",
      `
        <div class="floats" aria-label="Hỗ trợ nhanh">
          <button
            type="button"
            class="float-btn float-top"
            title="Lên đầu trang"
            aria-label="Lên đầu trang"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </button>
          <a href="tel:02836362362" class="float-btn float-phone" title="Gọi ngay" aria-label="Gọi ngay">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
            </svg>
          </a>
          <a href="https://hpo.edu.vn/dang-ky-hoc/" class="float-btn float-register" title="Đăng ký học" aria-label="Đăng ký học">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
          </a>
        </div>
      `,
    );

    document.querySelector(".float-top").addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountFloatingActions, { once: true });
  } else {
    mountFloatingActions();
  }

  const mount = document.getElementById("siteFooter");
  if (!mount) return;

  const base = mount.dataset.base || "";
  const href = (path) => base + path;

  mount.outerHTML = `
    <!-- ── FOOTER ── -->
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <a href="${href("index.html")}" class="logo" aria-label="Hiệp Phát">
              <div class="logo-mark">
                <img src="${href("assets/images/logo.png")}" alt="Hiệp Phát" />
              </div>
            </a>
            <p class="footer-desc">
              Công ty TNHH Ô Tô Hiệp Phát — GCNKD số 0309987279, do Sở KH&amp;ĐT
              TP.HCM cấp lần đầu ngày 11/05/2010.
            </p>
            <div class="footer-contact">
              <div class="footer-contact-item">
                <span class="footer-contact-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </span>
                <span>176 Thế Lữ, Ấp 1, xã Tân Nhựt, TP. Hồ Chí Minh</span>
              </div>
              <div class="footer-contact-item">
                <span class="footer-contact-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </span>
                <a href="tel:02836362362">028.36.362.362</a>
              </div>
              <div class="footer-contact-item">
                <span class="footer-contact-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </span>
                <a href="mailto:tuyensinh@hpo.edu.vn">tuyensinh@hpo.edu.vn</a>
              </div>
            </div>
            <div class="footer-social">
              <a href="https://www.facebook.com/profile.php?id=61579767334341" target="_blank" rel="noopener" aria-label="Facebook">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a href="https://youtube.com/@hiepphat2727" target="_blank" rel="noopener" aria-label="YouTube">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
                </svg>
              </a>
              <a href="https://hpo.edu.vn/thong-bao" target="_blank" rel="noopener" aria-label="TikTok">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.69a8.29 8.29 0 0 0 4.83 1.54V6.79a4.85 4.85 0 0 1-1.07-.1z" />
                </svg>
              </a>
            </div>
          </div>

          <div class="footer-col">
            <h4>Cơ sở</h4>
            <div class="footer-loc">
              <strong>1. Trụ sở chính</strong>
              <p>176 Thế Lữ, Tân Nhựt, TP. HCM</p>
              <a href="tel:02836362362">028.36.362.362</a>
            </div>
            <div class="footer-loc">
              <strong>2. Cơ sở Vĩnh Lộc</strong>
              <p>271 Đường số 1, P. Bình Tân</p>
              <a href="tel:02836201199">028.36.201.199</a>
            </div>
            <div class="footer-loc">
              <strong>3. VP Tuyển Sinh</strong>
              <p>276 Minh Phụng, TP. HCM</p>
              <a href="tel:0912799129">0912.799.129</a>
            </div>
          </div>

          <div class="footer-col">
            <h4>Tải ứng dụng</h4>
            <p class="footer-app-desc">
              Học online miễn phí. Trải nghiệm ngay trên Hiệp Phát Edu.
            </p>
            <div class="footer-app">
              <a href="https://play.google.com/store/apps/details?id=com.hpo.edugo" target="_blank" rel="noopener" aria-label="Tải Hiệp Phát Edu trên Google Play">
                <img src="${href("assets/images/CHPlay.png")}" alt="Tải trên Google Play" loading="lazy" />
              </a>
              <a href="https://apps.apple.com/vn/app/hiep-phat-edu/id6748065752" target="_blank" rel="noopener" aria-label="Tải Hiệp Phát Edu trên App Store">
                <img src="${href("assets/images/AppStore.png")}" alt="Tải trên App Store" loading="lazy" />
              </a>
            </div>
          </div>

          <div class="footer-col footer-map-col">
            <h4>Bản đồ</h4>
            <div class="footer-map">
              <iframe
                title="Bản đồ Công ty TNHH Ô Tô Hiệp Phát"
                src="https://www.google.com/maps?q=C%C3%B4ng%20ty%20TNHH%20%C3%94%20T%C3%B4%20Hi%E1%BB%87p%20Ph%C3%A1t%20176%20%C4%90%C6%B0%E1%BB%9Dng%20Th%E1%BA%BF%20L%E1%BB%AF%20T%C3%A2n%20Nh%E1%BB%B1t%20TP.HCM&output=embed"
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
                allowfullscreen
              ></iframe>
            </div>
            <a class="footer-gov" href="http://online.gov.vn/Website/chi-tiet-135372" target="_blank" rel="noopener" aria-label="Thông tin website Hiệp Phát trên Bộ Công Thương">
              <img
                src="https://atm253157-s3user.vcos.cloudstorage.com.vn/web24h-no-object-lock/storage/page/logo.png"
                alt="Đã thông báo Bộ Công Thương"
                loading="lazy"
              />
            </a>
          </div>
        </div>

        <div class="footer-bottom">
          <p>© 2025 Công Ty TNHH Ô Tô Hiệp Phát. Tất cả quyền được bảo lưu.</p>
          <p class="footer-bottom-legal">
            GCNKD: 0309987279 — Cấp ngày 11/05/2010<br />
            Sở KH&amp;ĐT TP. Hồ Chí Minh
          </p>
        </div>
      </div>
    </footer>
  `;
})();
