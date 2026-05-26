# Session Closeout Template

Before ending a meaningful work block, update the recovery files.

## Checklist

- Update `_recovery/CURRENT_STATE.md` if the project state changed.
- Update `_recovery/NEXT_STEPS.md` with the next exact actions.
- Append a dated entry to `_recovery/SESSION_LOG.md`.
- Update `_recovery/DECISIONS.md` if a product or technical decision changed.
- Update `_recovery/OPEN_QUESTIONS.md` if a question was answered or a new one appeared.
- Run `git status --short --branch`.
- Commit or clearly describe any uncommitted work.

## Log Entry

```md
## YYYY-MM-DD - Short Session Name

- What changed:
- What was verified:
- Decisions made:
- Next exact action:
- Any risk or blocker:
```
