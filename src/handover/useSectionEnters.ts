import { useEffect } from "react";

const STICKY_SECTION_IDS = new Set([
  "proposal",
  "confirmation",
  "repair",
  "handoff",
]);

/**
 * Marks main `.vx-section` nodes as entered for CSS transitions.
 * Sticky stack sections only get opacity/wash (no transform on ancestors).
 */
export function useSectionEnters() {
  useEffect(() => {
    const root = document.getElementById("main");
    if (!root) return;

    const sections = Array.from(
      root.querySelectorAll<HTMLElement>(":scope > .vx-section"),
    );
    if (sections.length === 0) return;

    root.classList.add("vx-sections-ready");

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      sections.forEach((section) => {
        section.classList.add("is-entered");
        if (STICKY_SECTION_IDS.has(section.id)) {
          section.classList.add("is-sticky-section");
        }
      });
      return () => {
        root.classList.remove("vx-sections-ready");
      };
    }

    sections.forEach((section) => {
      if (STICKY_SECTION_IDS.has(section.id)) {
        section.classList.add("is-sticky-section");
      }
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-entered");
          observer.unobserve(entry.target);
        });
      },
      { root: null, rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      observer.disconnect();
      root.classList.remove("vx-sections-ready");
    };
  }, []);
}
