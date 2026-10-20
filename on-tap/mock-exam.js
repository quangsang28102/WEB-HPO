(() => {
  const configs = {
    B: {
      title: "Thi thử hạng B",
      timeLimitMinutes: 20,
      questionCount: [8, 1, 1, 1, 1, 9, 9],
      criticalQuestionsRequired: 1,
      passMark: 27,
    },
    C1: {
      title: "Thi thử hạng C1",
      timeLimitMinutes: 22,
      questionCount: [10, 1, 1, 2, 1, 10, 10],
      criticalQuestionsRequired: 1,
      passMark: 32,
    },
  };

  const state = {
    bank: null,
    mode: "practice",
    config: null,
    paper: [],
    answers: [],
    index: 0,
    timeLeft: 0,
    timer: null,
    active: false,
    finished: false,
    previousPapers: new Map(),
  };
  const $ = (id) => document.getElementById(id);
  const els = {
    entry: $("quizEntry"),
    entryOptions: [...document.querySelectorAll("[data-quiz-entry]")],
    modeSwitcher: $("quizModeSwitcher"),
    tabs: [...document.querySelectorAll("[data-quiz-mode]")],
    shell: $("quizShell"),
    sidebar: document.querySelector(".quiz-sidebar"),
    selectedLabel: document.querySelector(".selected-exam span"),
    selectedName: $("selectedTopicName"),
    progressLabel: $("progressLabel"),
    score: $("scoreLabel"),
    progress: $("progressBar"),
    clock: $("mockClock"),
    number: $("questionNumber"),
    title: $("questionTitle"),
    danger: $("dangerTag"),
    imageWrap: $("imageWrap"),
    image: $("questionImage"),
    answers: $("answerList"),
    feedback: $("answerFeedback"),
    questionCard: $("questionCard"),
    restart: $("restartQuiz"),
    previous: $("previousQuestion"),
    next: $("nextQuestion"),
    palette: $("paletteGrid"),
    paletteSummary: $("paletteSummary"),
    paletteLegend: document.querySelector(".palette-legend"),
    submit: $("submitMockExam"),
    result: $("mockExamResult"),
    resultSummary: document.querySelector(".mock-result-summary"),
    resultIcon: $("mockResultIcon"),
    resultStatus: $("mockResultStatus"),
    resultMessage: $("mockResultMessage"),
    resultScore: $("mockResultScore"),
    resultFacts: $("mockResultFacts"),
    reviewSummary: $("mockReviewSummary"),
    reviewPalette: $("mockReviewPalette"),
    reviewDetail: $("mockReviewDetail"),
    resultNew: $("mockResultNewExam"),
    resultPractice: $("mockResultPractice"),
  };

  const ownsQuiz = () => state.mode !== "practice";
  const normalize = (value) => String(value || "").toLocaleLowerCase("vi");
  const questionKey = (question) => `${question.title}|${question.image || ""}`;
  const totalQuestions = (config) => config.questionCount.reduce((sum, count) => sum + count, 0);
  const splitAnswers = (value) =>
    String(value || "")
      .split(/\n+/)
      .map((answer) => answer.replace(/^\s*\d+[.)]\s*/, "").trim())
      .filter(Boolean);
  const shuffle = (items) => {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1));
      [result[index], result[other]] = [result[other], result[index]];
    }
    return result;
  };

  function sourceCategoriesForPart(part) {
    const categories = state.bank?.categories || [];
    return categories.filter((category) => Number(category.order) === part);
  }

  function createPaper(config) {
    const excluded = state.previousPapers.get(state.mode) || new Set();
    const questions = [];
    const used = new Set();

    config.questionCount.forEach((count, index) => {
      const part = index + 1;
      const categories = sourceCategoriesForPart(part);
      let pool = categories.flatMap((category) => category.questions || []);
      if (part === 2) pool = pool.filter((question) => question.importance);
      const available = pool.filter(
        (question) => !used.has(questionKey(question)) && !excluded.has(questionKey(question)),
      );
      if (available.length < count) {
        throw new Error(`Phần ${part} hiện không đủ câu hỏi để tạo đề.`);
      }
      const selected = shuffle(available).slice(0, count);
      selected.forEach((question) => {
        used.add(questionKey(question));
        questions.push({ ...question, _mockPart: part });
      });
    });

    const criticalCount = questions.filter((question) => question.importance).length;
    if (criticalCount !== config.criticalQuestionsRequired) {
      throw new Error(`Đề phải có đúng ${config.criticalQuestionsRequired} câu điểm liệt.`);
    }

    state.previousPapers.set(state.mode, new Set(questions.map(questionKey)));
    return questions;
  }

  function setActiveTab(mode) {
    els.tabs.forEach((tab) => {
      const active = tab.dataset.quizMode === mode;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-pressed", String(active));
    });
  }

  function showQuizInterface() {
    els.entry.hidden = true;
    els.modeSwitcher.hidden = false;
    els.shell.hidden = false;
  }

  function setPracticeLegend() {
    els.paletteLegend.innerHTML =
      '<span><i class="unanswered"></i>Chưa trả lời</span><span><i class="correct"></i>Đúng</span><span><i class="wrong"></i>Sai</span>';
  }

  function setMockLegend() {
    els.paletteLegend.innerHTML =
      '<span><i class="unanswered"></i>Chưa trả lời</span><span><i class="answered"></i>Đã trả lời</span><span><i class="critical"></i>Câu điểm liệt</span>';
  }

  function enterPractice() {
    clearInterval(state.timer);
    showQuizInterface();
    state.mode = "practice";
    state.config = null;
    state.active = false;
    state.finished = false;
    setActiveTab("practice");
    els.shell.classList.remove("is-mock-mode", "is-mock-result");
    els.questionCard.hidden = false;
    els.result.hidden = true;
    els.clock.hidden = true;
    els.previous.hidden = true;
    els.submit.hidden = true;
    els.restart.hidden = false;
    els.restart.textContent = "↻ Làm lại";
    els.next.hidden = false;
    els.selectedLabel.textContent = "Bài thi đang chọn";
    setPracticeLegend();
    document.querySelector(".quiz-sidebar")?.classList.remove("is-open");
    document.querySelector(".question-palette")?.classList.remove("is-open");
    document.getElementById("drawerBackdrop")?.classList.remove("is-visible");
    window.hpoQuizPractice?.refresh();
  }

  function prepareMockMode(mode) {
    showQuizInterface();
    state.mode = mode;
    state.config = configs[mode];
    state.active = false;
    state.finished = false;
    setActiveTab(mode);
    els.shell.classList.add("is-mock-mode");
    els.shell.classList.remove("is-mock-result");
    els.questionCard.hidden = false;
    els.result.hidden = true;
    els.clock.hidden = true;
    els.previous.hidden = false;
    els.submit.hidden = false;
    els.restart.hidden = false;
    els.restart.textContent = "↻ Đề mới";
    els.next.hidden = false;
    els.selectedLabel.textContent = "Chế độ đang chọn";
    els.selectedName.textContent = state.config.title;
    setMockLegend();
    document.getElementById("resultModal")?.classList.remove("is-open");
    document.querySelector(".quiz-sidebar")?.classList.remove("is-open");
    document.querySelector(".question-palette")?.classList.remove("is-open");
    document.getElementById("drawerBackdrop")?.classList.remove("is-visible");
  }

  function startExam(mode) {
    clearInterval(state.timer);
    prepareMockMode(mode);
    if (!state.bank) {
      els.number.textContent = "Đang tải đề thi";
      els.title.textContent = "Đang tải ngân hàng câu hỏi…";
      els.progressLabel.textContent = "Vui lòng đợi trong giây lát";
      els.score.textContent = "";
      els.answers.replaceChildren();
      els.feedback.className = "answer-feedback";
      els.feedback.textContent = "";
      return;
    }
    try {
      state.paper = createPaper(state.config);
    } catch (error) {
      els.number.textContent = state.config.title;
      els.title.textContent = error.message || "Không thể tạo đề thi.";
      els.progressLabel.textContent = "Chưa thể bắt đầu đề thi";
      els.score.textContent = "";
      els.answers.replaceChildren();
      els.feedback.className = "answer-feedback";
      els.feedback.textContent = "";
      return;
    }

    state.answers = Array(state.paper.length).fill(null);
    state.index = 0;
    state.timeLeft = state.config.timeLimitMinutes * 60;
    state.active = true;
    els.clock.hidden = false;
    renderQuestion();
    updateClock();
    state.timer = setInterval(() => {
      state.timeLeft = Math.max(0, state.timeLeft - 1);
      updateClock();
      if (state.timeLeft === 0) finishExam(true);
    }, 1000);
    document.querySelector(".quiz-app-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function updateClock() {
    const minutes = Math.floor(state.timeLeft / 60);
    const seconds = state.timeLeft % 60;
    els.clock.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    els.clock.classList.toggle("is-low", state.timeLeft <= 60);
  }

  function renderQuestion() {
    const question = state.paper[state.index];
    if (!question) return;
    const selected = state.answers[state.index];
    const answerTexts = splitAnswers(question.answers);
    const answeredCount = state.answers.filter((answer) => answer !== null).length;

    els.number.textContent = `Câu ${state.index + 1} / ${state.paper.length}`;
    els.title.textContent = question.title || "";
    els.danger.classList.toggle("is-visible", Boolean(question.importance));
    els.progressLabel.textContent = `Đang xem câu ${state.index + 1} / ${state.paper.length}`;
    els.score.textContent = `Đã trả lời ${answeredCount} / ${state.paper.length}`;
    els.progress.style.width = `${(answeredCount / state.paper.length) * 100}%`;
    els.paletteSummary.textContent = `${answeredCount} / ${state.paper.length} đã trả lời`;
    els.feedback.className = "answer-feedback";
    els.feedback.textContent = "";

    const imagePath = question.image
      ? /^https?:\/\//i.test(question.image)
        ? question.image
        : `https://lms.hpo.edu.vn${question.image}`
      : "";
    els.imageWrap.classList.toggle("is-visible", Boolean(imagePath));
    els.imageWrap.classList.remove("is-error");
    els.image.removeAttribute("src");
    if (imagePath) {
      els.image.src = imagePath;
      els.image.onerror = () => els.imageWrap.classList.add("is-error");
    }

    els.answers.replaceChildren();
    answerTexts.forEach((text, index) => {
      const button = document.createElement("button");
      const letter = document.createElement("span");
      const answer = document.createElement("span");
      button.type = "button";
      button.className = `answer-option${selected === index ? " is-selected" : ""}`;
      button.dataset.answer = String(index);
      button.setAttribute("aria-pressed", String(selected === index));
      letter.className = "answer-letter";
      letter.textContent = String.fromCharCode(65 + index);
      answer.className = "answer-text";
      answer.textContent = text;
      button.append(letter, answer);
      button.addEventListener("click", () => {
        if (!state.active) return;
        state.answers[state.index] = index;
        renderQuestion();
      });
      els.answers.append(button);
    });

    els.previous.disabled = state.index === 0;
    els.next.disabled = false;
    els.next.innerHTML = state.index === state.paper.length - 1
      ? 'Nộp bài thi <span aria-hidden="true">→</span>'
      : 'Câu tiếp theo <span aria-hidden="true">→</span>';
    renderPalette();
  }

  function renderPalette() {
    els.palette.replaceChildren();
    state.paper.forEach((question, index) => {
      const button = document.createElement("button");
      const answered = state.answers[index] !== null;
      button.type = "button";
      button.className = `palette-item${answered ? " is-answered" : ""}${index === state.index ? " is-current" : ""}${question.importance ? " is-critical" : ""}`;
      button.textContent = String(index + 1);
      button.setAttribute("aria-label", `Câu ${index + 1}${answered ? ", đã trả lời" : ", chưa trả lời"}${question.importance ? ", câu điểm liệt" : ""}`);
      button.addEventListener("click", () => {
        if (!state.active) return;
        state.index = index;
        renderQuestion();
      });
      els.palette.append(button);
    });
  }

  function next() {
    if (!state.active) return;
    if (state.index === state.paper.length - 1) {
      finishExam(false);
      return;
    }
    state.index++;
    renderQuestion();
  }

  function previous() {
    if (!state.active || state.index === 0) return;
    state.index--;
    renderQuestion();
  }

  function finishExam(timeExpired) {
    if (!state.active) return;
    state.active = false;
    state.finished = true;
    clearInterval(state.timer);

    const correct = state.paper.reduce(
      (count, question, index) => count + (state.answers[index] === Number(question.trueAnswer) ? 1 : 0),
      0,
    );
    const criticalQuestions = state.paper
      .map((question, index) => ({ question, answer: state.answers[index] }))
      .filter(({ question }) => question.importance);
    const criticalWrong = criticalQuestions.filter(
      ({ question, answer }) => answer !== Number(question.trueAnswer),
    ).length;
    const answered = state.answers.filter((answer) => answer !== null).length;
    const unanswered = state.paper.length - answered;
    const criticalQuestion = criticalQuestions[0];
    const criticalStatus = !criticalQuestion
      ? "thiếu câu"
      : criticalQuestion.answer === null
        ? "chưa làm"
        : criticalQuestion.answer === Number(criticalQuestion.question.trueAnswer)
          ? "đúng"
          : "sai";
    const passed =
      correct >= state.config.passMark &&
      criticalQuestions.length === state.config.criticalQuestionsRequired &&
      criticalWrong === 0;

    els.shell.classList.add("is-mock-result");
    els.questionCard.hidden = true;
    els.result.hidden = false;
    els.clock.hidden = true;
    els.previous.hidden = true;
    els.submit.hidden = true;
    els.restart.hidden = true;
    els.progressLabel.textContent = "Đã hoàn thành đề thi";
    els.score.textContent = `${correct} / ${state.paper.length} câu đúng`;
    els.progress.style.width = "100%";
    els.resultSummary.classList.toggle("is-fail", !passed);
    els.resultIcon.textContent = passed ? "✓" : "×";
    els.resultStatus.textContent = passed ? "ĐẠT" : "KHÔNG ĐẠT";
    els.resultMessage.textContent = timeExpired
      ? `Đã hết thời gian. ${resultReason(correct, criticalWrong, passed)}`
      : resultReason(correct, criticalWrong, passed);
    els.resultScore.textContent = `${correct} / ${state.paper.length}`;
    els.resultFacts.replaceChildren(
      resultFact(`${answered}/${state.paper.length} câu đã trả lời`),
      resultFact(`${unanswered} câu chưa làm`, unanswered > 0 ? "is-unanswered" : ""),
      resultFact(`Câu điểm liệt: ${criticalStatus}`, criticalStatus === "đúng" ? "is-success" : "is-fail"),
    );
    buildReview(correct);
    els.result.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function resultReason(correct, criticalWrong, passed) {
    if (passed) return `Bạn đạt ${correct} điểm, đủ mức yêu cầu ${state.config.passMark} điểm.`;
    if (criticalWrong > 0) return "Bạn sai hoặc bỏ trống câu điểm liệt nên bài thi không đạt.";
    return `Bạn cần đạt ít nhất ${state.config.passMark} điểm để qua bài thi.`;
  }

  function resultFact(text, status = "") {
    const fact = document.createElement("span");
    fact.className = `mock-result-fact${status ? ` ${status}` : ""}`;
    fact.textContent = text;
    return fact;
  }

  function buildReview(correctCount) {
    els.reviewSummary.textContent = `${correctCount} đúng · ${state.paper.length - correctCount} sai hoặc bỏ trống`;
    els.reviewPalette.replaceChildren();
    state.paper.forEach((question, index) => {
      const selected = state.answers[index];
      const isCorrect = selected === Number(question.trueAnswer);
      const button = document.createElement("button");
      const number = document.createElement("span");
      button.type = "button";
      button.className = `mock-review-number ${isCorrect ? "is-correct" : "is-wrong"}${index === 0 ? " is-current" : ""}`;
      button.setAttribute("aria-pressed", String(index === 0));
      button.setAttribute(
        "aria-label",
        `Câu ${index + 1}, ${isCorrect ? "đúng" : selected === null ? "chưa làm" : "sai"}${question.importance ? ", câu điểm liệt" : ""}`,
      );
      number.textContent = String(index + 1);
      button.append(number);
      if (question.importance) {
        const criticalMark = document.createElement("span");
        criticalMark.className = "mock-review-critical";
        criticalMark.setAttribute("aria-hidden", "true");
        criticalMark.textContent = "!";
        button.append(criticalMark);
      }
      button.addEventListener("click", () => showReviewDetail(index));
      els.reviewPalette.append(button);
    });
    showReviewDetail(0);
  }

  function showReviewDetail(index) {
    const question = state.paper[index];
    if (!question) return;
    const selected = state.answers[index];
    const correctIndex = Number(question.trueAnswer);
    const isCorrect = selected === correctIndex;
    els.reviewPalette.querySelectorAll(".mock-review-number").forEach((button, buttonIndex) => {
      const isCurrent = buttonIndex === index;
      button.classList.toggle("is-current", isCurrent);
      button.setAttribute("aria-pressed", String(isCurrent));
    });

    const detail = document.createElement("div");
    detail.className = `mock-review-detail-card ${isCorrect ? "is-correct" : "is-wrong"}`;
    const heading = document.createElement("div");
    heading.className = "mock-review-detail-heading";
    const questionNumber = document.createElement("strong");
    questionNumber.textContent = `Câu ${index + 1}`;
    heading.append(questionNumber);
    if (question.importance) {
      const critical = document.createElement("span");
      critical.className = "mock-review-critical-label";
      critical.textContent = "! Câu điểm liệt";
      heading.append(critical);
    }
    const status = document.createElement("span");
    status.className = `mock-review-status ${isCorrect ? "is-correct" : "is-wrong"}`;
    status.textContent = isCorrect ? "Trả lời đúng" : selected === null ? "Chưa trả lời" : "Trả lời sai";
    heading.append(status);

    const title = document.createElement("h4");
    title.className = "mock-review-question-title";
    title.textContent = question.title || "";
    detail.append(heading, title);

    if (question.image) {
      const figure = document.createElement("figure");
      const image = document.createElement("img");
      figure.className = "mock-review-image";
      image.alt = `Hình minh họa câu ${index + 1}`;
      image.src = /^https?:\/\//i.test(question.image)
        ? question.image
        : `https://lms.hpo.edu.vn${question.image}`;
      image.onerror = () => figure.remove();
      figure.append(image);
      detail.append(figure);
    }

    const options = document.createElement("div");
    options.className = "mock-review-options";
    splitAnswers(question.answers).forEach((answer, answerIndex) => {
      const option = document.createElement("div");
      const letter = document.createElement("span");
      const text = document.createElement("span");
      const note = document.createElement("span");
      const isAnswer = answerIndex === correctIndex;
      const isSelected = selected !== null && answerIndex === selected;
      option.className = `mock-review-option${isAnswer ? " is-correct" : ""}${isSelected && !isAnswer ? " is-selected-wrong" : ""}${isSelected && isAnswer ? " is-selected-correct" : ""}`;
      letter.className = "mock-review-option-letter";
      letter.textContent = String.fromCharCode(65 + answerIndex);
      text.className = "mock-review-option-text";
      text.textContent = answer;
      note.className = "mock-review-option-note";
      note.textContent = isSelected && isAnswer
        ? "Bạn chọn · Đáp án đúng"
        : isSelected
          ? "Bạn đã chọn"
          : isAnswer
            ? "Đáp án đúng"
            : "";
      option.append(letter, text, note);
      options.append(option);
    });
    detail.append(options);
    els.reviewDetail.replaceChildren(detail);
  }

  function handleKeyboard(event) {
    if (!ownsQuiz() || !state.active) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      previous();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      next();
    } else if (["1", "2", "3", "4"].includes(event.key)) {
      event.preventDefault();
      els.answers.querySelectorAll(".answer-option")[Number(event.key) - 1]?.click();
    } else {
      return;
    }
    event.stopImmediatePropagation();
  }

  els.entryOptions.forEach((option) => {
    option.addEventListener("click", () => {
      const mode = option.dataset.quizEntry;
      if (mode === "practice") enterPractice();
      else startExam(mode);
    });
  });
  els.tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const mode = tab.dataset.quizMode;
      if (mode === "practice") {
        enterPractice();
      } else if (mode !== state.mode || !state.active) {
        startExam(mode);
      }
    });
  });
  setActiveTab(null);
  els.previous.addEventListener("click", previous);
  els.submit.addEventListener("click", () => finishExam(false));
  els.resultNew.addEventListener("click", () => startExam(state.mode));
  els.resultPractice.addEventListener("click", enterPractice);
  document.addEventListener("keydown", handleKeyboard, true);

  window.hpoMockExam = {
    ownsQuiz,
    next,
    newPaper() {
      if (ownsQuiz()) startExam(state.mode);
    },
  };
  window.addEventListener("hpo-quiz-bank-ready", (event) => {
    state.bank = event.detail;
    if (ownsQuiz() && !state.active) startExam(state.mode);
  });
  window.addEventListener("hpo-quiz-bank-error", () => {
    if (!ownsQuiz()) return;
    els.title.textContent = "Không thể tải ngân hàng câu hỏi.";
    els.progressLabel.textContent = "Vui lòng tải lại trang";
  });
  if (window.hpoQuizQuestionBank) state.bank = window.hpoQuizQuestionBank;
})();
