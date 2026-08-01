import {
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import {
  AnimatePresence,
  LayoutGroup,
  m,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "motion/react";
import { NAV_ITEMS, protoHref } from "./handoverData";
import { ProtoLink } from "./ProtoLink";
import { EASE } from "./motion";

const NAV_IDS = NAV_ITEMS.map((item) => item.id);
/** Past hero + trust strip roughly — then chapters extend the primary pill. */
const CHAPTER_REVEAL_Y = 220;
/** Focus line below the floating header — last section top above this wins. */
const SECTION_FOCUS_Y = 120;

function useActiveSection() {
  const [active, setActive] = useState<string>(NAV_IDS[0] ?? "");

  useEffect(() => {
    const sections = NAV_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el != null,
    );
    if (sections.length === 0) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const focusY = Math.min(
        SECTION_FOCUS_Y,
        Math.round(window.innerHeight * 0.22),
      );
      let next = sections[0]?.id ?? "";
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= focusY) {
          next = section.id;
        } else {
          break;
        }
      }
      setActive((prev) => (prev === next ? prev : next));
    };

    const onScrollOrResize = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("hashchange", update);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("hashchange", update);
    };
  }, []);

  return active;
}

export function HandoverHeader() {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const active = useActiveSection();
  const { scrollY } = useScroll();
  const [chaptersOpen, setChaptersOpen] = useState(false);
  const reduce = useReducedMotion();

  useMotionValueEvent(scrollY, "change", (y) => {
    setChaptersOpen(y > CHAPTER_REVEAL_Y);
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={`vx-header is-glass${chaptersOpen ? " is-reading" : ""}`}
    >
      <div className="vx-header-slot">
        <m.div
          className="vx-header-inner"
          layout={!reduce}
          transition={
            reduce ? { duration: 0.01 } : { duration: 0.4, ease: EASE }
          }
        >
          <div className="vx-header-row">
            <a
              href="#hero"
              className="vx-brand"
              aria-label="AI travel agent · Trust moment"
            >
              <span className="vx-brand-full" aria-hidden="true">
                Trust moment
              </span>
              <span className="vx-brand-short" aria-hidden="true">
                Trust
              </span>
            </a>

            <div className="vx-header-middle">
              <AnimatePresence mode="wait" initial={false}>
                {chaptersOpen ? (
                  <m.div
                    key="chapters"
                    className="vx-header-chapters-wrap"
                    initial={reduce ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduce ? undefined : { opacity: 0, y: -6 }}
                    transition={{ duration: reduce ? 0.01 : 0.28, ease: EASE }}
                  >
                    <ChapterStrip active={active} />
                  </m.div>
                ) : (
                  <m.nav
                    key="primary"
                    className="vx-header-nav"
                    aria-label="Sections"
                    initial={reduce ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduce ? undefined : { opacity: 0, y: -6 }}
                    transition={{ duration: reduce ? 0.01 : 0.28, ease: EASE }}
                  >
                    {NAV_ITEMS.slice(0, 6).map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className={
                          active === item.id
                            ? "vx-nav-link is-active"
                            : "vx-nav-link"
                        }
                      >
                        {item.label}
                      </a>
                    ))}
                  </m.nav>
                )}
              </AnimatePresence>
            </div>

            <div className="vx-header-actions">
              <ProtoLink
                href={protoHref()}
                className="vx-btn vx-btn-primary vx-btn-sm"
              >
                <span className="vx-btn-label-full">Launch prototype</span>
                <span className="vx-btn-label-short">Prototype</span>
              </ProtoLink>
              <button
                type="button"
                className="vx-menu-btn"
                aria-expanded={open}
                aria-controls={menuId}
                onClick={() => setOpen((v) => !v)}
              >
                {open ? "Close" : "Menu"}
              </button>
            </div>
          </div>
        </m.div>

        {open ? (
          <div id={menuId} className="vx-mobile-menu">
            <nav aria-label="Mobile sections">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="vx-mobile-link"
                  onClick={() => setOpen(false)}
                >
                  <span>{item.number}</span>
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  );
}

function ChapterStrip({ active }: { active: string }) {
  const reduce = useReducedMotion();
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    const chip = root.querySelector<HTMLElement>(".vx-chapter-chip.is-active");
    if (!chip) return;
    chip.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [active, reduce]);

  return (
    <nav className="vx-header-chapters" aria-label="Chapter index">
      <LayoutGroup>
        <div ref={scrollerRef} className="vx-chapter-scroller">
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={
                  isActive ? "vx-chapter-chip is-active" : "vx-chapter-chip"
                }
                aria-current={isActive ? "location" : undefined}
              >
                {isActive ? (
                  <m.span
                    className="vx-chapter-chip-bg"
                    layoutId="vx-chapter-active"
                    transition={
                      reduce
                        ? { duration: 0.01 }
                        : { type: "spring", stiffness: 380, damping: 34 }
                    }
                    aria-hidden
                  />
                ) : null}
                <span className="vx-chapter-chip-label">
                  <span aria-hidden="true">{item.number}</span>
                  {item.label}
                </span>
              </a>
            );
          })}
        </div>
      </LayoutGroup>
    </nav>
  );
}

/** @deprecated Prefer header-docked chapters; kept for ChapterRail re-export. */
export function ChapterIndex() {
  return null;
}
