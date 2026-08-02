(() => {
  const storageKey = "lynn:page-transition:v1";
  const maxStateAge = 15000;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const deviceQueries = {
    mobile: window.matchMedia("(max-width: 760px)"),
    tablet: window.matchMedia("(min-width: 761px) and (max-width: 1100px)")
  };
  const timings = {
    desktop: { pixelSize: 18, total: 1600 },
    tablet: { pixelSize: 16, total: 1500 },
    mobile: { pixelSize: 16, total: 1400 }
  };
  const phase = {
    cover: 0.64,
    hold: 0.07,
    reveal: 0.29
  };

  let overlay = null;
  let frame = 0;
  let transitioning = false;
  let preserveOutgoingCover = false;
  let scrollbarRevealPercent = -1;

  const blockedScrollKeys = new Set([
    " ",
    "Spacebar",
    "PageUp",
    "PageDown",
    "End",
    "Home",
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight"
  ]);
  const scrollBlockOptions = { capture: true, passive: false };
  const blockScrollEvent = (event) => {
    if (event.cancelable) event.preventDefault();
  };
  const blockScrollKey = (event) => {
    if (blockedScrollKeys.has(event.key)) event.preventDefault();
  };
  const lockPageScroll = () => {
    document.documentElement.classList.add("page-transition-locked");
    window.addEventListener("wheel", blockScrollEvent, scrollBlockOptions);
    window.addEventListener("touchmove", blockScrollEvent, scrollBlockOptions);
    window.addEventListener("keydown", blockScrollKey, scrollBlockOptions);
  };
  const unlockPageScroll = () => {
    document.documentElement.classList.remove("page-transition-locked");
    window.removeEventListener("wheel", blockScrollEvent, scrollBlockOptions);
    window.removeEventListener("touchmove", blockScrollEvent, scrollBlockOptions);
    window.removeEventListener("keydown", blockScrollKey, scrollBlockOptions);
  };

  const clearStoredState = () => {
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // Storage can be unavailable in private or sandboxed browsing contexts.
    }
  };

  const saveStoredState = (state) => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(state));
      return true;
    } catch {
      clearStoredState();
      return false;
    }
  };

  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  const easeOutCubic = (value) => 1 - Math.pow(1 - clamp(value), 3);

  const resetScrollbarPaint = (color) => {
    const style = document.documentElement.style;
    style.setProperty("--page-transition-scrollbar-cover", color);
    style.setProperty("--page-transition-scrollbar-target", color);
    style.setProperty("--page-transition-scrollbar-reveal", "0%");
    scrollbarRevealPercent = 0;
  };

  const beginScrollbarReveal = (targetColor) => {
    document.documentElement.style.setProperty(
      "--page-transition-scrollbar-target",
      targetColor
    );
    scrollbarRevealPercent = 0;
  };

  const syncScrollbarReveal = (edgeCoverage) => {
    const revealPercent = Math.round((1 - clamp(edgeCoverage)) * 100);
    if (revealPercent === scrollbarRevealPercent) return;
    scrollbarRevealPercent = revealPercent;
    document.documentElement.style.setProperty(
      "--page-transition-scrollbar-reveal",
      `${revealPercent}%`
    );
  };

  const clearScrollbarPaint = () => {
    const style = document.documentElement.style;
    style.removeProperty("--page-transition-scrollbar-cover");
    style.removeProperty("--page-transition-scrollbar-target");
    style.removeProperty("--page-transition-scrollbar-reveal");
    scrollbarRevealPercent = -1;
  };

  const normalizePath = (value) => {
    try {
      const url = new URL(value, window.location.href);
      const path = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "") : "/";
      return `${path}${url.search}${url.hash}`;
    } catch {
      return "";
    }
  };

  const getDevice = () => {
    if (deviceQueries.mobile.matches) return "mobile";
    if (deviceQueries.tablet.matches) return "tablet";
    return "desktop";
  };

  const hashString = (value) => {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  };

  const seededNoise = (column, row, seed) => {
    const value = Math.sin(column * 127.1 + row * 311.7 + seed * 0.0001) * 43758.5453;
    return value - Math.floor(value);
  };

  const resolveCssColor = (value, context = document.body) => {
    if (!value) return "";
    const probe = document.createElement("span");
    probe.style.position = "fixed";
    probe.style.visibility = "hidden";
    probe.style.color = value;
    const parent = context instanceof Element ? context : document.body;
    parent.append(probe);
    const resolved = getComputedStyle(probe).color;
    probe.remove();
    return resolved;
  };

  const isVisibleColor = (value) => {
    if (!value || value === "transparent") return false;
    const compact = value.replace(/\s+/g, "").toLowerCase();
    return !compact.endsWith(",0)") && !compact.endsWith("/0)");
  };

  const colorChannels = (value) => {
    const resolved = resolveCssColor(value);
    const rgb = resolved.match(
      /^rgba?\(\s*([\d.]+)(?:\s*,\s*|\s+)([\d.]+)(?:\s*,\s*|\s+)([\d.]+)/i
    );
    if (rgb) return rgb.slice(1, 4).map(Number);

    const color = resolved.match(
      /^color\((?:srgb|display-p3)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/i
    );
    return color ? color.slice(1, 4).map((channel) => Number(channel) * 255) : null;
  };

  const transitionTone = (color) => {
    const channels = colorChannels(color);
    if (!channels) return "light";
    const linear = channels.map((channel) => {
      const normalized = clamp(channel / 255);
      return normalized <= 0.04045
        ? normalized / 12.92
        : Math.pow((normalized + 0.055) / 1.055, 2.4);
    });
    const luminance = linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
    return luminance < 0.179 ? "dark" : "light";
  };

  const setLoaderTone = (color) => {
    const loader = document.querySelector("[data-page-loader]");
    if (loader) loader.dataset.pageLoaderTone = transitionTone(color);
  };

  const clearLoaderTone = () => {
    const loader = document.querySelector("[data-page-loader]");
    if (loader) delete loader.dataset.pageLoaderTone;
  };

  const backgroundFromElement = (element) => {
    let current = element instanceof Element ? element : null;
    while (current) {
      if (!current.classList.contains("page-transition-overlay")) {
        const color = getComputedStyle(current).backgroundColor;
        if (isVisibleColor(color)) return color;
      }
      current = current.parentElement;
    }
    return "";
  };

  const transitionColorFromElement = (element) => {
    if (!(element instanceof Element)) return "";
    const source = element.closest("[data-transition-color]");
    if (!source) return "";
    const resolved = resolveCssColor(source.dataset.transitionColor, source);
    return isVisibleColor(resolved) ? resolved : "";
  };

  const mostCommonColor = (colors) => {
    if (!colors.length) return "";
    const counts = new Map();
    colors.forEach((color) => counts.set(color, (counts.get(color) || 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  };

  const sampleBottomColor = (trigger) => {
    const overrideSource = trigger?.closest("[data-transition-color]");
    if (overrideSource) {
      const resolvedOverride = resolveCssColor(
        overrideSource.dataset.transitionColor,
        overrideSource
      );
      if (isVisibleColor(resolvedOverride)) return resolvedOverride;
    }

    const y = Math.max(0, window.innerHeight - 2);
    const sampleRatios = [0.5, 0.25, 0.75, 0.1, 0.9];
    const elements = sampleRatios
      .map((ratio) => document.elementFromPoint(window.innerWidth * ratio, y));
    const regionColors = elements
      .map(transitionColorFromElement)
      .filter(Boolean);
    if (regionColors.length) return mostCommonColor(regionColors);

    const backgroundColors = elements.map(backgroundFromElement).filter(Boolean);
    if (backgroundColors.length) return mostCommonColor(backgroundColors);

    return backgroundFromElement(document.body)
      || getComputedStyle(document.documentElement).backgroundColor
      || "Canvas";
  };

  const createOverlay = (color) => {
    const canvas = document.createElement("canvas");
    canvas.className = "page-transition-overlay";
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.backgroundColor = "transparent";
    document.body.append(canvas);
    lockPageScroll();
    document.documentElement.style.setProperty("--page-transition-color", color);
    setLoaderTone(color);
    resetScrollbarPaint(color);

    const context = canvas.getContext("2d", { alpha: true });
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    overlay = { canvas, context, color, width, height };
    return overlay;
  };

  const createCells = (view, pixelSize, seed) => {
    const columns = Math.ceil(view.width / pixelSize);
    const rows = Math.ceil(view.height / pixelSize);
    const cells = [];

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const fromBottom = (rows - 1 - row) / Math.max(1, rows - 1);
        const noise = (seededNoise(column, row, seed) - 0.5) * 0.12;
        const ripple = Math.sin(column * 0.42) * 0.055
          + Math.sin(column * 0.13 + 1.7) * 0.0385;

        cells.push({
          x: column * pixelSize,
          y: row * pixelSize,
          size: pixelSize,
          coverAt: clamp(fromBottom * 0.72 + noise + ripple, 0, 0.94),
          fadeAt: seededNoise(column + 43, row + 71, seed)
        });
      }
    }

    return cells;
  };

  const drawCells = (view, cells, mode, progress) => {
    const { context, width, height, color } = view;
    let edgeCoverageTotal = 0;
    let edgeCellCount = 0;
    context.clearRect(0, 0, width, height);
    context.fillStyle = color;

    cells.forEach((cell) => {
      let alpha = 0;
      let scale = 1;

      if (mode === "cover") {
        const appearance = (progress - cell.coverAt) / 0.06;
        alpha = clamp(appearance);
        scale = 0.35 + 0.65 * easeOutCubic(alpha);
      } else {
        const disappearance = (progress - cell.fadeAt * 0.34) / 0.66;
        alpha = 1 - easeOutCubic(disappearance);
        scale = 0.7 + 0.3 * alpha;
      }

      if (cell.x + cell.size >= width) {
        edgeCoverageTotal += alpha * scale * scale;
        edgeCellCount += 1;
      }

      if (alpha <= 0) return;
      const inset = cell.size * (1 - scale) / 2;
      context.globalAlpha = alpha;
      context.fillRect(
        cell.x + inset,
        cell.y + inset,
        cell.size * scale + 0.4,
        cell.size * scale + 0.4
      );
    });

    context.globalAlpha = 1;
    return edgeCellCount ? edgeCoverageTotal / edgeCellCount : 0;
  };

  const animate = (duration, render) => new Promise((resolve) => {
    const startedAt = performance.now();
    const tick = (now) => {
      const progress = clamp((now - startedAt) / Math.max(1, duration));
      render(progress);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        resolve();
      }
    };
    frame = requestAnimationFrame(tick);
  });

  const cleanup = () => {
    cancelAnimationFrame(frame);
    overlay?.canvas.remove();
    overlay = null;
    transitioning = false;
    preserveOutgoingCover = false;
    clearScrollbarPaint();
    clearLoaderTone();
    unlockPageScroll();
    document.documentElement.classList.remove("page-transition-arriving");
    document.documentElement.classList.remove("page-transition-loading");
  };

  const commitNavigation = (href, preserveCover = false) => {
    preserveOutgoingCover = preserveCover;
    try {
      window.location.assign(href);
    } catch (error) {
      clearStoredState();
      cleanup();
      throw error;
    }
  };

  const getStoredState = () => {
    try {
      const state = JSON.parse(sessionStorage.getItem(storageKey) || "null");
      const fresh = state && Date.now() - state.createdAt < maxStateAge;
      const matching = fresh && normalizePath(state.target) === normalizePath(window.location.href);
      if (matching) return state;
      if (state) clearStoredState();
    } catch {
      clearStoredState();
    }
    return null;
  };

  const getPageLoader = () => document.querySelector("[data-page-loader]");

  const loaderState = (loader) => loader?.dataset.pageLoaderState || "idle";

  const loaderIsComplete = (loader) => (
    !loader?.isConnected
    || loader.hidden
    || loader.classList.contains("is-hidden")
    || loaderState(loader) === "complete"
  );

  const resolveActiveLoader = (loader) => new Promise((resolve) => {
    if (!loader) {
      resolve(null);
      return;
    }

    const decide = () => {
      const state = loaderState(loader);
      if (state === "loading") return loader;
      if (state === "complete" || state === "idle") return null;
      return undefined;
    };
    const immediate = decide();
    if (immediate !== undefined) {
      resolve(immediate);
      return;
    }

    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      observer.disconnect();
      window.removeEventListener("portfolio:loader-state", check);
      window.clearTimeout(fallback);
      resolve(value);
    };
    const check = () => {
      const result = decide();
      if (result !== undefined) finish(result);
    };
    const observer = new MutationObserver(check);
    observer.observe(loader, {
      attributes: true,
      attributeFilter: ["data-page-loader-state"]
    });
    window.addEventListener("portfolio:loader-state", check);
    const decisionTimeout = Number.parseInt(loader.dataset.pageLoaderDecisionTimeout || "0", 10);
    const fallback = Number.isFinite(decisionTimeout) && decisionTimeout > 0
      ? window.setTimeout(() => finish(null), decisionTimeout)
      : 0;
    check();
  });

  const getLoaderColor = (loader) => {
    const declared = loader?.dataset.pageLoaderColor;
    if (declared) {
      const resolved = resolveCssColor(declared, loader);
      if (isVisibleColor(resolved)) return resolved;
    }
    const background = loader ? getComputedStyle(loader).backgroundColor : "";
    if (isVisibleColor(background)) return background;
    return backgroundFromElement(document.body)
      || getComputedStyle(document.documentElement).backgroundColor
      || "Canvas";
  };

  const getPageBackgroundColor = () => (
    backgroundFromElement(document.body)
    || getComputedStyle(document.documentElement).backgroundColor
    || "Canvas"
  );

  const timeListToMilliseconds = (value) => value.split(",").map((part) => {
    const trimmed = part.trim();
    if (trimmed.endsWith("ms")) return Number.parseFloat(trimmed) || 0;
    if (trimmed.endsWith("s")) return (Number.parseFloat(trimmed) || 0) * 1000;
    return 0;
  });

  const loaderExitDuration = (loader) => {
    if (!loader?.isConnected) return 0;
    const style = getComputedStyle(loader);
    const durations = timeListToMilliseconds(style.transitionDuration);
    const delays = timeListToMilliseconds(style.transitionDelay);
    return durations.reduce((maximum, duration, index) => (
      Math.max(maximum, duration + (delays[index % Math.max(1, delays.length)] || 0))
    ), 0);
  };

  const waitForLoader = (loader) => new Promise((resolve) => {
    if (!loader) {
      resolve();
      return;
    }

    let settled = false;
    let observer = null;
    let fallback = 0;

    const finish = (waitForExit) => {
      if (settled) return;
      settled = true;
      observer?.disconnect();
      window.removeEventListener("portfolio:loader-complete", onComplete);
      window.clearTimeout(fallback);
      window.setTimeout(resolve, waitForExit ? loaderExitDuration(loader) : 0);
    };
    const onComplete = () => finish(true);
    const check = () => {
      if (loaderIsComplete(loader)) finish(true);
    };

    window.addEventListener("portfolio:loader-complete", onComplete, { once: true });
    observer = new MutationObserver(check);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["class", "hidden", "data-page-loader-state"]
    });
    const loaderTimeout = Number.parseInt(loader.dataset.pageLoaderTimeout || "0", 10);
    if (Number.isFinite(loaderTimeout) && loaderTimeout > 0) {
      fallback = window.setTimeout(() => finish(false), loaderTimeout);
    }
    check();
  });

  const finishReveal = async (state, loader = null) => {
    const activeLoader = await resolveActiveLoader(loader);
    if (activeLoader) {
      document.documentElement.classList.add("page-transition-loading");
      await waitForLoader(activeLoader);
      document.documentElement.classList.remove("page-transition-loading");
    } else {
      const holdDuration = state.total * phase.hold;
      const remainingHold = Math.max(0, state.coveredAt + holdDuration - Date.now());
      if (remainingHold) {
        await new Promise((resolve) => window.setTimeout(resolve, remainingHold));
      }
    }

    beginScrollbarReveal(getPageBackgroundColor());
    await animate(state.total * phase.reveal, (progress) => {
      const edgeCoverage = drawCells(overlay, state.cells, "reveal", progress);
      syncScrollbarReveal(edgeCoverage);
    });
    syncScrollbarReveal(0);

    clearStoredState();
    cleanup();
    window.dispatchEvent(new CustomEvent("portfolio:transition-complete"));
  };

  const revealArrival = async (state) => {
    transitioning = true;
    const config = timings[state.device] || timings.desktop;
    const view = createOverlay(state.color);
    const cells = createCells(view, state.pixelSize || config.pixelSize, state.seed || 1);
    state.cells = cells;
    drawCells(view, cells, "reveal", 0);

    requestAnimationFrame(() => {
      document.documentElement.classList.remove("page-transition-arriving");
    });

    await finishReveal(state, getPageLoader());
  };

  const revealInitialLoader = async (loader) => {
    transitioning = true;
    const device = getDevice();
    const config = timings[device];
    const color = getLoaderColor(loader);
    const seed = hashString(`loader→${normalizePath(window.location.href)}`);
    const view = createOverlay(color);
    const cells = createCells(view, config.pixelSize, seed);
    const state = {
      color,
      seed,
      device,
      pixelSize: config.pixelSize,
      total: config.total,
      coveredAt: Date.now(),
      cells
    };
    drawCells(view, cells, "reveal", 0);
    await finishReveal(state, loader);
  };

  const startNavigation = async (trigger, target) => {
    if (transitioning) return;
    if (reducedMotion.matches) {
      commitNavigation(target.href);
      return;
    }

    transitioning = true;
    const device = getDevice();
    const config = timings[device];
    const color = sampleBottomColor(trigger);
    const seed = hashString(`${normalizePath(window.location.href)}→${normalizePath(target.href)}`);
    const view = createOverlay(color);
    const cells = createCells(view, config.pixelSize, seed);

    await animate(config.total * phase.cover, (progress) => {
      drawCells(view, cells, "cover", progress);
    });

    const state = {
      target: target.href,
      color,
      seed,
      device,
      pixelSize: config.pixelSize,
      total: config.total,
      createdAt: Date.now(),
      coveredAt: Date.now()
    };
    saveStoredState(state);
    commitNavigation(target.href, true);
  };

  const getTransitionTarget = (eventTarget) => {
    if (!(eventTarget instanceof Element)) return null;
    const interactive = eventTarget.closest("a[href], button, input, select, textarea, [role='button']");
    if (interactive) {
      return interactive.matches("a[data-page-transition][href]") ? interactive : null;
    }
    return eventTarget.closest("a[data-page-transition][href], [data-page-transition][data-case-href]");
  };

  const getTargetUrl = (trigger) => {
    const href = trigger instanceof HTMLAnchorElement
      ? trigger.href
      : trigger.dataset.caseHref;
    if (!href) return null;
    try {
      return new URL(href, window.location.href);
    } catch {
      return null;
    }
  };

  const shouldHandle = (event, trigger, target) => {
    if (!trigger || !target || target.origin !== window.location.origin) return false;
    if (trigger instanceof HTMLAnchorElement) {
      if (trigger.target && trigger.target !== "_self") return false;
      if (trigger.hasAttribute("download")) return false;
    }
    if (event instanceof MouseEvent) {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
    }
    return normalizePath(target.href) !== normalizePath(window.location.href);
  };

  document.addEventListener("click", (event) => {
    const trigger = getTransitionTarget(event.target);
    const target = getTargetUrl(trigger);
    if (!shouldHandle(event, trigger, target)) return;
    event.preventDefault();
    event.stopPropagation();
    startNavigation(trigger, target);
  }, true);

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const trigger = getTransitionTarget(event.target);
    if (!trigger || trigger instanceof HTMLAnchorElement) return;
    const target = getTargetUrl(trigger);
    if (!shouldHandle(event, trigger, target)) return;
    event.preventDefault();
    event.stopPropagation();
    startNavigation(trigger, target);
  }, true);

  window.addEventListener("pagehide", () => {
    cancelAnimationFrame(frame);
    if (preserveOutgoingCover && overlay?.canvas.isConnected) return;
    cleanup();
  });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) cleanup();
  });

  if (reducedMotion.matches) {
    const loader = getPageLoader();
    if (loader) setLoaderTone(getLoaderColor(loader));
    clearStoredState();
    document.documentElement.classList.remove("page-transition-arriving");
  } else {
    const arrival = getStoredState();
    if (arrival) revealArrival(arrival);
    else {
      document.documentElement.classList.remove("page-transition-arriving");
      const loader = getPageLoader();
      if (loader) revealInitialLoader(loader);
    }
  }
})();
