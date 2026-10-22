(() => {
  const modal = document.getElementById('engineViewModal');
  const scroller = document.getElementById('engineViewScroll');
  const toggle = document.getElementById('engineVoiceToggle');
  const speech = window.speechSynthesis;
  const canSpeak = Boolean(
    speech && window.SpeechSynthesisUtterance && window.IntersectionObserver,
  );

  if (!modal || !scroller || !toggle) return;

  let enabled = true;
  let observer = null;
  let activeCopy = null;
  let speakingCopy = null;
  let activeUtterance = null;
  let pendingCopy = null;
  let speakTimer = 0;
  let scrollFrame = 0;
  const visibleCopies = new Set();

  function updateToggle() {
    toggle.setAttribute('aria-pressed', String(enabled));
    toggle.setAttribute('aria-label', 'Tự đọc văn bản');
    toggle.title = enabled ? 'Tắt giọng đọc' : 'Bật giọng đọc';
  }

  function clearPendingSpeech() {
    window.clearTimeout(speakTimer);
    speakTimer = 0;
    pendingCopy = null;
  }

  function cancelSpeech() {
    clearPendingSpeech();
    if (speakingCopy) setItemButtonState(speakingCopy, false);
    speakingCopy = null;
    activeUtterance = null;
    if (canSpeak) speech.cancel();
  }

  function setItemButtonState(copy, isSpeaking) {
    const button = copy.querySelector('.engine-view-item-voice');
    if (!button) return;
    button.setAttribute('aria-pressed', String(isSpeaking));
    const label = isSpeaking ? 'Dừng đọc mục này' : 'Đọc mục này';
    button.setAttribute('aria-label', label);
    button.title = label;
  }

  function textFor(copy) {
    const heading = copy.querySelector('.step-title')?.textContent.trim();
    const paragraphs = Array.from(copy.querySelectorAll('.p'), (paragraph) =>
      paragraph.textContent
        .replace(/^\s*[-–—•]+\s*/, '')
        .replace(/\s+/g, ' ')
        .trim(),
    ).filter(Boolean);

    return [heading, ...paragraphs].filter(Boolean).join('. ');
  }

  function speak(copy) {
    if (!enabled || !canSpeak || !copy || !modal.classList.contains('is-open')) return;

    const text = textFor(copy);
    if (!text) return;

    cancelSpeech();
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    utterance.rate = 0.94;
    const vietnameseVoice = speech.getVoices().find((voice) => /^vi([_-]|$)/i.test(voice.lang));
    if (vietnameseVoice) utterance.voice = vietnameseVoice;
    speakingCopy = copy;
    activeUtterance = utterance;
    setItemButtonState(copy, true);
    const finish = () => {
      if (activeUtterance !== utterance) return;
      setItemButtonState(copy, false);
      speakingCopy = null;
      activeUtterance = null;
    };
    utterance.onend = finish;
    utterance.onerror = finish;
    speech.speak(utterance);
  }

  function addItemButton(copy) {
    if (copy.querySelector('.engine-view-item-voice')) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'engine-view-item-voice';
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-label', 'Đọc mục này');
    button.title = 'Đọc mục này';
    button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/></svg>';

    if (canSpeak) {
      button.addEventListener('click', () => {
        if (speakingCopy === copy) {
          cancelSpeech();
          return;
        }

        if (!enabled) {
          enabled = true;
          updateToggle();
        }
        activeCopy = copy;
        speak(copy);
      });
    } else {
      button.disabled = true;
      button.setAttribute('aria-label', 'Trình duyệt không hỗ trợ đọc văn bản');
      button.title = 'Trình duyệt không hỗ trợ đọc văn bản';
    }

    const titleRow = copy.querySelector('.step-title-row');
    if (titleRow) {
      titleRow.append(button);
    } else {
      const actions = document.createElement('div');
      actions.className = 'engine-view-item-actions';
      actions.append(button);
      copy.insertBefore(actions, copy.firstChild);
    }

    if (canSpeak) setItemButtonState(copy, false);
  }

  function copyAtReadingLine() {
    let bestCopy = null;
    const scrollerBounds = scroller.getBoundingClientRect();
    const visibleTop = scrollerBounds.top + scroller.clientTop;
    const visibleBottom = visibleTop + scroller.clientHeight;
    const readingLine = visibleTop + Math.min(scroller.clientHeight * 0.25, 190);
    let bestDistance = Infinity;

    visibleCopies.forEach((copy) => {
      const bounds = copy.getBoundingClientRect();
      const distance = readingLine < bounds.top
        ? bounds.top - readingLine
        : readingLine > bounds.bottom
          ? readingLine - bounds.bottom
          : 0;
      if (distance < bestDistance) {
        bestCopy = copy;
        bestDistance = distance;
      }
    });

    return bestCopy;
  }

  function scheduleSpeech(copy, delay = 180) {
    clearPendingSpeech();
    if (!copy || !enabled) return;

    pendingCopy = copy;
    speakTimer = window.setTimeout(() => {
      speakTimer = 0;
      if (pendingCopy !== copy) return;
      pendingCopy = null;
      speak(copy);
    }, delay);
  }

  function updateActiveCopy() {
    const nextCopy = copyAtReadingLine();
    if (nextCopy === activeCopy) return;

    activeCopy = nextCopy;
    cancelSpeech();
    if (nextCopy) scheduleSpeech(nextCopy);
  }

  function initialize(root = scroller) {
    if (!root?.querySelectorAll) return;

    const copies = root.querySelectorAll('.engine-media-copy');
    if (!copies.length) return;
    copies.forEach(addItemButton);
    if (!canSpeak || observer) return;

    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0) {
          visibleCopies.add(entry.target);
        } else {
          visibleCopies.delete(entry.target);
        }
      });
      updateActiveCopy();
    }, {
      root: scroller,
      threshold: [0, 0.15, 0.3, 0.5, 0.75],
    });

    copies.forEach((copy) => observer.observe(copy));
    scroller.addEventListener('scroll', () => {
      if (scrollFrame) return;
      scrollFrame = window.requestAnimationFrame(() => {
        scrollFrame = 0;
        updateActiveCopy();
      });
    }, { passive: true });
  }

  toggle.addEventListener('click', () => {
    enabled = !enabled;
    updateToggle();

    if (!enabled) {
      cancelSpeech();
      return;
    }

    activeCopy = copyAtReadingLine();
    speak(activeCopy);
  });

  if (!canSpeak) {
    enabled = false;
    toggle.disabled = true;
    toggle.setAttribute('aria-label', 'Trình duyệt không hỗ trợ đọc văn bản');
    toggle.title = 'Trình duyệt không hỗ trợ đọc văn bản';
    toggle.setAttribute('aria-pressed', 'false');
  } else {
    updateToggle();
  }

  window.initializeEngineVoice = initialize;
  window.stopEngineVoice = () => {
    cancelSpeech();
    activeCopy = null;
    visibleCopies.clear();
  };
})();
