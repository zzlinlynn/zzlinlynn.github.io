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

const setupNextProjectAutoScroll = () => {
  const nextProject = document.querySelector(".case-study > .case-next-project");
  if (!nextProject) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const revealThreshold = .08;
  let isInRevealZone = false;
  let scrollFrame = 0;

  const scrollToPageBottom = () => {
    const scroller = document.scrollingElement || document.documentElement;
    window.scrollTo({
      top: scroller.scrollHeight,
      behavior: reducedMotion.matches ? "auto" : "smooth",
    });
  };

  const updateTriggerState = (nextIsInRevealZone) => {
    if (!nextIsInRevealZone) {
      isInRevealZone = false;
      window.cancelAnimationFrame(scrollFrame);
      scrollFrame = 0;
      return;
    }

    if (isInRevealZone) return;
    isInRevealZone = true;
    scrollFrame = window.requestAnimationFrame(() => {
      scrollFrame = 0;
      scrollToPageBottom();
    });
  };

  const isPastRevealThreshold = () => {
    const bounds = nextProject.getBoundingClientRect();
    const revealLine = window.innerHeight * .9;
    const visibleTop = Math.max(0, bounds.top);
    const visibleBottom = Math.min(revealLine, bounds.bottom);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);
    return bounds.height > 0 && visibleHeight / bounds.height >= revealThreshold;
  };

  if (!("IntersectionObserver" in window)) {
    const checkVisibility = () => {
      updateTriggerState(isPastRevealThreshold());
    };

    window.addEventListener("scroll", checkVisibility, { passive: true });
    window.addEventListener("resize", checkVisibility, { passive: true });
    checkVisibility();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries.find((candidate) => candidate.target === nextProject);
      if (!entry) return;
      updateTriggerState(
        entry.isIntersecting && entry.intersectionRatio >= revealThreshold,
      );
    },
    {
      rootMargin: "0px 0px -10% 0px",
      threshold: revealThreshold,
    },
  );

  observer.observe(nextProject);
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
    <span class="reading-progress__fill" aria-hidden="true"></span>
  `;
  footer.before(progressBar);

  const fill = progressBar.querySelector(".reading-progress__fill");
  let updateFrame = 0;
  let previousValue = -1;

  const updateProgress = () => {
    updateFrame = 0;

    const scroller = document.scrollingElement || document.documentElement;
    const scrollRange = Math.max(0, scroller.scrollHeight - window.innerHeight);
    const value = scrollRange > 0
      ? Math.max(0, Math.min(1, window.scrollY / scrollRange))
      : 1;
    const percentage = value * 100;
    const roundedValue = Math.round(percentage);
    const progressRect = progressBar.getBoundingClientRect();
    const cellGap = 1;
    const cellStride = progressRect.height + cellGap;
    const cellCount = Math.max(1, Math.ceil((progressRect.width + cellGap) / cellStride));
    const nearestFilledCells = Math.round(value * cellCount);
    const filledCells = value >= 1
      ? cellCount
      : Math.min(cellCount - 1, nearestFilledCells);
    const filledWidth = filledCells > 0
      ? Math.min(progressRect.width, filledCells * cellStride - cellGap)
      : 0;

    fill.style.width = `${filledWidth.toFixed(2)}px`;

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
  window.addEventListener("scroll", scheduleProgressUpdate, { passive: true });
  window.addEventListener("resize", scheduleProgressUpdate, { passive: true });
  window.addEventListener("load", scheduleProgressUpdate, { once: true });
  window.addEventListener("pageshow", scheduleProgressUpdate);
  document.fonts?.ready.then(scheduleProgressUpdate);

  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(scheduleProgressUpdate);
    resizeObserver.observe(document.documentElement);
    resizeObserver.observe(footer);
  }
};

setupCaseCursor();
setupCaseReveal();
setupNextProjectAutoScroll();
setupReadingProgress();
