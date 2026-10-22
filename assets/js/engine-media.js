(() => {
  const videos = new Set();
  const pausedByVisibility = new WeakSet();
  const inViewport = new WeakSet();
  const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  function loadVideo(video) {
    if (video.dataset.engineVideoLoaded === 'true') return;
    const source = video.dataset.videoSrc;
    if (!source) return;

    video.src = new URL(source, document.baseURI).href;
    video.dataset.engineVideoLoaded = 'true';
    video.load();
  }

  function playVideo(video) {
    if (reducedMotion() || video.dataset.userPaused === 'true') return;
    const playRequest = video.play();
    if (playRequest?.catch) playRequest.catch(() => {});
  }

  const observer = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (entry.isIntersecting) {
            inViewport.add(video);
            loadVideo(video);
            playVideo(video);
          } else {
            inViewport.delete(video);
            if (!video.paused) {
              pausedByVisibility.add(video);
              video.pause();
            }
          }
        });
      }, { rootMargin: '0px', threshold: 0.12 })
    : null;

  function initializeEngineVideoPlayback(root = document) {
    if (!root?.querySelectorAll) return;
    root.querySelectorAll('video[data-engine-video]').forEach((video) => {
      if (video.dataset.engineVideoReady === 'true') return;
      video.dataset.engineVideoReady = 'true';
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      videos.add(video);

      video.addEventListener('play', () => {
        video.dataset.userPaused = 'false';
      });
      video.addEventListener('pause', () => {
        if (pausedByVisibility.delete(video)) return;
        video.dataset.userPaused = 'true';
      });

      if (observer) {
        observer.observe(video);
      } else {
        loadVideo(video);
        playVideo(video);
      }
    });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      videos.forEach((video) => {
        if (!video.paused) {
          pausedByVisibility.add(video);
          video.pause();
        }
      });
      return;
    }

    videos.forEach((video) => {
      if (inViewport.has(video)) playVideo(video);
    });
  });

  window.initializeEngineVideoPlayback = initializeEngineVideoPlayback;
  document.addEventListener('DOMContentLoaded', () => {
    initializeEngineVideoPlayback(document);
  }, { once: true });
})();
