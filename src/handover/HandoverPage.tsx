import { useEffect } from "react";
import { HandoverHeader } from "./HandoverHeader";
import { Hero } from "./Hero";
import { HandoverMotion } from "./motion";
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
  PartTwoSection,
  ProposalStory,
  RepairStory,
  ScopeAndCta,
} from "./sections/StorySections";
import { SkyAtmosphere } from "./SkyAtmosphere";
import { StateJourneySection } from "./StateJourney";
import { useSectionEnters } from "./useSectionEnters";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource/instrument-sans/400.css";
import "@fontsource/instrument-sans/500.css";
import "@fontsource/instrument-sans/600.css";
import "@fontsource/instrument-sans/700.css";
import "./handover.css";

const PAGE_TITLE =
  "AI Travel Agent Trust Moment · Product Design Assignment · Sarthak Goyal";
const META_DESCRIPTION =
  "A working interaction system for how a consumer AI travel agent proposes, confirms, repairs, and safely hands off a flight rebooking.";

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
      content: "Designing the moment an AI travel agent acts",
    });
    const ogDescription = ensureMeta('meta[property="og:description"]', {
      property: "og:description",
      content:
        "A product-design assignment covering bounded approval, failure repair, and human escalation for an AI flight-rebooking agent.",
    });
    const ogImage = ensureMeta('meta[property="og:image"]', {
      property: "og:image",
      content: "/handover/og.jpg",
    });
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
      theme.setAttribute("content", "#F5F5F2");
      delete document.documentElement.dataset.handover;
      document.documentElement.style.colorScheme = "";
    };
  }, []);
}

export function HandoverPage() {
  useDocumentMeta();
  useSectionEnters();

  return (
    <HandoverMotion>
      <div className="vx-root">
        <SkyAtmosphere />
        <div className="vx-shell">
          <a href="#main" className="vx-skip">
            Skip to content
          </a>
          <HandoverHeader />
          <Hero />
          <TrustStrip />
          <main id="main">
            <TensionSection />
            <PrinciplesSection />
            <StateJourneySection />
            <ProposalStory />
            <ConfirmationStory />
            <RepairStory />
            <HandoffSection />
            <ExecutionSection />
            <DecisionsAccordion />
            <PartTwoSection />
            <ScopeAndCta />
          </main>
        </div>
      </div>
    </HandoverMotion>
  );
}
