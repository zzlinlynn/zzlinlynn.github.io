const surface = document.querySelector("[data-pan-surface]");
const world = document.querySelector("[data-pan-world]");
const sourceTile = world?.querySelector("[data-world-tile]");

if (surface && world && sourceTile) {
  const BASE_WIDTH = 1025;
  const MIN_SCALE = 0.54;
  const TILE_WIDTH = 1534;
  const TILE_HEIGHT = 1388;
  const INITIAL_POSITION = { x: -151, y: -60 };
  const tileTemplate = sourceTile.cloneNode(true);
  const state = {
    x: INITIAL_POSITION.x,
    y: INITIAL_POSITION.y,
    scale: 1,
    activePointerId: null,
    pointerX: 0,
    pointerY: 0,
    viewportWidth: 0,
    viewportHeight: 0,
    tileSignature: "",
    renderFrame: 0
  };

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

  const finishDrag = (event) => {
    if (
      state.activePointerId === null ||
      (event && event.pointerId !== state.activePointerId)
    ) {
      return;
    }

    const pointerId = state.activePointerId;
    state.activePointerId = null;
    surface.classList.remove("is-dragging");

    try {
      if (surface.hasPointerCapture?.(pointerId)) {
        surface.releasePointerCapture(pointerId);
      }
    } catch {
      // Pointer capture may already have been released during cancellation.
    }
  };

  surface.addEventListener("pointerdown", (event) => {
    if (
      state.activePointerId !== null ||
      !event.isPrimary ||
      event.button !== 0
    ) {
      return;
    }

    event.preventDefault();
    state.activePointerId = event.pointerId;
    state.pointerX = event.clientX;
    state.pointerY = event.clientY;
    surface.setPointerCapture(event.pointerId);
    surface.classList.add("is-dragging");
    surface.focus({ preventScroll: true });
  });

  surface.addEventListener("pointermove", (event) => {
    if (event.pointerId !== state.activePointerId) return;

    const deltaX = event.clientX - state.pointerX;
    const deltaY = event.clientY - state.pointerY;
    state.pointerX = event.clientX;
    state.pointerY = event.clientY;
    state.x += deltaX / state.scale;
    state.y += deltaY / state.scale;
    wrapPosition();
    requestRender();
  });

  surface.addEventListener("pointerup", finishDrag);
  surface.addEventListener("pointercancel", finishDrag);
  surface.addEventListener("lostpointercapture", finishDrag);
  surface.addEventListener("dragstart", (event) => event.preventDefault());
  window.addEventListener("blur", () => finishDrag());
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) finishDrag();
  });

  surface.addEventListener(
    "wheel",
    (event) => {
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
    if (updateScale(true)) requestRender();
  });

  resizeObserver.observe(surface);
  updateScale();
  render();
}
