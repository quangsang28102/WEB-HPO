(() => {
  const grid = document.getElementById("hospitalGrid");
  if (!grid) return;

  const searchInput = document.getElementById("searchInput");
  const districtSelect = document.getElementById("districtSelect");
  const serviceSelect = document.getElementById("serviceSelect");
  const resultSummary = document.getElementById("resultSummary");
  const pagination = document.getElementById("pagination");
  const emptyState = document.getElementById("emptyState");
  const pageSize = 12;
  let hospitals = [];
  let filtered = [];
  let currentPage = 1;

  const escapeHtml = (value = "") => String(value).replace(/[&<>"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]);
  const normalize = (value = "") => String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().trim();
  const phoneHref = value => String(value || "").replace(/\D/g, "").slice(0, 11);
  const districtLabel = value => /^\d+$/.test(String(value).trim()) ? `Quận ${value}` : value;
  const districtCardLabel = value => value ? (/^\d+$/.test(String(value).trim()) ? `Quận ${value}` : `Khu vực ${value}`) : "Chưa phân khu vực";

  function cardTemplate(item, index) {
    const phone = phoneHref(item.dienThoai);
    const address = item.diaChiMoi || item.diaChi || "Chưa cập nhật địa chỉ";
    const badges = [
      item.kskLaiXe ? '<span class="hospital-badge">Khám sức khỏe lái xe</span>' : "",
      item.kskNuocNgoai ? '<span class="hospital-badge hospital-badge--foreign">Khám người nước ngoài</span>' : ""
    ].join("");
    return `<article class="hospital-card">
      <div class="hospital-card__top"><span class="hospital-card__number">${String(index + 1).padStart(2, "0")}</span><div><h3>${escapeHtml(item.ten)}</h3><span class="hospital-card__district">${escapeHtml(districtCardLabel(item.quanHuyen))}</span></div></div>
      <p class="hospital-card__address">${escapeHtml(address)}</p>
      <div class="hospital-card__badges">${badges}</div>
      ${item.ghiChu ? `<p class="hospital-card__note">${escapeHtml(item.ghiChu)}</p>` : ""}
      ${(item.lienHe || item.dienThoai) ? `<div class="hospital-card__contact">${item.lienHe ? `<p>Liên hệ: <strong>${escapeHtml(item.lienHe)}</strong></p>` : ""}${item.dienThoai ? `<p>Điện thoại: <strong>${escapeHtml(item.dienThoai)}</strong></p>` : ""}</div>` : ""}
      <div class="hospital-card__actions">${phone ? `<a class="hospital-card__call" href="tel:${phone}">Gọi điện</a>` : ""}${item.map ? `<a class="hospital-card__map" href="${escapeHtml(item.map)}" target="_blank" rel="noopener">Xem bản đồ ↗</a>` : ""}</div>
    </article>`;
  }

  function render() {
    const totalPages = Math.ceil(filtered.length / pageSize);
    if (currentPage > totalPages) currentPage = Math.max(totalPages, 1);
    const start = (currentPage - 1) * pageSize;
    grid.innerHTML = filtered.slice(start, start + pageSize).map((item, index) => cardTemplate(item, start + index)).join("");
    grid.setAttribute("aria-busy", "false");
    resultSummary.textContent = `${filtered.length.toLocaleString("vi-VN")} cơ sở phù hợp`;
    emptyState.hidden = filtered.length !== 0;
    grid.hidden = filtered.length === 0;
    renderPagination(totalPages);
  }

  function renderPagination(totalPages) {
    pagination.hidden = totalPages <= 1;
    if (totalPages <= 1) {
      pagination.innerHTML = "";
      return;
    }
    const pages = [];
    for (let page = 1; page <= totalPages; page += 1) {
      if (page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1) pages.push(page);
    }
    let previousPage = 0;
    const pageButtons = pages.map(page => {
      const separator = page - previousPage > 1 ? '<span class="lookup-pagination__ellipsis" aria-hidden="true">…</span>' : "";
      previousPage = page;
      return `${separator}<button type="button" data-page="${page}" class="${page === currentPage ? "is-active" : ""}" ${page === currentPage ? 'aria-current="page"' : ""} aria-label="Trang ${page}">${page}</button>`;
    }).join("");
    pagination.innerHTML = `<button type="button" data-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""}>Trước</button>${pageButtons}<button type="button" data-page="${currentPage + 1}" ${currentPage === totalPages ? "disabled" : ""}>Sau</button>`;
  }

  function filterHospitals() {
    const query = normalize(searchInput.value);
    const district = districtSelect.value;
    const service = serviceSelect.value;
    filtered = hospitals.filter(item => {
      const searchable = normalize([item.ten, item.diaChi, item.diaChiMoi, item.quanHuyen].join(" "));
      const serviceMatch = service === "all" || (service === "driver" && item.kskLaiXe) || (service === "foreign" && item.kskNuocNgoai);
      return (!query || searchable.includes(query)) && (!district || item.quanHuyen === district) && serviceMatch;
    });
    currentPage = 1;
    render();
  }

  function resetFilters() {
    searchInput.value = "";
    districtSelect.value = "";
    serviceSelect.value = "driver";
    filterHospitals();
    searchInput.focus();
  }

  fetch("data.json")
    .then(response => { if (!response.ok) throw new Error("Không thể tải dữ liệu"); return response.json(); })
    .then(data => {
      hospitals = Array.isArray(data) ? data : [];
      const districts = [...new Set(hospitals.map(item => item.quanHuyen).filter(Boolean))].sort((a, b) => a.localeCompare(b, "vi", { numeric: true }));
      districtSelect.insertAdjacentHTML("beforeend", districts.map(name => `<option value="${escapeHtml(name)}">${escapeHtml(districtLabel(name))}</option>`).join(""));
      document.getElementById("facilityCount").textContent = hospitals.length.toLocaleString("vi-VN");
      document.getElementById("driverCount").textContent = hospitals.filter(item => item.kskLaiXe).length.toLocaleString("vi-VN");
      filterHospitals();
    })
    .catch(() => {
      grid.setAttribute("aria-busy", "false");
      grid.innerHTML = '<div class="lookup-empty" style="display:block;grid-column:1/-1"><strong>Không thể tải dữ liệu</strong><p>Vui lòng tải lại trang hoặc thử lại sau.</p></div>';
      resultSummary.textContent = "Dữ liệu chưa sẵn sàng";
    });

  searchInput.addEventListener("input", filterHospitals);
  districtSelect.addEventListener("change", filterHospitals);
  serviceSelect.addEventListener("change", filterHospitals);
  document.getElementById("resetButton").addEventListener("click", resetFilters);
  document.getElementById("emptyReset").addEventListener("click", resetFilters);
  pagination.addEventListener("click", event => {
    const button = event.target.closest("button[data-page]");
    if (!button || button.disabled) return;
    currentPage = Number(button.dataset.page);
    render();
    document.querySelector(".lookup-results-head").scrollIntoView({ behavior: "smooth", block: "start" });
  });
})();
