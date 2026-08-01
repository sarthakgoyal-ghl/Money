import type { ReactNode } from "react";

interface ProtoLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  /** Open prototype states in a new tab so docs position is preserved. */
  newTab?: boolean;
}

export function ProtoLink({
  href,
  children,
  className = "",
  newTab = true,
}: ProtoLinkProps) {
  return (
    <a
      href={href}
      className={className}
      {...(newTab
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
    >
      {children}
      {newTab ? <span className="sr-only"> (opens in a new tab)</span> : null}
    </a>
  );
}

interface CtaRowProps {
  children: ReactNode;
  className?: string;
}

export function CtaRow({ children, className = "" }: CtaRowProps) {
  return <div className={`vx-cta-row ${className}`.trim()}>{children}</div>;
}
