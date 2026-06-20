---
target: frontend/src/app/advisor
total_score: 21
p0_count: 0
p1_count: 2
timestamp: 2026-06-20T11-29-46Z
slug: frontend-src-app-advisor
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | SSE streaming is good; CPD AI search has no loading indicator |
| 2 | Match System / Real World | 3 | Domain language appropriate; "[LD]" section marker unexplained |
| 3 | User Control and Freedom | 2 | No undo on referral; briefing can't be re-triggered without refresh |
| 4 | Consistency and Standards | 2 | Side-stripe borders in BriefingBand; hardcoded hex in CPD; bounce easing in 4 files |
| 5 | Error Prevention | 2 | Introduce dialog posts with no confirmation; briefing auto-fires on mount |
| 6 | Recognition Rather Than Recall | 3 | Icons + labels good; "[LD]" tag opaque |
| 7 | Flexibility and Efficiency | 1 | No keyboard shortcuts; no briefing retry; no batch actions |
| 8 | Aesthetic and Minimalist Design | 2 | CPD page has 7 concurrent jobs; extreme visual complexity |
| 9 | Error Recovery | 2 | "Briefing unavailable — please refresh" has no retry button |
| 10 | Help and Documentation | 1 | No tooltips, no onboarding, no empty state guidance |
| **Total** | | **21/40** | **Acceptable — significant improvements needed** |

## Anti-Patterns Verdict

Side-stripe borders in BriefingBand (border-l-[3px]). Hardcoded hex colors in CPD page bypassing token system — dark mode will not apply. Bounce easing (cubic-bezier(.22,.68,0,1.15)) in 4 files. CPD page scope overload.

Detector: 4 bounce-easing findings in clients/[id]/page.tsx:83, ClientAdvisorBot.tsx:119, ClientAdvisorBot.tsx:261, PerformanceStack.tsx:27.

## Priority Issues

[P1] Side-stripe borders as section differentiators in BriefingBand.tsx lines 36-40. Replace with wash token backgrounds + section headers.
[P1] CPD page information overload — 7 concurrent jobs on one page. Move course viewer to /advisor/cpd/[module-id].
[P2] Bounce/elastic easing in 4 files — replace with cubic-bezier(0.22,1,0.36,1).
[P2] Hardcoded hex colors in cpd/page.tsx TOPIC_COLORS — will fail dark mode.
[P2] Briefing fires on mount, failure state has no retry button.

## Persona Red Flags

Alex: No keyboard shortcuts, no briefing retry without full refresh, no batch client actions.
Sam: Hardcoded hex chips fail dark mode contrast; AgentTracePanel lacks aria-live; CPD modal focus management not confirmed; BriefingBand quotes not aria-hidden.
Casey: AgentTracePanel fixed sidebar has no mobile close; BriefingBand action buttons below fold on mobile; metric cards not linked.

## Minor Observations

RelationshipCard.tsx:39 literal &apos; entity in string. getDailyQuote() uses Date.now() (timezone drift). --sidebar-bg token defined but unused. Scrollbar styling webkit-only (invisible in Firefox).

## Questions to Consider

- Should CPD be a separate route with its own nav?
- If briefing is the hero feature, why does it fire silently?
- Is AgentTracePanel for advisors or developers?
