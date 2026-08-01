# Reference synthesis

How the attached references were read, what was extracted, and what was
deliberately left behind. Nothing from the references is embedded in the app: no
logos, no branded assets, no screenshots, no proprietary illustrations. All route
graphics, tickets, and the AI mark are original SVG/CSS built in this repository.

## Why `PRIMARY-UI-DIRECTION.png` became the primary reference

An earlier round of this work used a *band* of travel canvas above a stack of
white content sheets. It was pleasant, and it was wrong for the product, for
three reasons the primary reference makes obvious:

1. **A map band is decoration; a full-screen map is context.** When the route
   occupies a third of the viewport it reads as a header image — something to
   scroll past. When it occupies the whole screen and content floats over it, the
   journey is the thing you are operating on, and every panel is visibly *about*
   that journey.
2. **A stack of sheets implies a wizard.** Screen → screen → screen is the shape
   of a form. An assistant that can be talked to at any point needs a surface
   that is *always there*, at a height that changes with how much attention the
   current step deserves. That is a dock, not a page.
3. **If everything is a light card, nothing is important.** The earlier design
   had no material left to signal "this is the moment that costs money". Making
   the product dark by default means light can be spent — twice, on confirmation
   and on the issued pass — and it lands.

The organising sentence that came out of it:

> **Map as context, AI as the operating layer, and explicit confirmation as the
> trust boundary.**

## Six principles extracted

1. **The map is the product's memory.** One continuous space the whole session
   moves through, so state changes are camera moves rather than page loads. The
   route never resets, which is what makes an eleven-state flow feel like one
   journey.
2. **Floating objects, not chrome.** Controls sit on the map as discrete discs
   and pills with their own dark backing, never as a header bar. A bar would cut
   the canvas into a header and a body and undo the premise.
3. **The assistant is a surface, not a screen.** A persistent dock with a fixed
   composer position means the product can always be talked to. Height is the
   signal for attention: compact when the map matters, expanded when the map is
   context the user has stopped consulting.
4. **Airport codes and times are the typography.** BOM / BLR and 2:10 PM at
   display size, tabular figures. Airline, fare class and baggage are metadata.
5. **Colour is status, and it is rationed.** The route line is the only element
   on the canvas that changes tone, so a tone change always means something.
   Light surfaces are rationed the same way.
6. **Restraint carries trust.** One completion animation, one halo, thin
   hairlines. Financial and travel transactions lose credibility when they
   celebrate.

## Which reference informs which surface

| Surface | Primary reference | What was taken |
|---|---|---|
| Full-screen satellite canvas, floating controls | `PRIMARY-UI-DIRECTION.png` | Dark satellite map at night, contextual labels instead of stock place names, controls as floating objects, a dark conversation dock anchored to the bottom |
| Assistant dock: request + structured response + composer | `PRIMARY-UI-DIRECTION.png` + AI-assistant references | The user's message and the assistant's structured answer in one scrollable surface, with a composer permanently pinned beneath it |
| Route, endpoint nodes, aircraft | Flight-tracking references | An illuminated curved track with lit endpoints and an aircraft placed analytically along it, rather than a straight line between two pins |
| Proposal flight object | Flight-row references | Compact, information-dense flight object; code/time hierarchy; fit stated against the user's own brief |
| Confirmation review | Finance / subscription references | Total at display size, fees collapsed beneath it, payment method named, calm high-trust surface, exact amount inside the action |
| Boarding pass | Wallet-pass references | Ticket-shaped object with perforation, notches and a decorative barcode texture, labelled as simulated |
| Reprice repair | Pending/partial transaction states | Amount delta, amber pending treatment, safety anchor weighted above the diagnosis |
| Human handoff | Support / transaction-status references | Three distinct certainty levels rather than one error, and a named person rather than "a specialist" |

## Deliberately avoided

- **A fake phone frame.** No notch, no status bar, no device mockup. On desktop
  the product is centred at 420 px on a quiet dark backdrop. A device frame makes
  a real interface look like a screenshot of one, and it puts the demo controls
  further from the reviewer's cursor.
- **An interactive map inside a payment flow.** Gestures are off by default. The
  optional "Explore route" control makes exploring an explicit, reversible
  decision, and it is hidden entirely when there is no live basemap to explore.
- **Stock map labels.** Every label, road and boundary flag is off. A
  neighbourhood name has nothing to do with whether the user should approve a
  ₹4,790 flight change, and at this scale they collide with the floating
  controls. The only text over the imagery is text about this trip.
- **A sliding pill on the segmented control.** It animated beautifully and it
  made the selected label's contrast impossible to compute from the DOM, because
  the white was an absolutely-positioned sibling rather than an ancestor
  background. The ratio has to be provable, so the fill moved onto the label.
- **Chat-bubble architecture.** The user's message is one compact line; the
  assistant answers with structured travel objects, not paragraphs.
- **A decorative AI orb.** Trip Pulse is small, functional, and static when the
  system is idle. It never appears just to signal "this product has AI".
- **Sparkle icons as an AI signifier**, glassmorphism as a default material,
  rainbow gradients, neon treatment, confetti, and celebratory motion on a
  financial transaction.
- **A composer that swallows input.** The field resolves a fixed vocabulary to
  real actions and states its limits when nothing matches, rather than absorbing
  a message and doing nothing.
- **Internal system vocabulary on screen.** "Bounded Confirmation", "approval
  invalidated", "material change" are design and documentation terms. On screen
  the assistant speaks plainly.
- **Fake production artefacts.** The barcode is a decorative, non-scannable
  pattern and the pass is labelled as a simulated booking. No countdown timers,
  no artificial urgency.

## How this stays original

The references were used as a *behaviour* brief rather than a visual one. Each
contributed a rule about hierarchy, motion purpose, or object design — not a
layout to reproduce. The synthesis differs from every source in combination: a
map-tracking app has no transactional approval boundary; a wallet has no agent; a
finance app has no route canvas; the AI-assistant references have no
hard-to-reverse action to protect.

This product needs all four at once — an immersive travel context, an assistant
whose work is visible, a transaction whose exact consequence is legible, and a
safety boundary that survives failure. Three layers are present on every screen
in some proportion:

1. **Travel context** — the persistent map, the route, the endpoints, the
   aircraft.
2. **AI assistance** — Trip Pulse, progressive work, the editable brief, the
   composer.
3. **Transaction precision** — exact totals, material-change invalidation, the
   protected current ticket, and explicit approval.
