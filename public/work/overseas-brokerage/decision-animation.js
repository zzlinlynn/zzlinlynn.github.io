(() => {
  const diagrams = document.querySelectorAll("[data-decision-motion]");
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  diagrams.forEach((diagram) => {
    const sentinel = diagram.querySelector(".motion-timeline-sentinel");

    if (
      !sentinel ||
      prefersReducedMotion.matches ||
      !("IntersectionObserver" in window)
    ) {
      diagram.classList.add("is-complete");
      return;
    }

    let hasPlayed = false;
    let observer;

    const complete = () => {
      hasPlayed = true;
      observer?.unobserve(diagram);
      diagram.classList.remove("is-pending", "is-playing");
      diagram.classList.add("is-complete");
    };

    const play = () => {
      diagram.classList.remove("is-pending", "is-playing", "is-complete");

      // Force layout so a completed timeline can restart on hover.
      void diagram.offsetWidth;
      diagram.classList.add("is-playing");
    };

    observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (!entry?.isIntersecting || hasPlayed) {
          return;
        }

        hasPlayed = true;
        play();
        observer.unobserve(diagram);
      },
      { threshold: 0.35 }
    );

    diagram.classList.add("is-pending");
    observer.observe(diagram);

    const finishTimeline = (event) => {
      if (event.animationName !== "motion-timeline") {
        return;
      }

      complete();
    };

    sentinel.addEventListener("animationend", finishTimeline);
    sentinel.addEventListener("animationcancel", finishTimeline);

    const stopForReducedMotion = (event) => {
      if (event.matches) {
        complete();
      }
    };

    if (prefersReducedMotion.addEventListener) {
      prefersReducedMotion.addEventListener("change", stopForReducedMotion, {
        once: true,
      });
    } else {
      prefersReducedMotion.addListener(stopForReducedMotion);
    }

    diagram.addEventListener("mouseenter", () => {
      if (
        !prefersReducedMotion.matches &&
        hasPlayed &&
        diagram.classList.contains("is-complete")
      ) {
        play();
      }
    });
  });
})();
