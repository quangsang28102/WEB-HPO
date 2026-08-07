(() => {
    const state = {
        categories: [],
        questions: [],
        filtered: [],
        index: 0,
        answers: new Map(),
        category: "all",
    };
    const $ = (id) => document.getElementById(id);
    const els = {
        topicList: $("topicList"),
        title: $("questionTitle"),
        number: $("questionNumber"),
        image: $("questionImage"),
        imageWrap: $("imageWrap"),
        answers: $("answerList"),
        feedback: $("answerFeedback"),
        next: $("nextQuestion"),
        restart: $("restartQuiz"),
        progress: $("progressBar"),
        progressLabel: $("progressLabel"),
        score: $("scoreLabel"),
        danger: $("dangerTag"),
        palette: $("questionPalette"),
        paletteGrid: $("paletteGrid"),
        paletteSummary: $("paletteSummary"),
        backdrop: $("drawerBackdrop"),
        sidebar: document.querySelector(".quiz-sidebar"),
        result: $("resultModal"),
    };
    const splitAnswers = (value) =>
        value
            .split(/\n+/)
            .map((x) => x.replace(/^\s*\d+[.)]\s*/, "").trim())
            .filter(Boolean);
    const score = () =>
        [...state.answers.values()].filter((x) => x.correct).length;
    const closeDrawers = () => {
        els.sidebar.classList.remove("is-open");
        els.palette.classList.remove("is-open");
        els.backdrop.classList.remove("is-visible");
    };
    const openDrawer = (drawer) => {
        closeDrawers();
        drawer.classList.add("is-open");
        els.backdrop.classList.add("is-visible");
    };
    function getTopics() {
        const regular = state.categories
            .map((category, index) => ({ category, index }))
            .filter(({ category }) => category.order !== 99 && !category._id.toLowerCase().includes("điểm liệt"));
        return [
            { key: "all", label: "Tất cả", name: "Toàn bộ ngân hàng 600 câu hỏi", count: state.questions.length },
            ...regular.map(({ category, index }, chapter) => ({ key: `cat-${index}`, label: `Chương ${chapter + 1}`, name: category._id, count: category.questions.length })),
            { key: "critical", label: "Câu điểm liệt", name: "60 câu hỏi điểm liệt", count: state.questions.filter((q) => q.importance).length },
        ];
    }
    function buildTopics() {
        const topics = getTopics();
        const selected = topics.find((topic) => topic.key === state.category) || topics[0];
        $("selectedTopicName").textContent = `${selected.label} — ${selected.name}`;
        els.topicList.innerHTML = topics
            .map(
                (t) =>
                    `<button 
                        class="topic-button${t.key === state.category ? " is-active" : ""}" 
                        data-topic="${t.key}"
                    >
                        <span class="topic-copy">
                            <strong>${t.label}</strong>
                        </span>
                    </button>`,
            )
            .join("");
        els.topicList
            .querySelectorAll("button")
            .forEach((b) => (b.onclick = () => selectTopic(b.dataset.topic)));
    }
    function selectTopic(key) {
        state.category = key;
        if (key === "all") state.filtered = [...state.questions];
        else if (key === "critical")
            state.filtered = state.questions.filter((q) => q.importance);
        else
            state.filtered = [
                ...state.categories[Number(key.split("-")[1])].questions,
            ];
        state.index = 0;
        state.answers.clear();
        buildTopics();
        buildPalette();
        render();
        closeDrawers();
    }
    function buildPalette() {
        els.paletteGrid.innerHTML = state.filtered
            .map(
                (_, i) =>
                    `<button class="palette-item" data-index="${i}">${i + 1}</button>`,
            )
            .join("");
        els.paletteGrid.querySelectorAll("button").forEach(
            (b) =>
            (b.onclick = () => {
                state.index = Number(b.dataset.index);
                render();
                closeDrawers();
            }),
        );
    }
    function resolveImage(path) {
        if (!path) return "";
        if (/^https?:/.test(path)) return path;
        return `https://lms.hpo.edu.vn${path}`;
    }
    function render() {
        const q = state.filtered[state.index];
        const IMAGE_BASE = 'https://lms.hpo.edu.vn'
        if (!q) return;
        const saved = state.answers.get(state.index);
        els.number.textContent = `Câu ${state.index + 1} / ${state.filtered.length}`;
        els.title.textContent = q.title;
        els.danger.classList.toggle("is-visible", Boolean(q.importance));
        els.progress.style.width = `${((state.index + 1) / state.filtered.length) * 100}%`;
        els.progressLabel.textContent = `Tiến độ ${state.index + 1} / ${state.filtered.length}`;
        els.score.textContent = `Điểm: ${score()}`;
        els.paletteSummary.textContent = `${state.answers.size} / ${state.filtered.length} đã trả lời`;
        els.imageWrap.classList.remove("is-visible", "is-error");
        if (q.image) {
            els.imageWrap.classList.add("is-visible");
            els.image.src = resolveImage(q.image);
            els.image.onerror = () => {
                if (!els.image.dataset.retried) {
                    els.image.dataset.retried = "1";
                    els.image.src = `${IMAGE_BASE}${q.image}`;
                } else els.imageWrap.classList.add("is-error");
            };
            els.image.onload = () => els.image.removeAttribute("data-retried");
        } else els.image.removeAttribute("src");
        const answers = splitAnswers(q.answers);
        els.answers.innerHTML = answers
            .map(
                (a, i) =>
                    `<button 
                        class="answer-option" 
                        data-answer="${i}" ${saved ? "disabled" : ""}
                    >
                        <span class="answer-letter">${String.fromCharCode(65 + i)}</span>
                        <span class="answer-text">${a}</span>
                    </button>`,
            )
            .join("");
        if (saved) paintAnswer(saved, q.trueAnswer);
        else {
            els.feedback.className = "answer-feedback";
            els.feedback.textContent = "";
        }
        els.answers
            .querySelectorAll("button")
            .forEach((b) => (b.onclick = () => answer(Number(b.dataset.answer))));
        els.next.disabled = !saved;
        els.next.innerHTML =
            state.index === state.filtered.length - 1
                ? "Xem kết quả <span>→</span>"
                : "Câu tiếp theo <span>→</span>";
        updatePalette();
    }
    function answer(choice) {
        if (state.answers.has(state.index)) return;
        const q = state.filtered[state.index],
            correct = choice === q.trueAnswer;
        state.answers.set(state.index, { choice, correct });
        paintAnswer({ choice, correct }, q.trueAnswer);
        els.answers.querySelectorAll("button").forEach((b) => (b.disabled = true));
        els.next.disabled = false;
        els.score.textContent = `Điểm: ${score()}`;
        updatePalette();
    }
    function paintAnswer(saved, trueAnswer) {
        const answerButtons = [...els.answers.querySelectorAll("button")];
        answerButtons.forEach((b, i) => {
            if (i === trueAnswer) b.classList.add("is-correct");
            if (i === saved.choice && i !== trueAnswer) b.classList.add("is-wrong");
        });
        els.feedback.className = `answer-feedback is-visible ${saved.correct ? "correct" : "wrong"}`;
        const correctText = answerButtons[trueAnswer]?.querySelector(".answer-text")?.textContent.trim() || "";
        els.feedback.textContent = saved.correct
            ? "Chính xác! Bạn đã chọn đúng đáp án."
            : `Chưa chính xác. Đáp án đúng là: ${String.fromCharCode(65 + trueAnswer)} ${correctText}`;
    }
    function updatePalette() {
        els.paletteGrid.querySelectorAll("button").forEach((b, i) => {
            const a = state.answers.get(i);
            b.className = `palette-item${i === state.index ? " is-current" : ""}${a ? ` is-${a.correct ? "correct" : "wrong"}` : ""}`;
        });
        els.paletteSummary.textContent = `${state.answers.size} / ${state.filtered.length} đã trả lời`;
    }
    function showResult() {
        const correct = score(),
            total = state.filtered.length,
            answered = state.answers.size,
            percent = Math.round((correct / total) * 100);
        $("resultPercent").textContent = `${percent}%`;
        $("resultCorrect").textContent = correct;
        $("resultWrong").textContent = answered - correct;
        $("resultTitle").textContent =
            percent >= 80
                ? "Kết quả rất tốt!"
                : percent >= 50
                    ? "Bạn đang tiến bộ"
                    : "Hãy luyện tập thêm";
        $("resultText").textContent =
            `Bạn đã trả lời đúng ${correct} / ${total} câu hỏi (${answered} câu đã làm).`;
        $("resultRing").style.background =
            `conic-gradient(var(--quiz-blue) ${percent}%,#e7edf6 0)`;
        els.result.classList.add("is-open");
        els.result.ariaHidden = "false";
    }
    function restart() {
        state.answers.clear();
        state.index = 0;
        buildPalette();
        render();
        els.result.classList.remove("is-open");
    }
    els.next.onclick = () => {
        if (state.index < state.filtered.length - 1) {
            state.index++;
            render();
            scrollTo({
                top: document.querySelector(".quiz-app-section").offsetTop - 10,
                behavior: "smooth",
            });
        } else showResult();
    };
    const restartConfirm = $("restartConfirm");
    const openRestartConfirm = () => {
        restartConfirm.classList.add("is-open");
        restartConfirm.setAttribute("aria-hidden", "false");
        $("confirmRestart").focus();
    };
    const closeRestartConfirm = () => {
        restartConfirm.classList.remove("is-open");
        restartConfirm.setAttribute("aria-hidden", "true");
        els.restart.focus();
    };
    els.restart.onclick = openRestartConfirm;
    $("cancelRestart").onclick = closeRestartConfirm;
    $("confirmBackdrop").onclick = closeRestartConfirm;
    $("confirmRestart").onclick = () => {
        closeRestartConfirm();
        restart();
    };
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && restartConfirm.classList.contains("is-open")) {
            closeRestartConfirm();
        }
    });
    $("resultRestart").onclick = restart;
    $("closeResult").onclick = () => els.result.classList.remove("is-open");
    $("closeTopics").onclick = closeDrawers;
    $("closePalette").onclick = closeDrawers;
    els.backdrop.onclick = closeDrawers;
    const burger = $("burger"),
        mobile = $("mobileMenu"),
        mobileClose = $("mobileClose");
    burger?.addEventListener("click", () => {
        mobile?.classList.add("is-open");
        document.body.style.overflow = "hidden";
    });
    mobileClose?.addEventListener("click", () => {
        mobile?.classList.remove("is-open");
        document.body.style.overflow = "";
    });
    fetch("../assets/data/600tn.json")
        .then((r) => {
            if (!r.ok) throw Error("Không thể tải dữ liệu");
            return r.json();
        })
        .then((data) => {
            state.categories = data
                .sort((a, b) => a.order - b.order)
                .map((category) => ({
                    ...category,
                    questions: category.questions.filter((q) => q.active).reverse(),
                }));
            state.questions = state.categories.flatMap((c) => c.questions);
            state.filtered = [...state.questions];
            buildTopics();
            buildPalette();
            render();
        })
        .catch(() => {
            els.title.textContent = "Không thể tải ngân hàng câu hỏi";
            els.number.textContent = "Có lỗi xảy ra";
            els.progressLabel.textContent = "Vui lòng tải lại trang";
        });
})();
