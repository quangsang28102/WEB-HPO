(function () {
  const mount = document.getElementById("siteHeader");
  if (!mount) return;

  const base = mount.dataset.base || "";
  const page = mount.dataset.page || "";
  const href = (path) => base + path;
  const current = (...names) => (names.includes(page) ? ' aria-current="page"' : "");

  mount.outerHTML = `
    <div class="topbar">
      <div class="container">
        <div class="topbar-inner">
          <div class="topbar-left">
            <span class="topbar-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              176 Thế Lữ, Tân Nhựt, TP. Hồ Chí Minh
            </span>
            <span class="topbar-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              T2 — T7: 7h30 — 17h30
            </span>
          </div>
          <div class="topbar-right">
            <a href="mailto:tuyensinh@hpo.edu.vn" class="topbar-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              tuyensinh@hpo.edu.vn
            </a>
            <div class="topbar-social">
              <a href="https://www.facebook.com/profile.php?id=61579767334341" target="_blank" rel="noopener" aria-label="Facebook">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a href="https://youtube.com/@hiepphat2727" target="_blank" rel="noopener" aria-label="YouTube">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
                </svg>
              </a>
              <a href="https://hpo.edu.vn/thong-bao" target="_blank" rel="noopener" aria-label="TikTok">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.69a8.29 8.29 0 0 0 4.83 1.54V6.79a4.85 4.85 0 0 1-1.07-.1z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <nav class="nav" id="navbar">
      <div class="container">
        <div class="nav-inner">
          <a href="${href("index.html")}" class="logo" aria-label="Hiệp Phát"${current("home")}>
            <div class="logo-mark">
              <img src="${href("assets/images/logo.png")}" alt="Hiệp Phát" />
            </div>
          </a>

          <ul class="nav-links">
            <li class="nav-item has-dropdown">
              <a href="${href("gioi-thieu/trung-tam-giao-duc-nghe-nghiep/")}"${current("training-center")}>Giới thiệu</a>
              <div class="nav-dropdown">
                <a href="${href("gioi-thieu/trung-tam-giao-duc-nghe-nghiep/")}"><span class="dd-dot"></span> Trung tâm giáo dục nghề nghiệp</a>
                <a href="https://hpo.edu.vn/trung-tam-sat-hach/"><span class="dd-dot"></span> Trung tâm sát hạch lái xe ô tô</a>
              </div>
            </li>
            <li class="nav-item"><a href="https://hpo.edu.vn/hoc-phi/">Học phí</a></li>
            <li class="nav-item"><a href="${href("quy-dinh-chuong-trinh-hoc-lai-xe/")}"${current("process")}>Quy định chương trình học lái xe</a></li>
            <li class="nav-item has-dropdown">
              <a href="${href("danh-sach-benh-vien/")}"${current("hospital-lookup", "exam-progress")}>Tra cứu</a>
              <div class="nav-dropdown">
                <a href="${href("danh-sach-benh-vien/")}"${current("hospital-lookup")}><span class="dd-dot"></span> Danh sách bệnh viện</a>
                <a href="${href("tien-do-thi-sat-hach/")}"${current("exam-progress")}><span class="dd-dot"></span> Tiến độ thi sát hạch</a>
              </div>
            </li>
            
            <li class="nav-item has-dropdown">
              <a href="https://hpo.edu.vn/huong-dan/">Hướng dẫn</a>
              <div class="nav-dropdown">
                <a href="https://hpo.edu.vn/huong-dan-dao-tao/"><span class="dd-dot"></span> Hướng dẫn Đào tạo</a>
                <a href="https://hpo.edu.vn/huong-dan-sat-hach/"><span class="dd-dot"></span> Hướng dẫn Sát hạch</a>
              </div>
            </li>
            
            <li class="nav-item"><a href="https://hpo.edu.vn/on-tap/">Ôn tập</a></li>
          </ul>

          <div class="nav-actions">
            <a href="tel:02836362362" class="nav-phone">
              <span class="nav-phone-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
                </svg>
              </span>
              <span class="nav-phone-text">
                <small>Tổng đài</small>
                <strong>028.36.362.362</strong>
              </span>
            </a>
            <a href="https://hpo.edu.vn/dang-ky-hoc/" class="btn btn-primary">
              Đăng ký học
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </a>
            <button class="nav-burger" id="burger" aria-label="Mở menu">
              <span></span><span></span><span></span>
            </button>
          </div>
        </div>
      </div>
    </nav>

    <div class="mobile-menu" id="mobileMenu">
      <div class="mobile-menu-panel">
        <div class="mobile-menu-head">
          <a href="${href("index.html")}" class="logo" aria-label="Hiệp Phát">
            <div class="logo-mark">
              <img src="${href("assets/images/logo.png")}" alt="Hiệp Phát" />
            </div>
          </a>
          <button class="mobile-menu-close" id="mobileClose" aria-label="Đóng menu">×</button>
        </div>
        <nav class="mobile-menu-list">
          <a href="${href("index.html")}"${current("home")}>Trang chủ</a>
          <a href="${href("gioi-thieu/trung-tam-giao-duc-nghe-nghiep/")}"${current("training-center")}>Giới thiệu</a>
          <a href="https://hpo.edu.vn/hoc-phi/">Học phí</a>
          <a href="${href("quy-dinh-chuong-trinh-hoc-lai-xe/")}"${current("process")}>Quy định chương trình học lái xe</a>
          <div class="mobile-menu-group">
            <span class="mobile-menu-label">Tra cứu</span>
            <a class="mobile-menu-child" href="${href("danh-sach-benh-vien/")}"${current("hospital-lookup")}>Danh sách bệnh viện</a>
            <a class="mobile-menu-child" href="${href("tien-do-thi-sat-hach/")}"${current("exam-progress")}>Tiến độ thi sát hạch</a>
          </div>
          <a href="https://hpo.edu.vn/thong-tin/">Thông tin</a>
          <a href="https://hpo.edu.vn/huong-dan/">Hướng dẫn</a>          
          <a href="https://hpo.edu.vn/on-tap/">Ôn tập</a>
        </nav>
        <div class="mobile-menu-foot">
          <a href="tel:02836362362" class="btn btn-outline" style="justify-content: center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
            </svg>
            028.36.362.362
          </a>
          <a href="https://hpo.edu.vn/dang-ky-hoc/" class="btn btn-primary" style="justify-content: center">
            Đăng ký học
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  `;
})();
