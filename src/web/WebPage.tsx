import { useEffect } from "react";
import { WebHeader } from "./WebHeader";
import { WebHero } from "./WebHero";
import { HandoverMotion } from "../handover/motion";
import {
  PrinciplesSection,
  TensionSection,
  TrustStrip,
} from "./sections/IntroSections";
import {
  ConfirmationStory,
  DecisionsAccordion,
  ExecutionSection,
  HandoffSection,
  FinalCta,
} from "./sections/StorySections";
import { SkyAtmosphere } from "../handover/SkyAtmosphere";
import { useSectionEnters } from "../handover/useSectionEnters";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource/instrument-sans/400.css";
import "@fontsource/instrument-sans/500.css";
import "@fontsource/instrument-sans/600.css";
import "@fontsource/instrument-sans/700.css";
import "../handover/handover.css";
import "./web.css";

const PAGE_TITLE = "Voyage · AI travel agent that rebooks with you in control";
const META_DESCRIPTION =
  "Voyage is an AI travel agent that proposes, confirms, repairs, and safely hands off flight rebooking, so travellers stay in control when plans change.";

function useDocumentMeta() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = PAGE_TITLE;

    const ensureMeta = (selector: string, attrs: Record<string, string>) => {
      let el = document.head.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        document.head.appendChild(el);
      }
      Object.entries(attrs).forEach(([key, value]) => {
        el?.setAttribute(key, value);
      });
      return el;
    };

    const description = ensureMeta('meta[name="description"]', {
      name: "description",
      content: META_DESCRIPTION,
    });
    const ogTitle = ensureMeta('meta[property="og:title"]', {
      property: "og:title",
      content: "Voyage: rebook flights without giving up control",
    });
    const ogDescription = ensureMeta('meta[property="og:description"]', {
      property: "og:description",
      content:
        "An AI travel agent built around exact approval, protected tickets, repair before side effects, and human handoff when automation must stop.",
    });
    const ogImage = ensureMeta('meta[property="og:image"]', {
      property: "og:image",
      content: "/handover/og.jpg",
    });

    const existingTheme = document.head.querySelector(
      'meta[name="theme-color"]',
    ) as HTMLMetaElement | null;
    const previousTheme = existingTheme?.getAttribute("content") ?? "#F5F5F2";
    const theme = ensureMeta('meta[name="theme-color"]', {
      name: "theme-color",
      content: "#e8f0f8",
    });

    document.documentElement.dataset.handover = "true";
    document.documentElement.style.colorScheme = "light";

    return () => {
      document.title = previousTitle;
      description.remove();
      ogTitle.remove();
      ogDescription.remove();
      ogImage.remove();
      theme.setAttribute("content", previousTheme);
      delete document.documentElement.dataset.handover;
      document.documentElement.style.colorScheme = "";
    };
  }, []);
}

export function WebPage() {
  useDocumentMeta();
  useSectionEnters();

  return (
    <HandoverMotion>
      <div className="vx-root" data-page="web">
        <SkyAtmosphere />
        <div className="vx-shell">
          <a href="#main" className="vx-skip">
            Skip to content
          </a>
          <WebHeader />
          <WebHero />
          <TrustStrip />
          <main id="main">
            <TensionSection />
            <PrinciplesSection />
            <ConfirmationStory />
            <HandoffSection />
            <ExecutionSection />
            <DecisionsAccordion />
            <FinalCta />
          </main>
        </div>
      </div>
    </HandoverMotion>
  );
}
