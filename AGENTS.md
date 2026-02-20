# Codex Operating Guide (Project Scope)

This file translates the team CLAUDE workflow into Codex-native practices for this repository.

## 1) Plan Mode by Default
- Use `update_plan` for any non-trivial task (3+ steps, ambiguous requirements, architecture changes, migrations, or production-risky edits).
- Keep exactly one step `in_progress` and update statuses as work advances.
- If implementation drifts or fails, stop and re-plan before continuing.
- Include verification work in the plan, not only build work.

## 2) Scoped Parallelism (Codex equivalent of subagents)
- Keep context lean: split work into small, explicit plan steps.
- Offload exploration to tools (`rg`, focused file reads, targeted test commands) instead of loading unnecessary files.
- Prefer one clear objective per step/command; avoid mixing unrelated concerns.
- For complex tasks, run independent checks in parallel where practical, then consolidate findings.

## 3) Self-Improvement Loop
- After user corrections, record reusable lessons in `tasks/lessons.md`.
- Add prevention rules (what to do next time, trigger conditions, and checklists).
- At task start, quickly review `tasks/lessons.md` and apply relevant lessons.

## 4) Verification Before Done
- Never mark work complete without evidence.
- Run relevant tests/lint/type-checks for touched code.
- When behavior changes, compare before/after outcomes (logs, API responses, screenshots, or test output).
- Ask: “Would a staff engineer approve this change for maintainability and risk?”

## 5) Demand Elegance (Balanced)
- For non-trivial changes, pause and evaluate a simpler/more robust approach before finalizing.
- Avoid hacky fixes if a clean solution is feasible within scope.
- For simple bugs, do the minimal correct change; do not over-engineer.

## 6) Autonomous Bug-Fixing
- When a bug is reported, diagnose and implement a fix end-to-end without asking for step-by-step guidance.
- Ground fixes in evidence (failing tests, logs, reproducible behavior).
- Reduce context switching for the user: identify root cause, apply fix, verify.

## 7) Task Management Files
- Keep an actionable checklist in `tasks/todo.md` for non-trivial tasks.
- Mark progress as items complete.
- Add a short “Review / Results” section at the end of each task entry.
- Capture corrections and durable takeaways in `tasks/lessons.md`.

## 8) Core Engineering Principles
- Simplicity first: smallest change that fully solves the issue.
- Root-cause focus: avoid temporary patches.
- Minimal impact: touch only necessary files and keep blast radius low.
