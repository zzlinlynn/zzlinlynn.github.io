(() => {
  const loader = document.querySelector("[data-page-loader]");
  if (!loader) return;

  const mode = loader.dataset.pageLoaderMode || "external";
  const grace = Number.parseInt(loader.dataset.pageLoaderGrace || "120", 10);
  const animationTarget = loader.querySelector("[data-page-loader-animation]");
  const usesManualAnimationBoundary = animationTarget?.dataset.pageLoaderAnimation === "manual";
  const pending = new Set();
  let baseReady = mode !== "auto";
  let graceElapsed = false;
  let completionRequested = false;
  let animationEnded = !animationTarget;
  let gateAnimationName = "";

  const emit = (name, detail = {}) => {
    window.dispatchEvent(new CustomEvent(name, {
      detail: { loader, ...detail }
    }));
  };

  const setState = (state) => {
    if (!state || loader.dataset.pageLoaderState === state) return;
    loader.dataset.pageLoaderState = state;

    if (state === "loading") {
      loader.hidden = false;
      loader.classList.remove("is-hidden");
    } else if (state === "complete") {
      loader.classList.add("is-hidden");
    }

    emit("portfolio:loader-state", { state });
    if (state === "loading") emit("portfolio:loader-start");
    if (state === "complete") emit("portfolio:loader-complete");
  };

  const timeToMilliseconds = (value) => {
    const trimmed = value.trim();
    if (trimmed.endsWith("ms")) return Number.parseFloat(trimmed) || 0;
    if (trimmed.endsWith("s")) return (Number.parseFloat(trimmed) || 0) * 1000;
    return 0;
  };

  const selectGateAnimation = () => {
    if (!animationTarget) return "";
    const style = getComputedStyle(animationTarget);
    const names = style.animationName.split(",").map((value) => value.trim());
    const durations = style.animationDuration.split(",").map(timeToMilliseconds);
    const delays = style.animationDelay.split(",").map(timeToMilliseconds);
    const candidates = names
      .map((name, index) => ({
        name,
        span: Math.max(0, delays[index % Math.max(1, delays.length)] || 0)
          + (durations[index % Math.max(1, durations.length)] || 0)
      }))
      .filter(({ name, span }) => name && name !== "none" && span > 0);
    candidates.sort((a, b) => b.span - a.span);
    return candidates[0]?.name || "";
  };

  const animationBoundary = ({ finished = false } = {}) => {
    if (finished) animationEnded = true;
    if (completionRequested) setState("complete");
  };

  const startLoading = () => {
    completionRequested = false;
    if (loader.dataset.pageLoaderState === "loading") return;
    animationEnded = !animationTarget;
    gateAnimationName = "";
    setState("loading");
    requestAnimationFrame(() => {
      gateAnimationName = selectGateAnimation();
      if (!gateAnimationName && !usesManualAnimationBoundary) {
        animationEnded = true;
        if (completionRequested) setState("complete");
      }
    });
  };

  const requestComplete = () => {
    completionRequested = true;
    if (loader.dataset.pageLoaderState !== "loading" || animationEnded) {
      setState("complete");
    }
  };

  const maybeComplete = () => {
    if (baseReady && pending.size === 0) requestComplete();
  };

  const api = {
    element: loader,
    get state() {
      return loader.dataset.pageLoaderState || "idle";
    },
    start() {
      startLoading();
    },
    complete() {
      baseReady = true;
      maybeComplete();
    },
    animationBoundary,
    track(task) {
      const promise = Promise.resolve(task);
      pending.add(promise);
      if (mode !== "auto" || graceElapsed) startLoading();
      const settle = () => {
        pending.delete(promise);
        maybeComplete();
      };
      promise.then(settle, settle);
      return promise;
    }
  };

  window.portfolioPageLoader = api;

  animationTarget?.addEventListener("animationiteration", (event) => {
    if (!gateAnimationName || event.animationName === gateAnimationName) {
      animationBoundary();
    }
  });
  animationTarget?.addEventListener("animationend", (event) => {
    if (!gateAnimationName || event.animationName === gateAnimationName) {
      animationBoundary({ finished: true });
    }
  });
  if (mode !== "auto") return;

  setState("checking");

  window.setTimeout(() => {
    graceElapsed = true;
    if (!baseReady || pending.size > 0) startLoading();
  }, Number.isFinite(grace) ? Math.max(0, grace) : 120);

  const windowReady = document.readyState === "complete"
    ? Promise.resolve()
    : new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));
  const fontsReady = document.fonts?.ready || Promise.resolve();

  Promise.allSettled([windowReady, fontsReady]).then(() => {
    baseReady = true;
    maybeComplete();
  });
})();
