import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const root = new URL("../", import.meta.url);

const read = (path) => readFile(new URL(path, root), "utf8");

class ClassList {
  #values = new Set();

  add(...values) {
    values.forEach((value) => this.#values.add(value));
  }

  remove(...values) {
    values.forEach((value) => this.#values.delete(value));
  }

  contains(value) {
    return this.#values.has(value);
  }
}

class CustomEventForTest extends Event {
  constructor(type, options = {}) {
    super(type);
    this.detail = options.detail;
  }
}

const createManualLoader = async () => {
  const animationTarget = new EventTarget();
  animationTarget.dataset = { pageLoaderAnimation: "manual" };
  const loader = {
    dataset: {
      pageLoaderMode: "external",
      pageLoaderState: "checking"
    },
    hidden: false,
    classList: new ClassList(),
    querySelector: () => animationTarget
  };
  loader.classList.add("is-hidden");

  const windowObject = new EventTarget();
  windowObject.setTimeout = setTimeout;
  const source = await read("page-loader.js");

  vm.runInNewContext(source, {
    window: windowObject,
    document: { querySelector: () => loader },
    CustomEvent: CustomEventForTest,
    getComputedStyle: () => ({
      animationName: "none",
      animationDuration: "0s",
      animationDelay: "0s"
    }),
    requestAnimationFrame: (callback) => {
      callback(0);
      return 1;
    },
    Promise,
    Set,
    Number
  }, { filename: "page-loader.js" });

  return windowObject.portfolioPageLoader;
};

async function testManualAnimationBoundary() {
  const loader = await createManualLoader();
  loader.start();
  loader.complete();
  assert.equal(
    loader.state,
    "loading",
    "manual JS loaders must not complete before a real animation boundary"
  );
  loader.animationBoundary();
  assert.equal(loader.state, "complete");

  const boundaryBeforeReady = await createManualLoader();
  boundaryBeforeReady.start();
  boundaryBeforeReady.animationBoundary();
  boundaryBeforeReady.complete();
  assert.equal(
    boundaryBeforeReady.state,
    "loading",
    "a boundary before readiness must not be reused for a later partial loop"
  );
  boundaryBeforeReady.animationBoundary();
  assert.equal(boundaryBeforeReady.state, "complete");
}

const flushMicrotasks = async () => {
  for (let turn = 0; turn < 4; turn += 1) await Promise.resolve();
};

const createAutoLoaderEnvironment = async () => {
  const timers = [];
  const animationTarget = new EventTarget();
  animationTarget.dataset = { pageLoaderAnimation: "manual" };
  const loader = {
    dataset: {
      pageLoaderMode: "auto",
      pageLoaderState: "checking",
      pageLoaderGrace: "120"
    },
    hidden: false,
    classList: new ClassList(),
    querySelector: () => animationTarget
  };
  loader.classList.add("is-hidden");

  let resolveFonts;
  const fontsReady = new Promise((resolve) => {
    resolveFonts = resolve;
  });
  const documentObject = {
    fonts: { ready: fontsReady },
    querySelector: () => loader,
    readyState: "loading"
  };
  const windowObject = new EventTarget();
  windowObject.setTimeout = (callback, delay) => {
    timers.push({ callback, delay });
    return timers.length;
  };

  vm.runInNewContext(await read("page-loader.js"), {
    window: windowObject,
    document: documentObject,
    CustomEvent: CustomEventForTest,
    getComputedStyle: () => ({
      animationName: "none",
      animationDuration: "0s",
      animationDelay: "0s"
    }),
    requestAnimationFrame: (callback) => {
      callback(0);
      return 1;
    },
    Promise,
    Set,
    Number
  }, { filename: "page-loader.js" });

  return {
    dispatchLoad() {
      windowObject.dispatchEvent(new Event("load"));
    },
    loader,
    pageLoader: windowObject.portfolioPageLoader,
    resolveFonts,
    runGrace() {
      const grace = timers.find(({ delay }) => delay === 120);
      grace?.callback();
    },
    windowObject
  };
};

async function testAutoLoaderFastAndSlowPaths() {
  const fast = await createAutoLoaderEnvironment();
  let fastStarts = 0;
  fast.windowObject.addEventListener("portfolio:loader-start", () => {
    fastStarts += 1;
  });
  fast.dispatchLoad();
  fast.resolveFonts();
  await flushMicrotasks();
  assert.equal(fast.pageLoader.state, "complete");
  assert.equal(fastStarts, 0, "auto pages ready inside the grace period must not flash Loading");
  assert.equal(fast.loader.classList.contains("is-hidden"), true);
  fast.runGrace();
  assert.equal(fast.pageLoader.state, "complete", "a late grace timer cannot restart a fast loader");

  const slow = await createAutoLoaderEnvironment();
  let slowStarts = 0;
  slow.windowObject.addEventListener("portfolio:loader-start", () => {
    slowStarts += 1;
  });
  slow.runGrace();
  assert.equal(slow.pageLoader.state, "loading");
  assert.equal(slowStarts, 1);
  assert.equal(slow.loader.classList.contains("is-hidden"), false);

  slow.dispatchLoad();
  await flushMicrotasks();
  assert.equal(slow.pageLoader.state, "loading", "auto mode must still wait for document fonts");
  slow.resolveFonts();
  await flushMicrotasks();
  assert.equal(
    slow.pageLoader.state,
    "loading",
    "auto readiness must still finish the visible manual animation at a real boundary"
  );
  slow.pageLoader.animationBoundary();
  assert.equal(slow.pageLoader.state, "complete");
  assert.equal(slow.loader.classList.contains("is-hidden"), true);
}

const createBridgeEnvironment = async ({
  documentReadyState = "complete",
  loaderMode = "external",
  reducedMotion = false
} = {}) => {
  const timers = [];
  const animationListeners = new Map();
  const animationStops = [];
  let lottieStarts = 0;

  class AnimationTarget extends EventTarget {
    constructor() {
      super();
      this.dataset = { pageLoaderAnimation: "manual" };
      this.classList = new ClassList();
    }

    replaceChildren() {}
  }
  const animationTarget = new AnimationTarget();
  class LoaderElement extends EventTarget {
    constructor() {
      super();
      this.dataset = {
        pageLoaderMode: "external",
        pageLoaderState: "checking",
        pageLoaderGrace: "120",
        pageLoaderPlaybackSpeed: "2"
      };
      this.hidden = false;
      this.classList = new ClassList();
      this.classList.add("is-hidden");
    }

    querySelector() {
      return animationTarget;
    }
  }
  const loader = new LoaderElement();
  const bridgeMode = loaderMode;
  const windowObject = new EventTarget();
  windowObject.setTimeout = (callback) => {
    timers.push(callback);
    return timers.length;
  };
  windowObject.clearTimeout = () => {};
  windowObject.matchMedia = () => ({ matches: reducedMotion });
  windowObject.LOADING_ANIMATION = { markers: [], op: 24 };
  const fakeAnimation = {
    addEventListener(name, callback) {
      const callbacks = animationListeners.get(name) || [];
      callbacks.push(callback);
      animationListeners.set(name, callbacks);
    },
    destroy() {},
    currentFrame: 0,
    goToAndStop(frame, isFrame) {
      this.currentFrame = frame;
      animationStops.push({ frame, isFrame });
    },
    isLoaded: reducedMotion,
    pause() {},
    setSpeed() {},
    totalFrames: windowObject.LOADING_ANIMATION.op
  };
  windowObject.lottie = {
    loadAnimation() {
      lottieStarts += 1;
      return fakeAnimation;
    }
  };

  class DocumentForTest extends EventTarget {
    constructor() {
      super();
      this.readyState = documentReadyState;
    }

    querySelector() {
      return loader;
    }
  }
  const documentObject = new DocumentForTest();

  const context = {
    window: windowObject,
    document: documentObject,
    CustomEvent: CustomEventForTest,
    getComputedStyle: () => ({
      animationName: "none",
      animationDuration: "0s",
      animationDelay: "0s"
    }),
    requestAnimationFrame: (callback) => {
      callback(0);
      return 1;
    },
    Promise,
    Set,
    Number
  };

  vm.runInNewContext(await read("page-loader.js"), context, { filename: "page-loader.js" });
  loader.dataset.pageLoaderMode = bridgeMode;
  vm.runInNewContext(await read("assets/brand/loading-bridge.js"), context, {
    filename: "loading-bridge.js"
  });

  return {
    bridge: windowObject.portfolioLoadingBridge,
    dispatchDOMContentLoaded() {
      documentObject.readyState = "interactive";
      documentObject.dispatchEvent(new Event("DOMContentLoaded"));
    },
    emitAnimation(name, currentFrame) {
      if (Number.isFinite(currentFrame)) fakeAnimation.currentFrame = currentFrame;
      (animationListeners.get(name) || []).forEach((callback) => callback());
    },
    get animationStops() {
      return animationStops;
    },
    get lottieStarts() {
      return lottieStarts;
    },
    loader,
    pageLoader: windowObject.portfolioPageLoader,
    runGrace() {
      timers.shift()?.();
    },
    windowObject
  };
};

async function testBridgeAutoInstallation() {
  const auto = await createBridgeEnvironment({
    documentReadyState: "loading",
    loaderMode: "auto"
  });
  auto.pageLoader.start();
  assert.equal(auto.lottieStarts, 0, "auto pages must wait until their DOM exists before installing Lottie");
  auto.dispatchDOMContentLoaded();
  assert.equal(auto.lottieStarts, 1, "auto pages must install Lottie at DOMContentLoaded");
  auto.bridge.installLottie();
  assert.equal(auto.lottieStarts, 1, "automatic and explicit installation must be idempotent");

  const external = await createBridgeEnvironment({
    documentReadyState: "loading",
    loaderMode: "external"
  });
  external.pageLoader.start();
  external.dispatchDOMContentLoaded();
  assert.equal(
    external.lottieStarts,
    0,
    "external pages must retain control of when their page-specific readiness installs Lottie"
  );
  external.bridge.installLottie();
  assert.equal(external.lottieStarts, 1);
}

async function testBridgeFastAndSlowPaths() {
  const fast = await createBridgeEnvironment();
  let fastStarts = 0;
  fast.windowObject.addEventListener("portfolio:loader-start", () => {
    fastStarts += 1;
  });
  fast.bridge.installLottie();
  await fast.bridge.completeWhen(Promise.resolve());
  assert.equal(fast.pageLoader.state, "complete");
  assert.equal(fastStarts, 0, "fast readiness must never enter visible Loading");
  assert.equal(fast.lottieStarts, 0, "fast readiness must not instantiate Lottie");
  assert.equal(fast.loader.hidden, true);
  fast.runGrace();
  assert.equal(fast.pageLoader.state, "complete");

  const slow = await createBridgeEnvironment();
  slow.bridge.installLottie();
  slow.runGrace();
  assert.equal(slow.pageLoader.state, "loading");
  assert.equal(slow.lottieStarts, 1);

  let release;
  const readiness = new Promise((resolve) => {
    release = resolve;
  });
  const completion = slow.bridge.completeWhen(readiness);
  slow.emitAnimation("loopComplete", 3.25);
  assert.equal(slow.pageLoader.state, "loading", "animation cannot bypass real readiness");
  assert.deepEqual(
    slow.animationStops,
    [],
    "an unfinished loader must keep playing after a wrapped loop frame"
  );
  release();
  await completion;
  await Promise.resolve();
  assert.equal(
    slow.pageLoader.state,
    "loading",
    "readiness after an earlier boundary must wait for the next full loop"
  );
  slow.emitAnimation("loopComplete", 4.25);
  assert.equal(slow.pageLoader.state, "complete");
  assert.deepEqual(
    slow.animationStops,
    [{ frame: 23, isFrame: true }],
    "a completed loader must replace the wrapped second-loop frame with the first loop's final frame"
  );

  const reduced = await createBridgeEnvironment({ reducedMotion: true });
  reduced.bridge.installLottie();
  reduced.runGrace();
  await reduced.bridge.completeWhen(Promise.resolve());
  assert.equal(
    reduced.pageLoader.state,
    "complete",
    "reduced motion must use a settled still frame instead of waiting forever"
  );
  assert.deepEqual(
    reduced.animationStops,
    [{ frame: 23, isFrame: true }],
    "reduced motion must retain its single settled still frame"
  );

  const failedAnimation = await createBridgeEnvironment();
  failedAnimation.bridge.installLottie();
  failedAnimation.runGrace();
  failedAnimation.emitAnimation("data_failed");
  await failedAnimation.bridge.completeWhen(Promise.resolve());
  assert.equal(
    failedAnimation.pageLoader.state,
    "complete",
    "a failed Lottie renderer must settle through the static fallback"
  );
  assert.deepEqual(
    failedAnimation.animationStops,
    [],
    "a failed animation must not be repositioned as though it completed a loop"
  );

  const disposed = await createBridgeEnvironment();
  disposed.bridge.installLottie();
  disposed.runGrace();
  disposed.windowObject.dispatchEvent(new Event("pagehide"));
  disposed.emitAnimation("loopComplete", 2.5);
  assert.deepEqual(
    disposed.animationStops,
    [],
    "a late loop event must not redraw an animation after disposal"
  );
}

const anchorTags = (source) => [...source.matchAll(/<a\b[\s\S]*?>/gi)]
  .map(([tag]) => tag);

const anchorsWithHref = (source, href) => anchorTags(source)
  .filter((tag) => tag.includes(`href="${href}"`));

const assertMarkedHref = (source, href, label) => {
  const anchors = anchorsWithHref(source, href);
  assert.ok(anchors.length > 0, `${label} must contain ${href}`);
  anchors.forEach((anchor) => {
    assert.match(anchor, /\sdata-page-transition(?:\s|=|>)/, `${label}: ${href} is unmarked`);
  });
};

const assertUnmarkedHref = (source, href, label) => {
  const anchors = anchorsWithHref(source, href);
  assert.ok(anchors.length > 0, `${label} must contain ${href}`);
  anchors.forEach((anchor) => {
    assert.doesNotMatch(
      anchor,
      /\sdata-page-transition(?:\s|=|>)/,
      `${label}: same-document ${href} must not trigger a page transition`
    );
  });
};

const assetReferenceCount = (source, path) => source.split(path).length - 1;

const assertTransitionShell = (source, label, { loaderMode } = {}) => {
  assert.ok(
    loaderMode === "external" || loaderMode === "auto",
    `${label}: expected an explicit external or auto loader mode`
  );
  const css = source.indexOf("/page-transition.css");
  const boot = source.indexOf("/page-transition-boot.js");
  const pageLoader = source.indexOf("/page-loader.js");
  const bridge = source.indexOf("/assets/brand/loading-bridge.js");
  const transition = source.indexOf("/page-transition.js");
  assert.ok(
    css >= 0 && boot > css && pageLoader > boot && bridge > pageLoader && transition > bridge,
    `${label}: loader and transition assets are out of order`
  );
  assert.match(source, /<footer\b[^>]*data-transition-color=/i, `${label}: footer color is missing`);

  const bootTag = source.match(/<script\b[^>]*src="\/page-transition-boot\.js[^>]*>/i)?.[0] || "";
  assert.ok(bootTag, `${label}: synchronous boot script is missing`);
  assert.doesNotMatch(bootTag, /\sdefer(?:\s|=|>)/i, `${label}: boot script cannot be deferred`);

  assert.match(
    source,
    new RegExp(`<html\\b[^>]*data-page-loader-page="${loaderMode}"`, "i"),
    `${label}: the early boot loader mode is missing or wrong`
  );

  const loaderTags = [...source.matchAll(/<[^>]+\sdata-page-loader(?:\s|=|>)[^>]*>/gi)]
    .map(([tag]) => tag);
  assert.equal(loaderTags.length, 1, `${label}: expected exactly one page loader`);
  const loaderTag = loaderTags[0] || "";
  assert.match(loaderTag, /class="[^"]*\bis-hidden\b[^"]*"/i, `${label}: loader must start hidden`);
  assert.match(
    loaderTag,
    new RegExp(`data-page-loader-mode="${loaderMode}"`, "i"),
    `${label}: loader DOM mode does not match its page mode`
  );
  assert.match(loaderTag, /data-page-loader-state="checking"/i);
  assert.match(loaderTag, /data-page-loader-grace="120"/i);
  assert.match(loaderTag, /data-page-loader-playback-speed="2"/i);
  assert.match(loaderTag, /data-page-loader-color="[^"]+"/i);
  assert.match(loaderTag, /aria-hidden="true"/i);

  const animationTargets = [...source.matchAll(/data-page-loader-animation="manual"/gi)];
  assert.equal(animationTargets.length, 1, `${label}: expected one manual Logo animation target`);
  assert.match(
    source,
    /class="[^"]*\bsplash__text\b[^"]*"[^>]*>\s*Loading\s*</i,
    `${label}: visible Loading label is missing`
  );

  for (const asset of [
    "/page-loader.js",
    "/assets/brand/loading-bridge.js",
    "/assets/brand/lottie.min.js",
    "/assets/brand/loading-data.js"
  ]) {
    assert.equal(assetReferenceCount(source, asset), 1, `${label}: expected one ${asset} reference`);
  }
  assert.ok(
    source.indexOf("/assets/brand/loading-data.js")
      > source.indexOf("/assets/brand/lottie.min.js"),
    `${label}: Lottie must load before its animation data`
  );
  for (const asset of [
    "/assets/brand/lottie.min.js",
    "/assets/brand/loading-data.js"
  ]) {
    const tag = source.match(new RegExp(`<script\\b[^>]*src="${asset.replaceAll("/", "\\/")}[^>]*>`, "i"))?.[0] || "";
    assert.match(tag, /\sdefer(?:\s|=|>)/i, `${label}: ${asset} must not block Loader startup`);
  }
};

async function testSourceIntegration() {
  const transitionCss = await read("page-transition.css");
  const sharedLoaderRule = transitionCss.match(
    /\.splash(?:\[data-page-loader\])?\s*\{([^}]*)\}/
  )?.[1] || "";
  assert.match(sharedLoaderRule, /position:\s*fixed\s*;/, "the shared loader must cover the viewport");
  assert.match(sharedLoaderRule, /inset:\s*0\s*;/);
  assert.match(sharedLoaderRule, /display:\s*grid\s*;/);
  assert.match(sharedLoaderRule, /place-items:\s*center\s*;/);
  assert.match(sharedLoaderRule, /background\s*:/, "the loader cannot reveal route-specific content");
  assert.match(sharedLoaderRule, /transition:\s*[^;]*opacity[^;]*visibility[^;]*;/);
  assert.match(
    transitionCss,
    /\.splash(?:\[data-page-loader\])?\.is-hidden\s*\{[^}]*opacity:\s*0\s*;[^}]*visibility:\s*hidden\s*;[^}]*pointer-events:\s*none\s*;/,
    "every route needs the same hidden loader state"
  );
  assert.match(
    transitionCss,
    /\.splash(?:\[data-page-loader\])?\[hidden\]\s+\.splash__inner\s*\{[^}]*display:\s*none\s*;/,
    "disposed Lottie content must not remain in layout"
  );
  assert.match(
    transitionCss,
    /\.splash(?:\[data-page-loader\])?\s+\.splash__mark\s*\{[^}]*width:\s*5rem\s*;[^}]*aspect-ratio:\s*1\s*;[^}]*loading-logo\.png[^}]*\}/,
    "the shared loader needs the static Logo fallback"
  );
  assert.match(
    transitionCss,
    /\.splash(?:\[data-page-loader\])?\s+\.splash__mark--lottie\.is-animated\s*\{[^}]*background:\s*none\s*;/,
    "the static Logo must yield to the running Lottie"
  );
  assert.match(
    transitionCss,
    /\.splash(?:\[data-page-loader\])?\s+\.splash__mark--lottie\s+svg\s*\{[^}]*display:\s*block\s*;[^}]*width:\s*100%\s*;[^}]*height:\s*100%\s*;/,
    "the animated Logo must preserve the shared mark dimensions"
  );
  assert.match(
    transitionCss,
    /\.splash(?:\[data-page-loader\])?\s+\.splash__text\s*\{[^}]*text-transform:\s*uppercase\s*;/,
    "the shared Loading label styling is missing"
  );
  assert.match(
    transitionCss,
    /\.splash\[data-page-loader\]\[data-page-loader-tone="dark"\][^{]*\.splash__mark\s*\{[^}]*filter:\s*brightness\(0\)\s+invert\(1\)\s*;/,
    "dark transition loaders must render the Logo in its light inverse"
  );
  assert.match(
    transitionCss,
    /\.splash\[data-page-loader\]\[data-page-loader-tone="dark"\][^{]*\.splash__text\s*\{[^}]*color:\s*var\(--page-loader-inverse-muted\)\s*;/,
    "dark transition loaders must render a light Loading label"
  );
  assert.doesNotMatch(
    transitionCss,
    /scrollbar-gutter\s*:/,
    "a permanent scrollbar gutter leaves an uncovered strip at the page edge"
  );
  assert.match(
    transitionCss,
    /html\.page-transition-locked\s*\{[\s\S]*?touch-action:\s*none\s*;[\s\S]*?overscroll-behavior:\s*none\s*;/,
    "the transition must suppress touch scrolling without changing layout overflow"
  );
  const lockedRule = transitionCss.match(/html\.page-transition-locked\s*\{([\s\S]*?)\}/)?.[1] || "";
  assert.doesNotMatch(lockedRule, /overflow\s*:/, "transition locking cannot change the scroll container");
  assert.match(
    transitionCss,
    /--page-transition-scrollbar-paint:\s*color-mix\([\s\S]*?--page-transition-scrollbar-target\)\s+var\(--page-transition-scrollbar-reveal\)/,
    "transition scrollbars must blend from the cover into the revealed page"
  );
  assert.match(
    transitionCss,
    /html\.page-transition-arriving,\s*html\.page-transition-locked\s*\{[\s\S]*?scrollbar-color:\s*var\(--page-transition-scrollbar-paint\)\s+var\(--page-transition-scrollbar-paint\)\s*;/,
    "the locked scrollbar must follow the pixel reveal paint without changing width"
  );
  assert.match(
    transitionCss,
    /html:has\(\[data-page-loader\]\[data-page-loader-state="loading"\]\)[\s\S]*?scrollbar-color:\s*var\(--page-transition-color\)\s+var\(--page-transition-color\)\s*;/,
    "the visible page loader must mask its scrollbar even when motion is reduced"
  );
  assert.match(
    transitionCss,
    /data-page-loader-state="complete"\]\:not\(\[hidden\]\)[\s\S]*?::\-webkit-scrollbar-corner[\s\S]*?background-color:\s*var\(--page-transition-scrollbar-paint\)\s*;/,
    "the loader scrollbar must use the synchronized paint until the loader is hidden"
  );
  assert.doesNotMatch(
    transitionCss,
    /scrollbar-width\s*:\s*none|::\-webkit-scrollbar\s*\{[^}]*\b(?:width\s*:\s*0|display\s*:\s*none)/,
    "scrollbar masking cannot remove its layout width"
  );

  const transitionScript = await read("page-transition.js");
  assert.match(transitionScript, /const lockPageScroll = \(\) =>/);
  assert.match(transitionScript, /const unlockPageScroll = \(\) =>/);
  assert.match(transitionScript, /addEventListener\("wheel", blockScrollEvent, scrollBlockOptions\)/);
  assert.match(transitionScript, /addEventListener\("touchmove", blockScrollEvent, scrollBlockOptions\)/);
  assert.match(transitionScript, /addEventListener\("keydown", blockScrollKey, scrollBlockOptions\)/);
  assert.match(transitionScript, /removeEventListener\("wheel", blockScrollEvent, scrollBlockOptions\)/);
  assert.match(transitionScript, /const beginScrollbarReveal = \(targetColor\) =>/);
  assert.match(transitionScript, /const syncScrollbarReveal = \(edgeCoverage\) =>/);
  assert.match(
    transitionScript,
    /let preserveOutgoingCover = false;/,
    "the transition must track whether an outgoing navigation owns the current cover"
  );
  assert.match(
    transitionScript,
    /const commitNavigation = \(href, preserveCover = false\) => \{\s*preserveOutgoingCover = preserveCover;\s*try \{\s*window\.location\.assign\(href\);\s*\} catch \(error\) \{\s*clearStoredState\(\);\s*cleanup\(\);\s*throw error;\s*\}\s*\};/,
    "navigation assignment failures must restore the current page"
  );
  assert.match(
    transitionScript,
    /saveStoredState\(state\);\s*commitNavigation\(target\.href, true\);/,
    "animated navigation must preserve its completed cover before pagehide"
  );
  assert.match(
    transitionScript,
    /window\.addEventListener\("pagehide", \(\) => \{\s*cancelAnimationFrame\(frame\);\s*if \(preserveOutgoingCover && overlay\?\.canvas\.isConnected\) return;\s*cleanup\(\);\s*\}\);/,
    "a committed navigation must retain its opaque cover through pagehide"
  );
  assert.match(
    transitionScript,
    /transitioning = false;\s*preserveOutgoingCover = false;/,
    "normal and BFCache cleanup must reset the committed-navigation guard"
  );
  assert.match(
    transitionScript,
    /window\.addEventListener\("pageshow", \(event\) => \{\s*if \(event\.persisted\) cleanup\(\);\s*\}\);/,
    "a BFCache restore must remove the retained outgoing cover"
  );
  assert.match(transitionScript, /const transitionTone = \(color\) =>/);
  assert.match(transitionScript, /luminance < 0\.179 \? "dark" : "light"/);
  assert.match(
    transitionScript,
    /loader\.dataset\.pageLoaderTone = transitionTone\(color\)/
  );
  assert.match(
    transitionScript,
    /delete loader\.dataset\.pageLoaderTone/
  );
  assert.match(transitionScript, /edgeCoverageTotal \+= alpha \* scale \* scale/);
  assert.match(transitionScript, /const edgeCoverage = drawCells\(overlay, state\.cells, "reveal", progress\)/);
  assert.match(transitionScript, /syncScrollbarReveal\(edgeCoverage\)/);
  assert.match(transitionScript, /syncScrollbarReveal\(0\)/);
  assert.doesNotMatch(transitionScript, /document\.body\.classList\.(?:add|remove)\("page-transition-locked"\)/);

  const homePaths = ["index.html", "src/pages/index.astro"];
  for (const path of homePaths) {
    const source = await read(path);
    assertTransitionShell(source, path, { loaderMode: "external" });
    assertUnmarkedHref(source, "/#top", path);
    assertUnmarkedHref(source, "#work", path);
    assertMarkedHref(source, "/about/", path);
    assertMarkedHref(source, "/playground/", path);
    [
      "/work/alipay-wealth-professionalization/",
      "/work/overseas-brokerage/",
      "/work/ai-design-agent/"
    ].forEach((href) => assertMarkedHref(source, href, path));

    const cards = [...source.matchAll(/<article\b[^>]*data-case-href="[^"]+"[^>]*>/gi)]
      .map(([tag]) => tag);
    assert.equal(cards.length, 3, `${path}: expected three case cards`);
    cards.forEach((card) => assert.match(card, /\sdata-page-transition(?:\s|=|>)/));
    assert.match(source, /data-work-stage[\s\S]{0,160}data-page-transition|data-page-transition[\s\S]{0,160}data-work-stage/);
  }

  const about = await read("about/index.html");
  assertTransitionShell(about, "about/index.html", { loaderMode: "external" });
  assertMarkedHref(about, "/#top", "about/index.html");
  assertMarkedHref(about, "/#work", "about/index.html");

  const playground = await read("src/pages/playground/index.astro");
  assertTransitionShell(playground, "src/pages/playground/index.astro", { loaderMode: "auto" });
  assertMarkedHref(playground, "/#top", "src/pages/playground/index.astro");
  assertMarkedHref(playground, "/#work", "src/pages/playground/index.astro");
  assertMarkedHref(playground, "/about/", "src/pages/playground/index.astro");

  const caseStudies = [
    ["ai-design-agent", "/work/overseas-brokerage/"],
    ["alipay-wealth-professionalization", "/work/ai-design-agent/"],
    ["overseas-brokerage", "/work/alipay-wealth-professionalization/"]
  ];
  const caseNavScript = await read("case-nav.js");
  assert.match(caseNavScript, /const setupNextProjectScramble = \(\) =>/);
  assert.match(caseNavScript, /querySelector\("\.case-next-project__label"\)/);
  assert.match(caseNavScript, /label\.style\.inlineSize =/);
  assert.match(caseNavScript, /label\.addEventListener\("mouseenter"/);
  assert.doesNotMatch(caseNavScript, /link\.addEventListener\("mouseenter"/);
  assert.match(
    caseNavScript,
    /label\.textContent = text;\s*label\.style\.removeProperty\("inline-size"\)/,
    "NEXT must restore its original text and geometry in the same update"
  );
  assert.match(caseNavScript, /setupNextProjectScramble\(\);/);
  for (const [slug, next] of caseStudies) {
    for (const prefix of ["public/work", "work"]) {
      const path = `${prefix}/${slug}/index.html`;
      const source = await read(path);
      assertTransitionShell(source, path, { loaderMode: "auto" });
      assertMarkedHref(source, "/#top", path);
      assertMarkedHref(source, "/#work", path);
      assertMarkedHref(source, "/about/", path);
      assertMarkedHref(source, next, path);
      assert.match(source, /case-next-project\.css\?v=20260802-next-hover-1/);
      assert.match(source, /case-nav\.js\?v=20260802-next-hover-2/);
      assert.match(source, /class="case-next-project__label">NEXT<\/span>/);
    }
  }

  const homeScript = await read("main.js");
  const astroHomeScript = await read("src/scripts/home.js");
  const aboutScript = await read("about/about.js");
  for (const [label, source] of [
    ["main.js", homeScript],
    ["src/scripts/home.js", astroHomeScript],
    ["about/about.js", aboutScript]
  ]) {
    assert.match(source, /portfolioLoadingBridge\.completeWhen/);
    assert.doesNotMatch(source, /splashCycleFallback|durationMs|waitForWindowLoad|waitForDocumentImages/);
    assert.doesNotMatch(source, /setTimeout\([\s\S]{0,80}320/);
    assert.match(source, /waitForCriticalImages/);
    assert.ok(source.length > 0, `${label} is empty`);
  }

  assert.match(homeScript, /waitForPageResources\(criticalImagesReady, heroPortraitReady\)/);
  assert.match(homeScript, /event\.metaKey[\s\S]{0,80}event\.ctrlKey/);
  assert.match(aboutScript, /waitForPageResources\(criticalImagesReady, slideshowReady\)/);

  const bridge = await read("assets/brand/loading-bridge.js");
  assert.match(bridge, /loopComplete/);
  assert.match(bridge, /animationBoundary\(\)/);
  assert.match(bridge, /animationBoundary\(\{ finished: true \}\)/);
  assert.doesNotMatch(bridge, /durationMs|animation\.op\s*-\s*window\.LOADING_ANIMATION\.ip/);
  assert.match(
    bridge,
    /pageLoaderMode[\s\S]*?auto[\s\S]*?DOMContentLoaded[\s\S]*?installLottie/,
    "auto pages must request the Logo animation once their DOM is ready"
  );
}

async function testMirrorsAndBuildOutput() {
  for (const file of [
    "page-transition.css",
    "page-transition-boot.js",
    "page-loader.js",
    "page-transition.js"
  ]) {
    assert.equal(await read(file), await read(`public/${file}`), `${file} mirror drifted`);
    assert.equal(await read(file), await read(`dist/${file}`), `${file} is missing from the build`);
  }
  for (const file of ["loading-bridge.js", "loading-data.js", "lottie.min.js"]) {
    const sourcePath = `assets/brand/${file}`;
    assert.equal(
      await read(sourcePath),
      await read(`public/${sourcePath}`),
      `${file} public mirror drifted`
    );
    assert.equal(
      await read(sourcePath),
      await read(`dist/${sourcePath}`),
      `${file} is missing or stale in the build`
    );
  }
  assert.equal(
    await read("case-nav.js"),
    await read("public/case-nav.js"),
    "case-nav.js public mirror drifted"
  );
  assert.equal(
    await read("case-nav.js"),
    await read("dist/case-nav.js"),
    "case-nav.js is missing or stale in the build"
  );
  assert.equal(
    await read("public/case-next-project.css"),
    await read("dist/case-next-project.css"),
    "case-next-project.css is missing or stale in the build"
  );

  assertTransitionShell(
    await read("playground/index.html"),
    "playground/index.html",
    { loaderMode: "auto" }
  );

  const builtPages = [
    ["dist/index.html", "external"],
    ["dist/about/index.html", "external"],
    ["dist/playground/index.html", "auto"],
    ["dist/work/ai-design-agent/index.html", "auto"],
    ["dist/work/alipay-wealth-professionalization/index.html", "auto"],
    ["dist/work/overseas-brokerage/index.html", "auto"]
  ];
  for (const [path, loaderMode] of builtPages) {
    assertTransitionShell(await read(path), path, { loaderMode });
  }
}

await testManualAnimationBoundary();
await testAutoLoaderFastAndSlowPaths();
await testBridgeAutoInstallation();
await testBridgeFastAndSlowPaths();
await testSourceIntegration();
await testMirrorsAndBuildOutput();
console.log("Page transition integration tests: OK");
