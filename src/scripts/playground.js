const surface = document.querySelector("[data-pan-surface]");
const world = document.querySelector("[data-pan-world]");
const sourceTile = world?.querySelector("[data-world-tile]");

if (surface && world && sourceTile) {
  const BASE_WIDTH = 1025;
  const MIN_SCALE = 0.54;
  const TILE_WIDTH = 1534;
  const TILE_HEIGHT = 1388;
  const DRAG_THRESHOLD = 8;
  const CAROUSEL_AUTOPLAY_DELAY = 3200;
  const CAROUSEL_MANUAL_DELAY = 5200;
  const INITIAL_POSITION = { x: -151, y: -60 };
  const tileTemplate = sourceTile.cloneNode(true);
  const projectModal = surface.querySelector("[data-project-modal]");
  const projectModalBody = surface.querySelector("[data-project-modal-body]");
  const projectCloseButton = surface.querySelector("[data-project-close]");
  const reducedMotionPreference = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );
  const projectTemplates = new Map(
    Array.from(document.querySelectorAll("template[data-project-template]"))
      .map((template) => [template.dataset.projectTemplate, template])
      .filter(([projectId]) => projectId)
  );
  const state = {
    x: INITIAL_POSITION.x,
    y: INITIAL_POSITION.y,
    scale: 1,
    activePointerId: null,
    pointerStartX: 0,
    pointerStartY: 0,
    pointerX: 0,
    pointerY: 0,
    pointerProjectId: null,
    pointerProjectCard: null,
    isDragging: false,
    viewportWidth: 0,
    viewportHeight: 0,
    tileSignature: "",
    renderFrame: 0
  };
  let previousFocus = null;
  let modalTransitionVersion = 0;
  let modalHideTimer = 0;
  let activeGalleryCarousel = null;
  let activeProjectFlip = null;

  const wrapCoordinate = (value, size) => {
    if (!Number.isFinite(value)) return 0;
    const remainder = ((value % size) + size) % size;
    return Math.abs(remainder) < 0.000001 ? 0 : remainder - size;
  };

  const wrapPosition = () => {
    state.x = wrapCoordinate(state.x, TILE_WIDTH);
    state.y = wrapCoordinate(state.y, TILE_HEIGHT);
  };

  const syncTiles = () => {
    const logicalWidth = surface.clientWidth / state.scale;
    const logicalHeight = surface.clientHeight / state.scale;
    const columns = Math.max(2, Math.ceil(logicalWidth / TILE_WIDTH) + 1);
    const rows = Math.max(2, Math.ceil(logicalHeight / TILE_HEIGHT) + 1);
    const signature = `${columns}x${rows}`;

    if (signature === state.tileSignature) return;

    const fragment = document.createDocumentFragment();

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const tile = tileTemplate.cloneNode(true);
        tile.style.setProperty("--tile-x", `${column * TILE_WIDTH}px`);
        tile.style.setProperty("--tile-y", `${row * TILE_HEIGHT}px`);
        tile.dataset.tileColumn = String(column);
        tile.dataset.tileRow = String(row);
        fragment.append(tile);
      }
    }

    world.replaceChildren(fragment);
    world.style.width = `${columns * TILE_WIDTH}px`;
    world.style.height = `${rows * TILE_HEIGHT}px`;
    state.tileSignature = signature;
    surface.dataset.tileColumns = String(columns);
    surface.dataset.tileRows = String(rows);
    surface.dataset.tileCount = String(columns * rows);
    surface.dataset.worldRepeated = "true";
  };

  const updateScale = (preserveCenter = false) => {
    const nextWidth = surface.clientWidth;
    const nextHeight = surface.clientHeight;

    if (
      !Number.isFinite(nextWidth) ||
      !Number.isFinite(nextHeight) ||
      nextWidth <= 0 ||
      nextHeight <= 0
    ) {
      return false;
    }

    const nextScale = Math.max(
      MIN_SCALE,
      Math.min(1, nextWidth / BASE_WIDTH || 1)
    );

    if (
      preserveCenter &&
      state.viewportWidth > 0 &&
      state.viewportHeight > 0
    ) {
      const centerWorldX =
        state.viewportWidth / (2 * state.scale) - state.x;
      const centerWorldY =
        state.viewportHeight / (2 * state.scale) - state.y;
      state.x = nextWidth / (2 * nextScale) - centerWorldX;
      state.y = nextHeight / (2 * nextScale) - centerWorldY;
    }

    state.scale = nextScale;
    state.viewportWidth = nextWidth;
    state.viewportHeight = nextHeight;
    wrapPosition();
    surface.style.setProperty("--playground-scale", String(state.scale));
    syncTiles();
    return true;
  };

  const render = () => {
    state.renderFrame = 0;
    wrapPosition();
    const x = state.x * state.scale;
    const y = state.y * state.scale;
    world.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${state.scale})`;
    surface.dataset.panX = state.x.toFixed(2);
    surface.dataset.panY = state.y.toFixed(2);
  };

  const requestRender = () => {
    if (state.renderFrame) return;
    state.renderFrame = window.requestAnimationFrame(render);
  };

  const resetPosition = () => {
    state.x = INITIAL_POSITION.x;
    state.y = INITIAL_POSITION.y;
    requestRender();
  };

  const isInsideProjectModal = (target) =>
    Boolean(
      projectModal &&
        target instanceof Node &&
        projectModal.contains(target)
    );

  const isProjectModalVisible = () =>
    Boolean(projectModal && !projectModal.hidden);

  const getProjectCard = (target) => {
    if (!(target instanceof Element)) return null;
    const card = target.closest("[data-project-id]");
    return card && surface.contains(card) ? card : null;
  };

  const parseTransitionTime = (value) => {
    const time = Number.parseFloat(value);
    if (!Number.isFinite(time)) return 0;
    return value.trim().endsWith("ms") ? time : time * 1000;
  };

  const getTransitionTime = (element) => {
    const style = window.getComputedStyle(element);
    const durations = style.transitionDuration
      .split(",")
      .map(parseTransitionTime);
    const delays = style.transitionDelay.split(",").map(parseTransitionTime);
    const count = Math.max(durations.length, delays.length);
    let longest = 0;

    for (let index = 0; index < count; index += 1) {
      const duration = durations[index % durations.length] || 0;
      const delay = delays[index % delays.length] || 0;
      longest = Math.max(longest, duration + delay);
    }

    return longest;
  };

  const getModalTransitionTime = () => {
    if (!projectModal) return 0;
    return [projectModal, ...projectModal.querySelectorAll("*")].reduce(
      (longest, element) => Math.max(longest, getTransitionTime(element)),
      0
    );
  };

  const cancelPendingModalHide = () => {
    modalTransitionVersion += 1;
    if (!modalHideTimer) return;
    window.clearTimeout(modalHideTimer);
    modalHideTimer = 0;
  };

  const prepareTransitionClone = (root) => {
    if (!(root instanceof Element)) return;

    root.removeAttribute("id");
    root.removeAttribute("data-project-id");
    root.querySelectorAll("[id]").forEach((element) => {
      element.removeAttribute("id");
    });
    root.querySelectorAll("[data-project-id]").forEach((element) => {
      element.removeAttribute("data-project-id");
    });
    root
      .querySelectorAll(
        "a, button, input, select, textarea, [tabindex], [contenteditable]"
      )
      .forEach((element) => {
        element.setAttribute("tabindex", "-1");
      });
  };

  const cancelActiveProjectFlip = () => {
    if (!activeProjectFlip) return;

    const { element, animations } = activeProjectFlip;
    activeProjectFlip = null;
    animations.forEach((animation) => animation.cancel());
    element.remove();
    projectModal?.classList.remove("is-flipping");
  };

  const finishProjectOpen = (projectId, transitionVersion) => {
    if (
      !projectModal ||
      !projectModalBody ||
      !projectCloseButton ||
      modalTransitionVersion !== transitionVersion ||
      !projectModal.classList.contains("is-open") ||
      projectModal.dataset.activeProject !== projectId
    ) {
      return;
    }

    activeGalleryCarousel?.destroy();
    activeGalleryCarousel = initGalleryCarousel(projectModalBody);
    projectModal.classList.remove("is-flipping");
    projectModal.classList.add("is-ready");
    projectCloseButton.focus({ preventScroll: true });
  };

  const revealActiveProjectFlip = () => {
    if (!activeProjectFlip) return;

    const { projectId, transitionVersion } = activeProjectFlip;
    const isAlreadyReady = projectModal?.classList.contains("is-ready");
    cancelActiveProjectFlip();

    if (!isAlreadyReady) {
      finishProjectOpen(projectId, transitionVersion);
    } else {
      projectCloseButton?.focus({ preventScroll: true });
    }
  };

  const startProjectFlip = ({
    projectId,
    sourceCard,
    sourceRect,
    sourceWidth,
    sourceHeight,
    transitionVersion
  }) => {
    if (
      !projectModal ||
      !projectModalBody ||
      !(sourceCard instanceof Element) ||
      !sourceRect ||
      typeof sourceCard.animate !== "function" ||
      reducedMotionPreference.matches
    ) {
      finishProjectOpen(projectId, transitionVersion);
      return;
    }

    const targetCard = projectModalBody.querySelector(".project-detail-card");
    if (!(targetCard instanceof Element)) {
      finishProjectOpen(projectId, transitionVersion);
      return;
    }

    targetCard.querySelectorAll("img").forEach((image, index) => {
      if (index === 0) image.loading = "eager";
      image.decoding = "async";
    });

    const targetRect = targetCard.getBoundingClientRect();
    const modalRect = projectModal.getBoundingClientRect();
    if (
      sourceRect.width <= 0 ||
      sourceRect.height <= 0 ||
      sourceWidth <= 0 ||
      sourceHeight <= 0 ||
      targetRect.width <= 0 ||
      targetRect.height <= 0
    ) {
      finishProjectOpen(projectId, transitionVersion);
      return;
    }

    const flip = document.createElement("div");
    const flipInner = document.createElement("div");
    const frontFace = document.createElement("div");
    const backFace = document.createElement("div");
    const sourceClone = sourceCard.cloneNode(true);
    const targetClone = targetCard.cloneNode(true);

    flip.className = "project-flip";
    flip.setAttribute("aria-hidden", "true");
    flip.setAttribute("inert", "");
    flipInner.className = "project-flip__inner";
    frontFace.className = "project-flip__face project-flip__front";
    backFace.className = "project-flip__face project-flip__back";
    sourceClone.classList.add("project-flip__source-card");
    targetClone.classList.add("project-flip__target-card");
    sourceClone.style.setProperty("--flip-source-width", `${sourceWidth}px`);
    sourceClone.style.setProperty("--flip-source-height", `${sourceHeight}px`);
    const sourceFitScale = Math.min(
      targetRect.width / sourceWidth,
      targetRect.height / sourceHeight
    );
    const fittedSourceWidth = sourceWidth * sourceFitScale;
    const fittedSourceHeight = sourceHeight * sourceFitScale;
    const sourceInsetX = Math.max(
      0,
      (targetRect.width - fittedSourceWidth) / 2
    );
    const sourceInsetY = Math.max(
      0,
      (targetRect.height - fittedSourceHeight) / 2
    );
    sourceClone.style.setProperty(
      "--flip-source-scale",
      String(sourceFitScale)
    );

    prepareTransitionClone(sourceClone);
    prepareTransitionClone(targetClone);
    frontFace.append(sourceClone);
    backFace.append(targetClone);
    flipInner.append(frontFace, backFace);
    flip.append(flipInner);

    const targetLeft =
      targetRect.left - modalRect.left + projectModal.scrollLeft;
    const targetTop =
      targetRect.top - modalRect.top + projectModal.scrollTop;
    const sourceLeft =
      sourceRect.left - modalRect.left + projectModal.scrollLeft;
    const sourceTop =
      sourceRect.top - modalRect.top + projectModal.scrollTop;
    const initialScaleX = sourceRect.width / fittedSourceWidth;
    const initialScaleY = sourceRect.height / fittedSourceHeight;
    const initialScale = (initialScaleX + initialScaleY) / 2;
    const translateX =
      sourceLeft - targetLeft - sourceInsetX * initialScale;
    const translateY =
      sourceTop - targetTop - sourceInsetY * initialScale;
    const sourceRadius =
      Number.parseFloat(window.getComputedStyle(sourceCard).borderRadius) || 6;
    const fittedSourceRadius = sourceRadius * sourceFitScale;
    const sourceClip = `inset(${sourceInsetY}px ${sourceInsetX}px round ${fittedSourceRadius}px)`;
    const targetClip = "inset(0px round 20px)";

    flip.style.left = `${targetLeft}px`;
    flip.style.top = `${targetTop}px`;
    flip.style.width = `${targetRect.width}px`;
    flip.style.height = `${targetRect.height}px`;
    projectModal.append(flip);

    const duration = 560;
    const flightAnimation = flip.animate(
      [
        {
          transform: `translate3d(${translateX}px, ${translateY}px, 0) scale3d(${initialScale}, ${initialScale}, 1)`,
          easing: "cubic-bezier(0.22, 0.75, 0.2, 1)",
          offset: 0
        },
        {
          transform: "translate3d(0, 0, 0) scale3d(1, 1, 1)",
          easing: "linear",
          offset: 0.62
        },
        {
          transform: "translate3d(0, 0, 0) scale3d(1, 1, 1)",
          offset: 1
        }
      ],
      { duration, easing: "linear", fill: "both" }
    );
    const turnAnimation = flipInner.animate(
      [
        {
          transform: "rotateY(0deg) rotateZ(0deg)",
          easing: "cubic-bezier(0.4, 0, 1, 1)",
          offset: 0
        },
        {
          transform: "rotateY(90deg) rotateZ(0deg)",
          offset: 0.5
        },
        {
          transform: "rotateY(-90deg) rotateZ(0deg)",
          easing: "cubic-bezier(0, 0, 0.2, 1)",
          offset: 0.5001
        },
        {
          transform: "rotateY(0deg) rotateZ(0deg)",
          offset: 1
        }
      ],
      { duration, easing: "linear", fill: "both" }
    );
    const frontFaceAnimation = frontFace.animate(
      [
        { opacity: 1, clipPath: sourceClip, offset: 0 },
        { opacity: 1, clipPath: targetClip, offset: 0.48 },
        { opacity: 0, clipPath: targetClip, offset: 0.52 },
        { opacity: 0, clipPath: targetClip, offset: 1 }
      ],
      { duration, easing: "linear", fill: "both" }
    );
    const backFaceAnimation = backFace.animate(
      [
        { opacity: 0, offset: 0 },
        { opacity: 0, offset: 0.48 },
        { opacity: 1, offset: 0.52 },
        { opacity: 1, offset: 1 }
      ],
      { duration, easing: "linear", fill: "both" }
    );

    activeProjectFlip = {
      element: flip,
      animations: [
        flightAnimation,
        turnAnimation,
        frontFaceAnimation,
        backFaceAnimation
      ],
      projectId,
      transitionVersion
    };

    Promise.all([
      flightAnimation.finished.catch(() => null),
      turnAnimation.finished.catch(() => null),
      frontFaceAnimation.finished.catch(() => null),
      backFaceAnimation.finished.catch(() => null)
    ]).then(() => {
      if (
        !activeProjectFlip ||
        activeProjectFlip.element !== flip ||
        modalTransitionVersion !== transitionVersion ||
        !projectModal.classList.contains("is-open") ||
        projectModal.dataset.activeProject !== projectId
      ) {
        return;
      }

      projectModal.classList.add("is-ready");
      projectModal.classList.remove("is-flipping");
      activeProjectFlip = null;
      flightAnimation.cancel();
      turnAnimation.cancel();
      frontFaceAnimation.cancel();
      backFaceAnimation.cancel();
      flip.remove();
      projectCloseButton?.focus({ preventScroll: true });
      window.requestAnimationFrame(() => {
        if (
          modalTransitionVersion !== transitionVersion ||
          !projectModal.classList.contains("is-open") ||
          projectModal.dataset.activeProject !== projectId
        ) {
          return;
        }

        activeGalleryCarousel?.destroy();
        activeGalleryCarousel = initGalleryCarousel(projectModalBody);
      });
    });
  };

  const restorePreviousFocus = () => {
    const focusTarget = previousFocus;
    previousFocus = null;

    if (
      focusTarget &&
      focusTarget.isConnected &&
      typeof focusTarget.focus === "function"
    ) {
      focusTarget.focus({ preventScroll: true });
      return;
    }

    surface.focus({ preventScroll: true });
  };

  const initGalleryCarousel = (root) => {
    if (!(root instanceof Element)) return null;

    const carousel = root.querySelector("[data-gallery-carousel]");
    const viewport = carousel?.querySelector("[data-carousel-viewport]");
    const track = carousel?.querySelector("[data-carousel-track]");
    const pagination = carousel?.querySelector("[data-carousel-pagination]");
    const slides = track
      ? Array.from(track.querySelectorAll("[data-carousel-slide]"))
      : [];
    const dots = pagination
      ? Array.from(pagination.querySelectorAll("[data-carousel-dot]"))
      : [];

    if (!carousel || !viewport || !track || slides.length < 2) return null;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );
    slides.forEach((slide) => {
      slide.querySelectorAll("img").forEach((image) => {
        image.loading = "eager";
      });
    });

    const loopClones = slides.map((slide) => {
      const clone = slide.cloneNode(true);
      clone.removeAttribute("data-carousel-slide");
      clone.removeAttribute("role");
      clone.removeAttribute("aria-roledescription");
      clone.removeAttribute("aria-label");
      clone.setAttribute("aria-hidden", "true");
      clone.dataset.carouselClone = "";
      clone.querySelectorAll("img").forEach((image) => {
        image.alt = "";
      });
      return clone;
    });
    track.append(...loopClones);

    const slideCount = slides.length;
    let currentIndex = 0;
    let visualIndex = 0;
    let autoplayTimer = 0;
    let loopResetTimer = 0;
    let destroyed = false;

    const clearAutoplay = () => {
      if (!autoplayTimer) return;
      window.clearTimeout(autoplayTimer);
      autoplayTimer = 0;
    };

    const clearLoopReset = () => {
      if (!loopResetTimer) return;
      window.clearTimeout(loopResetTimer);
      loopResetTimer = 0;
    };

    const getSlideStep = () => {
      const slideWidth = slides[0].getBoundingClientRect().width;
      const gap = Number.parseFloat(
        window.getComputedStyle(track).columnGap
      );
      return slideWidth + (Number.isFinite(gap) ? gap : 0);
    };

    const updateCarouselState = () => {
      dots.forEach((dot, index) => {
        if (index === currentIndex) {
          dot.setAttribute("aria-current", "true");
        } else {
          dot.removeAttribute("aria-current");
        }
      });

      slides.forEach((slide, index) => {
        slide.setAttribute(
          "aria-hidden",
          index === currentIndex ? "false" : "true"
        );
      });
    };

    const setTrackPosition = (animate) => {
      track.classList.toggle(
        "is-animating",
        Boolean(animate && !reducedMotion.matches)
      );
      track.style.transform = `translate3d(${-visualIndex * getSlideStep()}px, 0, 0)`;
    };

    const finishLoop = () => {
      if (destroyed || visualIndex !== slideCount) return;
      clearLoopReset();
      visualIndex = 0;
      setTrackPosition(false);
      void track.offsetWidth;
    };

    const queueLoopReset = () => {
      clearLoopReset();
      if (reducedMotion.matches) {
        finishLoop();
        return;
      }

      loopResetTimer = window.setTimeout(finishLoop, 780);
    };

    const scheduleAutoplay = (delay = CAROUSEL_AUTOPLAY_DELAY) => {
      clearAutoplay();
      if (destroyed || reducedMotion.matches || document.hidden) return;
      autoplayTimer = window.setTimeout(() => {
        autoplayTimer = 0;

        if (currentIndex === slideCount - 1) {
          currentIndex = 0;
          visualIndex = slideCount;
        } else {
          currentIndex += 1;
          visualIndex = currentIndex;
        }

        updateCarouselState();
        setTrackPosition(true);
        if (visualIndex === slideCount) queueLoopReset();
        scheduleAutoplay();
      }, delay);
    };

    const goToSlide = (index, manual = false) => {
      if (!Number.isInteger(index) || index < 0 || index >= slideCount) {
        return;
      }

      if (visualIndex === slideCount) finishLoop();
      clearLoopReset();
      currentIndex = index;
      visualIndex = index;
      updateCarouselState();
      setTrackPosition(true);
      scheduleAutoplay(
        manual ? CAROUSEL_MANUAL_DELAY : CAROUSEL_AUTOPLAY_DELAY
      );
    };

    const handleTransitionEnd = (event) => {
      if (event.target !== track || event.propertyName !== "transform") return;
      finishLoop();
    };

    const handlePaginationClick = (event) => {
      if (!(event.target instanceof Element)) return;
      const dot = event.target.closest("[data-carousel-dot]");
      if (!dot || !pagination.contains(dot)) return;
      const index = Number.parseInt(dot.dataset.carouselIndex, 10);
      goToSlide(index, true);
    };

    const handlePaginationKeydown = (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
        return;
      }

      const focusedIndex = dots.indexOf(document.activeElement);
      if (focusedIndex < 0) return;
      event.preventDefault();

      let nextIndex = focusedIndex;
      if (event.key === "ArrowLeft") {
        nextIndex = (focusedIndex - 1 + slideCount) % slideCount;
      } else if (event.key === "ArrowRight") {
        nextIndex = (focusedIndex + 1) % slideCount;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = slideCount - 1;
      }

      dots[nextIndex]?.focus({ preventScroll: true });
      goToSlide(nextIndex, true);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearAutoplay();
      } else {
        scheduleAutoplay();
      }
    };

    const handleMotionChange = () => {
      if (visualIndex === slideCount) {
        finishLoop();
      } else {
        setTrackPosition(false);
      }
      scheduleAutoplay();
    };

    const resizeObserver = new ResizeObserver(() => {
      setTrackPosition(false);
    });

    track.addEventListener("transitionend", handleTransitionEnd);
    pagination?.addEventListener("click", handlePaginationClick);
    pagination?.addEventListener("keydown", handlePaginationKeydown);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    reducedMotion.addEventListener("change", handleMotionChange);
    resizeObserver.observe(viewport);
    updateCarouselState();
    setTrackPosition(false);
    scheduleAutoplay();

    return {
      destroy() {
        if (destroyed) return;
        destroyed = true;
        clearAutoplay();
        clearLoopReset();
        resizeObserver.disconnect();
        track.classList.remove("is-animating");
        track.removeEventListener("transitionend", handleTransitionEnd);
        pagination?.removeEventListener("click", handlePaginationClick);
        pagination?.removeEventListener("keydown", handlePaginationKeydown);
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
        reducedMotion.removeEventListener("change", handleMotionChange);
      }
    };
  };

  const closeProject = () => {
    if (
      !projectModal ||
      !projectModalBody ||
      projectModal.hidden ||
      !projectModal.classList.contains("is-open")
    ) {
      return;
    }

    cancelPendingModalHide();
    cancelActiveProjectFlip();
    activeGalleryCarousel?.destroy();
    activeGalleryCarousel = null;
    const transitionVersion = modalTransitionVersion;
    projectModal.classList.remove("is-open", "is-ready", "is-flipping");
    projectModal.setAttribute("aria-hidden", "true");
    surface.classList.remove("has-open-project");
    restorePreviousFocus();

    const finishClosing = () => {
      if (
        modalTransitionVersion !== transitionVersion ||
        projectModal.classList.contains("is-open")
      ) {
        return;
      }

      projectModal.hidden = true;
      projectModalBody.replaceChildren();
      projectModal.removeAttribute("aria-labelledby");
      delete projectModal.dataset.activeProject;
      projectModal.classList.remove("is-ready", "is-flipping");
      modalHideTimer = 0;
    };

    const transitionTime = getModalTransitionTime();
    if (transitionTime <= 0) {
      finishClosing();
      return;
    }

    modalHideTimer = window.setTimeout(finishClosing, transitionTime + 50);
  };

  const openProject = (projectId, sourceCard = null) => {
    if (!projectModal || !projectModalBody || !projectCloseButton) return;

    const template = projectTemplates.get(projectId);
    if (!template) return;

    const sourceElement =
      sourceCard instanceof HTMLElement && sourceCard.isConnected
        ? sourceCard
        : null;
    const sourceRect = sourceElement?.getBoundingClientRect() || null;
    const sourceWidth = sourceElement?.offsetWidth || 0;
    const sourceHeight = sourceElement?.offsetHeight || 0;

    cancelPendingModalHide();
    cancelActiveProjectFlip();
    const transitionVersion = modalTransitionVersion;
    if (!isProjectModalVisible()) {
      previousFocus =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
    }

    const content = template.content.cloneNode(true);
    activeGalleryCarousel?.destroy();
    activeGalleryCarousel = null;
    projectModalBody.replaceChildren(content);

    let title = projectModalBody.querySelector(
      "[data-project-title], h1, h2, h3, [role='heading']"
    );
    const safeProjectId = projectId.replace(/[^a-zA-Z0-9_-]+/g, "-");
    const titleId = `playground-project-${safeProjectId || "detail"}-title`;

    if (!title) {
      title = document.createElement("span");
      title.className = "visually-hidden";
      title.textContent =
        template.dataset.projectLabel || projectId.replace(/[-_]+/g, " ");
      projectModalBody.prepend(title);
    }

    if (!title.id || /\s/.test(title.id)) title.id = titleId;
    projectModal.setAttribute("aria-labelledby", title.id);
    projectModal.removeAttribute("aria-hidden");
    projectModal.dataset.activeProject = projectId;
    projectModal.scrollTop = 0;
    projectModal.scrollLeft = 0;
    projectModal.hidden = false;
    projectModal.classList.remove("is-open", "is-ready", "is-flipping");
    surface.classList.add("has-open-project");
    // Flush the hidden state so the entrance transition starts reliably.
    void projectModal.offsetWidth;
    projectModal.classList.add("is-open", "is-flipping");
    projectModal.focus({ preventScroll: true });
    startProjectFlip({
      projectId,
      sourceCard: sourceElement,
      sourceRect,
      sourceWidth,
      sourceHeight,
      transitionVersion
    });
  };

  const finishPointer = (event, openOnClick = false) => {
    if (
      state.activePointerId === null ||
      (event && event.pointerId !== state.activePointerId)
    ) {
      return;
    }

    const pointerId = state.activePointerId;
    const projectId = state.pointerProjectId;
    const projectCard = state.pointerProjectCard;
    const wasDragging = state.isDragging;
    state.activePointerId = null;
    state.pointerProjectId = null;
    state.pointerProjectCard = null;
    state.isDragging = false;
    surface.classList.remove("is-dragging");

    try {
      if (surface.hasPointerCapture?.(pointerId)) {
        surface.releasePointerCapture(pointerId);
      }
    } catch {
      // Pointer capture may already have been released during cancellation.
    }

    if (openOnClick && !wasDragging && projectId) {
      openProject(projectId, projectCard);
    }
  };

  surface.addEventListener("pointerdown", (event) => {
    if (
      state.activePointerId !== null ||
      event.isPrimary === false ||
      event.button !== 0 ||
      isProjectModalVisible() ||
      isInsideProjectModal(event.target)
    ) {
      return;
    }

    const projectCard = getProjectCard(event.target);
    if (!projectCard) {
      event.preventDefault();
      surface.focus({ preventScroll: true });
    }

    state.activePointerId = event.pointerId;
    state.pointerStartX = event.clientX;
    state.pointerStartY = event.clientY;
    state.pointerX = event.clientX;
    state.pointerY = event.clientY;
    state.pointerProjectId = projectCard?.dataset.projectId || null;
    state.pointerProjectCard = projectCard;
    state.isDragging = false;

    try {
      surface.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is unavailable for some synthetic pointer events.
    }
  });

  surface.addEventListener("pointermove", (event) => {
    if (event.pointerId !== state.activePointerId) return;

    if (!state.isDragging) {
      const distanceX = event.clientX - state.pointerStartX;
      const distanceY = event.clientY - state.pointerStartY;
      if (
        distanceX * distanceX + distanceY * distanceY <
        DRAG_THRESHOLD * DRAG_THRESHOLD
      ) {
        return;
      }

      state.isDragging = true;
      surface.classList.add("is-dragging");
      surface.focus({ preventScroll: true });
    }

    const deltaX = event.clientX - state.pointerX;
    const deltaY = event.clientY - state.pointerY;
    state.pointerX = event.clientX;
    state.pointerY = event.clientY;
    state.x += deltaX / state.scale;
    state.y += deltaY / state.scale;
    wrapPosition();
    requestRender();
  });

  surface.addEventListener("pointerup", (event) =>
    finishPointer(event, true)
  );
  surface.addEventListener("pointercancel", (event) => finishPointer(event));
  surface.addEventListener("lostpointercapture", (event) =>
    finishPointer(event)
  );
  surface.addEventListener("dragstart", (event) => event.preventDefault());
  window.addEventListener("blur", () => finishPointer());
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) finishPointer();
  });

  projectCloseButton?.addEventListener("click", (event) => {
    event.preventDefault();
    closeProject();
  });

  projectModal?.addEventListener("click", (event) => {
    const backdrop =
      event.target === projectModal ||
      (event.target instanceof Element &&
        event.target.hasAttribute("data-project-backdrop"));
    if (
      backdrop &&
      projectModal.classList.contains("is-flipping") &&
      !projectModal.classList.contains("is-ready")
    ) {
      return;
    }
    if (backdrop) closeProject();
  });

  document.addEventListener("keydown", (event) => {
    if (
      !isProjectModalVisible() ||
      !projectModal?.classList.contains("is-open")
    ) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeProject();
      return;
    }

    if (event.key === "Tab") {
      if (
        projectModal.classList.contains("is-flipping") &&
        !projectModal.classList.contains("is-ready")
      ) {
        event.preventDefault();
        projectModal.focus({ preventScroll: true });
        return;
      }

      const focusableElements = Array.from(
        projectModal.querySelectorAll(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
        )
      ).filter(
        (element) =>
          element !== projectModal &&
          element.getAttribute("tabindex") !== "-1" &&
          !element.closest('[hidden], [inert], [aria-hidden="true"]')
      );

      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const focusedIndex = focusableElements.indexOf(document.activeElement);
      const firstElement = focusableElements[0];
      const lastElement = focusableElements.at(-1);

      if (focusedIndex < 0) {
        event.preventDefault();
        (event.shiftKey ? lastElement : firstElement)?.focus({
          preventScroll: true
        });
      } else if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus({ preventScroll: true });
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus({ preventScroll: true });
      }
    }
  });

  surface.addEventListener(
    "wheel",
    (event) => {
      if (isInsideProjectModal(event.target) || isProjectModalVisible()) return;
      if (event.ctrlKey) return;
      event.preventDefault();

      const unit =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? 16
          : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? surface.clientHeight
            : 1;

      let deltaX = event.deltaX * unit;
      let deltaY = event.deltaY * unit;

      if (event.shiftKey && Math.abs(deltaX) < Math.abs(deltaY)) {
        deltaX = deltaY;
        deltaY = 0;
      }

      state.x -= deltaX / state.scale;
      state.y -= deltaY / state.scale;
      wrapPosition();
      requestRender();
    },
    { passive: false }
  );

  surface.addEventListener("keydown", (event) => {
    if (isInsideProjectModal(event.target) || isProjectModalVisible()) return;

    const projectCard = getProjectCard(event.target);
    if (
      projectCard &&
      !event.repeat &&
      (event.key === "Enter" || event.key === " ")
    ) {
      event.preventDefault();
      openProject(projectCard.dataset.projectId, projectCard);
      return;
    }

    if (event.altKey || event.ctrlKey || event.metaKey) return;

    const step = event.shiftKey ? 112 : 56;
    const pageStep = (surface.clientHeight / state.scale) * 0.8;
    let handled = true;

    switch (event.key) {
      case "ArrowLeft":
        state.x += step;
        break;
      case "ArrowRight":
        state.x -= step;
        break;
      case "ArrowUp":
        state.y += step;
        break;
      case "ArrowDown":
        state.y -= step;
        break;
      case "PageUp":
        state.y += pageStep;
        break;
      case "PageDown":
        state.y -= pageStep;
        break;
      case "Home":
        resetPosition();
        break;
      default:
        handled = false;
    }

    if (!handled) return;
    event.preventDefault();
    wrapPosition();
    requestRender();
  });

  const resizeObserver = new ResizeObserver(() => {
    revealActiveProjectFlip();
    if (updateScale(true)) requestRender();
  });

  reducedMotionPreference.addEventListener("change", (event) => {
    if (event.matches) revealActiveProjectFlip();
  });

  resizeObserver.observe(surface);
  updateScale();
  render();
}
