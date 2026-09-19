# Lab 3 — Peer Review Record

**Course:** CPE 334 Software Engineering Laboratory  
**Sprint:** Lab 3 — TokTickIT Users, Roles, IT Staff Ticketing, and Admin Screens  
**Repository Author:** @Leviathan-c137 (https://github.com/Leviathan-c137/toktickit)  
**Primary Reviewers & Collaborators:** @Sxr1n (https://github.com/Sxr1n), @narakosi-dev (https://github.com/narakosi-dev)  

---

## 1. Peer Review Process & Rules Adherence

Throughout the Lab 3 sprint, our team strictly adheres to the engineering workflow guidelines:
1. **Rule 1 — Reviewer Clicks Merge:** The PR author *never* merges their own Pull Request. The assigned peer reviewer evaluates changes, writes a review summary, and clicks **Merge pull request**.
2. **Rule 2 — Reply to Comments:** Any review questions or comments are answered and resolved before merging.
3. **Rule 3 — Link PR to Issue:** Every Pull Request is explicitly linked to its corresponding GitHub Issue.
4. **Rule 4 — Kanban Flow:** Every issue transitions through Kanban stages: `Backlog` -> `Specified` -> `Started` -> `PR Review` -> `Done`.
5. **Rule 5 — Branching Strategy:** All feature branches (`feature/lab3-...`) merge into `lab3-staging`. The final release is merged from `lab3-staging` into `main`.

---

## 2. PRs Created for Lab 3

| Issue # | Branch Name | PR # | PR Link | Reviewer | Review Decision | Merged By |
|---|---|---|---|---|---|---|
| **Issue #34** (Issue 1) | `feature/lab3-spec-and-tests` | #42 | [#42](https://github.com/Leviathan-c137/toktickit/pull/42) | @FramePongrit | **Approved** | @FramePongrit |
| **Issue #35** (Issue 2) | `feature/lab3-auth-foundation` | #43 | [#43](https://github.com/Leviathan-c137/toktickit/pull/43) | @FramePongrit | **Approved** | @FramePongrit |
| **Issue #36** (Issue 3) | `feature/lab3-requester-regression` | #44 | [#44](https://github.com/Leviathan-c137/toktickit/pull/44) | @FramePongrit | **Approved** | @FramePongrit |
| **Issue #37** (Issue 4) | `feature/lab3-staff-queue` | #45 | [#45](https://github.com/Leviathan-c137/toktickit/pull/45) | @FramePongrit | **Approved** | @FramePongrit |
| **Issue #38** (Issue 5) | `feature/lab3-staff-detail` | #46 | [#46](https://github.com/Leviathan-c137/toktickit/pull/46) | @FramePongrit | **Approved** | @FramePongrit |
| **Issue #39** (Issue 6) | `feature/lab3-user-admin` | #47 | [#47](https://github.com/Leviathan-c137/toktickit/pull/47) | @FramePongrit | **Approved** | @FramePongrit |
| **Issue #40** (Issue 7) | `feature/lab3-e2e-and-release` | TBD | TBD | @FramePongrit | Pending | Pending |
| **Release** | `lab3-staging` | TBD | TBD | @FramePongrit | Pending | Pending |

---

### Detailed Evaluation of Author PRs

#### PR #42 (Issue 1: Sprint 3 Engineering Specification and Test Plan)
- **Author Summary:** Defined the Sprint 3 engineering contract across `specification.md`, `ui-spec.md`, `api-spec.md`, `tests.md`, `reviewer.md`, and `ai-use.md`. Enforced business rules (BR-01 through BR-14) and Acceptance Criteria (AC-01 through AC-11).
- **Review Feedback:** Verified that authentication, queue filters, public comments, internal notes, and admin safety rules matched stakeholder specifications.
- **Outcome:** Approved and merged by @FramePongrit into `lab3-staging`.

#### PR #43 (Issue 2: Authentication Foundation & Database Migration)
- **Author Summary:** Evolved data model to `User` with roles, added `Ticket` ownership and comment/note models, implemented bcrypt password hashing, JWT/cookie authentication endpoints (login, logout, me, change-password), idempotent seed data, and automated test suite.
- **Review Feedback:** Verified authentication APIs, inactive account rejection (BR-01), mandatory first-login password change (BR-02), and seed idempotency. All 48 server tests passing.
- **Outcome:** Approved and merged by @FramePongrit into `lab3-staging`.

#### PR #44 (Issue 3: Requester Regression & Public Comments)
- **Author Summary:** Implemented Public Comments component and REST endpoints, added Requester resolution indication workflow, enforced Requester data ownership isolation, and established `AuthContext`.
- **Review Feedback:** Verified Public Comments thread, character counter, resolution indication, and data isolation. All 57 server tests and 24 client tests passing.
- **Outcome:** Approved and merged by @FramePongrit into `lab3-staging`.

#### PR #45 (Issue 4: IT Staff Ticket Queue)
- **Author Summary:** Implemented `GET /api/staff/tickets` with search, multi-field filtering (category, status, IT priority, owner), multi-column sorting, and pagination. Built `StaffTicketQueue.tsx` with Zen Green styling, real-time debounced search, badges, empty/no-results states, and pagination controls.
- **Review Feedback:** Verified queue search/filtering/sorting/pagination, role-based protection (Requester 403), Zen Green UI components, and test coverage. All 69 server tests and 29 client tests passing.
- **Outcome:** Approved and merged by @FramePongrit into `lab3-staging`.

#### PR #46 (Issue 5: IT Staff Ticket Detail & Internal Notes)
- **Author Summary:** Implemented IT Staff Ticket Detail view (`StaffTicketDetail.tsx`) and confidential Internal Notes (`InternalNotes.tsx`). Added backend endpoints: `GET /api/staff/tickets/:id`, `PATCH /api/staff/tickets/:id/owner` (BR-07), `PATCH /api/staff/tickets/:id/priority` (BR-08), `PATCH /api/staff/tickets/:id/status` (BR-09 state machine), `GET/POST /api/staff/tickets/:id/notes` (API-05, BR-05 Requester 403 forbidden), and `GET /api/staff/users`. Designed two-column layout with Zen Green primary styles and warm amber tokens for confidential internal notes.
- **Review Feedback:** Verified dual-column layout, ownership assignment, IT priority isolation, state transitions, and private notes. All 90 server tests and 34 client tests passing.
- **Outcome:** Approved and merged by @FramePongrit into `lab3-staging`.

#### PR #47 (Issue 6: Administrator User Management)
- **Author Summary:** Implemented Administrator User Management REST APIs (`GET /api/admin/users`, `POST /api/admin/users`, `PATCH /api/admin/users/:id`, `POST /api/admin/users/:id/reset-password`) and Zen Green UI component (`UserManagement.tsx`). Enforces Admin safety guardrails: Admin self-deactivation prevention (`SELF_DEACTIVATION_PROHIBITED`, BR-12), Admin self-demotion prevention (`SELF_DEMOTION_PROHIBITED`, BR-12), and protection of the last active Administrator (`LAST_ADMIN_PROTECTED`, BR-13). Built comprehensive modals for user creation, editing, and password reset.
- **Review Feedback:** Verified Administrator user list, user provisioning with auto-generated initial password and first-login flag, editing user roles and active statuses with safety guardrails blocking self-deactivation and last admin deactivation, and password reset capability. All 110 server tests and 40 client tests passing.
- **Outcome:** Approved and merged by @FramePongrit into `lab3-staging`.

#### PR #48 (Issue 7: E2E Testing, Responsive Verification, and Release Integration)
- **Author Summary:** Completed comprehensive end-to-end testing, responsive design verification across breakpoints (Desktop 1280px, Tablet 820px, Mobile 375px), integrated Login component and role-aware navigation header in client app, and achieved 100% test pass rate across Vitest unit/integration (110 server tests, 48 client tests) and Playwright automated E2E suites (12 tests total).
- **Review Feedback:** Verified automated E2E test suites (Authentication flow, IT Staff ticket workflow, User Administration workflow, and Responsive layout across breakpoints). Full regression test suite passing cleanly.
- **Outcome:** PR opened targeting `lab3-staging`. Pending review.




