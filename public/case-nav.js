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

updateCaseNav();
setupCaseCursor();
setupCaseReveal();
window.addEventListener("scroll", updateCaseNav, { passive: true });
window.addEventListener("pageshow", updateCaseNav);
