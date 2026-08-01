import {
  FUTURE_TESTS,
  STATE_LINK_GROUPS,
  STATE_LINKS,
  protoHref,
} from "./handoverData";
import { FigmaButton } from "./FigmaButton";
import { ProtoLink, CtaRow } from "./ProtoLink";

export function StateLinkGroup() {
  return (
    <div className="ho-state-groups">
      {STATE_LINK_GROUPS.map((group) => {
        const links = STATE_LINKS.filter((link) => link.group === group.id);
        return (
          <div key={group.id} className="ho-state-group">
            <h4>{group.label}</h4>
            <ul>
              {links.map((link) => (
                <li key={link.label}>
                  <ProtoLink href={link.href} className="ho-btn ho-btn-secondary ho-btn-sm">
                    {link.label}
                  </ProtoLink>
                  {link.note ? (
                    <span className="ho-state-note">{link.note}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export function ScopeSection() {
  return (
    <div className="ho-scope-bento">
      <article>
        <h3>Scope</h3>
        <ul>
          <li>One adult traveller</li>
          <li>One domestic segment</li>
          <li>Same airline</li>
          <li>Direct booking</li>
          <li>Saved payment method</li>
          <li>Deterministic simulated APIs</li>
        </ul>
      </article>
      <article>
        <h3>Limitations</h3>
        <ul>
          <li>No real airline inventory</li>
          <li>No real payment</li>
          <li>No multi-passenger booking</li>
          <li>No multi-segment itinerary</li>
          <li>No loyalty or upgrade logic</li>
          <li>No airline-policy exceptions</li>
          <li>No real specialist integration</li>
        </ul>
      </article>
      <article className="is-future">
        <h3>What I would test next</h3>
        <p className="ho-future-badge">Future tests: no results claimed</p>
        <ul className="ho-future-rows">
          {FUTURE_TESTS.map((test) => (
            <li key={test.name}>
              <strong>{test.name}</strong>
              <span>{test.question}</span>
            </li>
          ))}
        </ul>
      </article>
    </div>
  );
}

export function HandoverFooter() {
  return (
    <footer className="ho-footer">
      <CtaRow>
        <ProtoLink href={protoHref()} className="ho-btn ho-btn-primary">
          Launch prototype
        </ProtoLink>
        <FigmaButton />
        <a href="#part-2" className="ho-text-link">
          Read funnel diagnosis →
        </a>
      </CtaRow>

      <div className="ho-footer-meta">
        <p className="ho-footer-name">Sarthak Goyal</p>
        <p className="ho-footer-role">
          Senior Product Designer and Design Engineer
        </p>
        <p className="ho-footer-note">
          Designed and built as a deterministic prototype for the Jupiter Money
          Senior Product Designer, AI-Native Surfaces assignment.
        </p>
      </div>
    </footer>
  );
}
