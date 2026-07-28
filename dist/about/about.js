import { ABOUT_DEVICE_PIXEL_DATA } from './about-device-pixel-data.js';
import { ABOUT_PHOTO_PIXEL_DATA } from './about-photo-pixel-data.js';

const root = document.documentElement;
const splash = document.getElementById('splash');

const aboutI18n = {
  en: {
    'nav.work': 'Work',
    'nav.about': 'About',
    'about.title': 'Hi there, this is Lynn.',
    'about.intro': 'A designer following her dream of delivering smiles with delightful experiences.',
    'about.curiosity': 'I am curious about form and function, interactive software, and prototyping. I value restraint and craft. I don’t just design for how things feel and look, but also how they work.',
    'about.education': 'Before becoming a product designer at Ant Group, I studied Information Experience Design (M.S.) at Pratt Institute.',
    'about.story': 'My adventure in technology and design began all the way back in college—it’s a story I’d love to share with you! Feel free to reach out via the links below.',
    'about.resume': 'Resume',
    'about.email': 'Email',
    'about.linkedin': 'LinkedIn',
    'footer.copy': 'crafted with <span class="footer-love-mark" role="img" aria-label="love"></span> &amp; made with AI by Lynn'
  },
  zh: {
    'nav.work': '作品',
    'nav.about': '关于',
    'about.title': '你好，我是 Lynn。',
    'about.intro': '一名追随梦想、希望通过愉悦体验传递微笑的设计师。',
    'about.curiosity': '我对形式与功能、交互软件和原型设计充满好奇。我重视克制与工艺，不只关注产品带来的感受和视觉，也关注它真正如何运作。',
    'about.education': '在成为蚂蚁集团产品设计师之前，我曾在普瑞特艺术学院攻读信息体验设计硕士。',
    'about.story': '我的科技与设计冒险早在大学时期就已开始——这是一个我很愿意与你分享的故事！欢迎通过下方链接联系我。',
    'about.resume': '简历',
    'about.email': '邮件',
    'about.linkedin': 'LinkedIn',
    'footer.copy': 'crafted with <span class="footer-love-mark" role="img" aria-label="love"></span> &amp; made with AI by Lynn'
  }
};

function dictionary() {
  return aboutI18n[root.dataset.lang || 'en'];
}

function translate() {
  const language = root.dataset.lang || 'en';
  const values = dictionary();
  root.lang = language === 'zh' ? 'zh-CN' : 'en';

  document.querySelectorAll('[data-about-i18n]').forEach((node) => {
    node.textContent = values[node.dataset.aboutI18n] || node.dataset.aboutI18n;
  });
  document.querySelectorAll('[data-about-i18n-html]').forEach((node) => {
    node.innerHTML = values[node.dataset.aboutI18nHtml] || node.dataset.aboutI18nHtml;
  });

  const languageToggle = document.querySelector('[data-lang-toggle]');
  const languageLabel = document.querySelector('[data-lang-label]');
  languageToggle?.setAttribute('aria-pressed', String(language === 'zh'));
  languageToggle?.setAttribute('aria-label', language === 'zh' ? 'Switch to English' : 'Switch to Chinese');
  if (languageLabel) languageLabel.textContent = language === 'zh' ? '中' : 'EN';
}

function setTheme(theme) {
  root.dataset.theme = theme;
  const themeToggle = document.querySelector('[data-theme-toggle]');
  themeToggle?.setAttribute('aria-pressed', String(theme === 'dark'));
  themeToggle?.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  window.dispatchEvent(new CustomEvent('portfolio-theme-change'));
}

function updateScrolledState() {
  document.body.classList.toggle('is-scrolled', window.scrollY > 12);
}

function decodePixelFrames(canvas) {
  const { width, height, opaqueMask, frames } = ABOUT_DEVICE_PIXEL_DATA;
  const encodedMask = window.atob(opaqueMask);
  canvas.width = width;
  canvas.height = height;

  return frames.map((frame) => {
    const encoded = window.atob(frame.pixels);
    const rgba = new Uint8ClampedArray(width * height * 4);

    for (let pixelIndex = 0; pixelIndex < encoded.length; pixelIndex += 1) {
      const color = frame.palette[encoded.charCodeAt(pixelIndex)];
      const offset = pixelIndex * 4;
      rgba[offset] = color >> 16;
      rgba[offset + 1] = (color >> 8) & 255;
      rgba[offset + 2] = color & 255;
      const maskByte = encodedMask.charCodeAt(pixelIndex >> 3);
      rgba[offset + 3] = maskByte & (1 << (pixelIndex & 7)) ? 255 : 0;
    }

    return new ImageData(rgba, width, height);
  });
}

function decodePhotoFrames() {
  const { width, height, frames } = ABOUT_PHOTO_PIXEL_DATA;

  return frames.map((frame) => {
    const encoded = window.atob(frame.pixels);
    const rgba = new Uint8ClampedArray(width * height * 4);

    for (let pixelIndex = 0; pixelIndex < encoded.length; pixelIndex += 1) {
      const color = frame.palette[encoded.charCodeAt(pixelIndex)];
      const offset = pixelIndex * 4;
      rgba[offset] = color >> 16;
      rgba[offset + 1] = (color >> 8) & 255;
      rgba[offset + 2] = color & 255;
      rgba[offset + 3] = 255;
    }

    return new ImageData(rgba, width, height);
  });
}

function isInsideRoundedScreen(x, y, screen, radius = 7) {
  if (x < screen.left || x > screen.right || y < screen.top || y > screen.bottom) {
    return false;
  }

  const nearestX = Math.max(screen.left + radius, Math.min(screen.right - radius, x));
  const nearestY = Math.max(screen.top + radius, Math.min(screen.bottom - radius, y));
  return Math.hypot(x - nearestX, y - nearestY) <= radius;
}

function composePhotoFrames(deviceFrame, photoFrames, screen) {
  const width = deviceFrame.width;

  return photoFrames.map((photoFrame) => {
    const pixels = new Uint8ClampedArray(deviceFrame.data);

    for (let photoY = 0; photoY < photoFrame.height; photoY += 1) {
      for (let photoX = 0; photoX < photoFrame.width; photoX += 1) {
        const x = screen.left + photoX;
        const y = screen.top + photoY;
        if (!isInsideRoundedScreen(x, y, screen)) continue;

        const sourceOffset = (photoY * photoFrame.width + photoX) * 4;
        const destinationOffset = (y * width + x) * 4;
        pixels[destinationOffset] = photoFrame.data[sourceOffset];
        pixels[destinationOffset + 1] = photoFrame.data[sourceOffset + 1];
        pixels[destinationOffset + 2] = photoFrame.data[sourceOffset + 2];
        pixels[destinationOffset + 3] = 255;
      }
    }

    return new ImageData(pixels, deviceFrame.width, deviceFrame.height);
  });
}

function createDarkDeviceFrame(frame, screen) {
  const pixels = new Uint8ClampedArray(frame.data);

  for (let y = 0; y < frame.height; y += 1) {
    for (let x = 0; x < frame.width; x += 1) {
      if (isInsideRoundedScreen(x, y, screen)) continue;

      const offset = (y * frame.width + x) * 4;
      if (pixels[offset + 3] === 0) continue;

      const luminance = pixels[offset] * 0.299
        + pixels[offset + 1] * 0.587
        + pixels[offset + 2] * 0.114;
      const tone = Math.round((255 - luminance) * 0.94);
      pixels[offset] = tone;
      pixels[offset + 1] = tone;
      pixels[offset + 2] = tone;
    }
  }

  return new ImageData(pixels, frame.width, frame.height);
}

function createMonochromeFrame(frame, screen) {
  const pixels = new Uint8ClampedArray(frame.data);
  const bayer = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5]
  ];

  for (let y = screen.top; y <= screen.bottom; y += 1) {
    for (let x = screen.left; x <= screen.right; x += 1) {
      if (!isInsideRoundedScreen(x, y, screen)) continue;

      const offset = (y * frame.width + x) * 4;
      const red = frame.data[offset];
      const green = frame.data[offset + 1];
      const blue = frame.data[offset + 2];
      const luminance = red * 0.299 + green * 0.587 + blue * 0.114;
      const normalized = Math.max(0, Math.min(1, ((luminance - 128) * 1.08 + 132) / 255));
      const threshold = (bayer[y % 4][x % 4] + 0.5) / 16;
      const halftone = normalized > threshold ? 235 : 30;
      const baseTone = 48 + normalized * 166;
      let tone = Math.round(baseTone * 0.7 + halftone * 0.3);

      if (x % 3 === 0 && y % 3 === 0) {
        tone += normalized > 0.5 ? 15 : -10;
      }

      tone = Math.max(18, Math.min(242, tone));
      pixels[offset] = tone;
      pixels[offset + 1] = tone;
      pixels[offset + 2] = tone;
      pixels[offset + 3] = 255;
    }
  }

  return new ImageData(pixels, frame.width, frame.height);
}

function createPlayStateFrame(frame, triangleTone = 36) {
  const pixels = new Uint8ClampedArray(frame.data);
  const width = frame.width;
  const erasedRanges = [
    [195, 198],
    [201, 204]
  ];

  for (let y = 351; y <= 359; y += 1) {
    const leftOffset = (y * width + 194) * 4;
    const rightOffset = (y * width + 205) * 4;

    erasedRanges.forEach(([startX, endX]) => {
      for (let x = startX; x <= endX; x += 1) {
        const offset = (y * width + x) * 4;
        const progress = (x - 194) / 11;

        for (let channel = 0; channel < 3; channel += 1) {
          pixels[offset + channel] = Math.round(
            pixels[leftOffset + channel]
            + (pixels[rightOffset + channel] - pixels[leftOffset + channel]) * progress
          );
        }
      }
    });
  }

  const playRows = [2, 3, 4, 5, 6, 5, 4, 3, 2];
  playRows.forEach((rowWidth, row) => {
    for (let x = 198; x < 198 + rowWidth; x += 1) {
      const offset = ((351 + row) * width + x) * 4;
      pixels[offset] = triangleTone;
      pixels[offset + 1] = triangleTone;
      pixels[offset + 2] = triangleTone;
      pixels[offset + 3] = 255;
    }
  });

  return new ImageData(pixels, frame.width, frame.height);
}

function setupAboutSlideshow() {
  const slideshow = document.querySelector('[data-about-slideshow]');
  const canvas = slideshow?.querySelector('[data-pixel-device]');
  const context = canvas?.getContext('2d', { alpha: true });
  if (!slideshow || !canvas || !context) return;

  const deviceFrames = decodePixelFrames(canvas);
  const photoFrames = decodePhotoFrames();
  const screen = {
    left: 68,
    top: 48,
    right: 331,
    bottom: 319
  };
  const lightColorFrames = composePhotoFrames(deviceFrames[0], photoFrames, screen);
  const darkDeviceFrame = createDarkDeviceFrame(deviceFrames[0], screen);
  const darkColorFrames = composePhotoFrames(darkDeviceFrame, photoFrames, screen);
  const colorFramesByTheme = {
    light: lightColorFrames,
    dark: darkColorFrames
  };
  const monochromeFramesByTheme = {
    light: lightColorFrames.map((frame) => createMonochromeFrame(frame, screen)),
    dark: darkColorFrames.map((frame) => createMonochromeFrame(frame, screen))
  };
  const pausedColorFramesByTheme = {
    light: lightColorFrames.map((frame) => createPlayStateFrame(frame)),
    dark: darkColorFrames.map((frame) => createPlayStateFrame(frame, 220))
  };
  const pausedMonochromeFramesByTheme = {
    light: monochromeFramesByTheme.light.map((frame) => createPlayStateFrame(frame)),
    dark: monochromeFramesByTheme.dark.map((frame) => createPlayStateFrame(frame, 220))
  };
  const descriptions = [
    'Lynn overlooking a city skyline at night in a pixel-art projector',
    'Lynn beneath orange reflected light in a pixel-art projector',
    'Lynn at the beach during sunset in a pixel-art projector',
    'Lynn beside the Shanghai waterfront at night in a pixel-art projector'
  ];
  const previousButton = slideshow.querySelector('[data-slide-previous]');
  const toggleButton = slideshow.querySelector('[data-slide-toggle]');
  const nextButton = slideshow.querySelector('[data-slide-next]');
  const status = slideshow.querySelector('[data-slide-status]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const interval = 5200;
  const renderedFrame = context.createImageData(canvas.width, canvas.height);
  const hover = {
    x: (screen.left + screen.right) / 2,
    y: (screen.top + screen.bottom) / 2,
    tx: (screen.left + screen.right) / 2,
    ty: (screen.top + screen.bottom) / 2,
    vx: 0,
    vy: 0,
    force: 0,
    target: 0,
    positioned: false,
    trails: []
  };
  const transition = {
    active: false,
    from: 0,
    to: 0,
    start: 0,
    duration: 820
  };
  let current = Number.parseInt(slideshow.dataset.initialSlide || '0', 10);
  let paused = reducedMotion.matches;
  let timer = null;
  let particleAnimation = 0;
  let lastParticlePaint = 0;

  function normalizeIndex(index) {
    return (index + lightColorFrames.length) % lightColorFrames.length;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function hash(x, y) {
    return Math.abs(Math.sin(x * 127.1 + y * 311.7) * 43758.5453) % 1;
  }

  function smoothstep(value) {
    const clamped = clamp(value, 0, 1);
    return clamped * clamped * (3 - 2 * clamped);
  }

  function activeColorFrame(index) {
    const theme = root.dataset.theme === 'dark' ? 'dark' : 'light';
    return paused
      ? pausedColorFramesByTheme[theme][index]
      : colorFramesByTheme[theme][index];
  }

  function activeMonochromeFrame(index) {
    const theme = root.dataset.theme === 'dark' ? 'dark' : 'light';
    return paused
      ? pausedMonochromeFramesByTheme[theme][index]
      : monochromeFramesByTheme[theme][index];
  }

  function paintStillFrame() {
    context.putImageData(activeMonochromeFrame(current), 0, 0);
  }

  function updateMetadata(index) {
    const normalized = normalizeIndex(index);
    canvas.setAttribute('aria-label', descriptions[normalized]);
    slideshow.dataset.slideIndex = String(normalized);
    if (status) status.textContent = `Portrait ${normalized + 1} of ${lightColorFrames.length}`;
  }

  function updateHover(time) {
    hover.x += (hover.tx - hover.x) * 0.22;
    hover.y += (hover.ty - hover.y) * 0.22;
    hover.vx *= 0.82;
    hover.vy *= 0.82;
    hover.force += (hover.target - hover.force) * (hover.target ? 0.2 : 0.09);
    hover.trails = hover.trails.filter((sample) => time - sample.born < 360);

    if (hover.target === 0 && hover.force < 0.004) {
      hover.force = 0;
    }

  }

  function revealAt(x, y, time) {
    if (!hover.force) return 0;

    const cellX = Math.floor(x / 2);
    const cellY = Math.floor(y / 2);
    const edgeNoise = hash(cellX + 71, cellY - 37);
    const angle = Math.atan2(y - hover.y, x - hover.x);
    const irregularity = 0.94
      + (edgeNoise - 0.5) * 0.17
      + Math.sin(angle * 5 + time * 0.003) * 0.045;

    function fieldAt(centerX, centerY, strength, innerRadius, outerRadius) {
      const distance = Math.hypot((x - centerX) * 0.94, (y - centerY) * 1.06);
      const field = (outerRadius * irregularity - distance) / (outerRadius - innerRadius);
      return smoothstep(field) * strength;
    }

    let reveal = fieldAt(hover.x, hover.y, hover.force, 50, 84);

    for (const sample of hover.trails) {
      const age = clamp((time - sample.born) / 360, 0, 1);
      const strength = (1 - age) * (1 - age) * 0.42 * hover.force;
      reveal = Math.max(
        reveal,
        fieldAt(sample.x, sample.y, strength, 34, 62 + age * 6)
      );
    }

    return clamp(reveal, 0, 0.97);
  }

  function transitionProgress(time) {
    if (!transition.active) return 0;
    return clamp((time - transition.start) / transition.duration, 0, 1);
  }

  function completeTransitionIfNeeded(time) {
    if (!transition.active || transitionProgress(time) < 1) return;
    current = transition.to;
    transition.active = false;
    slideshow.dataset.transitionState = 'idle';
    updateMetadata(current);
  }

  function paintParticleFrame(time) {
    const fromIndex = transition.active ? transition.from : current;
    const toIndex = transition.active ? transition.to : current;
    const monochromeFrom = activeMonochromeFrame(fromIndex).data;
    const monochromeTo = activeMonochromeFrame(toIndex).data;
    const colorFrom = activeColorFrame(fromIndex).data;
    const colorTo = activeColorFrame(toIndex).data;
    const output = renderedFrame.data;
    const block = 2;
    const progress = transitionProgress(time);
    const scramble = transition.active ? Math.pow(Math.sin(Math.PI * progress), 0.9) : 0;
    const phase = time / 190;
    const phaseIndex = Math.floor(phase);
    const phaseProgress = phase - phaseIndex;
    const phaseBlend = smoothstep(phaseProgress);

    output.set(monochromeFrom);

    for (let y = screen.top; y <= screen.bottom; y += block) {
      for (let x = screen.left; x <= screen.right; x += block) {
        if (!isInsideRoundedScreen(x + 1, y + 1, screen)) continue;

        const cellX = Math.floor(x / block);
        const cellY = Math.floor(y / block);
        const dissolveNoise = hash(cellX + 313, cellY - 127);
        const useTarget = transition.active
          && progress >= 0.1 + dissolveNoise * 0.8;
        const monochromeSource = useTarget ? monochromeTo : monochromeFrom;
        const colorSource = useTarget ? colorTo : colorFrom;
        const particleStrength = 0.48 + hash(cellX + 41, cellY - 23) * 0.42;
        const randomXNow = hash(
          cellX + phaseIndex * 23 + 11,
          cellY - phaseIndex * 17 - 29
        ) * 2 - 1;
        const randomXNext = hash(
          cellX + (phaseIndex + 1) * 23 + 11,
          cellY - (phaseIndex + 1) * 17 - 29
        ) * 2 - 1;
        const randomYNow = hash(
          cellX - phaseIndex * 19 - 37,
          cellY + phaseIndex * 29 + 17
        ) * 2 - 1;
        const randomYNext = hash(
          cellX - (phaseIndex + 1) * 19 - 37,
          cellY + (phaseIndex + 1) * 29 + 17
        ) * 2 - 1;
        const randomX = randomXNow + (randomXNext - randomXNow) * phaseBlend;
        const randomY = randomYNow + (randomYNext - randomYNow) * phaseBlend;
        const edgeDistance = Math.min(
          x - screen.left,
          screen.right - x,
          y - screen.top,
          screen.bottom - y
        );
        const edgeFade = smoothstep((edgeDistance - 1) / 5);
        const horizontalShift = randomX * particleStrength * edgeFade * 0.84;
        const verticalShift = randomY * particleStrength * edgeFade * 0.76;
        const sourceX = clamp(
          Math.round(x - horizontalShift),
          screen.left,
          screen.right - block + 1
        );
        const sourceY = clamp(
          Math.round(y - verticalShift),
          screen.top,
          screen.bottom - block + 1
        );
        const reveal = revealAt(x + 1, y + 1, time);
        const snowGate = hash(
          cellX + Math.floor(time / 44) * 17,
          cellY - Math.floor(time / 44) * 13
        );
        const snow = transition.active && snowGate < scramble * 0.55;
        const snowOffsetX = hash(cellX + 1207, cellY - 809) > 0.5 ? 1 : 0;
        const snowOffsetY = hash(cellX - 991, cellY + 1063) > 0.5 ? 1 : 0;
        const snowHasTail = hash(cellX + 1543, cellY - 1231) > 0.82;

        for (let offsetY = 0; offsetY < block && y + offsetY <= screen.bottom; offsetY += 1) {
          for (let offsetX = 0; offsetX < block && x + offsetX <= screen.right; offsetX += 1) {
            if (!isInsideRoundedScreen(x + offsetX, y + offsetY, screen)) continue;
            const destinationOffset = ((y + offsetY) * canvas.width + x + offsetX) * 4;
            const sourceOffset = (
              (sourceY + offsetY) * canvas.width + sourceX + offsetX
            ) * 4;
            const colorOffset = (
              (y + offsetY) * canvas.width + x + offsetX
            ) * 4;

            output[destinationOffset] = monochromeSource[sourceOffset];
            output[destinationOffset + 1] = monochromeSource[sourceOffset + 1];
            output[destinationOffset + 2] = monochromeSource[sourceOffset + 2];
            output[destinationOffset + 3] = monochromeSource[sourceOffset + 3];

            const isSnowPixel = snow && (
              (offsetX === snowOffsetX && offsetY === snowOffsetY)
              || (
                snowHasTail
                && offsetY === snowOffsetY
                && offsetX === 1 - snowOffsetX
              )
            );

            if (isSnowPixel) {
              const snowTone = hash(cellX + offsetX + 911, cellY + offsetY - 433) > 0.48
                ? 244
                : 20;
              output[destinationOffset] = snowTone;
              output[destinationOffset + 1] = snowTone;
              output[destinationOffset + 2] = snowTone;
              output[destinationOffset + 3] = 255;
            }

            if (reveal > 0) {
              const screenTexture = (x + offsetX) % 3 === 0 && (y + offsetY) % 3 === 0
                ? 0.94
                : 1;
              const mix = reveal * screenTexture;
              output[destinationOffset] = Math.round(
                output[destinationOffset] * (1 - mix) + colorSource[colorOffset] * mix
              );
              output[destinationOffset + 1] = Math.round(
                output[destinationOffset + 1] * (1 - mix) + colorSource[colorOffset + 1] * mix
              );
              output[destinationOffset + 2] = Math.round(
                output[destinationOffset + 2] * (1 - mix) + colorSource[colorOffset + 2] * mix
              );
            }
          }
        }

        const particleGate = hash(cellX + 97, cellY - 73);
        if (!snow && reveal < 0.72 && particleGate < 0.15) {
          const particleX = clamp(
            x + Math.round(randomX * 1.3),
            screen.left + 2,
            screen.right - 2
          );
          const particleY = clamp(
            y + Math.round(randomY * 1.2),
            screen.top + 2,
            screen.bottom - 2
          );
          if (isInsideRoundedScreen(particleX, particleY, screen)) {
            const particleOffset = (particleY * canvas.width + particleX) * 4;
            const localColorOffset = ((y + 1) * canvas.width + x + 1) * 4;
            const localLuminance = colorSource[localColorOffset] * 0.299
              + colorSource[localColorOffset + 1] * 0.587
              + colorSource[localColorOffset + 2] * 0.114;
            const toneSeed = hash(cellX - 211, cellY + 149);
            const particleTone = localLuminance < 128
              ? toneSeed > 0.62 ? 246 : 22
              : toneSeed > 0.72 ? 22 : 246;
            output[particleOffset] = particleTone;
            output[particleOffset + 1] = particleTone;
            output[particleOffset + 2] = particleTone;
            output[particleOffset + 3] = 255;

            if (toneSeed > 0.78 && particleX + 1 <= screen.right) {
              const adjacentOffset = particleOffset + 4;
              output[adjacentOffset] = particleTone;
              output[adjacentOffset + 1] = particleTone;
              output[adjacentOffset + 2] = particleTone;
              output[adjacentOffset + 3] = 255;
            }

            if (
              toneSeed > 0.93
              && particleY + 1 <= screen.bottom
              && isInsideRoundedScreen(particleX, particleY + 1, screen)
            ) {
              const lowerOffset = particleOffset + canvas.width * 4;
              output[lowerOffset] = particleTone;
              output[lowerOffset + 1] = particleTone;
              output[lowerOffset + 2] = particleTone;
              output[lowerOffset + 3] = 255;
            }
          }
        }
      }
    }

    context.putImageData(renderedFrame, 0, 0);
  }

  function animateParticles(time) {
    particleAnimation = 0;
    if (reducedMotion.matches || document.hidden) {
      paintStillFrame();
      return;
    }

    updateHover(time);
    completeTransitionIfNeeded(time);
    slideshow.classList.add('is-rippling');
    slideshow.dataset.rippleState = hover.target
      ? 'revealing'
      : hover.force > 0
        ? 'settling'
        : 'ambient';

    if (!lastParticlePaint || time - lastParticlePaint >= 30) {
      lastParticlePaint = time;
      paintParticleFrame(time);
    }

    particleAnimation = window.requestAnimationFrame(animateParticles);
  }

  function requestParticleFrame() {
    if (reducedMotion.matches || document.hidden || particleAnimation) return;
    particleAnimation = window.requestAnimationFrame(animateParticles);
  }

  function resetParticles() {
    hover.target = 0;
    hover.force = 0;
    hover.vx = 0;
    hover.vy = 0;
    hover.trails = [];
    lastParticlePaint = 0;
    slideshow.classList.remove('is-rippling');
    slideshow.classList.remove('is-hovering');
    slideshow.dataset.rippleState = 'idle';
    if (particleAnimation) {
      window.cancelAnimationFrame(particleAnimation);
      particleAnimation = 0;
    }
    paintStillFrame();
  }

  function showImmediately(index) {
    current = normalizeIndex(index);
    transition.active = false;
    slideshow.dataset.transitionState = 'idle';
    updateMetadata(current);
    paintStillFrame();
    requestParticleFrame();
  }

  function beginTransition(index) {
    const target = normalizeIndex(index);
    if (target === current && !transition.active) return;

    if (reducedMotion.matches) {
      showImmediately(target);
      return;
    }

    if (transition.active) {
      current = transitionProgress(performance.now()) >= 0.5
        ? transition.to
        : transition.from;
    }

    transition.from = current;
    transition.to = target;
    transition.start = performance.now();
    transition.active = true;
    slideshow.dataset.transitionState = 'active';
    slideshow.dataset.slideIndex = String(target);
    if (status) status.textContent = `Portrait ${target + 1} of ${lightColorFrames.length}`;
    requestParticleFrame();
  }

  function stopTimer() {
    if (timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  function startTimer() {
    stopTimer();
    if (paused || document.hidden || lightColorFrames.length < 2) return;
    timer = window.setInterval(() => beginTransition(current + 1), interval);
  }

  function updateToggle() {
    toggleButton?.setAttribute('aria-pressed', String(paused));
    toggleButton?.setAttribute(
      'aria-label',
      paused ? 'Play portrait slideshow' : 'Pause portrait slideshow'
    );
    slideshow.classList.toggle('is-paused', paused);
    if (reducedMotion.matches) paintStillFrame();
    requestParticleFrame();
  }

  previousButton?.addEventListener('click', () => {
    const requested = transition.active ? transition.to : current;
    beginTransition(requested - 1);
    startTimer();
  });
  nextButton?.addEventListener('click', () => {
    const requested = transition.active ? transition.to : current;
    beginTransition(requested + 1);
    startTimer();
  });
  toggleButton?.addEventListener('click', () => {
    paused = !paused;
    updateToggle();
    startTimer();
  });

  document.addEventListener('pointermove', (event) => {
    if (reducedMotion.matches || !finePointer.matches || event.pointerType === 'touch') return;

    const bounds = canvas.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / Math.max(1, bounds.width)) * canvas.width;
    const y = ((event.clientY - bounds.top) / Math.max(1, bounds.height)) * canvas.height;
    const insideScreen = x >= screen.left
      && x <= screen.right
      && y >= screen.top
      && y <= screen.bottom;

    if (!insideScreen) {
      hover.target = 0;
      slideshow.classList.remove('is-hovering');
      requestParticleFrame();
      return;
    }

    const now = performance.now();
    if (!hover.positioned || hover.force === 0) {
      hover.x = x;
      hover.y = y;
      hover.tx = x;
      hover.ty = y;
      hover.vx = 0;
      hover.vy = 0;
      hover.positioned = true;
    } else {
      const movement = Math.hypot(x - hover.tx, y - hover.ty);
      if (movement > 4.5) {
        hover.trails.push({
          x: hover.tx,
          y: hover.ty,
          born: now
        });
        if (hover.trails.length > 5) hover.trails.shift();
      }
      hover.vx = clamp(x - hover.tx, -22, 22);
      hover.vy = clamp(y - hover.ty, -22, 22);
      hover.tx = x;
      hover.ty = y;
    }

    hover.target = 1;
    slideshow.classList.add('is-hovering');
    requestParticleFrame();
  }, { passive: true });

  document.addEventListener('pointerleave', () => {
    hover.target = 0;
    slideshow.classList.remove('is-hovering');
    requestParticleFrame();
  });

  document.addEventListener('visibilitychange', () => {
    startTimer();
    if (document.hidden) {
      if (particleAnimation) window.cancelAnimationFrame(particleAnimation);
      particleAnimation = 0;
      paintStillFrame();
    } else {
      lastParticlePaint = 0;
      requestParticleFrame();
    }
  });
  window.addEventListener('portfolio-theme-change', () => {
    lastParticlePaint = 0;
    paintStillFrame();
    requestParticleFrame();
  });
  reducedMotion.addEventListener?.('change', (event) => {
    if (event.matches) {
      paused = true;
      resetParticles();
    }
    updateToggle();
    startTimer();
  });

  slideshow.dataset.rippleState = reducedMotion.matches ? 'idle' : 'ambient';
  slideshow.dataset.transitionState = 'idle';
  updateMetadata(current);
  updateToggle();
  paintStillFrame();
  requestParticleFrame();
  startTimer();
}

document.querySelector('[data-lang-toggle]')?.addEventListener('click', () => {
  root.dataset.lang = root.dataset.lang === 'zh' ? 'en' : 'zh';
  translate();
});

document.querySelector('[data-theme-toggle]')?.addEventListener('click', () => {
  setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
});

window.addEventListener('scroll', updateScrolledState, { passive: true });

setTheme(root.dataset.theme || 'light');
translate();
updateScrolledState();
setupAboutSlideshow();

window.addEventListener('load', () => {
  window.setTimeout(() => splash?.classList.add('is-hidden'), 240);
});
window.setTimeout(() => splash?.classList.add('is-hidden'), 900);
