# CLAUDE.md
## JUNCTN — Coding Discipline & Engineering Standards

This file defines the engineering standards for the JUNCTN codebase. Every piece of code — whether written by a human or AI-assisted — is held to these rules. When in doubt, refer back here.

---

## General Principles

1. Write code that is easy to read before optimising for brevity.
2. Prefer maintainability over cleverness.
3. Follow the Single Responsibility Principle — one function, one job.
4. Avoid premature optimisation. Make it work, make it right, then make it fast.
5. Always consider scalability and extensibility — we are designing for 800+ advisors from day one.

---

## Code Quality

1. Use meaningful variable, function, and class names. If you need a comment to explain a name, rename it.
2. Avoid magic numbers and hardcoded values — use named constants.
3. Keep functions small and focused. If a function does two things, split it.
4. Eliminate duplicated code whenever possible. Duplication is a liability.
5. Favour composition over inheritance when appropriate.
6. Follow the existing project style and architecture. Consistency beats personal preference.

---

## Error Handling

1. Never silently ignore exceptions. A swallowed error is a hidden bug.
2. Provide clear and actionable error messages — say what failed and how to fix it.
3. Validate all external inputs at the boundary before they enter business logic.
4. Handle edge cases explicitly. Do not rely on "this will never happen."
5. Log failures with sufficient context: timestamp, advisor ID, feature, what was attempted.

---

## Security

1. Never hardcode secrets, API keys, passwords, or tokens anywhere in the codebase.
2. Use environment variables for all sensitive configuration. Use `.env.example` to document required keys without values.
3. Sanitise and validate all user inputs — treat every external input as untrusted.
4. Apply the principle of least privilege — services and users get only the access they need.
5. Prevent SQL injection, XSS, and common vulnerabilities. Use parameterised queries and output encoding.
6. Every API route must validate `advisor_id` from the JWT before touching any data. Advisor A's context must never be reachable by Advisor B under any code path.
7. Partner contact details must never be included in LLM prompts. Matching runs on vectorised specialty and region data only.

---

## Testing

1. Write tests for all business-critical logic — agent pipelines, CPD credit calculations, topic detection, referral state transitions.
2. Cover normal cases, edge cases, and failure scenarios in every test suite.
3. Do not modify production code solely to satisfy tests. Fix the test or fix the design.
4. Ensure tests are deterministic and reproducible. No flaky tests in CI.
5. Maintain meaningful test coverage. Coverage numbers are a signal, not a goal.

---

## Documentation

1. Document public APIs, classes, and complex logic — especially the Advisor Context Layer schema and LangGraph agent graph.
2. Explain the *why*, not the *what*. The code shows what; comments explain the reasoning behind it.
3. Keep documentation synchronised with code changes. An outdated doc is worse than no doc.
4. Add comments only when the code itself is insufficiently clear. Clear code is the first goal.

---

## Performance

1. Measure before optimising. Profile first, guess never.
2. Avoid unnecessary database queries — the Context Layer is the cache; use it.
3. Minimise repeated computations. Cache deterministic results where appropriate.
4. Consider algorithmic complexity before shipping anything that touches all advisors or all clients.
5. Be mindful of memory usage for large datasets — embedding operations and vector searches scale with data volume.
6. Briefing generation must run as a background task. Never block the UI thread on an LLM call.

---

## Git & Version Control

1. Create atomic commits with clear commit messages — one logical change per commit.
2. Avoid mixing unrelated changes in a single commit.
3. Keep branches focused on a single feature or fix.
4. Never commit generated files unless explicitly required by the build.
5. Never commit secrets or credentials. Use `git-secrets` or equivalent pre-commit hooks.
6. **Commit after every major change.** A major change is any of: completing a task, switching a dependency or provider, refactoring a module, updating the data schema, adding a new route or agent node, or any change that would break the build if reverted independently.

**Commit message format:**
```
<type>(<scope>): <short description>

feat(briefing): add follow-up subagent to LangGraph pipeline
fix(cpd): correct quarterly credit rollup for part-credits
chore(auth): rotate JWT signing key reference to env var
```

---

## Pull Requests

1. Ensure all tests pass before submitting. Green CI is not optional.
2. Keep PRs reasonably small and reviewable. A PR that touches 20 files is a design problem.
3. Include rationale for significant design decisions — especially anything touching the Advisor Context Layer or agent graph.
4. Address review comments thoughtfully. "Done" is not a response to a design question.
5. Maintain backward compatibility unless intentionally breaking — document breaking changes explicitly.

---

## Backend-Specific Rules

1. Separate business logic from controllers and routes. FastAPI routes are thin; logic lives in service modules.
2. Use dependency injection where appropriate — especially for database sessions, the context store, and the LLM client.
3. Keep all database access centralised in repository modules. No raw queries in routes or services.
4. Design APIs with consistent response formats:
```json
{
  "success": true,
  "data": { },
  "error": null,
  "meta": { "advisor_id": "...", "timestamp": "..." }
}
```
5. Implement proper logging and monitoring on every agent step, every LLM call, and every context layer write.

---

## AI-Assisted Development Rules

These rules apply to any code generated by Claude, Copilot, or any other AI assistant.

1. Verify all AI-generated code before accepting it. Read it line by line.
2. Do not blindly trust generated implementations — especially around auth, data isolation, and anything touching the Advisor Context Layer.
3. Require explanations for complex generated code. If you cannot explain it, do not ship it.
4. Ensure generated code follows project architecture — generated code that works but violates these standards gets refactored, not merged.
5. Refactor generated code to meet quality standards when necessary. AI output is a first draft, not a final answer.

---

## JUNCTN-Specific Invariants

These are non-negotiable constraints specific to this platform. They must hold in every environment, every feature, every PR.

| Invariant | Rule |
|---|---|
| Advisor isolation | No API route may return data belonging to a different `advisor_id` than the one in the validated JWT. |
| LLM audit trail | Every LLM call must produce an audit log entry: `timestamp`, `advisor_id`, `feature`, `agent_step`, `input_token_count`, `output_summary`. |
| Partner contact quarantine | `partner.contact_info` fields are never included in any LLM prompt, embedding, or log. |
| Context Layer as source of truth | Features do not maintain their own state for data already in the Advisor Context Layer. Read from the layer; write back to the layer. |
| Bot parity | The Telegram bot enforces identical auth, data isolation, and security rules as the web app. It is a different front door to the same backend — not a different backend. |
| No blocking LLM calls on the request thread | All LLM completions (briefing, follow-up draft, module summary) run as background tasks. Routes return immediately with a job ID or a polling endpoint. |

---

*JUNCTN · ImagineHack 2026 · Engineering Standards · Internal use only*