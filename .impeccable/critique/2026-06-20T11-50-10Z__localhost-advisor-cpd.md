---
target: "http://localhost:3000/advisor/cpd"
total_score: 20
p0_count: 0
p1_count: 2
timestamp: 2026-06-20T11-50-10Z
slug: localhost-advisor-cpd
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Progress ring + deadline clear; AI search has spinner; CPD search error is silent |
| 2 | Match System / Real World | 3 | Domain terms appropriate; section count natural |
| 3 | User Control and Freedom | 2 | No Esc dismiss on course viewer; no resume on partial read; mid-quiz close loses answers |
| 4 | Consistency and Standards | 2 | TOPIC_COLORS hardcoded hex bypasses tokens, breaks dark mode; 6+ inline #0f766e |
| 5 | Error Prevention | 2 | Quiz submit disabled until complete (good); no confirm before close mid-quiz |
| 6 | Recognition Rather Than Recall | 3 | Tabs labelled with counts; chevron expand clear; AI pill-prompts help |
| 7 | Flexibility and Efficiency | 1 | No keyboard shortcuts; no section jump; no batch action; no URL tab persistence |
| 8 | Aesthetic and Minimalist Design | 1 | 7 simultaneous content regions; cognitive load fails 4/8 checklist items |
| 9 | Error Recovery | 1 | AI search silently fails; no error boundary; quiz gives no feedback on submit |
| 10 | Help and Documentation | 2 | Pill-prompts help; expand-preview good; no CPD credit explanation for first-timers |
| **Total** | | **20/40** | **Acceptable (barely) — significant improvements needed** |

## Anti-Patterns Verdict

Hero-metric template (progress ring + big number + triple stats + gradient glow). Hardcoded TOPIC_COLORS hex bypassing token system — breaks dark mode across 12+ render sites. Uppercase eyebrow labels inside course viewer (Format, Learning objectives, Topics, Knowledge Check).

Detector: no findings (0 results). Issues are structural/semantic, not pattern-detectable.

## Priority Issues

[P1] 7 concurrent content regions with no primary action — cognitive load fails 4/8 criteria. Fix: restructure to CPD-incomplete (status + single CTA) vs CPD-complete states. Merge recommended/weekly picks.
[P1] Hardcoded hex in TOPIC_COLORS breaks dark mode for all topic chips across library, weekly picks, AI search, category rings. Fix: map topics to 4-5 semantic token groups.
[P2] Course viewer: no Esc dismiss, no mid-session resume, mid-quiz close loses answers.
[P2] Hero banner is banned hero-metric template. Fix: keep ring + deadline, remove triple-stat row, flatten gradient.
[P2] Uppercase eyebrow labels in course viewer (Format/Learning objectives/Topics).

## Persona Red Flags

Alex: Must scroll past 5 content regions to reach Required tab; 3 clicks min to start a module; no Esc dismiss; no keyboard search shortcut.
Jordan: No explanation of CPD credits or MAS FAA-N13; 3 redundant "which module next" surfaces confuse; closing viewer loses reading progress.
Casey: Category rings 48px on mobile with 9px labels unreadable; course viewer sidebar hidden on mobile with no fallback; module title truncates mid-word; heavy backdrop-blur on slow devices.

## Minor Observations

Award icon used for both perfect and imperfect quiz results. isDone variable name collision (outer stream scope vs inner module scope). Empty state "No modules in this category" is dismissive. Decorative circles use px not tokens.
