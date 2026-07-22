# Dependency Security Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all npm audit vulnerabilities without changing the application's public behavior or Qimen/Meihua calculation outputs.

**Architecture:** Keep the CommonJS Express 4 application intact and change only dependency declarations, the npm lockfile, package-manager selection, tests, and release documentation. Existing offline tests protect domain behavior; local HTTP smoke checks protect EJS and Express integration.

**Tech Stack:** Node.js, npm, Express 4, EJS, Axios, Node test runner, Vercel Git deployments

---

### Task 1: Capture the security and behavior baseline

**Files:**
- Read: `package.json`
- Read: `package-lock.json`
- Test: `test/*.test.js`

- [ ] Run `npm audit --json` and confirm the baseline is 14 vulnerabilities: 3 moderate, 10 high, and 1 critical.
- [ ] Run `npm test` and confirm 6 tests pass.
- [ ] Start with `PORT=4310 LLM_API_KEY= NODE_ENV=test node app.js`.
- [ ] Request `/`, `/meihua`, and `/api/qimen`; confirm all return HTTP 200 before upgrading.
- [ ] Stop the local server.

### Task 2: Upgrade vulnerable dependencies

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Delete: `pnpm-lock.yaml`

- [ ] Run `npm install axios@1.18.1 ejs@6.0.1 express@4.22.2 --save`.
- [ ] Run `npm install nodemon@3.1.14 --save-dev`.
- [ ] Remove the root `pnpm-lock.yaml` so Vercel has one deterministic package-manager signal.
- [ ] Run `npm audit --audit-level=low` and require zero vulnerabilities.

### Task 3: Verify runtime compatibility

**Files:**
- Test: `test/qimen-components.test.js`
- Test: `test/meihua.test.js`
- Test: `test/qimen.test.js`
- Verify: `views/index.html`
- Verify: `views/meihua.html`

- [ ] Run `npm test`; require 6 passed and 0 failed.
- [ ] Run `TZ=UTC npm test`; require 6 passed and 0 failed.
- [ ] Start with `PORT=4310 LLM_API_KEY= NODE_ENV=test node app.js`.
- [ ] Request `/`, `/meihua`, and `/api/qimen`; require HTTP 200 and expected HTML/JSON markers.
- [ ] Stop the local server.
- [ ] Run `node --check` for every changed or newly added JavaScript file.
- [ ] Run `git diff --check`; require no whitespace errors.

### Task 4: Prove lockfile reproducibility

**Files:**
- Verify: `package-lock.json`

- [ ] Run `npm ci` to recreate `node_modules` only from the lockfile.
- [ ] Run `npm test` again; require 6 passed and 0 failed.
- [ ] Run `npm audit --audit-level=low` again; require zero vulnerabilities.

### Task 5: Document and publish

**Files:**
- Modify: `docs/2026-07-22-refactoring-todo.md`
- Modify: `docs/changelog.md`

- [ ] Mark the dependency-audit item complete and record final versions and verification evidence.
- [ ] Add a 2026-07-22 changelog entry for P0 regression protection and the dependency security upgrade.
- [ ] Review `git status` and stage only P0, security-upgrade, TODO, plan, and changelog files.
- [ ] Commit with `git commit -m "fix: harden core calculations and dependencies"`.
- [ ] Push with `git push origin main`.
- [ ] Confirm the remote `main` SHA matches local `HEAD` and report the Vercel Git-deployment handoff.
