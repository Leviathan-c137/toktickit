# Lab 4 — Peer Review Record

**Course:** CPE 334 Software Engineering Laboratory  
**Sprint:** Lab 4 — TokTickIT Actions Taken, Dashboards, and Final Regression  
**Repository Author:** @Leviathan-c137 (https://github.com/Leviathan-c137/toktickit)  
**Primary Reviewers & Collaborators:** @Beethoven190 (https://github.com/Beethoven190), @FramePongrit (https://github.com/FramePongrit), @Sxr1n (https://github.com/Sxr1n), @narakosi-dev (https://github.com/narakosi-dev)  

---

## 1. Peer Review Process & Rules Adherence

Throughout the Lab 4 sprint, our team strictly adheres to the engineering workflow guidelines established across earlier sprints:
1. **Rule 1 — Reviewer Clicks Merge:** The PR author *never* merges their own Pull Request. The assigned peer reviewer evaluates changes, writes a review summary, and approves/merges the PR.
2. **Rule 2 — Reply to Comments:** Any review questions, test suggestions, or code review comments are addressed before merging.
3. **Rule 3 — Link PR to Issue:** Every Pull Request is explicitly linked to its corresponding GitHub Issue using closing keywords (e.g., `Fixes #50`).
4. **Rule 4 — Kanban Flow:** Every issue transitions through Kanban stages: `Backlog` → `Specified` → `Started` → `PR Review` → `Done`.
5. **Rule 5 — Branching Strategy:** All feature branches (`feature/lab4-...`) branch from and merge into `lab4-staging`. The final release is merged from `lab4-staging` into `main`.

---

## 2. PRs Created for Lab 4

| Issue # | Branch Name | PR # | PR Link | Reviewer | Review Decision | Merged By |
|---|---|---|---|---|---|---|
| **Issue #50** (Issue 1) | `feature/lab4-spec-and-tests` | #56 | [#56](https://github.com/Leviathan-c137/toktickit/pull/56) | @Beethoven190 | **Approved** | @Beethoven190 |
| **Issue #51** (Issue 2) | `feature/lab4-actions-taken-foundation` | #57 | [#57](https://github.com/Leviathan-c137/toktickit/pull/57) | @Beethoven190 | **Approved** | @Beethoven190 |
| **Issue #52** (Issue 3) | `feature/lab4-actions-taken-ui` | #58 | [#58](https://github.com/Leviathan-c137/toktickit/pull/58) | @Sxr1n | **Approved** | @Sxr1n |
| **Issue #53** (Issue 4) | `feature/lab4-ticket-workflow` | #59 | [#59](https://github.com/Leviathan-c137/toktickit/pull/59) | @Sxr1n | **Approved** | @Sxr1n |
| **Issue #54** (Issue 5) | `feature/lab4-role-dashboards` | #60 | [#60](https://github.com/Leviathan-c137/toktickit/pull/60) | @Sxr1n, @Beethoven190 | **Approved** | @Sxr1n |
| **Issue #55** (Issue 6) | `feature/lab4-e2e-and-release` | #61 | [#61](https://github.com/Leviathan-c137/toktickit/pull/61) | @Sxr1n, @Beethoven190 | In Review | Pending |
| **Release** | `lab4-staging` | TBD | Pending Review | @Beethoven190 | Pending | Pending |

---

## 3. Detailed Evaluation of Author PRs

### PR #56 (Issue #50: Sprint 4 Engineering Specification and Test Plan)
- **Author Summary:** Defined the Sprint 4 engineering contract across `specification.md`, `ui-spec.md`, `api-spec.md`, `tests.md`, `reviewer.md`, and `ai-use.md`. Formulated business rules (BR-01 through BR-12) and Acceptance Criteria (AC-01 through AC-12) covering Actions Taken, Dashboards, Ticket Workflow, and Regression Hardening.
- **Review Feedback:** Thorough review by @Beethoven190 confirming parent-child modeling (BR-01), distributed team execution without reassigning ticket coordinator (BR-02), conditional follow-up note validation (BR-04), 8-state ticket transitions and resolution gate (BR-06, BR-07), Zen Green role dashboards, and complete traceability matrix mapping AC-01 to AC-12 across unit, API, UI, and E2E suites.
- **Outcome:** Approved and merged by @Beethoven190 into `lab4-staging`.

### PR #57 (Issue #51: Actions Taken Foundation, Database Migration, Seed, and REST APIs)
- **Author Summary:** Added `ActionTaken` Prisma model linked to `Ticket` (cascade delete) and `User`. Updated `seed.ts` with idempotent sample data featuring 0, 1, and multiple actions performed by different IT Staff members. Implemented `GET/POST /api/tickets/:id/actions` and `PATCH /api/tickets/:id/actions/:actionId` with automatic `performedById` attribution, BR-04 conditional follow-up note validation, Requester read-only data isolation, and HTTP 409 stale-update conflict detection. Achieved 100% test pass across 14 new tests (`server/tests/lab-04/actions-taken.api.test.ts`) and all 124 server tests.
- **Review Feedback:** Thorough review and code audit by @Beethoven190 verifying schema relational integrity with cascade delete and performance indices, idempotent multi-action seed distributions, strict REST RBAC with automatic performedById attribution, BR-04 conditional follow-up note validation, and HTTP 409 stale-update concurrency defense. Full 124 server regression tests passing cleanly. Recommended focusing on the follow-up note validation cues and dynamic toggle in the upcoming Issue #52 UI.
- **Outcome:** Approved and merged by @Beethoven190 into lab4-staging.

### PR #58 (Issue #52: Actions Taken UI on Ticket Detail)
- **Author Summary:** Built ActionsTaken.tsx component implementing chronological actions list, modal dialog for create/edit, real-time validation (including BR-04 conditional follow-up note validation with automatic focus on toggle as requested by @Beethoven190), HTTP 409 concurrency conflict alert, and Requester read-only mode with empty state. Integrated component into both StaffTicketDetail.tsx and RequesterTicketDetail.tsx. Implemented 7 new tests in client/tests/lab-04/ActionsTaken.test.tsx (UI-01, UI-02) with 100% pass across all 55 client tests and 124 server tests.
- **Review Feedback:** Comprehensive review and approval by @Sxr1n. Praised the clean Zen Green UI layout, empty states, requester read-only isolation, follow-up note validation, and auto-focus toggle cues. Recommended converting `datetime-local` in edit modal with local offset to prevent timezone shifts across saves, defaulting `isReadOnly` safely when unauthenticated, and re-sorting actions list upon update to guarantee AC-04 chronological integrity for backdated records.
- **Outcome:** Approved and merged by @Sxr1n into `lab4-staging`.

### PR #59 (Issue #53: Ticket Workflow, Permitted Status Transitions, and Resolution Gate)
- **Author Summary:** Enforced the formal 8-state ticket transition engine (`server/src/app.ts`) adhering to BR-06, rejecting illegal state leaps with HTTP 400 `INVALID_STATUS_TRANSITION`. Restricted resolution authority exclusively to IT Staff and Administrators (BR-07, AC-06, HTTP 403 for Requesters), preserving purely advisory resolution indications from Requesters. Implemented optimistic concurrency stale-update defense returning HTTP 409 `CONFLICT`. Added dynamic permitted status selector and terminal state (`Cancelled`/`Closed`) confirmation modal to `StaffTicketDetail.tsx` per UI Spec 2.4. Incorporated reviewer feedback from @Sxr1n on timezone offset handling and chronological re-sorting in `ActionsTaken.tsx`. Added 19 backend integration tests in `server/tests/lab-04/ticket-workflow.api.test.ts` (API-05, API-06, API-07) and 9 frontend tests in `client/tests/lab-04/TicketWorkflow.test.tsx` (UI-03), achieving 100% test pass rate across 143 server tests and 64 client tests.
- **Review Feedback:** Comprehensive review and approval by @Sxr1n. Verified state transition validation, resolution gate restrictions, optimistic concurrency handling, and modal confirmation behavior.
- **Outcome:** Approved and merged by @Sxr1n into `lab4-staging`.

### PR #60 (Issue #54: Role-Based Dashboards for Requester and IT Staff)
- **Author Summary:** Implemented authoritative role-based operational dashboards for Requester and IT Staff/Administrator personas. Delivered `GET /api/requester/dashboard` (FR-10, BR-09, BR-10, BR-12) enforcing strict requester data isolation, and `GET /api/staff/dashboard` (FR-11, BR-10, BR-12) computing service desk queue metrics and staff assignment counts. Developed `RequesterDashboard.tsx` (UI-04) featuring 4 metric cards, recent tickets list, and interactive drill-down navigation to filtered `MyTickets`, and `StaffDashboard.tsx` (UI-05) featuring 5 metric cards, recent tickets table, and drill-down navigation to `StaffTicketQueue`. Added 12 backend integration tests (API-08, API-09, API-10) and 14 frontend tests (UI-04, UI-05), passing 100% across all 19 server suites (163/163 tests) and 16 client suites (79/79 tests).
- **Review Feedback:** Thorough review and 5 feedback items by @Sxr1n regarding status grouping, open ticket definition across New/Open/Reopened, Waiting Requester grouping, dashboard navigation guards for guest requesters, and test parallelism. All comments were resolved and verified.
- **Outcome:** Approved and merged by @Sxr1n into `lab4-staging`.

### Issue #55 (Issue 6: Final Regression, E2E Testing, Accessibility, and Release Integration)
- **Author Summary:** Built comprehensive Playwright E2E suites (`client/e2e/lab-04/actions-taken-flow.spec.ts`, `client/e2e/lab-04/ticket-resolution.spec.ts`, `client/e2e/lab-04/dashboards.spec.ts`, `client/e2e/lab-04/responsive.spec.ts`) and Vitest integration suite (`client/tests/lab-04/E2EIntegration.test.tsx`). Verified full regression across Labs 1-3 with 100% passing rate across all 19 server test files (165 tests) and 17 client test files (81 tests). Verified WCAG 2.1 AA accessibility contrast and responsive viewport support across all viewports.
- **Review Feedback:** Rigorous review by @Sxr1n identifying 4 blocking items and 2 non-blocking enhancements:
  1. Fixed selector references (`logout-btn`, `ticket-status-badge`, `problem-resolved-btn`).
  2. Removed conditional `if (await isVisible())` assertion wrappers, replacing with unconditional `await expect(...).toBeVisible()`, and added explicit test exercising Resolution Gate rejection prior to action logging.
  3. Ensured complete test data isolation via API provisioning in `test-helpers.ts` targeting specific ticket IDs instead of modifying queue index 0.
  4. Reclassified `E2EIntegration.test.tsx` in `tests.md` as Component Integration (`INT-01`, `INT-02`) and based E2E status purely on live Playwright execution.
  5. Implemented cross-platform webServer commands in `playwright.config.ts`, added touch target sizing (>= 38-44px), and programmatic WCAG 2.1 AA color contrast calculation (>= 4.5:1).
- **Outcome:** Resolved and re-submitted for approval.
