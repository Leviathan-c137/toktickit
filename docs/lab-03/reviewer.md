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
| **Issue #38** (Issue 5) | `feature/lab3-staff-detail` | TBD | TBD | @FramePongrit | Pending | Pending |
| **Issue #39** (Issue 6) | `feature/lab3-user-admin` | TBD | TBD | @FramePongrit | Pending | Pending |
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


