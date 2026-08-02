/*
 * Lynn Navigation Motion v1.1.0
 * Dependency-free scroll and hover animation for the portfolio navigation.
 * Requires LynnLogoMotion from ../brand/logo-motion.js.
 */
(function attachLynnNavigationMotion(global) {
  "use strict";

  const SCRAMBLE_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*+-?";
  const SCRAMBLE_STEPS = 30;
  const SCRAMBLE_INTERVAL = 22;
  const GLYPH_BITMAPS = {
    W: ["10001", "10001", "10001", "10101", "10101", "11011", "01010"],
    O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
    R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
    K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
    A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
    B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
    U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
    T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"]
  };
  const PIXEL_STAGES = [
    { scatterY: .65, drop: .8, gravity: .1, keep: 1, alpha: .58, size: 1.5, trail: .14 },
    { scatterY: 3.2, drop: 3.4, gravity: .35, keep: .8, alpha: .42, size: 1.4, trail: .6 },
    { scatterY: 6.2, drop: 6.7, gravity: .68, keep: .56, alpha: .28, size: 1.25, trail: .86 },
    { scatterY: 5.2, drop: 7.4, gravity: .74, keep: .68, alpha: .34, size: 1.3, trail: .76 }
  ];

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function mix(from, to, amount) {
    return from + (to - from) * amount;
  }

  function smoothstep(value) {
    const t = clamp(value, 0, 1);
    return t * t * (3 - 2 * t);
  }

  function pixelHash(value) {
    const x = Math.sin(value * 91.917 + 17.173) * 43758.5453;
    return x - Math.floor(x);
  }

  function halfPixel(value) {
    return Math.round(value * 2) / 2;
  }

  function resolveElement(target) {
    if (!target) return null;
    if (target instanceof Element) return target;
    if (typeof target === "string") return document.querySelector(target);
    return null;
  }

  function defaultStateOneEdges(width) {
    const mobile = width <= 760;
    const tablet = width > 760 && width <= 1024;
    const gutter = mobile ? 24 : tablet ? 32 : 48;
    const canvas = Math.min(width, 1025);
    const left = (width - canvas) / 2 + gutter;
    return { left, right: width - left };
  }

  function create(target, options) {
    const root = resolveElement(target);
    if (!(root instanceof Element)) {
      throw new TypeError("LynnNavigationMotion.create() requires a valid navigation element.");
    }
    if (root.__lynnNavigationMotion) return root.__lynnNavigationMotion;
    if (!global.LynnLogoMotion) {
      throw new Error("Load logo-motion.js before navigation-motion.js.");
    }

    const config = options || {};
    const brand = root.querySelector("[data-nav-brand]");
    const linksIsland = root.querySelector("[data-nav-links]");
    const logoMark = root.querySelector("[data-logo-motion]");
    const labelElements = Array.from(root.querySelectorAll("[data-nav-label]"));
    if (!brand || !linksIsland || !logoMark || !labelElements.length) {
      throw new Error("Navigation markup is incomplete. See integration/nav-markup.html.");
    }

    const scrollTarget = resolveElement(config.scrollTarget || root.dataset.scrollTarget)
      || document.querySelector("[data-navigation-hero]")
      || document.querySelector("main > section");
    const leftAnchor = resolveElement(config.stateOneLeftAnchor || root.dataset.stateOneLeftAnchor)
      || document.querySelector("[data-nav-state-one-left]");
    const rightAnchor = resolveElement(config.stateOneRightAnchor || root.dataset.stateOneRightAnchor)
      || document.querySelector("[data-nav-state-one-right]");
    const darkToneRegions = Array.from(
      document.querySelectorAll('[data-navigation-tone="dark"]')
    );
    const reduceMotion = global.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const logoMotion = global.LynnLogoMotion.create(logoMark, {
      intensity: Number(config.logoIntensity) || 1.05
    });
    const listeners = [];
    const typeLabels = [];
    const hoverLabels = [];

    function listen(element, type, handler, eventOptions) {
      element.addEventListener(type, handler, eventOptions);
      listeners.push(() => element.removeEventListener(type, handler, eventOptions));
    }

    labelElements.forEach((element, labelIndex) => {
      const text = (element.dataset.navLabel || element.textContent || "").trim().toUpperCase();
      const row = element.querySelector("[data-nav-glyph-row]");
      if (!row) throw new Error("Each data-nav-label link needs a data-nav-glyph-row element.");
      row.replaceChildren();
      const slots = [];

      Array.from(text).forEach((character, characterIndex) => {
        const slot = document.createElement("span");
        slot.className = "lynn-nav__glyph-slot";
        const normal = document.createElement("span");
        normal.className = "lynn-nav__glyph-normal";
        normal.textContent = character;
        const scramble = document.createElement("span");
        scramble.className = "lynn-nav__glyph-scramble";
        scramble.textContent = character;
        const variants = PIXEL_STAGES.map((stage, variantIndex) => {
          const variant = document.createElement("span");
          variant.className = `lynn-nav__glyph-variant lynn-nav__glyph-variant--${variantIndex + 1}`;
          const bitmap = GLYPH_BITMAPS[character] || GLYPH_BITMAPS.O;
          let particleRank = 0;

          bitmap.forEach((bitmapRow, bitmapRowIndex) => {
            Array.from(bitmapRow).forEach((bit, bitmapColumnIndex) => {
              if (bit !== "1") return;
              const seed = (labelIndex + 1) * 10000
                + (characterIndex + 1) * 1000
                + (variantIndex + 1) * 100
                + particleRank;
              particleRank += 1;
              if (pixelHash(seed + 9) > stage.keep) return;

              const pixel = document.createElement("span");
              pixel.className = "lynn-nav__glyph-pixel";
              const baseX = (bitmapColumnIndex - 2) * 1.65 - stage.size / 2;
              const baseY = (bitmapRowIndex - 3) * 1.65 - stage.size / 2;
              const bottomWeight = Math.pow(bitmapRowIndex / 6, 1.55);
              const gravityPull = bottomWeight * stage.gravity;
              const dispersionScale = 1 - gravityPull * .82;
              const scatterY = (pixelHash(seed + 2) - .5) * 2 * stage.scatterY * dispersionScale;
              const downwardSlide = Math.pow(pixelHash(seed + 3), .7)
                * stage.drop
                * (.72 + (1 - bottomWeight) * .28);
              const freeY = baseY + scatterY + downwardSlide;
              const gravityBasinY = 5.5 + stage.drop * .32;
              const pixelY = mix(freeY, gravityBasinY, gravityPull);
              const gravityAlpha = .58 + bottomWeight * .42;
              const pixelAlpha = stage.alpha
                * gravityAlpha
                * (.88 + pixelHash(seed + 5) * .12);

              pixel.style.setProperty("--pixel-size", `${stage.size}px`);
              pixel.style.setProperty("--pixel-x", `${halfPixel(baseX)}px`);
              pixel.style.setProperty("--pixel-y", `${halfPixel(pixelY)}px`);
              pixel.style.setProperty(
                "--pixel-color",
                `rgb(var(--lynn-nav-ink-rgb) / ${pixelAlpha.toFixed(3)})`
              );

              const trailChance = stage.trail * (1 - bottomWeight * .28);
              if (pixelHash(seed + 4) < trailChance) {
                const trailStep = 2 + Math.round(1 - bottomWeight);
                const maxTrailCount = variantIndex >= 2 ? 4 : 3;
                const trailCount = Math.max(2, maxTrailCount - Math.round(bottomWeight * 2));
                const shadows = [];
                for (let trailIndex = 1; trailIndex <= trailCount; trailIndex += 1) {
                  const trailAlpha = stage.alpha * ((.2 + bottomWeight * .22) / trailIndex);
                  shadows.push(
                    `0 ${trailStep * trailIndex}px 0 rgb(var(--lynn-nav-ink-rgb) / ${trailAlpha.toFixed(3)})`
                  );
                }
                pixel.style.setProperty("--pixel-trail", shadows.join(", "));
              }
              variant.append(pixel);
            });
          });
          return variant;
        });

        slot.append(normal, ...variants, scramble);
        row.append(slot);
        slots.push({ normal, variants, scramble });
      });

      typeLabels.push(slots);
      hoverLabels.push({
        element,
        text,
        characters: slots.map(({ scramble }) => scramble),
        timer: 0,
        pointerInside: false,
        focused: false
      });
    });

    let geometry = null;
    let progress = 0;
    let manual = false;
    let destroyed = false;
    let updateFrame = 0;
    let logoHoverFrame = 0;
    let logoVisualProgress = 0;
    let logoScrollProgress = 0;
    let logoHovering = false;
    let logoPointerInside = false;
    let logoFocused = false;
    let toneObserver = null;

    function setScrambleFrame(record, tick) {
      const letters = Array.from(record.text);
      const resolvedCount = Math.floor(
        Math.min(tick, SCRAMBLE_STEPS) / SCRAMBLE_STEPS * letters.length
      );
      record.characters.forEach((character, index) => {
        const resolved = index < resolvedCount || tick >= SCRAMBLE_STEPS;
        character.textContent = resolved
          ? letters[index]
          : SCRAMBLE_CHARACTERS[Math.floor(Math.random() * SCRAMBLE_CHARACTERS.length)];
        character.classList.toggle("is-scrambled", !resolved);
      });
    }

    function stopScramble(record, hide) {
      if (record.timer) {
        global.clearInterval(record.timer);
        record.timer = 0;
      }
      setScrambleFrame(record, SCRAMBLE_STEPS);
      if (hide) record.element.classList.remove("is-scrambling");
    }

    function startScramble(record) {
      stopScramble(record, true);
      if (reduceMotion) return;
      record.element.classList.add("is-scrambling");
      let tick = 0;
      setScrambleFrame(record, tick);
      record.timer = global.setInterval(() => {
        tick += 1;
        setScrambleFrame(record, tick);
        if (tick >= SCRAMBLE_STEPS) stopScramble(record, false);
      }, SCRAMBLE_INTERVAL);
    }

    hoverLabels.forEach((record) => {
      listen(record.element, "mouseenter", () => {
        record.pointerInside = true;
        startScramble(record);
      });
      listen(record.element, "mouseleave", () => {
        record.pointerInside = false;
        if (!record.focused) stopScramble(record, true);
      });
      listen(record.element, "focus", () => {
        record.focused = true;
        startScramble(record);
      });
      listen(record.element, "blur", () => {
        record.focused = false;
        if (!record.pointerInside) stopScramble(record, true);
      });
    });

    function applyLogoVisualProgress(value) {
      logoVisualProgress = clamp(value, 0, 1);
      const endpointOrderOpacity = logoVisualProgress < .07
        ? 1 - smoothstep(logoVisualProgress / .07)
        : logoVisualProgress > .93
          ? smoothstep((logoVisualProgress - .93) / .07)
          : 0;
      logoMark.style.setProperty("--logo-order-opacity", endpointOrderOpacity.toFixed(3));
      logoMotion.setProgress(logoVisualProgress);
    }

    function animateLogoVisualTo(targetProgress, duration, onComplete) {
      global.cancelAnimationFrame(logoHoverFrame);
      logoHoverFrame = 0;
      const from = logoVisualProgress;
      const to = clamp(targetProgress, 0, 1);
      if (reduceMotion || Math.abs(to - from) < .001) {
        applyLogoVisualProgress(to);
        if (onComplete) onComplete();
        return;
      }

      const start = performance.now();
      function tick(now) {
        if (destroyed) return;
        const elapsed = clamp((now - start) / duration, 0, 1);
        const eased = 1 - Math.pow(1 - elapsed, 3);
        applyLogoVisualProgress(mix(from, to, eased));
        if (elapsed < 1) {
          logoHoverFrame = global.requestAnimationFrame(tick);
        } else {
          logoHoverFrame = 0;
          if (onComplete) onComplete();
        }
      }
      logoHoverFrame = global.requestAnimationFrame(tick);
    }

    function syncLogoHover() {
      const shouldHover = logoPointerInside || logoFocused;
      if (shouldHover === logoHovering) return;
      logoHovering = shouldHover;
      if (logoHovering) {
        animateLogoVisualTo(.5, 820);
      } else {
        animateLogoVisualTo(logoScrollProgress, 620, () => {
          if (!logoHovering) applyLogoVisualProgress(logoScrollProgress);
        });
      }
    }

    listen(brand, "mouseenter", () => {
      logoPointerInside = true;
      syncLogoHover();
    });
    listen(brand, "mouseleave", () => {
      logoPointerInside = false;
      syncLogoHover();
    });
    listen(brand, "focus", () => {
      logoFocused = true;
      syncLogoHover();
    });
    listen(brand, "blur", () => {
      logoFocused = false;
      syncLogoHover();
    });

    function measure() {
      const width = global.innerWidth;
      const mobile = width <= 760;
      const tablet = width > 760 && width <= 1024;
      const fallbackEdges = defaultStateOneEdges(width);
      const leftRect = leftAnchor ? leftAnchor.getBoundingClientRect() : null;
      const rightRect = rightAnchor ? rightAnchor.getBoundingClientRect() : null;
      const stateOneLeft = leftRect ? leftRect.left : fallbackEdges.left;
      const stateOneRight = rightRect ? rightRect.right : fallbackEdges.right;
      const liveEdge = mobile ? 21.6 : clamp(width * .058, 52, 104);
      const linksWidth = linksIsland.offsetWidth;
      const y = mobile ? 8 : tablet ? 10.5 : 12;

      geometry = {
        y,
        toneSampleY: y + Math.max(brand.offsetHeight, linksIsland.offsetHeight) / 2,
        startBrandX: stateOneLeft,
        startLinksX: stateOneRight - linksWidth,
        endBrandX: liveEdge,
        endLinksX: width - liveEdge - linksWidth
      };
    }

    function updateColorTone() {
      if (destroyed || !geometry) return;
      const documentIsDark = document.documentElement.dataset.theme === "dark";
      const regionIsDark = darkToneRegions.some((region) => {
        const rect = region.getBoundingClientRect();
        return rect.top <= geometry.toneSampleY && rect.bottom > geometry.toneSampleY;
      });
      root.classList.toggle("is-on-dark", documentIsDark || regionIsDark);
    }

    function updateTypeMotion(value) {
      const stops = [0, .18, .37, .56, .74, 1];
      const layerAtStop = [-1, 0, 1, 2, 3, -1];
      let segment = stops.length - 2;
      for (let index = 0; index < stops.length - 1; index += 1) {
        if (value <= stops[index + 1]) {
          segment = index;
          break;
        }
      }

      const local = smoothstep(
        (value - stops[segment]) / (stops[segment + 1] - stops[segment])
      );
      const outgoingIndex = layerAtStop[segment];
      const incomingIndex = layerAtStop[segment + 1];
      typeLabels.forEach((slots) => {
        slots.forEach(({ normal, variants }) => {
          const layers = [normal, ...variants];
          const outgoing = outgoingIndex < 0 ? normal : variants[outgoingIndex];
          const incoming = incomingIndex < 0 ? normal : variants[incomingIndex];
          layers.forEach((layer) => {
            layer.style.opacity = "0";
            layer.style.transform = "translate3d(0, 0, 0) scale(1)";
          });
          outgoing.style.opacity = String(1 - local);
          outgoing.style.transform = `translate3d(0, ${Math.round(-local * 14)}px, 0) scale(${(1 - local * .1).toFixed(3)})`;
          incoming.style.opacity = String(local);
          incoming.style.transform = `translate3d(0, ${Math.round(18 * (1 - local))}px, 0) scale(${(.74 + local * .26).toFixed(3)})`;
        });
      });
    }

    function render(nextProgress) {
      if (destroyed) return;
      progress = clamp(nextProgress, 0, 1);
      brand.classList.toggle("is-name-hidden", progress !== 0);
      if (!geometry) measure();
      const renderedProgress = reduceMotion ? (progress < .5 ? 0 : 1) : progress;
      const eased = smoothstep(renderedProgress);
      const brandX = mix(geometry.startBrandX, geometry.endBrandX, eased);
      const linksX = mix(geometry.startLinksX, geometry.endLinksX, eased);

      brand.style.transform = `translate3d(${brandX.toFixed(2)}px, ${geometry.y.toFixed(2)}px, 0)`;
      linksIsland.style.transform = `translate3d(${linksX.toFixed(2)}px, ${geometry.y.toFixed(2)}px, 0)`;
      updateColorTone();
      logoScrollProgress = renderedProgress;
      if (!logoHovering && !logoHoverFrame) applyLogoVisualProgress(renderedProgress);
      updateTypeMotion(renderedProgress);
      root.style.setProperty("--lynn-nav-progress", progress.toFixed(4));
    }

    function scrollProgress() {
      if (typeof config.getProgress === "function") {
        return clamp(Number(config.getProgress()) || 0, 0, 1);
      }
      if (!scrollTarget) {
        return clamp(global.scrollY / Math.max(1, global.innerHeight), 0, 1);
      }
      const rect = scrollTarget.getBoundingClientRect();
      const targetTop = rect.top + global.scrollY;
      return clamp((global.scrollY - targetTop) / Math.max(1, scrollTarget.offsetHeight), 0, 1);
    }

    function requestUpdate() {
      if (manual || updateFrame || destroyed) return;
      updateFrame = global.requestAnimationFrame(() => {
        updateFrame = 0;
        render(scrollProgress());
      });
    }

    function refreshLayout() {
      geometry = null;
      measure();
      render(manual ? progress : scrollProgress());
    }

    function handleResize() {
      refreshLayout();
    }

    listen(global, "scroll", requestUpdate, { passive: true });
    listen(global, "resize", handleResize);
    listen(global, "portfolio-theme-change", updateColorTone);

    if (darkToneRegions.length && global.MutationObserver) {
      toneObserver = new global.MutationObserver(updateColorTone);
      darkToneRegions.forEach((region) => {
        toneObserver.observe(region, {
          attributes: true,
          attributeFilter: ["class", "hidden", "style", "aria-hidden"]
        });
      });
    }

    const api = {
      element: root,
      setProgress(value) {
        manual = true;
        render(value);
        return api;
      },
      followScroll() {
        manual = false;
        render(scrollProgress());
        return api;
      },
      refresh() {
        refreshLayout();
        return api;
      },
      getProgress() {
        return progress;
      },
      destroy() {
        if (destroyed) return;
        destroyed = true;
        global.cancelAnimationFrame(updateFrame);
        global.cancelAnimationFrame(logoHoverFrame);
        hoverLabels.forEach((record) => stopScramble(record, true));
        listeners.splice(0).forEach((remove) => remove());
        toneObserver?.disconnect();
        toneObserver = null;
        labelElements.forEach((element) => {
          const row = element.querySelector("[data-nav-glyph-row]");
          if (row) row.replaceChildren();
        });
        brand.style.removeProperty("transform");
        brand.classList.remove("is-name-hidden");
        linksIsland.style.removeProperty("transform");
        root.classList.remove("is-on-dark");
        root.style.removeProperty("--lynn-nav-progress");
        logoMark.style.removeProperty("--logo-order-opacity");
        logoMotion.destroy();
        delete root.__lynnNavigationMotion;
      }
    };

    root.__lynnNavigationMotion = api;
    measure();
    render(scrollProgress());
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (!destroyed) refreshLayout();
      });
    }
    return api;
  }

  global.LynnNavigationMotion = Object.freeze({
    version: "1.1.0",
    create
  });
})(window);
