# Part 2 — KYC funnel diagnosis

## 1. Step selected

**Step 3 — ID document upload.**

## 2. Evidence from funnel

- **74,600** users enter Step 3.
- **61%** complete it.
- **~29,100** users are lost at this step alone — larger than any other
  single-step drop in the funnel and where any KYC funnel typically fails.
  Downstream steps (selfie, review, submission) cannot be fixed while this
  step is bleeding almost 30k users per period.

## 3. Hypothesis

Most of the drop is not a *decision* to abandon — it is a *task-failure* loop:

> First-attempt document capture failures (blur, glare, cropped edges, wrong
> document type, unsupported document, generic post-upload server errors)
> cause users to retake multiple times, hit a generic "Upload failed" error
> with no repair path, and abandon rather than restart the flow from scratch.

Specifically, we expect: high retake counts per completing user, a long tail
of time-on-step, disproportionate abandonment on Android low-tier devices and
in poor lighting, and a spike in abandonment right after the first server-side
rejection message.

## 4. Proposed redesign

A six-screen capture flow that replaces the current single upload button:

1. **Preparation** — plain-language explainer of what's needed, why, and
   privacy posture (data retention, provider). Time-boxed to under 15s of
   reading.
2. **Document selection** — explicit chip picker (Passport / Driver's license /
   National ID) with an example thumbnail per option. Removes the "unsupported
   document" failure entirely.
3. **Live camera guidance** — real-time overlay for edge detection, glare,
   blur, and distance. Copy adapts ("Move closer", "Reduce glare"). Denies
   capture until conditions are green.
4. **Auto-capture** — captures automatically when all four conditions are
   green for ~800 ms. Users can still tap manually; both paths use the same
   validation.
5. **Review** — user sees the exact frame that will be submitted, with an
   explicit "Looks clear" / "Retake" pair. Blurriness score is shown as a
   simple three-state indicator, not a percentage.
6. **Targeted retake + save/resume** — if the server rejects, show the
   *specific* reason ("Bottom edge cut off" / "Glare on hologram"), not a
   generic error. Offer resume-by-link + email so the user can retry on a
   better device / in better light without losing their session.

## 5. Expected metric movement

- Step 3 completion: **61% → 70–73%**, driven mostly by lifting first-attempt
  success and reducing rage-abandonment after the first rejection.
- Overall KYC completion should rise proportionally; the selfie step is the
  next likely constraint but is not fixed here.

## 6. Experiment and attribution

- **Design**: user-level 50/50 A/B, holdout on the old single-upload screen,
  new flow on the treatment arm. Bucket at the user level (not session) so
  retries stay in the same arm.
- **Same everywhere**: KYC provider, risk rules, backend decisioning, traffic
  eligibility, geography weighting. Only the client-side capture UX differs.
- **Run length**: minimum 3 weeks or until each arm sees ≥ 25k users through
  Step 3 (whichever is later), to smooth device / OS mix.
- **Primary metric**: document upload completion (Step 3 → Step 4).
- **Supporting metrics**: first-attempt document success rate, retakes per
  completing user, time-on-step (p50/p90), resume-link usage.
- **Analysis**: pre-registered primary; supporting metrics for diagnosis.
  Segment by OS, device tier, document type, and rejection reason.

## 7. Guardrail metrics

Improved capture UX must not silently degrade downstream quality or fraud
posture. Monitor with pre-agreed alarm thresholds:

- **Manual review rate** — must not rise more than +1 pp vs. control.
- **KYC rejection rate** (final decision) — must not rise more than +0.5 pp.
- **Fraud rate** on approved cohorts (30/60/90-day) — no material lift.
- **Selfie completion** — no drop; if the harder step downstream now catches
  more users, we know Step 3 was over-selecting on determined users.
- **Support contacts about ID upload** — expect down, but flag if up.

## Instrumentation checklist

Event stream (all with user_id, session_id, device tier, OS, doc type):

- `kyc_camera_permission_prompted` / `_granted` / `_denied`
- `kyc_doc_type_selected` (value)
- `kyc_capture_attempt` (auto | manual)
- `kyc_capture_validation_failed` (reason: blur | glare | edge | distance)
- `kyc_capture_committed`
- `kyc_upload_failed` (client error class)
- `kyc_server_rejected` (rejection code)
- `kyc_retake_started` (attempt_index)
- `kyc_resume_link_sent`
- `kyc_step3_completed`

This gives us both funnel-shaped analysis and a clear diagnosis for any post-
launch regression.
