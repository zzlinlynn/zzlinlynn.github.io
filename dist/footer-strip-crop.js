(() => {
  const footer = document.querySelector(".site-footer--shared");
  const meta = footer?.querySelector(".footer-meta");
  if (!footer || !meta) return;

  let cropFrame = 0;

  const updateCrop = () => {
    window.cancelAnimationFrame(cropFrame);
    cropFrame = window.requestAnimationFrame(() => {
      const metaHeight = meta.getBoundingClientRect().height;
      if (metaHeight > 0) footer.style.height = `${metaHeight}px`;
    });
  };

  updateCrop();
  document.fonts?.ready.then(updateCrop);
  window.addEventListener("resize", updateCrop, { passive: true });
})();
