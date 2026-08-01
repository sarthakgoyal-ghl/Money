import { protoHref } from "./handoverData";
import { ProtoLink } from "./ProtoLink";
import { Reveal } from "./ScreenStory";

type Tone = "decide" | "safe" | "change" | "stop";

interface NodeDef {
  label: string;
  href?: string;
  tone: Tone;
}

const MAIN: NodeDef[] = [
  { label: "Request", tone: "decide" },
  { label: "Proposal", href: protoHref("proposal"), tone: "decide" },
  { label: "Confirmation", href: protoHref("confirmation"), tone: "decide" },
  { label: "Execution", href: protoHref("executing"), tone: "safe" },
  { label: "Success", href: protoHref("success"), tone: "safe" },
];

const EXITS = [
  {
    title: "Adjust",
    from: "Proposal",
    summary: "Compare another flight without losing the original ticket.",
    nodes: [
      { label: "Other Options", href: protoHref("alternatives"), tone: "decide" as Tone },
      { label: "Select replacement", tone: "decide" as Tone },
    ],
  },
  {
    title: "Reject",
    from: "Proposal / Confirmation",
    summary: "Keeping AI 621 is a valid outcome. It is not a failure.",
    nodes: [
      { label: "Keep AI 621", href: protoHref("rejected"), tone: "safe" as Tone },
      { label: "No changes made", tone: "safe" as Tone },
    ],
  },
  {
    title: "Interpretation correction",
    from: "Proposal",
    summary:
      "The agent’s interpretation differed from the intended constraint. Correct one unit and search again.",
    nodes: [
      {
        label: "Constraint clarification",
        href: protoHref("misread"),
        tone: "change" as Tone,
      },
      { label: "Correct & search again", tone: "decide" as Tone },
    ],
  },
  {
    title: "Price change",
    from: "Confirmation / Execution",
    summary:
      "The previous approval is invalidated. A new decision is required before side effects.",
    nodes: [
      { label: "Fare → ₹6,240", href: protoHref("price-change"), tone: "change" as Tone },
      { label: "New decision required", tone: "decide" as Tone },
    ],
  },
  {
    title: "Human handoff",
    from: "Execution",
    summary:
      "Payment authorised but ticket not issued. Automation stops; AI 621 remains active.",
    nodes: [
      { label: "Payment ≠ ticket", href: protoHref("handoff"), tone: "stop" as Tone },
      { label: "Context → Priya", href: protoHref("support"), tone: "stop" as Tone },
    ],
  },
] as const;

function NodeChip({ node }: { node: NodeDef }) {
  const className = `vx-map-chip tone-${node.tone}`;
  if (node.href) {
    return (
      <ProtoLink href={node.href} className={className}>
        {node.label}
      </ProtoLink>
    );
  }
  return <span className={className}>{node.label}</span>;
}

function MainPathNode({
  node,
  index,
}: {
  node: NodeDef;
  index: number;
}) {
  const num = String(index + 1).padStart(2, "0");
  const inner = (
    <>
      <span className="vx-path-num" aria-hidden="true">
        {num}
      </span>
      <span className="vx-path-label">{node.label}</span>
      {node.href ? (
        <span className="vx-path-hint" aria-hidden="true">
          Open
        </span>
      ) : null}
    </>
  );

  if (node.href) {
    return (
      <ProtoLink href={node.href} className={`vx-path-node tone-${node.tone}`}>
        {inner}
      </ProtoLink>
    );
  }

  return (
    <div className={`vx-path-node is-static tone-${node.tone}`}>{inner}</div>
  );
}

export function StateJourneySection() {
  return (
    <section
      id="system"
      className="vx-section vx-tone-off"
      aria-labelledby="system-heading"
    >
      <Reveal className="vx-section-head">
        <p className="vx-eyebrow">[ interaction system ]</p>
        <h2 id="system-heading" className="vx-display">
          One primary path.
          <br />
          Clear exits when reality changes.
        </h2>
        <p className="vx-lede">
          The happy path is linear. Every exit preserves a known-safe state before
          the next action can take effect.
        </p>
      </Reveal>

      <Reveal className="vx-map">
        <div className="vx-map-main">
          <p className="vx-map-kicker">Main path</p>
          <ol className="vx-path" aria-label="Main path">
            {MAIN.map((node, index) => (
              <li key={node.label}>
                <MainPathNode node={node} index={index} />
                {index < MAIN.length - 1 ? (
                  <span className="vx-path-rail" aria-hidden="true" />
                ) : null}
              </li>
            ))}
          </ol>
        </div>

        <div className="vx-map-exits">
          <div className="vx-map-exits-head">
            <p className="vx-map-kicker">When reality changes</p>
            <ul className="vx-map-legend" aria-label="Legend">
              <li className="tone-decide">User decision</li>
              <li className="tone-safe">Known safe state</li>
              <li className="tone-change">Condition changed</li>
              <li className="tone-stop">Automation stops</li>
            </ul>
          </div>

          <ul className="vx-map-exit-list">
            {EXITS.map((exit) => (
              <li key={exit.title} className="vx-map-exit">
                <div className="vx-map-exit-copy">
                  <h3>{exit.title}</h3>
                  <p className="vx-map-exit-from">From {exit.from}</p>
                  <p className="vx-map-exit-summary">{exit.summary}</p>
                </div>
                <div className="vx-map-exit-nodes">
                  {exit.nodes.map((node) => (
                    <NodeChip key={node.label} node={node} />
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="vx-map-alt">
          Text overview: the main path moves from request through proposal,
          confirmation, execution, and success. Users can adjust via Other Options,
          keep AI 621, repair an interpretation mismatch or fare change before side
          effects, and escalate to Priya when payment is authorised but the
          replacement ticket is not issued.
        </p>
      </Reveal>
    </section>
  );
}
