const updateCaseNav = () => {
  document.body.classList.toggle("is-scrolled", window.scrollY > 12);
};

const setupCaseCursor = () => {
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!finePointer || reducedMotion || window.innerWidth <= 760) return;

  const cursor = document.createElement("div");
  cursor.className = "cursor";
  cursor.id = "cursor";
  cursor.setAttribute("aria-hidden", "true");
  cursor.innerHTML = '<div class="cursor__shape"></div>';
  document.body.append(cursor);
  document.body.classList.add("cursor-on");

  let x = -100;
  let y = -100;
  let currentX = x;
  let currentY = y;
  let isDown = false;

  const updateCursorState = (event) => {
    const target = event.target instanceof Element
      ? event.target.closest("[data-cursor-soft], a, button, [role='button']")
      : null;
    cursor.classList.add("is-active");
    cursor.classList.toggle("is-soft", Boolean(target));
    cursor.classList.toggle("is-down", isDown);
  };

  document.addEventListener("pointermove", (event) => {
    x = event.clientX;
    y = event.clientY;
    updateCursorState(event);
  }, { passive: true });
  document.addEventListener("pointerleave", () => cursor.classList.remove("is-active"));
  window.addEventListener("blur", () => cursor.classList.remove("is-active"));
  document.addEventListener("pointerdown", () => {
    isDown = true;
    cursor.classList.add("is-down");
  }, { passive: true });
  document.addEventListener("pointerup", () => {
    isDown = false;
    cursor.classList.remove("is-down");
  }, { passive: true });

  const render = () => {
    currentX += (x - currentX) * .22;
    currentY += (y - currentY) * .22;
    cursor.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
    window.requestAnimationFrame(render);
  };

  render();
};

const setupCaseReveal = () => {
  const caseStudy = document.querySelector(".case-study");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!caseStudy || reducedMotion.matches || !("IntersectionObserver" in window)) return;

  const sectionTargets = [...caseStudy.querySelectorAll(":scope > .case-section")]
    .slice(1)
    .map((section) => section.querySelector(":scope > .section-inner, :scope > .section-layout"))
    .filter(Boolean);
  const nextProject = caseStudy.querySelector(":scope > .case-next-project");
  const targets = nextProject ? [...sectionTargets, nextProject] : sectionTargets;

  if (!targets.length) return;

  const initialRevealLine = window.innerHeight * .9;

  targets.forEach((target) => {
    [...target.children].forEach((item, index) => {
      item.classList.add("case-reveal-item");
      item.style.setProperty("--case-reveal-order", String(Math.min(index, 4)));
    });

    const bounds = target.getBoundingClientRect();
    target.dataset.caseReveal = bounds.top <= initialRevealLine ? "visible" : "pending";
  });

  document.documentElement.classList.add("case-reveal-ready");

  let observer;
  const reveal = (target) => {
    if (target.dataset.caseReveal !== "pending") return;
    target.dataset.caseReveal = "revealed";
    observer?.unobserve(target);
  };

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) reveal(entry.target);
      });
    },
    {
      rootMargin: "0px 0px -10% 0px",
      threshold: .08,
    },
  );

  targets.forEach((target) => {
    if (target.dataset.caseReveal === "pending") observer.observe(target);
  });

  const revealFocusedContent = (event) => {
    const target = event.target instanceof Element
      ? event.target.closest("[data-case-reveal]")
      : null;
    if (target) reveal(target);
  };

  const disableReveal = () => {
    observer.disconnect();
    targets.forEach((target) => {
      target.dataset.caseReveal = "visible";
    });
    document.documentElement.classList.remove("case-reveal-ready");
    document.removeEventListener("focusin", revealFocusedContent);
  };

  document.addEventListener("focusin", revealFocusedContent);
  if (reducedMotion.addEventListener) {
    reducedMotion.addEventListener("change", (event) => {
      if (event.matches) disableReveal();
    }, { once: true });
  }
};

const setupReadingProgress = () => {
  const caseStudy = document.querySelector(".case-study");
  const footer = document.querySelector(".site-footer--shared");
  if (!caseStudy || !footer) return;

  const progressBar = document.createElement("div");
  progressBar.className = "reading-progress";
  progressBar.setAttribute("role", "progressbar");
  progressBar.setAttribute("aria-label", "页面浏览进度");
  progressBar.setAttribute("aria-valuemin", "0");
  progressBar.setAttribute("aria-valuemax", "100");
  progressBar.setAttribute("aria-valuenow", "0");
  progressBar.innerHTML = `
    <span class="reading-progress__fill" aria-hidden="true">
      <canvas class="reading-progress__texture"></canvas>
    </span>
  `;
  footer.before(progressBar);

  const fill = progressBar.querySelector(".reading-progress__fill");
  const texture = progressBar.querySelector(".reading-progress__texture");
  let updateFrame = 0;
  let textureFrame = 0;
  let previousValue = -1;

  const drawFooterTexture = () => {
    textureFrame = 0;

    const source = footer.querySelector("canvas");
    const sourceRect = source?.getBoundingClientRect();
    const sourceReady = source?.parentElement?.style.getPropertyValue("--footer-ground-top");
    const progressRect = progressBar.getBoundingClientRect();
    const footerRect = footer.getBoundingClientRect();
    if (!source || !sourceReady || !sourceRect?.width || !sourceRect.height || !progressRect.width || !progressRect.height) return;

    const dpr = window.devicePixelRatio || 1;
    const targetWidth = Math.max(1, Math.round(progressRect.width * dpr));
    const targetHeight = Math.max(1, Math.round(progressRect.height * dpr));
    const scaleX = source.width / sourceRect.width;
    const scaleY = source.height / sourceRect.height;
    const sourceX = Math.max(0, (progressRect.left - sourceRect.left) * scaleX);
    const sourceWidth = Math.min(source.width - sourceX, progressRect.width * scaleX);
    const sourceHeight = Math.min(source.height, progressRect.height * scaleY);
    const visibleFooterHeight = Math.min(source.height, footerRect.height * scaleY);
    const sourceY = Math.max(0, source.height - visibleFooterHeight);

    texture.width = targetWidth;
    texture.height = targetHeight;
    const context = texture.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, targetWidth, targetHeight);
    context.imageSmoothingEnabled = false;
    // Mirror the footer's top strip so both edges share the same seam pixels.
    context.save();
    context.translate(0, targetHeight);
    context.scale(1, -1);
    context.drawImage(
      source,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      targetWidth,
      targetHeight,
    );
    context.restore();
    progressBar.classList.add("has-footer-texture");
  };

  const scheduleTextureDraw = () => {
    window.cancelAnimationFrame(textureFrame);
    textureFrame = window.requestAnimationFrame(() => {
      textureFrame = window.requestAnimationFrame(drawFooterTexture);
    });
  };

  const updateProgress = () => {
    updateFrame = 0;

    const scroller = document.scrollingElement || document.documentElement;
    const scrollRange = Math.max(0, scroller.scrollHeight - window.innerHeight);
    const value = scrollRange > 0
      ? Math.max(0, Math.min(1, window.scrollY / scrollRange))
      : 1;
    const percentage = value * 100;
    const roundedValue = Math.round(percentage);

    fill.style.clipPath = `inset(0 ${Math.max(0, 100 - percentage).toFixed(4)}% 0 0)`;

    if (roundedValue !== previousValue) {
      previousValue = roundedValue;
      progressBar.setAttribute("aria-valuenow", String(roundedValue));
      progressBar.setAttribute("aria-valuetext", `已浏览 ${roundedValue}%`);
    }
  };

  const scheduleProgressUpdate = () => {
    if (updateFrame) return;
    updateFrame = window.requestAnimationFrame(updateProgress);
  };

  updateProgress();
  scheduleTextureDraw();
  window.addEventListener("scroll", scheduleProgressUpdate, { passive: true });
  window.addEventListener("resize", scheduleProgressUpdate, { passive: true });
  window.addEventListener("resize", scheduleTextureDraw, { passive: true });
  window.addEventListener("load", () => {
    scheduleProgressUpdate();
    scheduleTextureDraw();
  }, { once: true });
  window.addEventListener("pageshow", scheduleProgressUpdate);
  document.fonts?.ready.then(() => {
    scheduleProgressUpdate();
    scheduleTextureDraw();
  });

  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(() => {
      scheduleProgressUpdate();
      scheduleTextureDraw();
    });
    resizeObserver.observe(document.documentElement);
    resizeObserver.observe(footer);
  }
};

updateCaseNav();
setupCaseCursor();
setupCaseReveal();
setupReadingProgress();
window.addEventListener("scroll", updateCaseNav, { passive: true });
window.addEventListener("pageshow", updateCaseNav);
