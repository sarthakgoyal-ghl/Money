import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  Children,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  AnimatePresence,
  m,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import type { ScreenShot } from "./handoverData";
import { EASE } from "./motion";

interface ScreenLightboxProps {
  screen: ScreenShot;
  open: boolean;
  onClose: () => void;
  returnFocusRef: React.RefObject<HTMLElement | null>;
}

export function ScreenLightbox({
  screen,
  open,
  onClose,
  returnFocusRef,
}: ScreenLightboxProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const previousBody = document.body.style.overflow;
    const previousHtml = html.style.overflow;
    document.body.style.overflow = "hidden";
    html.style.overflow = "hidden";
    html.classList.add("vx-lightbox-open");
    // Defer focus so the portaled dialog is in the DOM.
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 0);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousBody;
      html.style.overflow = previousHtml;
      html.classList.remove("vx-lightbox-open");
      document.removeEventListener("keydown", onKey);
      returnFocusRef.current?.focus();
    };
  }, [open, onClose, returnFocusRef]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <m.div
          className="vx-lightbox"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          ref={dialogRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0.01 : 0.2 }}
        >
          <button
            type="button"
            className="vx-lightbox-scrim"
            aria-label="Close enlarged screenshot"
            onClick={onClose}
          />
          <m.div
            className="vx-lightbox-panel"
            initial={reduce ? false : { opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: reduce ? 0.01 : 0.28, ease: EASE }}
          >
            <div className="vx-lightbox-toolbar">
              <p id={titleId}>{screen.alt}</p>
              <button
                ref={closeRef}
                type="button"
                className="vx-btn vx-btn-secondary vx-btn-sm"
                onClick={onClose}
              >
                Close
              </button>
            </div>
            <div className="vx-lightbox-frame">
              <img
                src={screen.src}
                alt={screen.alt}
                width={screen.width}
                height={screen.height}
                className="vx-lightbox-img"
              />
            </div>
          </m.div>
        </m.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

interface ScreenFigureProps {
  screen: ScreenShot;
  size?: "hero" | "story" | "card" | "compact";
  priority?: boolean;
  className?: string;
  rotate?: number;
  stackedBehind?: ScreenShot;
  interactive?: boolean;
}

export function ScreenFigure({
  screen,
  size = "story",
  priority = false,
  className = "",
  rotate = 0,
  stackedBehind,
  interactive = true,
}: ScreenFigureProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const reduce = useReducedMotion();
  const onClose = useCallback(() => setOpen(false), []);

  const figure = (
    <figure
      className={`vx-phone vx-phone-${size} ${className}`.trim()}
      style={
        rotate && !reduce
          ? { transform: `rotate(${rotate}deg)` }
          : undefined
      }
    >
      {stackedBehind ? (
        <div className="vx-phone-stack" aria-hidden="true">
          <div className="vx-phone-bezel is-ghost">
            <img
              src={stackedBehind.src}
              alt=""
              width={stackedBehind.width}
              height={stackedBehind.height}
              loading="lazy"
              className="vx-phone-img"
            />
          </div>
        </div>
      ) : null}
      {interactive ? (
        <m.button
          ref={triggerRef}
          type="button"
          className="vx-phone-trigger"
          onClick={() => setOpen(true)}
          aria-label={`Enlarge screenshot: ${screen.alt}`}
          whileHover={reduce ? undefined : { y: -6 }}
          whileTap={reduce ? undefined : { scale: 0.98 }}
        >
          <div className="vx-phone-bezel">
            <img
              src={screen.src}
              alt={screen.alt}
              width={screen.width}
              height={screen.height}
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              className="vx-phone-img"
            />
          </div>
        </m.button>
      ) : (
        <div className="vx-phone-bezel">
          <img
            src={screen.src}
            alt={screen.alt}
            width={screen.width}
            height={screen.height}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className="vx-phone-img"
          />
        </div>
      )}
    </figure>
  );

  return (
    <>
      {figure}
      {interactive ? (
        <ScreenLightbox
          screen={screen}
          open={open}
          onClose={onClose}
          returnFocusRef={triggerRef}
        />
      ) : null}
    </>
  );
}

export type StoryStep = {
  id: string;
  label: string;
  title: string;
  body: ReactNode;
  screen: ScreenShot;
};

interface StickyProductStoryProps {
  steps: StoryStep[];
  tone?: "light" | "blue" | "soft";
  /** Kept under the steps so CTAs share the content spine. */
  footer?: ReactNode;
  /**
   * `stack` — upcoming cards overlay preceding ones while scrolling.
   * `rows` — flat paired list (default).
   */
  layout?: "rows" | "stack";
}

function ProductStepCard({
  step,
  index,
  className = "",
  style,
}: {
  step: StoryStep;
  index: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <article className={`vx-product-step ${className}`.trim()} style={style}>
      <div className="vx-product-step-copy">
        <p className="vx-eyebrow">
          <span className="vx-product-step-num" aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </span>
          [{step.label}]
        </p>
        <h3>{step.title}</h3>
        <div className="vx-story-body">{step.body}</div>
      </div>
      <div className="vx-product-step-media">
        <ScreenFigure screen={step.screen} size="story" />
      </div>
    </article>
  );
}

/**
 * Motion scroll-stack — sticky pin + scale linked to container progress.
 * Pattern from Motion / Framer scroll cards (useScroll + useTransform).
 */
function StackSlot({
  index,
  total,
  progress,
  children,
}: {
  index: number;
  total: number;
  progress: MotionValue<number>;
  children: ReactNode;
}) {
  const rangeStart = index / Math.max(total, 1);
  const targetScale = 1 - (total - index) * 0.05;
  const scale = useTransform(progress, [rangeStart, 1], [1, targetScale]);

  return (
    <div className="vx-stack-slot" style={{ zIndex: index + 1 }}>
      <div
        className="vx-stack-pin"
        style={{ top: `calc(var(--vx-header-h) + 60px + ${index * 20}px)` }}
      >
        <m.div className="vx-stack-scale" style={{ scale, transformOrigin: "top center" }}>
          {children}
        </m.div>
      </div>
    </div>
  );
}

/** Generic scroll-stack for arbitrary card children. */
export function ScrollStack({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });
  const cards = Children.toArray(children);

  if (reduce) {
    return (
      <div className={`vx-stack-story is-static ${className}`.trim()}>
        {cards}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`vx-stack-story ${className}`.trim()}>
      <div className="vx-stack-track">
        {cards.map((card, index) => (
          <StackSlot
            key={index}
            index={index}
            total={cards.length}
            progress={scrollYProgress}
          >
            {card}
          </StackSlot>
        ))}
      </div>
    </div>
  );
}

function MotionStackStory({
  steps,
  tone,
  footer,
}: {
  steps: StoryStep[];
  tone: string;
  footer?: ReactNode;
}) {
  return (
    <div className={`vx-product-story is-${tone}`}>
      <ScrollStack>
        {steps.map((step, index) => (
          <ProductStepCard
            key={step.id}
            step={step}
            index={index}
            className="vx-stack-card"
          />
        ))}
      </ScrollStack>
      {footer ? <div className="vx-product-story-footer">{footer}</div> : null}
    </div>
  );
}

/**
 * Product story: paired rows, or Motion scroll-stacked overlay cards.
 */
export function StickyProductStory({
  steps,
  tone = "light",
  footer,
  layout = "rows",
}: StickyProductStoryProps) {
  const reduce = useReducedMotion();

  if (layout === "stack" && !reduce) {
    return <MotionStackStory steps={steps} tone={tone} footer={footer} />;
  }

  return (
    <div className={`vx-product-story is-${tone}`}>
      {steps.map((step, index) => (
        <ProductStepCard key={step.id} step={step} index={index} />
      ))}
      {footer ? <div className="vx-product-story-footer">{footer}</div> : null}
    </div>
  );
}

export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduce = useReducedMotion();
  return (
    <m.div
      ref={ref}
      className={className}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: reduce ? 0.01 : 0.55, ease: EASE, delay }}
    >
      {children}
    </m.div>
  );
}
