import { useEffect, useId, useState } from "react";
import { m, useReducedMotion } from "motion/react";
import { BRAND, NAV_ITEMS, protoHref } from "./webData";
import { ProtoLink } from "../handover/ProtoLink";
import { EASE } from "../handover/motion";

const NAV_IDS = NAV_ITEMS.map((item) => item.id);
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

export function WebHeader() {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const active = useActiveSection();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="vx-header is-glass">
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
              aria-label={`${BRAND.name} · ${BRAND.tagline}`}
            >
              <span className="vx-brand-full" aria-hidden="true">
                {BRAND.name}
              </span>
              <span className="vx-brand-short" aria-hidden="true">
                {BRAND.name}
              </span>
            </a>

            <div className="vx-header-middle">
              <nav className="vx-header-nav" aria-label="Sections">
                {NAV_ITEMS.map((item) => (
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
              </nav>
            </div>

            <div className="vx-header-actions">
              <ProtoLink
                href={protoHref()}
                className="vx-btn vx-btn-primary vx-btn-sm"
              >
                <span className="vx-btn-label-full">Try Voyage</span>
                <span className="vx-btn-label-short">Try it</span>
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
