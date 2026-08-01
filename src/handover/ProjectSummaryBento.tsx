import { SCENARIO } from "./handoverData";

export function ProjectSummaryBento() {
  return (
    <section
      id="overview"
      className="ho-chapter ho-tone-light"
      aria-labelledby="overview-heading"
    >
      <header className="ho-chapter-intro">
        <p className="ho-eyebrow">At a glance</p>
        <h2 id="overview-heading" className="ho-chapter-title">
          The hard-to-reverse moment, in one frame.
        </h2>
      </header>

      <div className="ho-bento">
        <article className="ho-bento-cell is-domain">
          <h3>Domain</h3>
          <p>Consumer travel</p>
        </article>
        <article className="ho-bento-cell is-action">
          <h3>Hard-to-reverse action</h3>
          <p>
            Rebook an existing flight, charge the fare difference, issue a
            replacement ticket, and release the original booking.
          </p>
        </article>

        <article className="ho-bento-cell is-current">
          <h3>Current booking</h3>
          <p className="ho-bento-flight">{SCENARIO.current.flightNo}</p>
          <p>
            {SCENARIO.current.route}
            <br />
            {SCENARIO.current.times}
            <br />
            Seat {SCENARIO.current.seat}
          </p>
        </article>
        <div className="ho-bento-cell is-transition" aria-hidden="true">
          <span>{SCENARIO.current.flightNo}</span>
          <span className="ho-bento-arrow">→</span>
          <span>{SCENARIO.recommended.flightNo}</span>
        </div>
        <article className="ho-bento-cell is-proposed">
          <h3>Proposed replacement</h3>
          <p className="ho-bento-flight">{SCENARIO.recommended.flightNo}</p>
          <p>
            {SCENARIO.recommended.route}
            <br />
            {SCENARIO.recommended.times}
            <br />
            Seat {SCENARIO.recommended.seat}
            <br />
            <strong>{SCENARIO.recommended.extra} extra</strong>
          </p>
        </article>

        <article className="ho-bento-cell is-risk">
          <h3>Core risk</h3>
          <p>
            A careless confirmation could create an unexpected charge, release
            the user’s original seat, or leave payment and ticketing out of sync.
          </p>
        </article>
        <article className="ho-bento-cell is-scope">
          <h3>Scope</h3>
          <p>
            One adult passenger, one domestic segment, same airline, saved
            payment method, and deterministic simulated airline and payment
            systems.
          </p>
        </article>
      </div>
    </section>
  );
}
