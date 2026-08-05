(() => {
  const API_URL = "https://thi.hpo.edu.vn/api/public/status";
  const form = document.getElementById("lookupForm");
  if (!form) return;

  const input = document.getElementById("citizenId");
  const error = document.getElementById("citizenError");
  const count = document.getElementById("characterCount");
  const resultSection = document.getElementById("examResult");
  const resultContent = document.getElementById("resultContent");
  const submitButton = form.querySelector("button[type='submit']");
  const submitLabel = submitButton.querySelector("span");

  const subjectNames = {
    mon1: "Lý thuyết",
    mon2: "Mô phỏng",
    mon3: "Sa hình",
    gplx: "Đường trường"
  };

  const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, character => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  })[character]);

  const formatDate = value => {
    if (!value) return "Chưa cập nhật";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("vi-VN", { timeZone:"Asia/Ho_Chi_Minh" }).format(date);
  };

  const statusClass = status => {
    const normalized = String(status || "").toLowerCase();
    if (["completed", "passed", "success"].includes(normalized)) return "completed";
    if (["failed", "not_passed", "cancelled"].includes(normalized)) return "failed";
    return "pending";
  };

  const showError = message => {
    error.textContent = message;
    error.hidden = false;
    input.classList.add("is-invalid");
    resultSection.hidden = true;
  };

  function renderResult(data) {
    const subjects = Array.isArray(data.subjectProgress) ? [...data.subjectProgress].sort((a, b) => (a.order || 0) - (b.order || 0)) : [];
    const completedCount = subjects.filter(subject => statusClass(subject.displayStatus) === "completed").length;
    const percentage = subjects.length ? Math.round(completedCount / subjects.length * 100) : 0;
    const overallClass = statusClass(data.overallStatus);
    const overallLabel = data.overallStatusLabel || (overallClass === "completed" ? "Hoàn thành" : "Đang cập nhật");
    const subjectsHtml = subjects.map((subject, index) => {
      const subjectClass = statusClass(subject.displayStatus);
      return `<article class="is-${subjectClass}${subject.isCurrent ? " is-current" : ""}">
        <span class="exam-subject__number">${String(subject.order || index + 1).padStart(2, "0")}</span>
        <div><p>Môn thi</p><h4>${escapeHtml(subjectNames[subject.subjectCode] || subject.subjectName || subject.subjectCode)}</h4></div>
        <strong>${escapeHtml(subject.label || "Đang cập nhật")}</strong>
      </article>`;
    }).join("");
    const noticeTitle = overallClass === "completed" ? "Bạn đã hoàn thành kỳ sát hạch" : "Kết quả đang được cập nhật";
    const noticeText = overallClass === "completed" ? "Kết quả đã được ghi nhận trên hệ thống. Vui lòng theo dõi thông báo tiếp theo từ HPO." : "Vui lòng chờ hệ thống cập nhật kết quả của các nội dung thi còn lại.";

    resultContent.innerHTML = `
      <div class="exam-result__header">
        <div><p class="exam-result__eyebrow">Kết quả tra cứu</p><h2 id="result-title">${escapeHtml(data.fullName || "Học viên")}</h2><p>CCCD: <strong>${escapeHtml(data.cccdMasked || "•••• •••• ••••")}</strong></p></div>
        <span class="exam-status exam-status--${overallClass}"><i></i> ${escapeHtml(overallLabel)}</span>
      </div>
      <div class="exam-info-grid">
        <div><span>Kỳ sát hạch</span><strong>${escapeHtml(data.sessionName || "Chưa cập nhật")}</strong></div>
        <div><span>Ngày thi</span><strong>${escapeHtml(formatDate(data.examDate))}</strong></div>
        <div><span>Địa điểm</span><strong>${escapeHtml(data.location || "Chưa cập nhật")}</strong></div>
        <div><span>Số thứ tự</span><strong>${String(data.orderNumber ?? "—").padStart(2, "0")}</strong></div>
      </div>
      <div class="exam-progress-head"><div><p>Tiến độ sát hạch</p><h3>${completedCount}/${subjects.length} nội dung đã hoàn thành</h3></div><strong>${percentage}%</strong></div>
      <div class="exam-progress-track"><span style="width:${percentage}%"></span></div>
      <div class="exam-subjects">${subjectsHtml || "<p>Chưa có dữ liệu môn thi.</p>"}</div>
      <div class="exam-result__notice ${overallClass === "completed" ? "" : "exam-result__notice--waiting"}"><span>${overallClass === "completed" ? "✓" : "i"}</span><div><strong>${noticeTitle}</strong><p>${noticeText}</p></div></div>
      ${data.paymentDeadline ? `<div class="exam-payment"><div><p>Thời hạn thanh toán</p><strong>${escapeHtml(data.paymentDeadline)}</strong></div><button type="button" ${data.canSubmitPayment ? "" : "disabled"}>Thanh toán</button></div>` : ""}
    `;
    resultSection.hidden = false;
    resultSection.scrollIntoView({ behavior:"smooth", block:"start" });
  }

  input.addEventListener("input", () => {
    input.value = input.value.replace(/\D/g, "").slice(0, 12);
    count.textContent = `${input.value.length}/12`;
    input.classList.remove("is-invalid");
    error.hidden = true;
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (!/^\d{12}$/.test(input.value)) {
      showError("Vui lòng nhập đúng 12 chữ số căn cước công dân.");
      input.focus();
      return;
    }

    submitButton.disabled = true;
    submitLabel.textContent = "Đang tra cứu…";
    error.hidden = true;
    input.classList.remove("is-invalid");

    try {
      const response = await fetch(API_URL, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({ cccd:input.value })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "Không thể tra cứu thông tin lúc này.");
      if (!payload.result) throw new Error("Dữ liệu trả về chưa hợp lệ.");
      renderResult(payload.result);
    } catch (requestError) {
      const isNetworkError = requestError instanceof TypeError;
      showError(isNetworkError ? "Không thể kết nối hệ thống tra cứu. Vui lòng thử lại sau." : requestError.message);
    } finally {
      submitButton.disabled = false;
      submitLabel.textContent = "Tra cứu tiến độ";
    }
  });

  document.getElementById("closeResult").addEventListener("click", () => {
    resultSection.hidden = true;
    input.focus();
  });
})();
