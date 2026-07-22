# Dependency Security Upgrade Design

## Goal

Remove all vulnerabilities reported by the root npm dependency graph while preserving the existing Express 4 routes, EJS views, Qimen calculations, Meihua calculations, and Vercel Git deployment flow.

## Scope

- Upgrade vulnerable direct dependencies to versions outside every reported advisory range.
- Keep Express on major version 4 to avoid an unrelated routing migration.
- Accept the required EJS major upgrade because no supported 2.x version fixes the critical template-injection advisory.
- Keep `lunar-javascript` at the package-lock version used by the new golden tests; changing the calendar library could change domain results and is not required by the audit.
- Standardize the root application on npm by retaining `package-lock.json` and removing `pnpm-lock.yaml`.
- Update the dated TODO and changelog, then commit and push only the intended application changes.

## Dependency Targets

| Package | Current | Target | Reason |
| --- | ---: | ---: | --- |
| axios | 1.11.0 | 1.18.1 | Fix direct DoS, SSRF, header and prototype-pollution advisories |
| ejs | 2.7.4 | 6.0.1 | Fix critical template injection and pollution protection advisories |
| express | 4.21.2 | 4.22.2 | Pull fixed body-parser, path-to-regexp and qs versions without Express 5 migration |
| nodemon | 2.0.22 | 3.1.14 | Remove vulnerable development-only notifier dependency chain |

Transitive packages such as `body-parser`, `qs`, `path-to-regexp`, `follow-redirects`, `form-data`, `brace-expansion`, `minimatch`, and `picomatch` must resolve outside the vulnerable ranges through the updated lockfile.

## Compatibility Strategy

The existing CommonJS API remains unchanged. EJS 6 exposes a CommonJS entrypoint, so `require('ejs').renderFile` remains the integration point. Express remains on v4, so route matching and middleware behavior do not intentionally change.

## Verification

The upgrade is accepted only when all of these checks pass:

1. `npm test` passes all six offline tests.
2. `TZ=UTC npm test` passes the same six tests.
3. A local server returns HTTP 200 for `/`, `/meihua`, and `/api/qimen`.
4. Returned HTML contains the expected page markers, proving EJS rendering works after the major upgrade.
5. `npm audit --audit-level=low` reports zero vulnerabilities.
6. `npm ci` can recreate the installed dependency graph from `package-lock.json`.
7. `git diff --check` and JavaScript syntax checks pass.

## Deployment

After verification, update `docs/changelog.md`, stage only the files belonging to P0 and this security upgrade, commit on `main`, and push to `origin/main`. The existing Git-connected Vercel project is expected to create a deployment from that push; no direct production CLI deployment is included.
