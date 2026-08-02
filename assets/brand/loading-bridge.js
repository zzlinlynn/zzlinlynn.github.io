(() => {
  const pageLoader = window.portfolioPageLoader;
  const loader = pageLoader?.element;
  if (!pageLoader || !loader) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const animationTarget = loader.querySelector('[data-page-loader-animation="manual"]');
  const configuredGrace = Number.parseInt(loader.dataset.pageLoaderGrace || "120", 10);
  const grace = Number.isFinite(configuredGrace) ? Math.max(0, configuredGrace) : 120;
  const configuredSpeed = Number.parseFloat(loader.dataset.pageLoaderPlaybackSpeed || "1");
  const playbackSpeed = Number.isFinite(configuredSpeed) && configuredSpeed > 0
    ? configuredSpeed
    : 1;

  let loadingStarted = pageLoader.state === "loading";
  let animationInstallRequested = false;
  let animationSettled = false;
  let animation = null;
  let disposed = false;

  const disposeAnimation = () => {
    if (disposed) return;
    disposed = true;
    try {
      animation?.destroy();
    } catch {
      // The renderer may already have released its DOM during navigation.
    }
    animation = null;
    animationTarget?.replaceChildren();
    loader.hidden = true;
  };

  const stopAtAnimationEnd = () => {
    if (!animation || disposed) return;

    const instanceFrames = Number(animation.totalFrames);
    const inPoint = Number(window.LOADING_ANIMATION?.ip);
    const outPoint = Number(window.LOADING_ANIMATION?.op);
    const dataFrames = Number.isFinite(outPoint)
      ? outPoint - (Number.isFinite(inPoint) ? inPoint : 0)
      : 0;
    const frameCount = Number.isFinite(instanceFrames) && instanceFrames > 0
      ? instanceFrames
      : dataFrames;
    if (!Number.isFinite(frameCount) || frameCount <= 0) return;

    try {
      animation.goToAndStop(Math.max(0, frameCount - 1), true);
    } catch {
      try {
        animation.pause();
      } catch {
        // The normal completion handler has already hidden the loader.
      }
    }
  };

  const startInstalledAnimation = () => {
    if (!loadingStarted || !animationInstallRequested || animationSettled) return;
    animationSettled = true;

    if (
      !animationTarget
      || !window.LOADING_ANIMATION
      || typeof window.lottie?.loadAnimation !== "function"
    ) {
      pageLoader.animationBoundary({ finished: true });
      return;
    }

    try {
      animation = window.lottie.loadAnimation({
        container: animationTarget,
        renderer: "svg",
        loop: !reducedMotion.matches,
        autoplay: !reducedMotion.matches,
        animationData: window.LOADING_ANIMATION,
        rendererSettings: {
          preserveAspectRatio: "xMidYMid meet",
          progressiveLoad: false
        }
      });
      animation.setSpeed(playbackSpeed);
      animationTarget.classList.add("is-animated");
      let failureReported = false;
      const finishFailedAnimation = () => {
        if (failureReported) return;
        failureReported = true;
        animationTarget.classList.remove("is-animated");
        pageLoader.animationBoundary({ finished: true });
      };
      animation.addEventListener("data_failed", finishFailedAnimation);
      animation.addEventListener("error", finishFailedAnimation);

      if (reducedMotion.matches) {
        let boundaryReported = false;
        const finishReducedMotion = () => {
          if (boundaryReported) return;
          boundaryReported = true;
          const marker = window.LOADING_ANIMATION.markers?.find(
            (candidate) => candidate.cm === "complete"
          );
          const stillFrame = marker?.tm
            ?? Math.max(0, window.LOADING_ANIMATION.op - 1);
          animation?.goToAndStop(stillFrame, true);
          pageLoader.animationBoundary({ finished: true });
        };
        animation.addEventListener("DOMLoaded", finishReducedMotion);
        if (animation.isLoaded) finishReducedMotion();
      } else {
        animation.addEventListener("loopComplete", () => {
          if (disposed) return;
          pageLoader.animationBoundary();
          if (pageLoader.state === "complete") stopAtAnimationEnd();
        });
      }
    } catch {
      animation = null;
      pageLoader.animationBoundary({ finished: true });
    }
  };

  const installLottie = () => {
    animationInstallRequested = true;
    startInstalledAnimation();
  };

  const onLoaderStart = () => {
    loadingStarted = true;
    startInstalledAnimation();
  };

  const onLoaderComplete = () => {
    try {
      animation?.pause();
    } catch {
      // A completed loader remains hidden even if its renderer cannot pause.
    }
    if (!loadingStarted) loader.hidden = true;
  };

  const onLoaderTransitionEnd = (event) => {
    if (
      event.target === loader
      && pageLoader.state === "complete"
      && (event.propertyName === "opacity" || event.propertyName === "visibility")
    ) {
      disposeAnimation();
    }
  };

  const completeWhen = (task) => Promise.resolve(task).then(
    () => pageLoader.complete(),
    () => pageLoader.complete()
  );

  window.addEventListener("portfolio:loader-start", onLoaderStart);
  window.addEventListener("portfolio:loader-complete", onLoaderComplete);
  window.addEventListener("portfolio:transition-complete", disposeAnimation, { once: true });
  window.addEventListener("pagehide", disposeAnimation, { once: true });
  loader.addEventListener("transitionend", onLoaderTransitionEnd);

  window.setTimeout(() => {
    if (pageLoader.state === "checking") pageLoader.start();
  }, grace);

  window.portfolioLoadingBridge = {
    completeWhen,
    installLottie
  };

  if (loader.dataset.pageLoaderMode === "auto") {
    if (document.readyState === "complete") {
      installLottie();
    } else {
      document.addEventListener("DOMContentLoaded", installLottie, { once: true });
    }
  }
})();
