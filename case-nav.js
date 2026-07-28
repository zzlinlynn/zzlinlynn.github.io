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

updateCaseNav();
setupCaseCursor();
window.addEventListener("scroll", updateCaseNav, { passive: true });
window.addEventListener("pageshow", updateCaseNav);
