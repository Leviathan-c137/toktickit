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
| **Issue #52** (Issue 3) | `feature/lab4-actions-taken-ui` | TBD | Pending Review | @Beethoven190 | Pending | Pending |
| **Issue #53** (Issue 4) | `feature/lab4-ticket-workflow` | TBD | Pending Review | @Beethoven190 | Pending | Pending |
| **Issue #54** (Issue 5) | `feature/lab4-role-dashboards` | TBD | Pending Review | @Beethoven190 | Pending | Pending |
| **Issue #55** (Issue 6) | `feature/lab4-final-hardening` | TBD | Pending Review | @Sxr1n | Pending | Pending |
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
