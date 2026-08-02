const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const cursor = document.getElementById('cursor');
const cursorLabel = document.getElementById('cursor-label');
const layer = document.querySelector('.layer');
const panel = document.querySelector('.panel');
const panelKicker = document.getElementById('panel-kicker');
const panelTitle = document.getElementById('panel-title');
const panelContext = document.getElementById('panel-context');
const panelFacts = document.getElementById('panel-facts');
const panelPaths = document.getElementById('panel-paths');
const closeButton = document.querySelector('[data-close-layer]');

async function waitForImage(image) {
  image.loading = 'eager';

  if (!image.complete) {
    await new Promise((resolve) => {
      image.addEventListener('load', resolve, { once: true });
      image.addEventListener('error', resolve, { once: true });
    });
  }

  if (!image.naturalWidth || typeof image.decode !== 'function') return;
  try {
    await image.decode();
  } catch {
    // A completed image request is allowed to settle even if decoding reports an error.
  }
}

function waitForCriticalImages() {
  return Promise.all(Array.from(
    document.querySelectorAll('[data-page-loader-critical]'),
    waitForImage
  ));
}

async function waitForPageResources(...resources) {
  const fontsReady = document.fonts?.ready || Promise.resolve();
  await Promise.allSettled([
    fontsReady,
    ...resources
  ]);
  await new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

const i18n = {
  en: {
    'nav.work': 'Work',
    'nav.about': 'About',
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'hero.eyebrow': 'Product / UX Designer\nResearch to strategy\nComplex systems',
    'hero.meta': 'Portfolio direction preview using living artifacts, ink response, and inspection-first project surfaces.',
    'hero.topName': '> Lynn',
    'hero.topRole': 'Product / UX Designer',
    'hero.topMode': 'Portfolio system',
    'hero.topModeSub': 'Research to strategy',
    'hero.topNow': 'Currently',
    'hero.topNowSub': 'Building July 2026 case system',
    'hero.dossierLeftTitle': 'Product / UX Designer',
    'hero.dossierLeftMeta': 'Research to strategy · ambiguous systems',
    'hero.dossierRightTitle': 'Case evidence',
    'hero.dossierRightMeta': 'Financial journeys · AI tooling · judgment under constraints',
    'hero.title': '<span>UX</span>',
    'hero.secondaryTitle': '<span>Product</span><span>Designer</span>',
    'hero.sub': 'The site should feel like a crafted product-design artifact: visual enough to invite inspection, restrained enough to keep the case reading serious.',
    'hero.ctaWork': 'Selected Works',
    'hero.ctaAbout': 'About',
    'hero.artifact': 'The artifact is not decoration. It behaves like evidence under inspection: layered, quiet, and responsive.',
    'alipay.kicker': 'Research to Strategy',
    'alipay.title': 'Alipay Wealth\nProfessionalization',
    'alipay.summary': 'Translate vague business objectives into dimensions that users can perceive, and implement them in pre-transaction decision-making.',
    'alipay.tag1': 'research ownership',
    'alipay.tag2': 'problem reframing',
    'alipay.hoverLead': 'User Research',
    'alipay.hover': 'The project will launch in the fall of 2026.',
    'brokerage.kicker': 'Complex Financial Systems',
    'brokerage.title': 'Overseas Brokerage\nPlatform',
    'brokerage.summary': 'A 0–1 brokerage product space where high-stakes journeys had to stay efficient, recoverable, and consistent.',
    'brokerage.tag1': 'high-stakes UX',
    'brokerage.tag2': 'reusable rules',
    'brokerage.tag3': 'AI entry',
    'brokerage.hoverLead': 'Startup Pace',
    'brokerage.hover': 'The only UX designer in the early stage... NDA',
    'agent.kicker': 'AI Tooling',
    'agent.title': 'AI Design Agent',
    'agent.summary': 'A design-system-aware workflow for extracting tokens, components, and guidelines into editable outputs.',
    'agent.tag1': 'AI tooling',
    'agent.tag2': 'design systems',
    'agent.tag3': 'evaluation',
    'agent.hoverLead': 'Co-creating with Claude Code',
    'agent.hover': 'Improve design workflow efficiency with AI',
    'lab.kicker': 'Lab / Research',
    'lab.title': 'Playground',
    'lab.copy': 'Experiments, side projects, and things I built just to see if I could.',
    'lab.aiSearch': 'AI Search proposal trade-offs',
    'lab.k12': 'K12 multi-device permission flow',
    'lab.patent': 'Multimodal AI interaction patent',
    'lab.archive': 'Earlier work archive',
    'footer.copy': 'crafted with <span class="footer-love-mark" role="img" aria-label="love"></span> &amp; made with AI by Lynn',
    'footer.resume': 'Resume',
    'footer.about': 'About',
    'footer.contact': 'Contact',
    'action.openMap': 'Open case map',
    'action.overview': 'Overview',
    'action.openCase': 'Open case',
    'action.close': 'Close',
    'panel.role': 'Role',
    'panel.quality': 'Quality bar',
    'panel.alipay.kicker': 'Cluster map / Wealth professionalization',
    'panel.alipay.title': 'Shared context before subcases',
    'panel.alipay.context': 'This cluster is about why users do or do not perceive a financial platform as professional. Subcases inherit the same frame: professional perception is comparative, threshold-based, and formed in core decision paths.',
    'panel.alipay.role': 'Research owner + UX contributor',
    'panel.alipay.quality': 'Transparent data, balanced judgment, focused hierarchy',
    'panel.alipay.path1': 'Professionalism research and strategy reframing',
    'panel.alipay.path2': 'Fund AI Insight',
    'panel.alipay.path3': 'Fund AI Comparison',
    'panel.brokerage.kicker': 'Cluster map / Overseas brokerage',
    'panel.brokerage.title': 'Shared system before subcases',
    'panel.brokerage.context': 'This cluster is about complete high-risk financial journeys: explicit state, recoverable exceptions, efficient paths, and reusable interaction patterns.',
    'panel.brokerage.role': 'Interaction owner for key journeys',
    'panel.brokerage.quality': 'Walkable, efficient, recoverable, consistent',
    'panel.brokerage.path1': 'Quick Order / Flash Trading',
    'panel.brokerage.path2': 'IPO Combined Subscription',
    'panel.brokerage.path3': 'AI Homepage',
    'cursor.work': 'Jump to selected works',
    'cursor.about': 'Open working style and resume entry',
    'cursor.hero': 'Inspect the portfolio artifact system',
    'cursor.map': 'Open the cluster map without leaving the homepage',
    'cursor.overview': 'Open the shareable overview route',
    'cursor.openCase': 'Open the single case route',
    'cursor.lab': 'Explore the playground',
    'cursor.resume': 'Open resume route',
  },
  zh: {
    'nav.work': '作品',
    'nav.about': '关于',
    'theme.light': '浅色',
    'theme.dark': '深色',
    'hero.eyebrow': '产品 / 体验设计师\n研究到策略\n复杂系统',
    'hero.meta': '作品集视觉方向预览：活物件、墨迹响应，以及以检查证据为核心的项目表面。',
    'hero.topName': '> Lynn',
    'hero.topRole': '产品 / 体验设计师',
    'hero.topMode': '作品集系统',
    'hero.topModeSub': '研究到策略',
    'hero.topNow': '当前',
    'hero.topNowSub': '构建 2026 年 7 月案例系统',
    'hero.dossierLeftTitle': '产品 / 体验设计师',
    'hero.dossierLeftMeta': '研究到策略 · 模糊问题定义',
    'hero.dossierRightTitle': '案例证据',
    'hero.dossierRightMeta': '金融链路 · AI 工具 · 约束中的判断',
    'hero.title': '<span>UX</span>',
    'hero.secondaryTitle': '<span>产品</span><span>设计师</span>',
    'hero.sub': '这个网站应该像一个被精心制作的产品设计物件：足够有视觉吸引力让人愿意检查，又足够克制让案例阅读保持严肃。',
    'hero.ctaWork': '精选作品',
    'hero.ctaAbout': '关于我',
    'hero.artifact': '这个物件不是装饰。它像被检查的证据一样响应：有层次、安静、可观察。',
    'alipay.kicker': '研究到策略',
    'alipay.title': '支付宝理财专业化专项',
    'alipay.summary': '将模糊的专业感目标转译为用户能在决策路径中感知到的专业证据。',
    'alipay.tag1': '用户研究',
    'alipay.tag2': '问题重构',
    'alipay.tag3': '金融 AI 边界',
    'alipay.hoverLead': '用户研究',
    'alipay.hover': '项目将于 2026 年秋季上线。',
    'brokerage.kicker': '复杂金融系统',
    'brokerage.title': '境外券商交易平台',
    'brokerage.summary': '一个 0→1 境外券商产品问题域，需要让高风险链路保持高效、可恢复、且规则一致。',
    'brokerage.tag1': '高风险体验',
    'brokerage.tag2': '可复用规则',
    'brokerage.tag3': 'AI 入口',
    'brokerage.hoverLead': '创业节奏',
    'brokerage.hover': '早期阶段唯一的 UX 设计师……受 NDA 约束',
    'agent.kicker': 'AI 工具',
    'agent.title': 'AI 设计智能体',
    'agent.summary': '一个能感知设计系统的工作流，用于抽取设计变量、组件和规范，并生成可编辑产物。',
    'agent.tag1': 'AI 工具',
    'agent.tag2': '设计系统',
    'agent.tag3': '评估标准',
    'agent.hoverLead': '与 Claude Code 共创',
    'agent.hover': '借助 AI 提升设计工作流效率',
    'lab.kicker': '实验 / 研究',
    'lab.title': '实验场',
    'lab.copy': '实验、支线项目，以及那些只为看看自己能否做到而做出的东西。',
    'lab.aiSearch': 'AI 搜索方案取舍',
    'lab.k12': 'K12 多端权限流程',
    'lab.patent': '多模态 AI 交互专利',
    'lab.archive': '早期作品归档',
    'footer.copy': 'crafted with <span class="footer-love-mark" role="img" aria-label="love"></span> &amp; made with AI by Lynn',
    'footer.resume': '简历',
    'footer.about': '关于',
    'footer.contact': '联系',
    'action.openMap': '展开案例地图',
    'action.overview': '总览',
    'action.openCase': '打开案例',
    'action.close': '关闭',
    'panel.role': '角色',
    'panel.quality': '质量标准',
    'panel.alipay.kicker': '案例地图 / 理财专业化',
    'panel.alipay.title': '子案例之前的共用语境',
    'panel.alipay.context': '这个项目组讨论用户为什么会或不会感知金融平台专业。子案例共享同一个框架：专业感是比较出来的，有准入门槛，并且在核心决策路径中形成。',
    'panel.alipay.role': '用户研究负责人 + UX 参与者',
    'panel.alipay.quality': '数据透明、判断平衡、层级聚焦',
    'panel.alipay.path1': '专业感研究与策略重构',
    'panel.alipay.path2': '基金 AI 透视',
    'panel.alipay.path3': '基金 AI 对比',
    'panel.brokerage.kicker': '案例地图 / 境外券商',
    'panel.brokerage.title': '子案例之前的共用系统',
    'panel.brokerage.context': '这个项目组讨论完整的高风险金融链路：明确状态、异常可兜底、高效路径，以及可复用的交互范式。',
    'panel.brokerage.role': '关键链路交互负责人',
    'panel.brokerage.quality': '走得通、用得易、回得来、规则一致',
    'panel.brokerage.path1': '闪电下单 / 快速交易',
    'panel.brokerage.path2': 'IPO 组合打新',
    'panel.brokerage.path3': 'AI 首页',
    'cursor.work': '跳到精选作品',
    'cursor.about': '打开工作方式与简历入口',
    'cursor.hero': '检查作品集物件系统',
    'cursor.map': '不离开首页，展开案例地图',
    'cursor.overview': '打开可分享的总览路径',
    'cursor.openCase': '打开单案例路径',
    'cursor.lab': '打开短项目探索',
    'cursor.resume': '打开简历入口',
  }
};

const clusters = {
  alipay: {
    accent: 'var(--accent)',
    keys: {
      kicker: 'panel.alipay.kicker',
      title: 'panel.alipay.title',
      context: 'panel.alipay.context',
      role: 'panel.alipay.role',
      quality: 'panel.alipay.quality',
      paths: ['panel.alipay.path1', 'panel.alipay.path2', 'panel.alipay.path3']
    },
    routes: [
      '/work/alipay-wealth-professionalization/research-strategy/',
      '/work/alipay-wealth-professionalization/fund-ai-insight/',
      '/work/alipay-wealth-professionalization/fund-ai-comparison/'
    ]
  },
  brokerage: {
    accent: 'var(--blue)',
    keys: {
      kicker: 'panel.brokerage.kicker',
      title: 'panel.brokerage.title',
      context: 'panel.brokerage.context',
      role: 'panel.brokerage.role',
      quality: 'panel.brokerage.quality',
      paths: ['panel.brokerage.path1', 'panel.brokerage.path2', 'panel.brokerage.path3']
    },
    routes: [
      '/work/overseas-brokerage/quick-order/',
      '/work/overseas-brokerage/ipo-combined-subscription/',
      '/work/overseas-brokerage/ai-homepage/'
    ]
  }
};

let activeCluster = null;
let refreshWorkShowcase = () => {};

function dict() {
  return i18n[root.dataset.lang || 'en'];
}

function text(key) {
  return dict()[key] || key;
}

function translate() {
  const lang = root.dataset.lang || 'en';
  root.lang = lang === 'zh' ? 'zh-CN' : 'en';
  document.querySelectorAll('[data-i18n]').forEach((node) => {
    node.textContent = text(node.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-html]').forEach((node) => {
    node.innerHTML = text(node.dataset.i18nHtml);
  });
  const langToggle = document.querySelector('[data-lang-toggle]');
  const langLabel = document.querySelector('[data-lang-label]');
  if (langToggle) {
    langToggle.setAttribute('aria-pressed', String(lang === 'zh'));
    langToggle.setAttribute('aria-label', lang === 'zh' ? 'Switch to English' : 'Switch to Chinese');
  }
  if (langLabel) langLabel.textContent = lang === 'zh' ? '中' : 'EN';
  if (activeCluster) renderCluster(activeCluster);
  refreshWorkShowcase();
}

function setTheme(theme) {
  root.dataset.theme = theme;
  const themeToggle = document.querySelector('[data-theme-toggle]');
  if (themeToggle) {
    themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
    themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }
  window.dispatchEvent(new CustomEvent('portfolio-theme-change'));
}

function renderCluster(key) {
  const cluster = clusters[key];
  if (!cluster) return;
  panel.style.setProperty('--panel-accent', cluster.accent);
  panelKicker.textContent = text(cluster.keys.kicker);
  panelTitle.textContent = text(cluster.keys.title);
  panelContext.textContent = text(cluster.keys.context);
  panelFacts.innerHTML = `
    <span>${text('panel.role')} · ${text(cluster.keys.role)}</span>
    <span>${text('panel.quality')} · ${text(cluster.keys.quality)}</span>
  `;
  panelPaths.innerHTML = cluster.keys.paths.map((pathKey, index) => (
    `<a class="path" href="${cluster.routes[index]}" data-cursor-label-key="cursor.overview">
      <strong>${text(pathKey)}</strong>
      <span>${cluster.routes[index]}</span>
    </a>`
  )).join('');
}

function openCluster(key) {
  activeCluster = key;
  renderCluster(key);
  layer.classList.add('is-open');
  layer.setAttribute('aria-hidden', 'false');
  closeButton.focus();
}

function closeLayer() {
  layer.classList.remove('is-open');
  layer.setAttribute('aria-hidden', 'true');
}

function setupCaseLinks() {
  document.querySelectorAll('[data-case-href]').forEach((panel) => {
    const href = panel.dataset.caseHref;
    if (!href) return;
    panel.setAttribute('role', 'link');
    panel.setAttribute('tabindex', '0');

    panel.addEventListener('click', (event) => {
      if (event.target.closest('a, button')) return;
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      window.location.href = href;
    });

    panel.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      if (event.target.closest('a, button')) return;
      event.preventDefault();
      window.location.href = href;
    });
  });
}

function setupPointerVars() {
  document.addEventListener('pointermove', (event) => {
    const x = event.clientX / Math.max(1, window.innerWidth);
    const y = event.clientY / Math.max(1, window.innerHeight);
    root.style.setProperty('--page-x', `${event.clientX}px`);
    root.style.setProperty('--page-y', `${event.clientY}px`);
    root.style.setProperty('--mx', (x - .5).toFixed(4));
    root.style.setProperty('--my', (y - .5).toFixed(4));
  }, { passive: true });
}

function setupCursor() {
  if (reduceMotion || !cursor || !cursorLabel) return;
  const cursorMode = window.matchMedia('(min-width: 761px) and (hover: hover) and (pointer: fine)');
  const cursorShape = cursor.querySelector('.cursor__shape');
  const measurementContext = document.createElement('canvas').getContext('2d');
  if (measurementContext) {
    const labelStyle = window.getComputedStyle(cursorLabel);
    measurementContext.font = labelStyle.font || `${labelStyle.fontSize} ${labelStyle.fontFamily}`;
  }
  let x = -100;
  let y = -100;
  let cx = x;
  let cy = y;
  let down = false;

  function resetCursorState() {
    down = false;
    cursor.classList.remove('is-active', 'is-label', 'is-soft', 'is-down');
  }

  function syncCursorMode() {
    document.body.classList.toggle('cursor-on', cursorMode.matches);
    if (!cursorMode.matches) resetCursorState();
  }

  syncCursorMode();
  cursorMode.addEventListener('change', syncCursorMode);

  function setTarget(event) {
    if (!cursorMode.matches) return;
    const target = event.target.closest('[data-cursor-label-key], [data-cursor-soft], a, button');
    cursor.classList.toggle('is-active', true);
    cursor.classList.toggle('is-down', down);
    cursor.classList.remove('is-label', 'is-soft');

    if (!target) return;
    const key = target.dataset.cursorLabelKey;
    if (key) {
      const label = text(key);
      cursorLabel.textContent = label;
      const measuredWidth = measurementContext?.measureText(label).width || label.length * 8.2;
      const width = Math.max(96, Math.min(window.innerWidth - 24, Math.ceil(measuredWidth + 26)));
      cursor.style.setProperty('--label-width', `${width}px`);
      cursor.classList.add('is-label');
    } else {
      cursor.classList.add('is-soft');
    }
  }

  document.addEventListener('pointermove', (event) => {
    x = event.clientX;
    y = event.clientY;
    setTarget(event);
  }, { passive: true });
  document.addEventListener('pointerleave', () => cursor.classList.remove('is-active'));
  document.addEventListener('pointerdown', () => {
    if (!cursorMode.matches) return;
    down = true;
    cursor.classList.add('is-down');
  }, { passive: true });
  document.addEventListener('pointerup', () => {
    down = false;
    cursor.classList.remove('is-down');
  }, { passive: true });

  function tick() {
    cx += (x - cx) * .22;
    cy += (y - cy) * .22;
    let renderedX = cx;
    let renderedY = cy;
    if (cursor.classList.contains('is-label') && cursorShape) {
      const shapeWidth = cursorShape.offsetWidth;
      const shapeHeight = cursorShape.offsetHeight;
      renderedX = Math.min(Math.max(12, cx), Math.max(12, window.innerWidth - shapeWidth - 12));
      renderedY = Math.min(Math.max(12, cy), Math.max(12, window.innerHeight - shapeHeight - 12));
    }
    cursor.style.transform = `translate3d(${renderedX}px, ${renderedY}px, 0)`;
    requestAnimationFrame(tick);
  }

  tick();
}

function setupWorkColorReveal() {
  if (!finePointer) return Promise.resolve();
  const stages = Array.from(document.querySelectorAll('.work-stage'))
    .filter((stage) => stage.querySelector('.work-media--color'));
  if (!stages.length) return Promise.resolve();

  const alphaMasks = new Map();
  const alphaLoads = new Map();
  const stageStates = new WeakMap();
  const edgeBand = .06432039;
  const edgePair = .12864078;
  const bottomStart = .87135922;
  const bottomSplit = .93567961;
  const coverColumns = {
    alipay: {
      bottomTop: new Set([0, 3, 9, 12, 13, 18]),
      bottomBottom: new Set([1, 2, 3, 6, 7, 8, 10, 14, 16, 17])
    },
    brokerage: {
      bottomTop: new Set([0, 3, 8, 9, 13, 17]),
      bottomBottom: new Set([1, 3, 4, 6, 7, 8, 12, 14, 15, 18])
    },
    agent: {
      topTop: new Set([0, 2, 3, 5, 6, 10, 11, 13, 16, 18]),
      topBottom: new Set([1, 8, 17]),
      bottomTop: new Set([1, 3, 8, 13, 14, 15]),
      bottomBottom: new Set([0, 1, 4, 5, 7, 8, 9, 12, 13, 14, 17, 18])
    }
  };
  const supplementalHitRegions = {
    brokerage: [
      { left: .065, top: .021, right: .411, bottom: .096 },
      { left: .608, top: .03, right: .913, bottom: .088 }
    ]
  };

  function activeComposite(stage) {
    return stage.querySelector('[data-work-image].is-active')
      || stage.querySelector('.work-composite');
  }

  function projectKey(composite) {
    if (composite.classList.contains('work-composite--alipay')) return 'alipay';
    if (composite.classList.contains('work-composite--brokerage')) return 'brokerage';
    if (composite.classList.contains('work-composite--agent')) return 'agent';
    return '';
  }

  function hitsSupplementalRegion(composite, foregroundNx, foregroundNy) {
    const regions = supplementalHitRegions[projectKey(composite)];
    return Boolean(regions?.some((region) => (
      foregroundNx >= region.left && foregroundNx <= region.right
      && foregroundNy >= region.top && foregroundNy <= region.bottom
    )));
  }

  function isCoveredByWhiteBlock(composite, nx, ny) {
    const key = projectKey(composite);
    const pattern = coverColumns[key];
    if (!pattern) return false;
    const col = Math.min(18, Math.max(0, Math.floor(Math.min(.999999, Math.max(0, nx)) * 19)));

    if (key === 'agent' && ny < edgePair) {
      return (ny < edgeBand ? pattern.topTop : pattern.topBottom).has(col);
    }
    if (ny < bottomStart) return false;
    return (ny < bottomSplit ? pattern.bottomTop : pattern.bottomBottom).has(col);
  }

  function hitsAnimatedCutout(stage, clientX, clientY) {
    if (!stage.classList.contains('is-morph-ready')) return false;
    return Array.from(stage.querySelectorAll('[data-work-morph-block]')).some((block) => {
      if (Number.parseFloat(block.style.opacity || '0') < .08) return false;
      const rect = block.getBoundingClientRect();
      return clientX >= rect.left
        && clientX < rect.right
        && clientY >= rect.top
        && clientY < rect.bottom;
    });
  }

  function imageSource(image) {
    const source = image.currentSrc || image.getAttribute('src') || '';
    if (!source) return '';
    try {
      return new URL(source, document.baseURI).href;
    } catch {
      return source;
    }
  }

  async function createAlphaMask(source) {
    const image = new Image();
    image.decoding = 'async';
    image.src = source;
    try {
      await image.decode();
    } catch {
      await new Promise((resolve, reject) => {
        if (image.complete) {
          if (image.naturalWidth) resolve();
          else reject(new Error('Foreground image failed to load'));
          return;
        }
        image.addEventListener('load', resolve, { once: true });
        image.addEventListener('error', reject, { once: true });
      });
    }

    if (!image.naturalWidth || !image.naturalHeight) throw new Error('Foreground image has no dimensions');
    const scale = Math.min(1, 512 / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Canvas is unavailable');
    context.drawImage(image, 0, 0, width, height);
    const rgba = context.getImageData(0, 0, width, height).data;
    const alpha = new Uint8Array(width * height);
    for (let index = 0, channel = 3; index < alpha.length; index += 1, channel += 4) {
      alpha[index] = rgba[channel];
    }
    return { width, height, alpha };
  }

  function requestStageUpdate(stage) {
    const state = stageStates.get(stage);
    if (!state || state.raf) return;
    state.raf = requestAnimationFrame(() => updateStage(stage, state));
  }

  function primeAlphaMask(image) {
    const source = imageSource(image);
    if (!source || alphaMasks.has(source) || alphaLoads.has(source)) return source;
    const load = createAlphaMask(source);
    alphaLoads.set(source, load);
    load.then(
      (mask) => alphaMasks.set(source, mask),
      () => alphaMasks.set(source, null)
    ).finally(() => {
      alphaLoads.delete(source);
      stages.forEach((stage) => {
        if (stageStates.get(stage)?.pointer) requestStageUpdate(stage);
      });
    });
    return source;
  }

  function hitsForeground(image, clientX, clientY) {
    const rect = image.getBoundingClientRect();
    if (!rect.width || !rect.height
      || clientX < rect.left || clientX >= rect.right
      || clientY < rect.top || clientY >= rect.bottom) return false;

    const source = primeAlphaMask(image);
    if (!source) return true;
    if (!alphaMasks.has(source)) return false;
    const mask = alphaMasks.get(source);
    if (!mask) return true;

    const nx = (clientX - rect.left) / rect.width;
    const ny = (clientY - rect.top) / rect.height;
    const centerX = Math.min(mask.width - 1, Math.max(0, Math.floor(nx * mask.width)));
    const centerY = Math.min(mask.height - 1, Math.max(0, Math.floor(ny * mask.height)));
    const sampleRadius = Math.max(1, Math.min(6, Math.ceil((4 / rect.width) * mask.width)));

    for (let y = Math.max(0, centerY - sampleRadius); y <= Math.min(mask.height - 1, centerY + sampleRadius); y += 1) {
      const row = y * mask.width;
      for (let x = Math.max(0, centerX - sampleRadius); x <= Math.min(mask.width - 1, centerX + sampleRadius); x += 1) {
        if (mask.alpha[row + x] >= 24) return true;
      }
    }
    return false;
  }

  function clearStage(stage) {
    stage.querySelectorAll('.work-composite.is-color-revealing').forEach((composite) => {
      composite.classList.remove('is-color-revealing');
    });
  }

  function updateStage(stage, state) {
    state.raf = 0;
    const pointer = state.pointer;
    const composite = activeComposite(stage);
    if (!pointer || !composite) {
      clearStage(stage);
      return;
    }

    stage.querySelectorAll('.work-composite').forEach((item) => {
      if (item !== composite) item.classList.remove('is-color-revealing');
    });

    const rect = composite.getBoundingClientRect();
    if (!rect.width || !rect.height
      || pointer.x < rect.left || pointer.x >= rect.right
      || pointer.y < rect.top || pointer.y >= rect.bottom) {
      composite.classList.remove('is-color-revealing');
      return;
    }

    const nx = (pointer.x - rect.left) / rect.width;
    const ny = (pointer.y - rect.top) / rect.height;
    const foreground = composite.querySelector('.work-media--foreground');
    const usesAnimatedCutouts = stage.classList.contains('is-morph-ready');
    if (!foreground
      || (usesAnimatedCutouts && hitsAnimatedCutout(stage, pointer.x, pointer.y))
      || (!usesAnimatedCutouts && isCoveredByWhiteBlock(composite, nx, ny))) {
      composite.classList.remove('is-color-revealing');
      return;
    }
    const foregroundRect = foreground.getBoundingClientRect();
    const foregroundNx = (pointer.x - foregroundRect.left) / foregroundRect.width;
    const foregroundNy = (pointer.y - foregroundRect.top) / foregroundRect.height;
    if (!hitsForeground(foreground, pointer.x, pointer.y)
      && !hitsSupplementalRegion(composite, foregroundNx, foregroundNy)) {
      composite.classList.remove('is-color-revealing');
      return;
    }

    const radius = Math.max(64, Math.min(104, rect.width * .22));
    composite.style.setProperty('--reveal-x', `${(nx * 100).toFixed(3)}%`);
    composite.style.setProperty('--reveal-y', `${(ny * 100).toFixed(3)}%`);
    composite.style.setProperty('--reveal-radius', `${radius.toFixed(1)}px`);
    if (foregroundRect.width && foregroundRect.height) {
      const clampedForegroundNx = Math.min(1, Math.max(0, foregroundNx));
      const clampedForegroundNy = Math.min(1, Math.max(0, foregroundNy));
      composite.style.setProperty('--foreground-reveal-x', `${(clampedForegroundNx * 100).toFixed(3)}%`);
      composite.style.setProperty('--foreground-reveal-y', `${(clampedForegroundNy * 100).toFixed(3)}%`);
    }
    composite.classList.add('is-color-revealing');
  }

  stages.forEach((stage) => {
    const state = { pointer: null, raf: 0 };
    stageStates.set(stage, state);
    stage.addEventListener('pointermove', (event) => {
      state.pointer = { x: event.clientX, y: event.clientY };
      requestStageUpdate(stage);
    }, { passive: true });
    const clear = () => {
      state.pointer = null;
      if (state.raf) cancelAnimationFrame(state.raf);
      state.raf = 0;
      clearStage(stage);
    };
    stage.addEventListener('pointerleave', clear);
    stage.addEventListener('pointercancel', clear);
  });

  const initialMaskLoads = new Set();
  document.querySelectorAll('.work-media--foreground').forEach((image) => {
    const source = primeAlphaMask(image);
    const load = source ? alphaLoads.get(source) : null;
    if (load) initialMaskLoads.add(load);
  });
  const clearAll = () => {
    stages.forEach((stage) => {
      const state = stageStates.get(stage);
      if (state) {
        state.pointer = null;
        if (state.raf) cancelAnimationFrame(state.raf);
        state.raf = 0;
      }
      clearStage(stage);
    });
  };
  window.addEventListener('scroll', clearAll, { passive: true });
  window.addEventListener('resize', clearAll);
  return Promise.all(Array.from(initialMaskLoads, (load) => load.catch(() => undefined)));
}

function setupParallax() {
  const items = Array.from(document.querySelectorAll('[data-parallax]'));
  const scenes = Array.from(document.querySelectorAll('.work-panel, .lab-strip, .site-footer'));
  if (reduceMotion) return;
  function update() {
    const viewport = window.innerHeight || 1;
    let currentScene = null;
    let closestSceneDistance = Infinity;
    root.style.setProperty('--scroll-y', `${window.scrollY}px`);
    items.forEach((item) => {
      const rect = item.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const progress = (center - viewport / 2) / viewport;
      const depth = Number.parseFloat(item.dataset.depth || '');
      if (Number.isFinite(depth)) item.style.setProperty('--depth', `${depth}px`);
      item.style.setProperty('--parallax', Math.max(-1.35, Math.min(1.35, progress)).toFixed(4));
    });
    scenes.forEach((scene) => {
      const rect = scene.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const progress = (center - viewport / 2) / viewport;
      const distance = Math.abs(center - viewport / 2);
      scene.style.setProperty('--scene-parallax', Math.max(-1.35, Math.min(1.35, progress)).toFixed(4));
      if (rect.bottom > viewport * .12 && rect.top < viewport * .88 && distance < closestSceneDistance) {
        currentScene = scene;
        closestSceneDistance = distance;
      }
    });
    scenes.forEach((scene) => {
      scene.classList.toggle('is-current', scene === currentScene);
    });
    requestAnimationFrame(update);
  }
  update();
}

function setupWorkShowcase() {
  const showcase = document.querySelector('[data-work-showcase]');
  const stage = showcase?.querySelector('[data-work-stage]');
  const panels = Array.from(showcase?.querySelectorAll('[data-work-project]') || []);
  const images = Array.from(stage?.querySelectorAll('[data-work-image]') || []);
  if (!showcase || !stage || !panels.length || images.length !== panels.length) return;

  const desktopLayout = window.matchMedia('(min-width: 1025px)');
  let activeIndex = -1;
  let updateFrame = 0;
  let measuredHalf = 0;
  const cellWidth = 100 / 19;
  const edgeRowHeight = 12.864078 / 2;
  const morphRows = {
    topTop: 0,
    topBottom: edgeRowHeight,
    bottomTop: 100 - edgeRowHeight * 2,
    bottomBottom: 100 - edgeRowHeight
  };
  const morphCells = (row, columns) => columns.map((column) => ({
    key: `${row}:${column}`,
    x: column * cellWidth,
    y: morphRows[row]
  }));
  const alipayCells = [
    ...morphCells('bottomTop', [0, 3, 9, 12, 13, 18]),
    ...morphCells('bottomBottom', [1, 2, 3, 6, 7, 8, 10, 14, 16, 17])
  ];
  const brokerageCells = [
    ...morphCells('bottomTop', [0, 3, 8, 9, 13, 17]),
    ...morphCells('bottomBottom', [1, 3, 4, 6, 7, 8, 12, 14, 15, 18])
  ];
  const agentCells = [
    ...morphCells('topTop', [0, 2, 3, 5, 6, 10, 11, 13, 16, 18]),
    ...morphCells('topBottom', [1, 8, 17]),
    ...morphCells('bottomTop', [1, 3, 8, 13, 14, 15]),
    ...morphCells('bottomBottom', [0, 1, 4, 5, 7, 8, 9, 12, 13, 14, 17, 18])
  ];
  const morphStates = [
    brokerageCells,
    alipayCells,
    agentCells
  ];
  const morphStateKeys = morphStates.map((state) => new Set(state.map((cell) => cell.key)));
  const morphDefinitions = new Map();
  morphStates.flat().forEach((cell) => morphDefinitions.set(cell.key, cell));
  const morphBackdrop = document.createElement('div');
  const morphMask = document.createElement('div');
  const morphFragment = document.createDocumentFragment();
  const morphBlocks = Array.from(morphDefinitions.values()).map((cell) => {
    const block = document.createElement('span');
    block.className = 'work-morph-block';
    block.dataset.workMorphBlock = cell.key;
    block.style.left = `${cell.x.toFixed(4)}%`;
    block.style.top = `${cell.y.toFixed(4)}%`;
    morphFragment.append(block);
    return block;
  });
  morphBackdrop.className = 'work-morph-backdrop';
  morphBackdrop.setAttribute('aria-hidden', 'true');
  morphMask.className = 'work-morph-mask';
  morphMask.setAttribute('aria-hidden', 'true');
  morphMask.append(morphFragment);
  stage.prepend(morphBackdrop);
  stage.append(morphMask);

  const clamp01 = (value) => Math.max(0, Math.min(1, value));
  const smoothstep = (value) => {
    const clamped = clamp01(value);
    return clamped * clamped * (3 - 2 * clamped);
  };
  const renderMorph = (position) => {
    const clampedPosition = Math.max(0, Math.min(morphStates.length - 1, position));
    const fromIndex = Math.floor(clampedPosition);
    const toIndex = Math.min(morphStates.length - 1, fromIndex + 1);
    const progress = reduceMotion ? Math.round(clampedPosition - fromIndex) : smoothstep(clampedPosition - fromIndex);

    morphBlocks.forEach((block) => {
      const key = block.dataset.workMorphBlock;
      const fromOpacity = morphStateKeys[fromIndex].has(key) ? 1 : 0;
      const toOpacity = morphStateKeys[toIndex].has(key) ? 1 : 0;
      const opacity = fromOpacity + (toOpacity - fromOpacity) * progress;
      block.style.opacity = opacity.toFixed(4);
    });
    stage.style.setProperty('--work-morph-position', clampedPosition.toFixed(4));
  };

  renderMorph(0);
  stage.classList.add('is-morph-ready');

  const syncStageMetrics = () => {
    if (!desktopLayout.matches) return;
    const nextHalf = stage.offsetHeight / 2;
    if (!nextHalf || Math.abs(nextHalf - measuredHalf) < .5) return;
    measuredHalf = nextHalf;
    stage.style.setProperty('--work-stage-half', `${nextHalf}px`);
  };

  const setActiveProject = (nextIndex) => {
    if (nextIndex === activeIndex) return;
    activeIndex = nextIndex;
    const panel = panels[nextIndex];
    const href = panel.dataset.caseHref;
    const cursorKey = panel.querySelector('.work-stage')?.dataset.cursorLabelKey;
    const title = panel.querySelector('h3')?.textContent?.replace(/\s+/g, ' ').trim();

    stage.dataset.activeIndex = String(nextIndex);
    if (href) stage.setAttribute('href', href);
    if (cursorKey) stage.dataset.cursorLabelKey = cursorKey;
    stage.setAttribute('aria-label', title ? `${text('action.openCase')}: ${title}` : text('action.openCase'));

    panels.forEach((item, index) => {
      item.classList.toggle('is-active-project', index === nextIndex);
    });
    images.forEach((image, index) => {
      const isActive = index === nextIndex;
      image.classList.toggle('is-active', isActive);
      image.setAttribute('aria-hidden', String(!isActive));
    });
  };

  const transitionLineForIndex = (index) => {
    const previousCopy = panels[index - 1]?.querySelector('.work-copy');
    const currentCopy = panels[index]?.querySelector('.work-copy');
    if (!previousCopy || !currentCopy) return null;

    const previousRect = previousCopy.getBoundingClientRect();
    const currentRect = currentCopy.getBoundingClientRect();
    const previousCenter = previousRect.top + previousRect.height / 2;
    const currentCenter = currentRect.top + currentRect.height / 2;
    return (previousCenter + currentCenter) / 2;
  };

  const morphPositionAtScroll = (activationLine) => {
    const viewport = window.innerHeight || 1;
    const currentScroll = window.scrollY;
    const transitionSpan = Math.max(180, Math.min(320, viewport * .32));
    let position = 0;

    for (let index = 1; index < panels.length; index += 1) {
      const transitionLine = transitionLineForIndex(index);
      if (transitionLine === null) continue;
      const threshold = currentScroll + transitionLine - activationLine;
      const start = threshold - transitionSpan / 2;
      const end = threshold + transitionSpan / 2;

      if (currentScroll >= end) {
        position = index;
        continue;
      }
      if (currentScroll > start) {
        position = index - 1 + (currentScroll - start) / transitionSpan;
      }
      break;
    }

    return position;
  };

  const update = () => {
    updateFrame = 0;
    if (!desktopLayout.matches) return;
    syncStageMetrics();

    const activationLine = (window.innerHeight || 1) / 2;
    let nextIndex = 0;
    for (let index = 1; index < panels.length; index += 1) {
      const transitionLine = transitionLineForIndex(index);
      if (transitionLine !== null && transitionLine <= activationLine) nextIndex = index;
    }
    setActiveProject(nextIndex);
    renderMorph(reduceMotion ? nextIndex : morphPositionAtScroll(activationLine));
  };

  const requestUpdate = () => {
    if (updateFrame) return;
    updateFrame = requestAnimationFrame(update);
  };

  refreshWorkShowcase = requestUpdate;
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  desktopLayout.addEventListener?.('change', requestUpdate);

  if ('ResizeObserver' in window) {
    const stageObserver = new ResizeObserver(requestUpdate);
    stageObserver.observe(stage);
  }

  requestUpdate();
}

function setupScrollReveal() {
  if (reduceMotion) return;
  const revealItems = Array.from(document.querySelectorAll('.work-panel, .lab-strip, .site-footer'));
  if (!revealItems.length) return;
  document.body.classList.add('motion-ready');

  if (!('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting || entry.intersectionRatio > .18) {
        entry.target.classList.add('is-visible');
      }
    });
  }, {
    root: null,
    rootMargin: '-8% 0px -12% 0px',
    threshold: [0, .18, .34]
  });

  revealItems.forEach((item) => observer.observe(item));

  const footer = document.querySelector('.site-footer');
  const checkFooter = () => {
    if (!footer || footer.classList.contains('is-visible')) return;
    const rect = footer.getBoundingClientRect();
    if (rect.top < (window.innerHeight || 1) * 1.12) {
      footer.classList.add('is-visible');
    }
  };
  window.addEventListener('scroll', checkFooter, { passive: true });
  window.addEventListener('resize', checkFooter);
  checkFooter();
}

function setupPlaygroundGridFill() {
  const section = document.querySelector('.lab-strip');
  const layer = section?.querySelector('.playground-grid-fill');
  const cells = Array.from(layer?.querySelectorAll('span') || []);
  if (!section || !layer || !cells.length) return;

  const positions = cells.map((cell) => ({
    x: parseFloat(cell.style.getPropertyValue('--cell-x')) / 100,
    y: parseFloat(cell.style.getPropertyValue('--cell-y')) / 100
  }));
  const gridSize = parseFloat(getComputedStyle(root).getPropertyValue('--ambient-grid-size')) || 18;
  const fadeDuration = 180;
  const settleDuration = 90;
  const states = cells.map(() => ({
    currentX: null,
    currentY: null,
    targetX: null,
    targetY: null,
    phase: 'visible',
    revision: 0,
    timer: 0
  }));
  let latestSectionRect = section.getBoundingClientRect();
  let alignmentFrame = 0;

  const isSameCell = (x1, y1, x2, y2) => (
    Number.isFinite(x1)
    && Number.isFinite(y1)
    && Math.abs(x1 - x2) < .01
    && Math.abs(y1 - y2) < .01
  );

  const renderCell = (cell, state) => {
    cell.style.setProperty('--cell-left', `${state.currentX - latestSectionRect.left}px`);
    cell.style.setProperty('--cell-top', `${state.currentY - latestSectionRect.top}px`);
  };

  const queueMove = (cell, state, targetX, targetY) => {
    state.targetX = targetX;
    state.targetY = targetY;

    if (!Number.isFinite(state.currentX) || !Number.isFinite(state.currentY) || reduceMotion) {
      state.currentX = targetX;
      state.currentY = targetY;
      state.phase = 'visible';
      state.revision += 1;
      window.clearTimeout(state.timer);
      cell.classList.remove('is-fading');
      renderCell(cell, state);
      return;
    }

    if (isSameCell(state.currentX, state.currentY, targetX, targetY)) {
      if (state.phase === 'visible' || state.phase === 'fading-in' || state.phase === 'hidden') return;

      const revealRevision = ++state.revision;
      window.clearTimeout(state.timer);
      state.phase = 'fading-in';
      cell.classList.remove('is-fading');
      state.timer = window.setTimeout(() => {
        if (revealRevision !== state.revision) return;
        state.phase = 'visible';
      }, fadeDuration);
      return;
    }

    state.phase = 'fading-out';
    cell.classList.add('is-fading');
    const moveRevision = ++state.revision;
    window.clearTimeout(state.timer);
    state.timer = window.setTimeout(() => {
      if (moveRevision !== state.revision) return;
      state.phase = 'hidden';
      state.currentX = state.targetX;
      state.currentY = state.targetY;
      latestSectionRect = section.getBoundingClientRect();
      renderCell(cell, state);

      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (moveRevision !== state.revision) return;
        state.phase = 'fading-in';
        cell.classList.remove('is-fading');
        state.timer = window.setTimeout(() => {
          if (moveRevision !== state.revision) return;
          state.phase = 'visible';
          if (!isSameCell(state.currentX, state.currentY, state.targetX, state.targetY)) {
            queueMove(cell, state, state.targetX, state.targetY);
          }
        }, fadeDuration);
      }));
    }, fadeDuration + settleDuration);
  };

  const alignCells = () => {
    alignmentFrame = 0;
    latestSectionRect = section.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
    const viewportHeight = document.documentElement.clientHeight || window.innerHeight;
    if (latestSectionRect.bottom < -gridSize || latestSectionRect.top > viewportHeight + gridSize) return;
    const firstCellX = viewportWidth / 2 - gridSize / 2 + 1;
    const firstCellY = 1;

    cells.forEach((cell, index) => {
      const position = positions[index];
      const state = states[index];
      if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) return;

      const desiredX = latestSectionRect.left + latestSectionRect.width * position.x;
      const desiredY = latestSectionRect.top + latestSectionRect.height * position.y;
      const snappedX = firstCellX + Math.round((desiredX - firstCellX) / gridSize) * gridSize;
      const snappedY = firstCellY + Math.round((desiredY - firstCellY) / gridSize) * gridSize;

      if (Number.isFinite(state.currentX) && Number.isFinite(state.currentY)) renderCell(cell, state);
      queueMove(cell, state, snappedX, snappedY);
    });

    layer.setAttribute('data-grid-aligned', '');
  };

  const requestAlignment = () => {
    if (alignmentFrame) return;
    alignmentFrame = requestAnimationFrame(alignCells);
  };

  window.addEventListener('scroll', requestAlignment, { passive: true });
  window.addEventListener('resize', requestAlignment, { passive: true });
  window.addEventListener('pageshow', requestAlignment);
  window.visualViewport?.addEventListener('scroll', requestAlignment, { passive: true });
  window.visualViewport?.addEventListener('resize', requestAlignment, { passive: true });

  if ('ResizeObserver' in window) {
    const sectionObserver = new ResizeObserver(requestAlignment);
    sectionObserver.observe(section);
  }

  requestAlignment();
}

function setupHeroPortrait() {
  const canvas = document.getElementById('hero-portrait-canvas');
  if (!canvas) return Promise.resolve();
  const hero = canvas.closest('.hero');
  const ctx = canvas.getContext('2d');
  const image = new Image();
  const sourceCanvas = document.createElement('canvas');
  const sourceCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx || !sourceCtx) return Promise.resolve();
  let width = 0;
  let height = 0;
  let dpr = 1;
  let viewportWidth = 0;
  let viewportHeight = 0;
  let frame = 0;
  let sourceData = null;
  let raf = 0;
  let frameTimer = 0;
  let resizeFrame = 0;
  let resizeSettleTimer = 0;
  let portraitResizeObserver = null;
  const portraitOpticalAnchorX = .485;
  let projectionScale = 1.2;
  let projectionAnchorX = portraitOpticalAnchorX;
  let projectionAnchorY = .46;
  let visibleField = { left: 0, top: 0, right: 0, bottom: 0 };
  let resolveInitialPortrait;
  let hasHandledInitialImage = false;
  const initialPortraitReady = new Promise((resolve) => {
    resolveInitialPortrait = resolve;
  });
  const portraitPointer = {
    x: 0,
    y: 0,
    tx: 0,
    ty: 0,
    vx: 0,
    vy: 0,
    force: 0,
    target: 0
  };

  function resizePortrait(force = false) {
    const sizingElement = canvas.parentElement || canvas;
    const rect = sizingElement.getBoundingClientRect();
    const nextDpr = Math.min(window.devicePixelRatio || 1, 2);
    const nextWidth = Math.max(1, Math.floor(rect.width));
    const nextHeight = Math.max(1, Math.floor(rect.height));
    const nextViewportWidth = Math.max(
      1,
      Math.floor(document.documentElement.clientWidth || window.innerWidth || nextWidth)
    );
    const nextViewportHeight = Math.max(
      1,
      Math.floor(window.innerHeight || document.documentElement.clientHeight || nextHeight)
    );
    const bitmapChanged = force
      || nextWidth !== width
      || nextHeight !== height
      || nextDpr !== dpr;
    const projectionChanged = force
      || nextViewportWidth !== viewportWidth
      || nextViewportHeight !== viewportHeight;

    width = nextWidth;
    height = nextHeight;
    dpr = nextDpr;
    viewportWidth = nextViewportWidth;
    viewportHeight = nextViewportHeight;

    if (bitmapChanged) {
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      prepareSource();
    }
    updatePortraitProjection();
    return bitmapChanged || projectionChanged;
  }

  function commitPortraitResize(force = false) {
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = 0;
        if (resizePortrait(force)) restartPortrait();
      });
    });
  }

  function schedulePortraitResize() {
    if (resizeSettleTimer) window.clearTimeout(resizeSettleTimer);
    resizeSettleTimer = window.setTimeout(() => {
      resizeSettleTimer = 0;
      commitPortraitResize();
    }, 120);
  }

  function hash(x, y) {
    return Math.abs(Math.sin(x * 127.1 + y * 311.7) * 43758.5453) % 1;
  }

  function insideEllipse(x, y, cx, cy, rx, ry) {
    const dx = (x - cx) / rx;
    const dy = (y - cy) / ry;
    return dx * dx + dy * dy <= 1;
  }

  function ellipseFeather(x, y, cx, cy, rx, ry, inner = .58, outer = 1.22) {
    const dx = (x - cx) / rx;
    const dy = (y - cy) / ry;
    const distance = dx * dx + dy * dy;
    const t = clamp((outer - distance) / (outer - inner), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function portraitScaleFactor() {
    const vw = viewportWidth || width;
    const vh = viewportHeight || height;
    const aspect = vw / Math.max(vh, 1);
    const compactHeight = clamp((820 - vh) / 360, 0, 1);
    const narrowBoost = clamp((760 - vw) / 420, 0, 1) * .17;
    const wideBoost = clamp((vw - 760) / 820, 0, 1) * (.14 - compactHeight * .035);
    const tallBoost = clamp((vh - 720) / 430, 0, 1) * .04;
    const shortTrim = compactHeight * .07;
    const ribbonTrim = clamp((aspect - 2.15) / 2.35, 0, 1) * .035;
    return clamp(1 + narrowBoost + wideBoost + tallBoost - shortTrim - ribbonTrim, .96, 1.24);
  }

  function updatePortraitProjection() {
    projectionScale = portraitScaleFactor();
    const vw = viewportWidth || width;
    const vh = viewportHeight || height;
    const aspect = vw / Math.max(vh, 1);
    const compactHeight = clamp((820 - vh) / 360, 0, 1);
    const ribbonLift = clamp((aspect - 2.15) / 2.4, 0, 1);
    projectionAnchorX = portraitOpticalAnchorX;
    projectionAnchorY = clamp(.5 + compactHeight * .07 - ribbonLift * .02, .46, .58);
  }

  function portraitProjection(x, y) {
    const rawX = x / width;
    const rawY = y / height;
    const nx = (rawX - projectionAnchorX) / projectionScale + .5;
    const ny = (rawY - projectionAnchorY) / projectionScale + projectionAnchorY;
    return {
      nx,
      ny,
      sx: clamp(nx * width, 0, width - 1),
      sy: clamp(ny * height, 0, height - 1)
    };
  }

  function renderFieldFeather(x, y) {
    const nx = x / width;
    const ny = y / height;
    const left = clamp(nx / .07, 0, 1);
    const right = clamp((1 - nx) / .07, 0, 1);
    const top = 1;
    const bottom = clamp((1 - ny) / .18, 0, 1);
    const viewLeft = clamp((x - visibleField.left) / (width * .08), 0, 1);
    const viewRight = clamp((visibleField.right - x) / (width * .08), 0, 1);
    const viewTop = 1;
    const viewBottom = clamp((visibleField.bottom - y) / (height * .18), 0, 1);
    const fade = left * right * top * bottom * viewLeft * viewRight * viewTop * viewBottom;
    return fade * fade * (3 - 2 * fade);
  }

  function updateVisibleField() {
    const rect = canvas.getBoundingClientRect();
    const toCanvasX = width / Math.max(1, rect.width);
    const toCanvasY = height / Math.max(1, rect.height);
    visibleField = {
      left: clamp((0 - rect.left) * toCanvasX, 0, width),
      right: clamp((window.innerWidth - rect.left) * toCanvasX, 0, width),
      top: clamp((0 - rect.top) * toCanvasY, 0, height),
      bottom: clamp((window.innerHeight - rect.top) * toCanvasY, 0, height)
    };
  }

  function updatePortraitPointer() {
    portraitPointer.x += (portraitPointer.tx - portraitPointer.x) * .22;
    portraitPointer.y += (portraitPointer.ty - portraitPointer.y) * .22;
    portraitPointer.vx *= .84;
    portraitPointer.vy *= .84;
    portraitPointer.force += (portraitPointer.target - portraitPointer.force) * .18;
    if (portraitPointer.force < .002 && portraitPointer.target === 0) {
      portraitPointer.force = 0;
    }
    return portraitPointer.force > .01 || portraitPointer.target > .01;
  }

  function portraitHover(x, y, cell, strength = 1) {
    if (!portraitPointer.force) return { x: 0, y: 0, heat: 0 };
    const dx = x - portraitPointer.x;
    const dy = y - portraitPointer.y;
    const speed = Math.hypot(portraitPointer.vx, portraitPointer.vy);
    const axisLength = speed > .35 ? speed : 1;
    const axisX = speed > .35 ? portraitPointer.vx / axisLength : Math.cos(frame * .018);
    const axisY = speed > .35 ? portraitPointer.vy / axisLength : Math.sin(frame * .018);
    const axial = dx * axisX + dy * axisY;
    const cross = -dx * axisY + dy * axisX;
    const distance = Math.hypot(axial * .84, cross * 1.12);
    const radius = cell * (4.15 + clamp(speed * .02, 0, .7));
    if (!radius || distance > radius * 1.18) return { x: 0, y: 0, heat: 0 };
    const stableNoise = hash(Math.floor(x / cell) + 19, Math.floor(y / cell) - 7);
    const angle = Math.atan2(dy, dx);
    const lobe = .82 + stableNoise * .24 + Math.sin(angle * 5 + frame * .035) * .1;
    const field = 1 - distance / (radius * lobe);
    if (field <= 0) return { x: 0, y: 0, heat: 0 };
    const wave = Math.sin(distance * .42 - frame * .36 + stableNoise * 6.28);
    const grainWave = Math.sin(distance * .76 + frame * .52 + stableNoise * 11.7);
    const crossWave = Math.cos((axial - cross) * .055 - frame * .44 + stableNoise * 5.4);
    const falloff = field * field * (3 - 2 * field);
    const wake = clamp((axial / radius + .62) * .5, 0, 1);
    const heat = clamp(falloff * (.74 + Math.abs(wave) * .68 + Math.abs(grainWave) * .22 + wake * .2) * portraitPointer.force * strength, 0, 1.72);
    const tangentX = -Math.sin(angle);
    const tangentY = Math.cos(angle);
    const swirl = heat * cell * (13.6 + speed * .054) * (wave * .82 + grainWave * .34);
    const stream = heat * cell * (8.25 + speed * .064) * (1 + crossWave * .18);
    const chop = (stableNoise - .5) * heat * cell * 13.4;
    const radial = heat * cell * 3.2 * Math.sin(stableNoise * 9.42 + frame * .16);
    return {
      x: axisX * stream + tangentX * swirl + Math.cos(angle) * radial + axisY * chop,
      y: axisY * stream + tangentY * swirl + Math.sin(angle) * radial - axisX * chop,
      heat
    };
  }

  function requestPortraitInteraction() {
    if (reduceMotion || !finePointer) return;
    if (!raf && !frameTimer) {
      raf = requestAnimationFrame(drawPortrait);
    }
  }

  function portraitMask(x, y) {
    const { nx, ny } = portraitProjection(x, y);
    const face = insideEllipse(nx, ny, .50, .37, .18, .235);
    const crown = insideEllipse(nx, ny, .50, .285, .23, .22) && ny < .54;
    const sideHairLeft = insideEllipse(nx, ny, .365, .51, .13, .34);
    const sideHairRight = insideEllipse(nx, ny, .65, .515, .16, .35);
    const neck = nx > .425 && nx < .59 && ny > .545 && ny < .74;
    const shoulder = insideEllipse(nx, ny, .52, .93, .53, .32) && ny > .66;
    const mask = face || crown || sideHairLeft || sideHairRight || neck || shoulder;
    if (!mask) return 0;
    const centerFalloff = clamp(1 - Math.abs(nx - .51) * 1.12, .30, 1);
    const topFade = 1;
    const bottomFade = clamp((.965 - ny) / .285, 0, 1);
    const smoothBottomFade = bottomFade * bottomFade * (3 - 2 * bottomFade);
    return centerFalloff * topFade * smoothBottomFade * renderFieldFeather(x, y);
  }

  function portraitSoftMask(x, y) {
    const { nx, ny } = portraitProjection(x, y);
    const face = ellipseFeather(nx, ny, .50, .37, .18, .235, .5, 1.22);
    const crown = ellipseFeather(nx, ny, .50, .285, .235, .225, .44, 1.28) * clamp((.58 - ny) / .09, 0, 1);
    const sideHairLeft = ellipseFeather(nx, ny, .365, .51, .14, .35, .46, 1.28);
    const sideHairRight = ellipseFeather(nx, ny, .65, .515, .17, .36, .46, 1.28);
    const lowerHairLeft = ellipseFeather(nx, ny, .34, .68, .15, .285, .34, 1.26) * clamp((ny - .49) / .12, 0, 1);
    const lowerHairRight = ellipseFeather(nx, ny, .69, .69, .2, .3, .34, 1.26) * clamp((ny - .49) / .12, 0, 1);
    const neckX = clamp((nx - .405) / .045, 0, 1) * clamp((.615 - nx) / .045, 0, 1);
    const neckY = clamp((ny - .52) / .065, 0, 1) * clamp((.77 - ny) / .065, 0, 1);
    const neck = neckX * neckY;
    const shoulder = ellipseFeather(nx, ny, .52, .93, .54, .33, .42, 1.22) * clamp((ny - .635) / .105, 0, 1);
    const silhouette = Math.max(face, crown, sideHairLeft, sideHairRight, lowerHairLeft, lowerHairRight, neck, shoulder);
    if (!silhouette) return 0;
    const centerFalloff = clamp(1 - Math.abs(nx - .51) * 1.02, .34, 1);
    const topFade = 1;
    const bottomFade = clamp((.975 - ny) / .3, 0, 1);
    const smoothBottomFade = bottomFade * bottomFade * (3 - 2 * bottomFade);
    return silhouette * centerFalloff * topFade * smoothBottomFade * renderFieldFeather(x, y);
  }

  function prepareSource() {
    if (!image.complete || !image.naturalWidth || !width || !height) return;
    sourceCanvas.width = width;
    sourceCanvas.height = height;
    sourceCtx.clearRect(0, 0, width, height);
    const cropW = image.naturalWidth * .78;
    const cropH = cropW / (width / height);
    const cropX = image.naturalWidth * .50 - cropW / 2;
    const cropY = image.naturalHeight * .465 - cropH / 2;
    sourceCtx.filter = 'brightness(1.4) contrast(1.34) saturate(.92)';
    sourceCtx.drawImage(
      image,
      Math.max(0, cropX),
      Math.max(0, cropY),
      Math.min(image.naturalWidth - Math.max(0, cropX), cropW),
      Math.min(image.naturalHeight - Math.max(0, cropY), cropH),
      0,
      0,
      width,
      height
    );
    sourceCtx.filter = 'none';
    sourceData = sourceCtx.getImageData(0, 0, width, height).data;
  }

  function samplePhoto(x, y) {
    const projected = portraitProjection(x, y);
    const sx = Math.floor(projected.sx);
    const sy = Math.floor(projected.sy);
    const index = (sy * width + sx) * 4;
    const r = sourceData[index];
    const g = sourceData[index + 1];
    const b = sourceData[index + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const lum = r * .299 + g * .587 + b * .114;
    return { r, g, b, lum, sat: (max - min) / 255 };
  }

  function photoDetail(x, y, sample) {
    if (!sourceData) return 0;
    const offset = Math.max(2, Math.floor(width / 180));
    const right = samplePhoto(x + offset, y);
    const down = samplePhoto(x, y + offset);
    return Math.min(1, (Math.abs(sample.lum - right.lum) + Math.abs(sample.lum - down.lum)) / 112);
  }

  function spectralGlint(x, y, cell, detail, feature, mask, hover, intensity = 1) {
    const gx = Math.floor(x / cell);
    const gy = Math.floor(y / cell);
    const cadenceSeed = hash(gx + 503, gy - 211);
    const cadence = .24 + cadenceSeed * .54;
    const phase = hash(gx - 37, gy + 181) * Math.PI * 2;
    const flicker = Math.pow(clamp(.5 + Math.sin(frame * cadence + phase) * .5, 0, 1), 1.92);
    const rollingGate = hash(gx + Math.floor(frame * (cadence * 1.18 + .22)), gy + 79);
    const energy = clamp((detail * .48 + feature * .34 + mask * .26 + hover.heat * .64) * intensity, 0, 1);
    if (energy < .018 || rollingGate > .38 + energy * .36) return null;
    const colorSeed = hash(gx + Math.floor(frame * cadence * 2.35) + 13, gy - 97);
    const color = colorSeed < .34 ? '0 238 255' : colorSeed < .68 ? '255 0 230' : '255 232 0';
    const alpha = clamp((.03 + energy * .19 + hover.heat * .05) * (.24 + flicker * .62), .01, .2);
    return {
      color,
      alpha,
      flicker,
      lift: clamp(.06 + energy * .28 + flicker * .15, .06, .48)
    };
  }

  function liftedSample(sample) {
    const r = clamp((sample.r - 10) * 1.5 + 30, 0, 255);
    const g = clamp((sample.g - 10) * 1.5 + 30, 0, 255);
    const b = clamp((sample.b - 10) * 1.5 + 30, 0, 255);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    return {
      r,
      g,
      b,
      lum: r * .299 + g * .587 + b * .114,
      sat: (max - min) / 255
    };
  }

  function drawBottomSmear() {
    if (root.dataset.theme === 'dark') return;
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.filter = 'blur(14px)';
    const bands = [
      { color: '0 238 255', alpha: .18, y: .795, x: .08 },
      { color: '255 0 230', alpha: .15, y: .825, x: .14 },
      { color: '255 232 0', alpha: .12, y: .855, x: .11 },
      { color: '24 21 18', alpha: .16, y: .89, x: .18 }
    ];
    bands.forEach((band, index) => {
      for (let i = 0; i < 3; i += 1) {
        const y = height * band.y + i * height * .024;
        const h = height * (.035 + index * .006);
        const x = width * band.x + i * width * .035;
        const w = width * (.78 - i * .08);
        const gradient = ctx.createLinearGradient(x, y, x + w, y);
        gradient.addColorStop(0, `rgb(${band.color} / 0)`);
        gradient.addColorStop(.18, `rgb(${band.color} / ${band.alpha})`);
        gradient.addColorStop(.72, `rgb(${band.color} / ${band.alpha * .8})`);
        gradient.addColorStop(1, `rgb(${band.color} / 0)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(x + Math.sin(frame * .028 + index) * 16, y, w, h);
      }
    });
    ctx.restore();
  }

  function drawDarkPortrait(cell, drift, mx, my, scroll) {
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';

    for (let y = 0; y < height; y += cell) {
      for (let x = 0; x < width; x += cell) {
        const jitter = hash(Math.floor(x / cell), Math.floor(y / cell));
        const mask = portraitSoftMask(x, y);
        if (!mask) continue;
        const darkMask = Math.pow(mask, 1.18);
        if (darkMask < .032) continue;

        const { nx, ny } = portraitProjection(x, y);
        const raw = samplePhoto(x, y);
        const sample = liftedSample(raw);
        const detail = photoDetail(x, y, raw);
        const faceWeight = ellipseFeather(nx, ny, .50, .385, .19, .245, .42, 1.38);
        const faceZone = faceWeight > .045;
        const hairZone = ny < .66 && faceWeight < .42;
        const shoulderZone = ny > .66;
        const sourceLight = clamp((sample.lum - 34) / 214, 0, 1);
        const contour = Math.pow(detail, .62);
        const faceShadow = Math.pow(clamp((178 - raw.lum) / 154, 0, 1), .88) * faceWeight;
        const faceFeature = clamp(faceShadow * .82 + contour * .38, 0, 1) * faceWeight;
        const faceBridge = faceZone ? clamp(1 - Math.abs(faceWeight - .34) / .34, 0, 1) : 0;
        const lowerHairWeight = ny > .5
          ? Math.max(
            ellipseFeather(nx, ny, .34, .68, .15, .285, .34, 1.26),
            ellipseFeather(nx, ny, .69, .69, .2, .3, .34, 1.26)
          ) * clamp((ny - .5) / .14, 0, 1) * clamp((.88 - ny) / .16, 0, 1)
          : 0;
        const hairTexture = ny < .66
          ? clamp((1 - sourceLight) * .48 + contour * .56 + mask * .1, 0, 1) * clamp(1 - faceWeight * .34, .5, 1)
          : 0;
        const lowerHairTexture = lowerHairWeight * clamp((1 - sourceLight) * .5 + contour * .58 + mask * .08, 0, 1);
        const faceStructure = faceZone ? clamp(contour * (1 + faceWeight * .2) + faceShadow * .92, 0, 1) : contour;
        const faceMids = faceWeight * clamp((raw.lum - 96) / 168, 0, 1) * clamp(1 - faceFeature * .9, 0, 1);
        const skinPlate = faceWeight * sourceLight * clamp(1 - faceFeature * 1.28, 0, 1);
        const faceFill = faceWeight * clamp(sourceLight * .34 + faceMids * .36, 0, 1) * clamp(1 - faceFeature * .82, 0, 1);
        const localFloor = lowerHairWeight > .05 ? .15 : hairZone ? .13 : shoulderZone ? .12 : faceZone ? .095 : .078;
        const hairMass = Math.max(hairTexture, lowerHairTexture);
        const value = clamp(localFloor + sourceLight * (.42 - faceWeight * .2) + faceStructure * (.22 + faceWeight * .1) + faceFeature * .15 + faceBridge * .06 + faceMids * .16 + faceFill * .04 + hairTexture * .18 + lowerHairTexture * .25, 0, 1);
        const zoneDensity = lowerHairWeight > .05 ? 1 : shoulderZone ? .72 : hairZone ? .98 : faceZone ? .66 : .8;
        const density = clamp(darkMask * zoneDensity * (.052 + value * .32 + faceStructure * .14 + faceFeature * .17 + faceBridge * .07 + faceMids * .16 + faceFill * .08 + hairTexture * .36 + lowerHairTexture * .48), 0, .86);
        if (jitter > density) continue;

        const sizeNoise = hash(Math.floor(x / cell) + 173, Math.floor(y / cell) - 89);
        const clusterNoise = hash(Math.floor(x / (cell * 2.6)) + 31, Math.floor(y / (cell * 2.6)) - 17);
        const microNoise = hash(Math.floor(x / cell) - 409, Math.floor(y / cell) + 313);
        const sizeEnergy = clamp(value * .32 + faceStructure * .28 + faceFeature * .18 + faceMids * .14 + faceFill * .02 + hairMass * .34 + detail * .32, 0, 1);
        const sizeScale = clamp(.42 + Math.pow(sizeEnergy, .64) * .54 + Math.pow(sizeNoise, .7) * .38 + clusterNoise * .24 + microNoise * .2 - skinPlate * .055, .34, 1.72);
        const aspectNoise = hash(Math.floor(x / cell) - 251, Math.floor(y / cell) + 97);
        const shadowGrain = .72 + Math.pow(clamp(hairMass + faceStructure * .42 + value * .18, 0, 1), .8) * .42;
        const grainScale = (.52 + Math.pow(microNoise, 1.8) * .98) * shadowGrain;
        const pulse = .988 + Math.sin((x + y) * .014 + frame * .029) * .012;
        const dotW = Math.max(.46, cell * (.22 + density * .15) * sizeScale * grainScale * (.88 + aspectNoise * .24));
        const dotH = Math.max(.5, cell * (.24 + density * .17) * (sizeScale * .9 + detail * .2) * grainScale * (1.1 - aspectNoise * .18));
        const alpha = clamp((.092 + value * .3 + faceStructure * .14 + faceFeature * .2 + faceBridge * .07 + faceMids * .1 + faceFill * .035 + hairTexture * .24 + lowerHairTexture * .3 - skinPlate * .035) * darkMask * pulse, .035, .72);
        const tone = Math.round(112 + value * 54 + faceStructure * 9 + faceFeature * 22 + faceBridge * 7 + faceMids * 22 + faceFill * 8 + hairTexture * 34 + lowerHairTexture * 42);
        const hover = portraitHover(x, y, cell, .82);
        const dx = (jitter - .5) * cell * .18 + mx * .9;
        const dy = Math.sin((x * .01) + scroll) * .24 + my * .65 + drift * .08;
        const hoverTone = Math.round(clamp(tone + hover.heat * 34, 0, 255));
        const glint = spectralGlint(x, y, cell, detail, faceStructure + faceFeature + lowerHairTexture, darkMask, hover, 1.58);

        ctx.fillStyle = `rgb(${hoverTone} ${hoverTone} ${hoverTone})`;
        ctx.globalAlpha = clamp(alpha + hover.heat * .18, .052, .96);
        ctx.fillRect(x + dx + hover.x, y + dy + hover.y, dotW, dotH);

        const rgbGate = hash(Math.floor(x / cell) + Math.floor(frame * .24) + 907, Math.floor(y / cell) - 433);
        const rgbChance = clamp(.026 + detail * .08 + faceFeature * .055 + lowerHairTexture * .04 + hover.heat * .18 + (glint ? .14 : 0), .026, .38);
        if (rgbGate < rgbChance) {
          const colorSeed = hash(Math.floor(x / cell) + Math.floor(frame * .42) + 119, Math.floor(y / cell) - 739);
          const darkRgb = colorSeed < .34 ? '255 54 42' : colorSeed < .68 ? '73 255 135' : '42 154 255';
          const channelShift = colorSeed < .34 ? -cell * .16 : colorSeed < .68 ? 0 : cell * .16;
          const rgbAlpha = clamp(.09 + detail * .1 + faceFeature * .08 + lowerHairTexture * .06 + (glint ? glint.alpha * .9 : 0) + hover.heat * .04, .078, .38);
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = `rgb(${darkRgb})`;
          ctx.globalAlpha = rgbAlpha;
          ctx.fillRect(x + dx + hover.x + channelShift, y + dy + hover.y, dotW * 1.08, dotH * 1.08);
        }
      }
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function queuePortrait(delay = 112) {
    if (reduceMotion) return;
    frameTimer = window.setTimeout(() => {
      raf = requestAnimationFrame(drawPortrait);
    }, delay);
  }

  function drawPortrait() {
    raf = 0;
    frameTimer = 0;
    if (!width || !height) resizePortrait();
    updatePortraitProjection();
    updateVisibleField();
    if (!sourceData) prepareSource();
    if (!sourceData) {
      ctx.clearRect(0, 0, width, height);
      return;
    }
    const interactive = updatePortraitPointer();
    const heroRect = hero ? hero.getBoundingClientRect() : null;
    const heroVisible = !heroRect || (heroRect.bottom > -120 && heroRect.top < window.innerHeight + 120);
    if (!heroVisible) {
      frame += 1;
      queuePortrait(620);
      return;
    }
    ctx.clearRect(0, 0, width, height);
    const cell = Math.max(4.05, Math.min(5.45, width / 248));
    const drift = reduceMotion ? 0 : Math.sin(frame * .02) * 1.8;
    const mx = 0;
    const my = 0;
    const scroll = (window.scrollY || 0) * .012;
    const isDark = root.dataset.theme === 'dark';
    if (isDark) {
      drawDarkPortrait(cell, drift, mx, my, scroll);
      frame += 1;
      queuePortrait(interactive ? 28 : 162);
      return;
    }
    const channels = [
      { color: '0 238 255', x: -cell * .26, y: -cell * .08 + drift * .32, key: 'c' },
      { color: '255 0 230', x: cell * .22, y: cell * .06 - drift * .32, key: 'm' },
      { color: '255 232 0', x: cell * .04, y: cell * .2, key: 'y' },
      { color: '18 16 14', x: 0, y: 0, key: 'k' }
    ];

    ctx.globalCompositeOperation = 'multiply';
    for (let y = 0; y < height; y += cell) {
      for (let x = 0; x < width; x += cell) {
        const jitter = hash(Math.floor(x / cell), Math.floor(y / cell));
        const mask = portraitSoftMask(x, y);
        if (mask < .016) continue;
        const { nx, ny } = portraitProjection(x, y);
        const raw = samplePhoto(x, y);
        const sample = liftedSample(raw);
        const detail = photoDetail(x, y, raw);
        const shadow = Math.pow(clamp((255 - sample.lum) / 255, 0, 1), .72);
        const faceZone = insideEllipse(nx, ny, .50, .385, .18, .23);
        const shoulderBoost = clamp((ny - .66) / .22, 0, 1) * .34;
        const highKey = faceZone ? clamp((sample.lum - 165) / 76, 0, 1) : 0;
        const feature = detail * (faceZone ? 1.65 : 1);
        const skinRelief = faceZone ? Math.pow(clamp((230 - raw.lum) / 182, 0, 1), 1.12) * .14 : 0;
        const highlightFill = isDark ? highKey * .34 : 0;
        const formDepth = clamp(shadow * .5 + feature * .34 + shoulderBoost * .22 + skinRelief * 1.2 - highKey * .14, 0, 1);
        const baseInk = clamp(shadow * .78 + feature * .96 + shoulderBoost + highlightFill + skinRelief - highKey * (isDark ? .05 : .32), 0, 1);
        const hover = portraitHover(x, y, cell, 1);
        const pixelGlint = spectralGlint(x, y, cell, detail, feature + skinRelief, mask, hover, 1.08);

        channels.forEach((channel, channelIndex) => {
          const processPresence = channel.key === 'c'
            ? (255 - sample.r) / 255
            : channel.key === 'm'
              ? (255 - sample.g) / 255
              : channel.key === 'y'
                ? (255 - sample.b) / 255
                : baseInk;
          const isInk = channel.key === 'k';
          const channelPower = channel.key === 'k'
            ? baseInk * .9 + feature * .36 + shadow * .16
            : baseInk * .25 + feature * .36 + processPresence * .22 + sample.sat * .16;
          const glintBoost = pixelGlint && !isInk ? pixelGlint.lift * .18 : 0;
          const tonalDensity = isInk
            ? (.026 + channelPower * .9 + formDepth * .22)
            : (.005 + channelPower * .32 + formDepth * .06 + glintBoost);
          const density = clamp(mask * tonalDensity * (faceZone ? .84 + formDepth * .2 : 1), 0, isInk ? .96 : .3);
          if (jitter > density) return;
          const sizeNoise = hash(Math.floor(x / cell) + channelIndex * 53, Math.floor(y / cell) - channelIndex * 31);
          const clusterNoise = hash(Math.floor(x / (cell * 2.8)) + channelIndex * 29, Math.floor(y / (cell * 2.8)) - channelIndex * 23);
          const aspectNoise = hash(Math.floor(x / cell) - channelIndex * 73, Math.floor(y / cell) + channelIndex * 41);
          const sizeEnergy = clamp(channelPower * .32 + feature * .32 + shadow * .2 + detail * .3 + processPresence * .1 + formDepth * .28, 0, 1);
          const microNoise = hash(Math.floor(x / cell) + channelIndex * 127 - 17, Math.floor(y / cell) - channelIndex * 101 + 29);
          const sizeScale = clamp(.43 + Math.pow(sizeEnergy, .68) * .5 + Math.pow(sizeNoise, .7) * .34 + clusterNoise * .21 + microNoise * .16 + (pixelGlint ? pixelGlint.flicker * .028 : 0), .4, 1.58);
          const pulse = .86 + Math.sin((x + y) * .016 + frame * .032 + channelIndex) * .14;
          const colorTwinkle = .58 + Math.sin(frame * .04 + x * .021 + y * .014 + channelIndex * 2.1) * .18;
          const glintScale = isInk && pixelGlint ? 1 + pixelGlint.flicker * .055 : 1;
          const formGrain = .74 + Math.pow(formDepth, .7) * .38;
          const grainScale = (.56 + Math.pow(microNoise, 1.75) * .92) * formGrain;
          const w = Math.max(.46, cell * (isInk ? .27 + density * .23 : .16 + density * .12) * sizeScale * grainScale * glintScale * (.86 + aspectNoise * .28));
          const h = Math.max(.5, cell * (isInk ? .32 + density * .24 : .18 + density * .14) * (sizeScale * .92 + detail * .18) * grainScale * glintScale * (1.12 - aspectNoise * .18));
          const channelScatter = isInk ? .42 : 1.18 + channelIndex * .2;
          const chroma = isInk ? 0 : (channelIndex - 1) * hover.heat * cell * .22;
          const dx = channel.x + (jitter - .5) * .7 + hover.x * channelScatter + chroma;
          const dy = channel.y + Math.sin((x * .01) + scroll + channelIndex) * .9 + hover.y * channelScatter;
          ctx.globalCompositeOperation = isInk ? 'multiply' : 'source-over';
          ctx.fillStyle = `rgb(${channel.color})`;
          const channelMatchesGlint = pixelGlint && channel.color === pixelGlint.color;
          ctx.globalAlpha = isInk
            ? clamp(density * pulse * (.7 + (pixelGlint ? pixelGlint.flicker * .08 : 0)) + hover.heat * .1, .035, .8)
            : clamp(density * pulse * colorTwinkle * .24 + hover.heat * .03 + (channelMatchesGlint ? pixelGlint.alpha * .62 : 0), .012, .26);
          ctx.fillRect(x + dx, y + dy, w, h);
          if (isInk && pixelGlint) {
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = `rgb(${pixelGlint.color})`;
            ctx.shadowColor = `rgb(${pixelGlint.color} / ${clamp(pixelGlint.alpha * .28, .014, .08)})`;
            ctx.shadowBlur = cell * .26;
            ctx.globalAlpha = clamp(pixelGlint.alpha * .46, .014, .14);
            ctx.fillRect(x + dx, y + dy, w, h);
            ctx.shadowBlur = 0;
          }
        });
      }
    }
    ctx.globalCompositeOperation = 'source-over';

    frame += 1;
    queuePortrait(interactive ? 28 : 162);
  }

  function stopPortraitLoop() {
    if (raf) cancelAnimationFrame(raf);
    if (frameTimer) window.clearTimeout(frameTimer);
    raf = 0;
    frameTimer = 0;
  }

  function restartPortrait() {
    stopPortraitLoop();
    drawPortrait();
  }

  function handleInitialImage(loaded) {
    if (hasHandledInitialImage) return;
    hasHandledInitialImage = true;
    if (!loaded) sourceData = null;
    try {
      resizePortrait(true);
      restartPortrait();
    } finally {
      resolveInitialPortrait();
    }
  }

  image.addEventListener('load', () => handleInitialImage(true), { once: true });
  image.addEventListener('error', () => handleInitialImage(false), { once: true });
  image.src = 'assets/lynn-rgb-portrait-studio-1600.jpg';
  if (image.complete) {
    handleInitialImage(Boolean(image.naturalWidth));
  }
  window.addEventListener('resize', schedulePortraitResize, { passive: true });
  window.visualViewport?.addEventListener('resize', schedulePortraitResize, { passive: true });
  if ('ResizeObserver' in window) {
    portraitResizeObserver = new ResizeObserver(schedulePortraitResize);
    portraitResizeObserver.observe(canvas.parentElement || canvas);
  }
  [
    window.matchMedia('(max-width: 1180px)'),
    window.matchMedia('(max-width: 760px)'),
    window.matchMedia('(max-height: 820px) and (min-width: 761px)')
  ].forEach((query) => query.addEventListener?.('change', schedulePortraitResize));
  window.addEventListener('portfolio-theme-change', () => {
    frame = 0;
    restartPortrait();
  });
  if (finePointer && !reduceMotion) {
    document.addEventListener('pointermove', (event) => {
      const rect = canvas.getBoundingClientRect();
      const inside = event.clientX >= rect.left
        && event.clientX <= rect.right
        && event.clientY >= rect.top
        && event.clientY <= rect.bottom;
      if (inside) {
        const nextX = ((event.clientX - rect.left) / Math.max(1, rect.width)) * width;
        const nextY = ((event.clientY - rect.top) / Math.max(1, rect.height)) * height;
        portraitPointer.vx = clamp(nextX - portraitPointer.tx, -28, 28);
        portraitPointer.vy = clamp(nextY - portraitPointer.ty, -28, 28);
        portraitPointer.tx = nextX;
        portraitPointer.ty = nextY;
        portraitPointer.target = 1;
      } else {
        portraitPointer.target = 0;
      }
      requestPortraitInteraction();
    }, { passive: true });
    document.addEventListener('pointerleave', () => {
      portraitPointer.target = 0;
      requestPortraitInteraction();
    });
  }
  return initialPortraitReady;
}

document.querySelector('[data-lang-toggle]')?.addEventListener('click', () => {
  root.dataset.lang = root.dataset.lang === 'zh' ? 'en' : 'zh';
  translate();
});

document.querySelector('[data-theme-toggle]')?.addEventListener('click', () => {
  setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
});

document.querySelectorAll('[data-open-cluster]').forEach((button) => {
  button.addEventListener('click', () => openCluster(button.dataset.openCluster));
});

setupCaseLinks();

closeButton.addEventListener('click', closeLayer);
layer.addEventListener('click', (event) => {
  if (event.target === layer) closeLayer();
});
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeLayer();
});

setTheme(root.dataset.theme || 'light');
window.portfolioLoadingBridge?.installLottie();
const criticalImagesReady = waitForCriticalImages();
translate();
setupPointerVars();
setupCursor();
setupWorkShowcase();
setupWorkColorReveal();
setupPlaygroundGridFill();
setupScrollReveal();
setupParallax();
const heroPortraitReady = setupHeroPortrait();
const pageResourcesReady = waitForPageResources(criticalImagesReady, heroPortraitReady);
if (window.portfolioLoadingBridge) {
  void window.portfolioLoadingBridge.completeWhen(pageResourcesReady);
}
