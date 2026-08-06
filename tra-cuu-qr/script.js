(() => {
  const API_URL = "https://lms.hpo.edu.vn/api/public/license-test-qr/student";
  const form = document.getElementById("qrLookupForm");
  if (!form) return;

  const input = document.getElementById("identityCard");
  const error = document.getElementById("identityError");
  const count = document.getElementById("characterCount");
  const result = document.getElementById("qrResult");
  const qrCanvas = document.getElementById("qrCanvas");
  const submit = form.querySelector("button[type='submit']");
  const submitLabel = submit.querySelector("span");
  let currentQrText = "";

  function showError(message) {
    error.textContent = message;
    error.hidden = false;
    input.classList.add("is-invalid");
    result.hidden = true;
  }

  function extractStudent(payload) {
    const candidates = [payload?.result, payload?.data?.result, payload?.data, payload];
    return candidates.find(value => value && typeof value === "object" && (value.qrCode || value.fullName || value.identityCard));
  }

  function renderQr(student) {
    if (!student?.qrCode || typeof student.qrCode !== "string") {
      throw new Error("Hệ thống chưa cung cấp mã QR thanh toán cho học viên này.");
    }
    if (typeof window.QRCode !== "function") {
      throw new Error("Không thể khởi tạo mã QR. Vui lòng tải lại trang và thử lại.");
    }

    currentQrText = student.qrCode;
    document.getElementById("result-title").textContent = student.fullName || "Học viên";
    document.getElementById("resultIdentity").textContent = student.identityCard || input.value;
    qrCanvas.replaceChildren();
    new window.QRCode(qrCanvas, {
      text: currentQrText,
      width: 220,
      height: 220,
      colorDark: "#071432",
      colorLight: "#ffffff",
      correctLevel: window.QRCode.CorrectLevel.M
    });
    result.hidden = false;
    result.scrollIntoView({ behavior: "smooth", block: "start" });
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

    submit.disabled = true;
    submitLabel.textContent = "Đang tra cứu…";
    error.hidden = true;
    input.classList.remove("is-invalid");

    try {
      const url = new URL(API_URL);
      url.searchParams.set("identityCard", input.value);
      const response = await fetch(url.toString(), { headers: { Accept: "application/json" } });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = response.status === 404
          ? "Không tìm thấy thông tin thí sinh với số CCCD này."
          : payload.message || "Không thể tra cứu thông tin lúc này.";
        throw new Error(message);
      }
      const student = extractStudent(payload);
      if (!student) throw new Error(payload.message || "Dữ liệu trả về chưa hợp lệ.");
      renderQr(student);
    } catch (requestError) {
      showError(requestError instanceof TypeError
        ? "Không thể kết nối hệ thống tra cứu. Vui lòng thử lại sau."
        : requestError.message);
    } finally {
      submit.disabled = false;
      submitLabel.textContent = "Tra cứu mã QR";
    }
  });

  document.getElementById("closeResult").addEventListener("click", () => {
    result.hidden = true;
    input.focus();
  });

  document.getElementById("downloadQr").addEventListener("click", () => {
    if (!currentQrText) return;
    const source = qrCanvas.querySelector("canvas")?.toDataURL("image/png") || qrCanvas.querySelector("img")?.src;
    if (!source) return;
    const link = document.createElement("a");
    link.href = source;
    link.download = `ma-qr-thanh-toan-${input.value}.png`;
    link.click();
  });
})();
