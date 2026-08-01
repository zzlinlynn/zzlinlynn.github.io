/*
 * Lynn Logo Motion v1.0.0
 * Dependency-free SVG animation component.
 *
 * Public API:
 *   const motion = LynnLogoMotion.create(element, { intensity: 1.05 });
 *   motion.setProgress(0.5);
 *   motion.setIntensity(1.1);
 *   motion.destroy();
 */
(function attachLynnLogoMotion(global) {
  "use strict";

  const GRID = [
    "0000000000000001111110000000000000",
    "0000000000001111111111110000000000",
    "0000000000111111111111111100000000",
    "0000000011111111111111111111000000",
    "0000000111111110000000111111100000",
    "0000001111110000000000011111100000",
    "0000011111000000000000111111000000",
    "0000111100000000000001111110000000",
    "0001111000000000000011111100000000",
    "0001110000000000000111111000000000",
    "0011100000000000001111110000000000",
    "0011000000000000011111100000000000",
    "0110000000000000111111000000000000",
    "0110000000000001111110011000000000",
    "0100000000000011111000111000000000",
    "1100000000000111110001111000000000",
    "1100000000001111100011111000000000",
    "1000000000011111000011111000000000",
    "1000000000011110000011111000000000",
    "0000000000111100010011111000000000",
    "0000000000111000111011111000000000",
    "0000000001110001111011111000000000",
    "0000000001100011111011111000000000",
    "0000000000000111110011111000000000",
    "0000000000001111100011111000000000",
    "0000000000011111000011111000000001",
    "0000000000111110000011111000000011",
    "0000000001111100000011111000000111",
    "0000000011111000000011111100001110",
    "0000000111110000000011111111111100",
    "0000000111111000000011111111111100",
    "0000000111111100000011111111111000",
    "0000000111111111111111111111110000",
    "0000000011111111111111111111100000",
    "0000000001111111111111111110000000",
    "0000000000011111111111111000000000",
    "0000000000000111111111000000000000"
  ];

  const NS = "http://www.w3.org/2000/svg";
  const CENTER = 1500;
  const CELL = 60;
  const PITCH = 68;
  const ORIGIN_X = 348;
  const ORIGIN_Y = 246;
  const MIN_INTENSITY = 0.55;
  const MAX_INTENSITY = 1.6;
  const DEFAULT_INTENSITY = 1.05;
  const NOISE_SLOT_SHIFT = 90;
  const RETURN_SLOT_SHIFT = 52;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function hash(value) {
    const x = Math.sin(value * 91.917 + 17.173) * 43758.5453;
    return x - Math.floor(x);
  }

  function smoothstep(value) {
    const t = clamp(value, 0, 1);
    return t * t * (3 - 2 * t);
  }

  function normalizeAngle(angle) {
    return ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  }

  // SVG's Y axis points down. A decreasing mathematical angle therefore reads
  // as counterclockwise on screen. The returned arc is always non-positive.
  function counterClockwiseDelta(from, to) {
    const clockwise = normalizeAngle(to - from);
    return clockwise < 1e-7 ? 0 : clockwise - Math.PI * 2;
  }

  function mix(from, to, amount) {
    return from + (to - from) * amount;
  }

  function resolveMount(target) {
    if (typeof target === "string") return document.querySelector(target);
    return target;
  }

  function create(target, options) {
    const mount = resolveMount(target);
    if (!(mount instanceof Element)) {
      throw new TypeError("LynnLogoMotion.create() requires a valid mount element.");
    }
    if (mount.__lynnLogoMotion) return mount.__lynnLogoMotion;

    const config = options || {};
    const fallbackMarkup = mount.innerHTML;
    let intensity = clamp(Number(config.intensity) || DEFAULT_INTENSITY, MIN_INTENSITY, MAX_INTENSITY);
    let progress = 0;
    let destroyed = false;
    let lastRenderedProgress = null;
    let lastRenderedIntensity = null;

    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 3000 3000");
    svg.setAttribute("class", "logo-motion__svg");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

    const pixelsRoot = document.createElementNS(NS, "g");
    svg.append(pixelsRoot);
    const pixels = [];

    GRID.forEach((row, rowIndex) => {
      Array.from(row).forEach((bit, columnIndex) => {
        if (bit !== "1") return;

        const x = ORIGIN_X + columnIndex * PITCH;
        const y = ORIGIN_Y + rowIndex * PITCH;
        const cx = x + CELL / 2;
        const cy = y + CELL / 2;
        const vx = cx - CENTER;
        const vy = cy - CENTER;
        const radius = Math.hypot(vx, vy);
        const angle = Math.atan2(vy, vx);

        const group = document.createElementNS(NS, "g");
        const rect = document.createElementNS(NS, "rect");
        rect.setAttribute("x", x);
        rect.setAttribute("y", y);
        rect.setAttribute("width", CELL);
        rect.setAttribute("height", CELL);
        rect.setAttribute("class", "logo-motion__pixel");
        group.append(rect);
        pixelsRoot.append(group);
        pixels.push({ group, cx, cy, radius, angle });
      });
    });

    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const noiseSlots = pixels.map((pixel, rank) => {
      const distribution = (rank + 0.7) / pixels.length;
      return {
        radius: Math.pow(distribution, 0.58) * 1120 + (hash(rank * 7.13 + 5) - 0.5) * 2,
        angle: rank * goldenAngle + (hash(rank * 19.17 + 3) - 0.5) * 0.003
      };
    });

    const sourceByAngle = pixels
      .slice()
      .sort((a, b) => normalizeAngle(a.angle) - normalizeAngle(b.angle));
    const noiseSlotsByAngle = noiseSlots
      .slice()
      .sort((a, b) => normalizeAngle(a.angle) - normalizeAngle(b.angle));

    sourceByAngle.forEach((pixel, rank) => {
      const slot = noiseSlotsByAngle[
        (rank - NOISE_SLOT_SHIFT + pixels.length) % pixels.length
      ];
      pixel.noiseRadius = slot.radius;
      pixel.noiseAngle = slot.angle;
    });

    const noiseByAngle = pixels
      .slice()
      .sort((a, b) => normalizeAngle(a.noiseAngle) - normalizeAngle(b.noiseAngle));
    const logoSlots = pixels
      .slice()
      .sort((a, b) => {
        const angleDifference = normalizeAngle(a.angle) - normalizeAngle(b.angle);
        return angleDifference || a.radius - b.radius;
      });

    noiseByAngle.forEach((pixel, rank) => {
      const targetPixel = logoSlots[
        (rank - RETURN_SLOT_SHIFT + logoSlots.length) % logoSlots.length
      ];
      pixel.returnRadius = targetPixel.radius;
      pixel.returnAngle = targetPixel.angle;
    });

    mount.classList.add("logo-motion");
    mount.replaceChildren(svg);

    function render(force) {
      if (destroyed) return;
      if (
        !force
        && progress === lastRenderedProgress
        && intensity === lastRenderedIntensity
      ) return;

      lastRenderedProgress = progress;
      lastRenderedIntensity = intensity;

      const formation = smoothstep(progress / 0.46);
      const collectiveReturn = smoothstep((progress - 0.56) / 0.4);
      const disorderScale = intensity < 1 ? 0.55 + intensity * 0.45 : 1;
      const fieldExpansion = intensity > 1 ? 1 + (intensity - 1) * 0.12 : 1;

      pixels.forEach((pixel) => {
        const dispersedRadius = pixel.noiseRadius * fieldExpansion;
        const noiseRadius = mix(pixel.radius, dispersedRadius, disorderScale);
        const noiseAngle = pixel.angle
          + counterClockwiseDelta(pixel.angle, pixel.noiseAngle) * disorderScale;

        let currentRadius = mix(pixel.radius, noiseRadius, formation);
        let currentAngle = pixel.angle
          + counterClockwiseDelta(pixel.angle, noiseAngle) * formation;

        if (collectiveReturn > 0) {
          currentRadius = mix(noiseRadius, pixel.returnRadius, collectiveReturn);
          currentAngle = noiseAngle
            + counterClockwiseDelta(noiseAngle, pixel.returnAngle) * collectiveReturn;
        }

        const currentX = CENTER + Math.cos(currentAngle) * currentRadius;
        const currentY = CENTER + Math.sin(currentAngle) * currentRadius;
        const edgeWeight = smoothstep((pixel.noiseRadius - 180) / 940);
        const noiseScale = 0.8 - edgeWeight * 0.48;
        const scale = collectiveReturn > 0
          ? mix(noiseScale, 1, collectiveReturn)
          : mix(1, noiseScale, formation);
        const dx = currentX - pixel.cx;
        const dy = currentY - pixel.cy;

        pixel.group.setAttribute(
          "transform",
          `translate(${dx.toFixed(2)} ${dy.toFixed(2)}) translate(${(pixel.cx * (1 - scale)).toFixed(2)} ${(pixel.cy * (1 - scale)).toFixed(2)}) scale(${scale.toFixed(4)})`
        );
      });
    }

    const api = {
      element: svg,
      setProgress(value) {
        progress = clamp(Number(value) || 0, 0, 1);
        render(false);
        return api;
      },
      setIntensity(value) {
        intensity = clamp(Number(value) || DEFAULT_INTENSITY, MIN_INTENSITY, MAX_INTENSITY);
        render(false);
        return api;
      },
      getProgress() {
        return progress;
      },
      getIntensity() {
        return intensity;
      },
      destroy() {
        if (destroyed) return;
        destroyed = true;
        mount.classList.remove("logo-motion");
        mount.innerHTML = fallbackMarkup;
        delete mount.__lynnLogoMotion;
      }
    };

    mount.__lynnLogoMotion = api;
    render(true);
    return api;
  }

  global.LynnLogoMotion = Object.freeze({
    version: "1.0.0",
    create
  });
})(window);
