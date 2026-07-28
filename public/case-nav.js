const updateCaseNav = () => {
  document.body.classList.toggle("is-scrolled", window.scrollY > 12);
};

updateCaseNav();
window.addEventListener("scroll", updateCaseNav, { passive: true });
window.addEventListener("pageshow", updateCaseNav);
