# Figma implementation map

**File:** `Gift Card Styling Update` — `AuuiY6REUWuJcblWwg8nD0`
**Page:** `202:37996` — "Dashboard, Create, Edit, Send GC, Ecomm" (the travel frames live at canvas x≈12,666 / y≈20,655)
**MCP access:** ✅ Connected as `sarthak.goyal@gohighlevel.com` (HighLevel LLC, Full seat). All 12 nodes read via
`get_metadata`, `get_screenshot`, `get_variable_defs` and `get_design_context`. Measurements below are read from
MCP, not estimated from the raster screenshots.

Local reference renders: [`docs/figma-refs/`](figma-refs/)

---

## Baseline dimensions

| Thing | Value | Source |
|---|---|---|
| Mobile viewport | **402 × 874** | `1204:80299` "iPhone" |
| Device frame outer | **422 × 894** | frame = viewport + 10 px border |
| Device border | **10 px `rgba(255,255,255,0.47)`** | `border-10 border-[rgba(255,255,255,0.47)]` |
| Device radius | **40 px** | `rounded-[40px]` |
| Desktop stage | **1440 × 960** | `1204:80198` |
| Cloud backdrop | `tengyart-hR4JiEOZMS8-unsplash` 1440 × 960 | `1204:80199` |
| Status bar | 54 px | `Status Bar` instance |
| Route header block | 170 px tall, `pt-63 pb-16 px-16`, gap 18 | `1204:81168` |
| Home indicator | 34 px; bar 134 × 5 r-100 `#101828` @ bottom 8 | `1204:81193` |

---

## The 12 supplied nodes

| # | Node | Figma name | Size | Kind | Product state | Route |
|---|---|---|---|---|---|---|
| 1 | `1204:80198` | Trip Builder cover image | 1440×960 | Desktop stage | Prototype presentation | all |
| 2 | `1204:80683` | Thread | 422×1208 | Full screen (scrolls) | **Assistant** — the only conversational screen | `?state=interpreting` → `?state=proposal` |
| 3 | `1204:80850` | Thread | 422×894 | Full screen | Full-map proposal | `?state=proposal` (expanded map) |
| 4 | `1204:81349` | Thread | 422×894 | Full screen | Other options — **initial / partial** sheet | `?state=alternatives` |
| 5 | `1204:80934` | Thread | 422×894 | Full screen | Other options — **expanded** sheet | `?state=alternatives` (expanded) |
| 6 | `1204:80991` | — | 370×894 | Component spec | Other options controls + results | — |
| 7 | `1204:81405` | Thread | 422×894 | Full screen | Review flight change | `?state=confirmation` |
| 8 | `1204:81465` | — | 370×1131 | Continuation spec | Lower scroll of the Review sheet | `?state=confirmation` |
| 9 | `1204:81611` | Thread | 422×894 | Full screen | **Execution** (a frame *was* supplied) | `?state=executing` |
| 10 | `1204:81101` | Thread | 422×894 | Full screen | Success summary | `?state=success` |
| 11 | `1204:81195` | Thread | 422×894 | Full screen | Boarding pass / expanded success | `?state=ticket` |
| 12 | `1204:81274` | — | 370×541 | Component spec | Boarding-pass card internals | — |

Nodes 6, 8 and 12 are **component specifications**, not screens. They are rendered on a dark canvas in Figma
purely because that is the page background — they must never ship with a dark backdrop.

---

## Design tokens (from `get_variable_defs` + `get_design_context`)

### Colour

| Token | Value | Use |
|---|---|---|
| `--fig-blue` | `#0088ff` (`#08f`) | primary actions, links |
| `--fig-blue-ios` | `#0078ff` | sticky footer CTA, iOS message bubble |
| `--fig-blue-arrow` | `#007aff` | route arrow |
| `--fig-blue-400` | `#528bff` | accent |
| `--fig-blue-wash` | `rgba(0,136,255,0.08)` | secondary button fill |
| `--fig-gray-900` | `#101828` | primary text |
| `--fig-gray-600` | `#475467` | secondary text |
| `--fig-gray-400` | `#98a2b3` | tertiary |
| `--fig-tertiary` | `#909093` | caution / disclaimer text |
| `--fig-bubble-generic` | `#e9e9eb` | AI bubble, nav border |
| `--fig-success-500` | `#12b76a` | success accent |
| `--fig-success-600` | `#039855` | success text |
| `--fig-success-200` | `#a6f4c5` | success border |
| `--fig-success-50` | `#f6fef9` | success surface |
| `--fig-nav-bg` | `#ffffffbf` | navigation bar |

### Type

Figma uses **SF Pro** for thread/row/bubble text and **Inter** for buttons and tokenised text styles.
SF Pro is not redistributable, so the implementation uses the system stack
`-apple-system, "SF Pro Text", "SF Pro Display", BlinkMacSystemFont, …` which resolves to genuine SF Pro on
Apple devices and falls back to Inter elsewhere. **Documented substitution — not silent.**

| Style | Spec |
|---|---|
| Screen title | SF Pro Semibold `590`, 20 px, tracking `-0.6px`, `#101828` |
| Sheet title | SF Pro Semibold `590`, 20 px, tracking `-0.6px` |
| Body | SF Pro Regular 13 px, line-height `1.25`, `#475467` |
| Tile label | SF Pro Regular 13 px `#475467` |
| Tile value | SF Pro Semibold `590` 15 px / 15 px `#101828` |
| Button label | Inter Semibold 600, 16 px / 24 px |
| Pill label | SF Pro Medium `510` 13 px / 21 px `#101828` |
| Caution | SF Pro Regular 13 px / 15 px `#909093`, tracking `0.05px` |
| Safety note | Inter Light 300, 10 px, `#666` |
| Status-bar time | SF Pro Text Semibold 17 px / 22 px |

Inter scale (tokenised): `2xs` 10/15 · `md` 13/18 · `lg` 14/20 · `2xl` 16/24. Weights 400/500/600.

### Radius / spacing / effects

| Token | Value |
|---|---|
| radius sheet | `24px` (`border/radius/6`) |
| radius card | `16px` (`border/radius/4`) |
| radius tile / button | `14px` |
| radius footer CTA | `12px` (`border/radius/3`) |
| radius pill | `20px` route pill · `32px` status pill |
| radius circular button | `24px` on a 44 px box |
| spacing | 2 · 6 · 8 · 10 · 12 · 13 · 16 · 18 · 28 |
| `Shadow/xs` | `0 1px 2px rgba(16,24,40,0.05)` |
| `Shadow/3xl` | `0 32px 64px -12px rgba(16,24,40,0.14)` |
| sheet shadow | `0 4px 32px rgba(0,0,0,0.16)` |
| circular button shadow | `0 4px 32px rgba(0,0,0,0.08)` |
| route pill shadow | `0 10px 12px rgba(16,24,40,0.04)` |
| status pill shadow | `0 6px 8px rgba(16,24,40,0.05)` |

### Materials

- **Sheet:** `background: rgba(245,246,243,0.7)` + `backdrop-filter: blur(16.25px)`, plus an inner fill layer of
  `rgba(15,15,15,0.2)` at `mix-blend-mode: color-dodge` over `rgba(245,245,245,0.2)` blurred `21.65px`.
- **Circular button:** `#0f0f0f` at `color-dodge` over `rgba(245,245,245,0.4)`.
- **Route pill:** `linear-gradient(rgba(245,243,255,0.18))` over `linear-gradient(rgba(255,255,255,0.82))`,
  `blur(12px)`, 1 px white border.
- **Status pill:** same idea at `0.22` / `0.88`, `blur(9px)`.
- **Status-bar scrim:** `linear-gradient(rgba(217,217,217,0.26) → transparent)`, 170 px.
- **Route header:** `backdrop-filter: blur(25px)`.

---

## Per-screen notes

### 2 · Assistant (`1204:80683`) — the only conversational screen
Header (pale-blue gradient) · status bar · centred "Trip assistant" · circular overflow · "Today at 3:15 PM"
separator · right-aligned `#0078ff` user bubble · "Thought for 7s" disclosure · "What I understood" `#e9e9eb`
card with a pencil edit affordance · "I found a flight that meets your brief." bubble · **map preview with an
expand control** · recommended flight card · `Other options` / `Keep AI 621` outlined pair · "Why this option"
card · "Fare and seat refreshed 32 seconds ago · ↻ Refresh" · sticky `Review change · ₹4,790` · safety note ·
suggestion chips · **prompt composer** (`+` · "Plan, build, modify anything…" · mic · voice) · home indicator.

**Content corrections applied:** the frame's understood-list reads "Aisle seat" → must read
**"Window or aisle seat"** per the canonical brief.

### 3 · Full-map proposal (`1204:80850`)
Full-bleed light map · circular back · route pill · circular overflow · two status pills
(`AI 621 · 8:35 PM · 14A` green, `AI 639 · arrives 4:00 PM` blue) · floating recommendation card with
`Review change`, `Other options`, `Keep AI 621`, safety note. **No composer, no bubbles.**

### 4/5/6 · Other options
Sheet title "Other options" / "Here's everything I compared." · circular chevron toggles between the two
supplied heights · `Arrive by` / `Maximum extra cost` / `Seat preference` segmented rows · `Nonstop only`
toggle · Current-brief card · results list · `Why this one is recommended` / `Compare the differences`
disclosures · simulated-fares caution · sticky `Use AI 639 · ₹4,790`.

**Content corrections applied:** frame shows `5 PM`, `₹3,000`, `Window` selected and AI 647 labelled
`Seat 12A · Window`. Canonical initial state is **6 PM / ₹5,000 / Window or aisle**, and AI 647 is
**Seat 15C · Aisle**.

### 7/8 · Review flight change
One scrollable sheet, sticky footer. Handle · circular close · centred title · circular collapse · Current card
(amber "Current" label) · blue chevron · New card · change-summary chips · price card with expanded
`View price breakdown` · `paying with` + `Change` · `What happens next` 3-tile row · green current-ticket
assurance · blue approval-boundary statement · `View fare conditions` · sticky `Pay ₹4,790 & rebook` +
`Keep AI 621`.

**Content corrections applied:** the frame's Current card shows AI 639's times (`2:10 PM → 4:00 PM`) and an
`Extra ₹4,790`. Canonical Current is **AI 621 · 8:35 PM → 10:25 PM · Seat 14A · no extra label**.

### 9 · Execution (`1204:81611`)
`Rebooking to AI 639` · 4-step connected timeline (✓ done, ◉ active, ○ blocked) · the blocked
`Releasing AI 621` row carries "Waiting - held until the replacement ticket exists." · green
`Charging ₹4,790` / `Seat 12A` row · lock-icon duplicate-charge note · `Notify me when it's done`.

### 10 · Success summary (`1204:81101`)
80 px blue seal · `You're rebooked` · "**AI 647** arrives in Bengaluru at **5:10 PM**." · 2×2 tiles
(Booking / Seat / Charged / Released) · green charge alert · caution · `View boarding pass` /
`Get help with this trip`.

**Content corrections applied:** the frame's map pill reads `AI 621 · Seat 12A · ₹4,790` — three mismatched
facts. Replaced with a state-correct pill naming the **issued** flight.

### 11/12 · Boarding pass (`1204:81195`, `1204:81274`)
Handle · circular close · seal · heading · pass card (airline logo, times, curved plane route, date / seat /
class / passenger / booking / baggage, perforation notches, decorative barcode) · payment summary rows ·
`View activity` · `Add to wallet` · `Receipt` / `Calendar` / `Help` tiles.

**Content corrections applied:** the frame pairs an **AI 647** headline with an **AI 639** pass. Everything
derives from `selectedFlight`.

### 1 · Desktop stage (`1204:80198`)
1440×960 cloud photo, `cover`, centred; 402×874 viewport centred at `x≈519, y=43`; 10 px
`rgba(255,255,255,0.47)` border; 40 px radius; soft outer shadow.

---

## States without a supplied frame

Extended from the same system — light map + translucent pale sheet + Figma radii/blur/shadow + blue primary:

| State | Route | Accent |
|---|---|---|
| Price changed | `?state=price-change` | amber |
| Misread repair | `?state=misread` | neutral + focused choice |
| Rejected | `?state=rejected` | neutral |
| Human handoff | `?state=handoff` | amber pending + restrained red paused |
| Support chat | `?state=support` | conventional support composer (**not** the AI composer) |
| Case details | `?state=case-details` | disclosure rows + timeline |

---

## Assets to export

| Asset | Node | Use |
|---|---|---|
| Cloud photo | `1204:80199` | desktop backdrop |
| Success seal (80 px) | `1204:81109` | success + boarding pass |
| Air India logo | in `1204:81274` | boarding pass |
| Curved plane route | in `1204:81274` | boarding pass |
| Sparkle, pencil, shield-tick, refresh, wallet, ticket, headset, paid, seat, bag, class icons | various | UI |

Icons that exist 1:1 in the project's `lucide-react` set at the same optical weight are used from there;
anything bespoke is exported as SVG with its `viewBox` preserved.

---

## AI composer placement (hard rule)

The conversational interface — header, bubbles, activity disclosure, understood card, suggestion chips and
prompt composer — exists **only** on the Assistant screen (`?state=interpreting` / `?state=proposal`).

Every other state renders map + sheet with **no composer**. The support state gets a visually distinct
human-support input, never the blue AI composer.

---

## Implementation status (final pass)

| Frame | Component | Route |
|---|---|---|
| `1204:80198` | `PrototypeStage` / `CloudBackdrop` / `DeviceFrame` | desktop presentation |
| `1204:80683` | `AssistantScreen` + assistant subcomponents | `?state=interpreting` / `?state=proposal` |
| `1204:80850` | `FullMapProposalScreen` | expand map from proposal |
| `1204:81349` / `80934` / `80991` | `OtherOptionsSheet` | `?state=alternatives` / `?state=adjust` |
| `1204:81405` / `81465` | `ReviewChangeSheet` | `?state=confirmation` |
| `1204:81611` | `ExecutionSheet` | `?state=executing` |
| `1204:81101` | `SuccessSummarySheet` | `?state=success` |
| `1204:81195` / `81274` | `BoardingPassSheet` | `?state=ticket` |
| Inferred | `RejectedSheet`, `PriceChangeSheet`, `MisreadSheet`, `HandoffSheet` | `?state=rejected`, `price-change`, `misread`, `handoff` |

Orchestration: `FigmaMapFlow` + `LightMapShell` + `LightRouteMap`. Legacy dark `JourneyStage` / `AssistantDock` removed from runtime paths.

**Build:** `npm run build` passes (TypeScript + Vite production).
