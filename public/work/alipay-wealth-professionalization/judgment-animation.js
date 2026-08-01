(() => {
  const diagrams = document.querySelectorAll("[data-judgment-motion]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const parts = ["gate", "compare", "advantage"];

  const replayClass = (part) => `is-replaying-${part}`;
  const mobilePlayingClass = (part) => `is-mobile-playing-${part}`;
  const mobileCompleteClass = (part) => `is-mobile-complete-${part}`;

  const replayEndTarget = {
    gate: ".judgment-gate-arrowhead-motion",
    compare: ".judgment-triangle-dot-motion",
    advantage: ".judgment-ray-motion--last",
  };

  const replayEndAnimation = {
    gate: "judgment-arrowhead-reveal",
    compare: "judgment-dot-arrive",
    advantage: "judgment-ray-burst",
  };

  const onReducedMotion = (handler) => {
    if (reducedMotion.addEventListener) {
      reducedMotion.addEventListener("change", handler, { once: true });
    } else {
      reducedMotion.addListener(handler);
    }
  };

  const restartClass = (diagram, className) => {
    diagram.classList.remove(className);
    void diagram.offsetWidth;
    diagram.classList.add(className);
  };

  const setupPartEndEvents = (diagram, isMobile) => {
    parts.forEach((part) => {
      const target = diagram.querySelector(replayEndTarget[part]);

      if (!target) {
        return;
      }

      const finishPart = (event) => {
        if (event.animationName !== replayEndAnimation[part]) {
          return;
        }

        diagram.classList.remove(replayClass(part));

        if (isMobile && diagram.classList.contains(mobilePlayingClass(part))) {
          diagram.classList.remove(mobilePlayingClass(part));
          diagram.classList.add(mobileCompleteClass(part));
        }
      };

      target.addEventListener("animationend", finishPart);
      target.addEventListener("animationcancel", finishPart);
    });
  };

  const setupContinuousDiagram = (diagram) => {
    const sentinel = diagram.querySelector(".judgment-animation-sentinel");
    let hasPlayed = false;
    let observer;

    const complete = () => {
      hasPlayed = true;
      observer?.unobserve(diagram);
      diagram.classList.remove(
        "is-pending",
        "is-playing",
        ...parts.map(replayClass)
      );
      diagram.classList.add("is-complete");
    };

    diagram.classList.add("is-pending");

    if (
      reducedMotion.matches ||
      !sentinel ||
      !("IntersectionObserver" in window)
    ) {
      complete();
      return;
    }

    observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || hasPlayed) {
          return;
        }

        hasPlayed = true;
        diagram.classList.remove("is-pending", "is-complete");
        void diagram.offsetWidth;
        diagram.classList.add("is-playing");
        observer.unobserve(diagram);
      },
      { threshold: 0.25 }
    );

    observer.observe(diagram);

    const finishTimeline = (event) => {
      if (event.animationName === "judgment-motion-timeline") {
        complete();
      }
    };

    sentinel.addEventListener("animationend", finishTimeline);
    sentinel.addEventListener("animationcancel", finishTimeline);

    diagram.querySelectorAll(".judgment-hit").forEach((hit) => {
      hit.addEventListener("mouseenter", () => {
        const part = hit.dataset.judgmentPart;

        if (
          reducedMotion.matches ||
          !parts.includes(part) ||
          !hasPlayed ||
          !diagram.classList.contains("is-complete") ||
          diagram.classList.contains(replayClass(part))
        ) {
          return;
        }

        restartClass(diagram, replayClass(part));
      });
    });

    setupPartEndEvents(diagram, false);
    onReducedMotion((event) => {
      if (event.matches) {
        complete();
      }
    });
  };

  const setupMobileDiagram = (diagram) => {
    const played = new Set();
    const observers = new Map();
    diagram.classList.add("is-mobile-ready");

    const completeAll = () => {
      observers.forEach((observer) => observer.disconnect());

      parts.forEach((part) => {
        played.add(part);
        diagram.classList.remove(mobilePlayingClass(part), replayClass(part));
        diagram.classList.add(mobileCompleteClass(part));
      });
    };

    if (
      reducedMotion.matches ||
      !("IntersectionObserver" in window)
    ) {
      completeAll();
      return;
    }

    diagram.querySelectorAll(".judgment-hit").forEach((hit) => {
      const part = hit.dataset.judgmentPart;

      if (!parts.includes(part)) {
        return;
      }

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry?.isIntersecting || played.has(part)) {
            return;
          }

          played.add(part);
          restartClass(diagram, mobilePlayingClass(part));
          observer.unobserve(hit);
        },
        { threshold: 0.55 }
      );

      observers.set(part, observer);
      observer.observe(hit);

      hit.addEventListener("mouseenter", () => {
        if (
          reducedMotion.matches ||
          !played.has(part) ||
          !diagram.classList.contains(mobileCompleteClass(part)) ||
          diagram.classList.contains(replayClass(part))
        ) {
          return;
        }

        restartClass(diagram, replayClass(part));
      });
    });

    setupPartEndEvents(diagram, true);
    onReducedMotion((event) => {
      if (event.matches) {
        completeAll();
      }
    });
  };

  diagrams.forEach((diagram) => {
    if (diagram.dataset.variant === "mobile") {
      setupMobileDiagram(diagram);
    } else {
      setupContinuousDiagram(diagram);
    }
  });
})();
