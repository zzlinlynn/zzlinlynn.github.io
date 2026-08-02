(() => {
  const storageKey = "lynn:page-transition:v1";
  const maxAge = 15000;

  const normalizePath = (value) => {
    try {
      const url = new URL(value, window.location.href);
      const path = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "") : "/";
      return `${path}${url.search}${url.hash}`;
    } catch {
      return "";
    }
  };

  const clearStoredState = () => {
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // Storage can be unavailable in private or sandboxed browsing contexts.
    }
  };

  const mayNeedInitialLoader = document.documentElement.hasAttribute("data-page-loader-page");
  let state = null;

  try {
    state = JSON.parse(sessionStorage.getItem(storageKey) || "null");
  } catch {
    clearStoredState();
  }

  const isFresh = state && Date.now() - state.createdAt < maxAge;
  const isDestination = isFresh && normalizePath(state.target) === normalizePath(window.location.href);

  if (!isDestination && !mayNeedInitialLoader) {
    if (state) clearStoredState();
    return;
  }

  if (isDestination && state.color) {
    document.documentElement.style.setProperty("--page-transition-color", state.color);
  }
  document.documentElement.classList.add("page-transition-arriving");
})();
