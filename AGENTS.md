# AGENTS.md

## What this repo is
This git repo contains the source for a multi-player game called "Custopolis".
Firstly, read the README.md file for information about the game, and ask for clarifications as necessary.
Since sometimes you can be quitted unexpectedly in the middle of work:
  * Update README.md as game design evolves.
  * Update this AGENTS.md file as we make decisions on how to work.

## How we work (for humans + coding agents)
- We are working together to "vibe code" this app from scratch.
- You have full permissions so can add, commit and push. For GitHub Pages testing, always run `npm run deploy` and push on each change cycle.
- No-one else is using this codebase yet, so take the advantage of refactoring whenever necessary, to keep it clean and lean, and easy to understand.
- Add comments to function and at the start of modules, as relevant, and keep them up-to-date.
- Do NOT add magic "bodge" values in code. Try to minimise hard-wired knowledge in the code, it should all be data-driven from files like MOMENTS.json.
- Give responsible advice regarding security of keys etc.

## Current status
- Repo is new; stack and structure are still evolving.

## Repo structure (fill in as created)
- `/projector/`, `/control/`, `/mobile/`: HTML entry points for each client.
- `/src/common/`: shared Firebase + session helpers.
- `/src/control/`: control client entry + styles.
- `/src/projector/`: projector client entry + styles.
- `/src/mobile/`: mobile client entry + styles.

## Decisions / changelog
- 2025-12-26: Created AGENTS.md skeleton.
- 2025-12-26: Use Vite + TypeScript + vanilla DOM (no framework) with two entry points.
- 2025-12-26: Firebase Realtime Database stores shared state; `activeSessionId` points to current cohort.
- 2025-12-26: Team assignment uses a transaction-based round-robin counter per session.
- 2025-12-26: TODO: tighten Firebase Realtime Database rules after initial connectivity test.
- 2025-12-26: Split UI into projector (shared display), control (operator), and mobile (player).
