(() => {
  const diagrams = document.querySelectorAll("[data-needs-motion]");
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  const replayClassByPart = {
    understand: "is-replaying-understand",
    execute: "is-replaying-execute",
    control: "is-replaying-control",
  };
  const replayClasses = Object.values(replayClassByPart);

  diagrams.forEach((diagram) => {
    const sentinel = diagram.querySelector(".needs-animation-sentinel");

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
      diagram.classList.remove("is-pending", "is-playing", ...replayClasses);
      diagram.classList.add("is-complete");
    };

    const playAll = () => {
      diagram.classList.remove(
        "is-pending",
        "is-playing",
        "is-complete",
        ...replayClasses
      );
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
        playAll();
        observer.unobserve(diagram);
      },
      { threshold: 0.25 }
    );

    diagram.classList.add("is-pending");
    observer.observe(diagram);

    const finishTimeline = (event) => {
      if (event.animationName === "needs-motion-timeline") {
        complete();
      }
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

    diagram.querySelectorAll(".needs-hit").forEach((hitArea) => {
      hitArea.addEventListener("mouseenter", () => {
        const replayClass = replayClassByPart[hitArea.dataset.needPart];

        if (
          prefersReducedMotion.matches ||
          !replayClass ||
          !hasPlayed ||
          !diagram.classList.contains("is-complete") ||
          diagram.classList.contains(replayClass)
        ) {
          return;
        }

        diagram.classList.remove(replayClass);
        void diagram.offsetWidth;
        diagram.classList.add(replayClass);
      });
    });

    const clearReplayClass = (selector, animationName, replayClass) => {
      const animatedPart = diagram.querySelector(selector);

      if (!animatedPart) {
        return;
      }

      const finishReplay = (event) => {
        if (event.animationName === animationName) {
          diagram.classList.remove(replayClass);
        }
      };

      animatedPart.addEventListener("animationend", finishReplay);
      animatedPart.addEventListener("animationcancel", finishReplay);
    };

    clearReplayClass(
      ".needs-signal--upper",
      "needs-signal-upper",
      replayClassByPart.understand
    );
    clearReplayClass(
      ".needs-needle-motion",
      "needs-dial-turn",
      replayClassByPart.execute
    );
    clearReplayClass(
      ".needs-control-cursor",
      "needs-control-cursor",
      replayClassByPart.control
    );
  });
})();
