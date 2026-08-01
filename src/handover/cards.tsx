import type { ReactNode } from "react";

interface AnnotationCardProps {
  title: string;
  children: ReactNode;
}

export function AnnotationCard({ title, children }: AnnotationCardProps) {
  return (
    <article className="ho-annotation">
      <h3 className="ho-annotation-title">{title}</h3>
      <div className="ho-annotation-body">{children}</div>
    </article>
  );
}

interface RationaleBlockProps {
  title: string;
  children: ReactNode;
}

export function RationaleBlock({ title, children }: RationaleBlockProps) {
  return (
    <div className="ho-rationale">
      <h3 className="ho-rationale-title">{title}</h3>
      <div className="ho-rationale-body">{children}</div>
    </div>
  );
}

interface PrincipleCardProps {
  index: number;
  title: string;
  body: string;
}

export function PrincipleCard({ index, title, body }: PrincipleCardProps) {
  return (
    <article className="ho-principle">
      <span className="ho-principle-index" aria-hidden="true">
        {String(index).padStart(2, "0")}
      </span>
      <h3 className="ho-principle-title">{title}</h3>
      <p className="ho-principle-body">{body}</p>
    </article>
  );
}

interface DecisionCardProps {
  index: number;
  title: string;
  body: string;
}

export function DecisionCard({ index, title, body }: DecisionCardProps) {
  return (
    <article className="ho-decision">
      <h3 className="ho-decision-title">
        <span className="ho-decision-index" aria-hidden="true">
          {index}.
        </span>{" "}
        {title}
      </h3>
      <p className="ho-decision-body">{body}</p>
    </article>
  );
}
