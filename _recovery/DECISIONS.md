# HL Intel Decisions

## Durable Recovery

- Decision: The workspace, not the chat, is the source of truth.
- Reason: Chat crashes or context loss should not erase project state.
- Consequence: Important state must be captured in `_recovery/` and git.

## First Sellable Product

- Decision: Keep HL Intel Telegram-first for the first sellable version.
- Reason: The fastest path to value is filtered, contextual alerts rather than a dashboard.
- Consequence: Dashboard, Discord, and automation stay secondary until Pro user demand proves they are needed.

## Product Boundary

- Decision: HL Intel is data and intelligence, not trade automation or financial advice.
- Reason: Keeps the product simpler, safer, and easier to sell.
- Consequence: Copy, alerts, and docs should avoid promising execution or outcomes.

## Workspace Structure

- Decision: Use `/Users/corbinpaulson/Documents/HL INTEL Workspace` as the clean daily workspace.
- Reason: The old `/Users/corbinpaulson/Documents/New project` folder is crowded with many recovered and unrelated project files.
- Consequence: New HL Intel work should happen in the clean worktree unless deliberately working on recovery history.

## Live Scanner Host

- Decision: Run the first live HL Intel scanner on Fly as app `hl-intel-scanner`.
- Reason: The product needs an always-on worker with persistent SQLite state and GitHub-driven deploys.
- Consequence: Production docs, recovery notes, and deploy checks should assume one Fly worker with the `hl_intel_data` volume mounted at `/data`.
