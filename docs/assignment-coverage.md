# Assignment coverage

Deterministic demo URLs use `?state=<slug>`. Open from the Demo States menu or deep-link.

## Intent / proposal

| Requirement | Where | URL |
| --- | --- | --- |
| Assistant interpretation | Interpreting phase on Assistant thread | `?state=interpreting` |
| Current booking | Proposal thread + map status | `?state=proposal` |
| Recommended flight | AI 639 recommendation card | `?state=proposal` |
| Why this option | Recommendation rationale / disclosures | `?state=proposal` |
| Other Options | Adjust / alternatives sheet | `?state=adjust` · `?state=alternatives` |

## Confirmation

| Requirement | Where | URL |
| --- | --- | --- |
| Old-to-new comparison | Review flight change sheet | `?state=confirmation` |
| Exact amount | Payable now + Pay CTA | `?state=confirmation` |
| Payment method | Paying with + Change | `?state=confirmation` |
| What happens next | Three-step strip | `?state=confirmation` |
| Approval boundary | Info alert (exact flight / seat / total) | `?state=confirmation` |
| Pay and rebook | Primary CTA → execution | `?state=confirmation` → `?state=executing` |
| Keep AI 621 | Soft CTA → rejected | `?state=rejected` |
| Return to adjust | Close / chevron collapse → proposal (selection preserved) | Close from confirmation |

## Failure / repair

| Requirement | Where | URL |
| --- | --- | --- |
| Price changed | Price-change sheet; approval voided | `?state=price-change` |
| AI misread | Misread repair sheet | `?state=misread` |
| Find another | Primary CTA → alternatives under brief | From price-change |
| Higher-price reconfirmation | Review ₹6,240 → confirmation at ₹6,240 | From price-change |
| Rewrite request | Misread → interpreting + composer focus | From misread |

## Escalation

| Requirement | Where | URL |
| --- | --- | --- |
| Payment authorised, ticket not issued | Handoff sheet + case packet | `?state=handoff` |
| Retries paused | Retries tile + warn alert | `?state=handoff` |
| AI 621 active | Current ticket tile / copy | `?state=handoff` |
| Priya handoff | Chat with Priya | `?state=support` |
| Shared context | Specialist thread + case details | `?state=support` · Case details |
| Case details | Full context sheet from model | From handoff |

## Success surfaces

| Requirement | URL |
| --- | --- |
| Success summary | `?state=success` |
| Boarding pass | `?state=ticket` |

## Escalation boundary (rationale)

Automation may continue when the transaction state is known and no financial or booking side effect has occurred. It stops and hands off when payment and ticket status disagree, the current-booking state is uncertain, or another automated attempt could create a duplicate authorisation, charge or ticket.

**Automation may repair:** misinterpreted request; unavailable option before payment; price change before payment; seat change before payment; constraint adjustment; known failure with no side effects.

**Human handoff is required:** payment authorised but ticket not issued; ticket and payment systems disagree; duplicate-charge or duplicate-ticket risk; current booking status uncertain; repeated automated failure; policy exception requiring judgment; user explicitly requests a person.
