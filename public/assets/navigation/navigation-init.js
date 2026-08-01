(function initializeLynnNavigationMotion(global) {
  "use strict";

  function initialize() {
    const navigation = document.querySelector("[data-navigation-motion]");
    if (!navigation || !global.LynnNavigationMotion || global.navigationMotion) return;

    global.navigationMotion = global.LynnNavigationMotion.create(navigation, {
      scrollTarget: navigation.dataset.scrollTarget || "#hero",
      stateOneLeftAnchor: navigation.dataset.stateOneLeftAnchor || "[data-nav-state-one-left]",
      stateOneRightAnchor: navigation.dataset.stateOneRightAnchor || "[data-nav-state-one-right]"
    });

    const staticProgress = Number.parseFloat(navigation.dataset.navigationStaticProgress);
    if (Number.isFinite(staticProgress)) {
      global.navigationMotion.setProgress(staticProgress);
    }

    global.addEventListener("load", () => global.navigationMotion?.refresh(), { once: true });
    global.addEventListener("pageshow", () => global.navigationMotion?.refresh());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})(window);
