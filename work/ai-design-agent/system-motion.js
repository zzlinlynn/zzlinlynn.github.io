(() => {
  const diagrams = document.querySelectorAll("[data-system-motion]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  diagrams.forEach((motion) => {
    const variants = motion.querySelectorAll(".system-motion__variant");
    let hasAutoPlayed = false;
    let observer;

    const complete = () => {
      motion.classList.remove("is-pending", "is-playing", "is-hover-replay");
      motion.classList.add("is-complete");
    };

    const play = ({ hoverReplay = false } = {}) => {
      if (reducedMotion.matches) {
        complete();
        return;
      }

      motion.classList.remove(
        "is-pending",
        "is-playing",
        "is-complete",
        "is-hover-replay"
      );
      void motion.offsetWidth;
      motion.classList.add("is-playing");

      if (hoverReplay) {
        motion.classList.add("is-hover-replay");
      }
    };

    motion.addEventListener("animationend", (event) => {
      if (
        event.animationName === "system-timeline" &&
        event.target.classList.contains("system-timeline-sentinel")
      ) {
        complete();
      }
    });

    if (!reducedMotion.matches && "IntersectionObserver" in window) {
      const motionHeight = motion.getBoundingClientRect().height;
      const triggerThreshold = motionHeight
        ? Math.min(0.35, (window.innerHeight * 0.6) / motionHeight)
        : 0.35;

      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];

          if (!entry?.isIntersecting || hasAutoPlayed) return;

          hasAutoPlayed = true;
          observer.unobserve(motion);
          play();
        },
        { threshold: triggerThreshold }
      );

      motion.classList.add("is-pending");
      observer.observe(motion);
    } else {
      hasAutoPlayed = true;
      complete();
    }

    variants.forEach((variant) => {
      variant.addEventListener("mouseenter", () => {
        if (
          hasAutoPlayed &&
          !reducedMotion.matches &&
          motion.classList.contains("is-complete")
        ) {
          play({ hoverReplay: true });
        }
      });
    });

    const stopForReducedMotion = (event) => {
      if (!event.matches) return;

      hasAutoPlayed = true;
      observer?.unobserve(motion);
      complete();
    };

    if (reducedMotion.addEventListener) {
      reducedMotion.addEventListener("change", stopForReducedMotion, {
        once: true,
      });
    } else {
      reducedMotion.addListener(stopForReducedMotion);
    }
  });
})();
