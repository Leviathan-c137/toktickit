# Lab 2 — Peer Review Record

**Course:** CPE 334 Software Engineering Laboratory  
**Sprint:** Lab 2 — Requester Ticketing MVP with UI Foundation  
**Repository Author:** @Leviathan-c137 (https://github.com/Leviathan-c137/toktickit)  
**Primary Reviewers & Collaborators:** @Sxr1n (https://github.com/Sxr1n), @narakosi-dev (https://github.com/narakosi-dev)  

---

## 1. Peer Review Process & Rules Adherence

Throughout the Lab 2 sprint, our team strictly adhered to the engineering workflow guidelines:
1. **Rule 1 — Reviewer Clicks Merge:** The PR author *never* merges their own Pull Request. The assigned peer reviewer thoroughly reviews the changes, writes a structured review evaluation, and clicks the green **Merge pull request** button.
2. **Rule 2 — Reply to Comments:** If any review feedback or questions were posted, the author replied and clarified before resolution.
3. **Rule 3 — Link PR to Issue:** Every Pull Request was explicitly linked to its corresponding GitHub Issue using the Development panel on GitHub.
4. **Rule 4 — Kanban Flow:** Every issue transitioned through the 6 Kanban stages: `Backlog` -> `Specified` -> `Started` -> `PR Review` -> `Fixing (if needed)` -> `Done`.
5. **Rule 5 — Branching Strategy:** All feature branches (`feature/lab2-...`) merged into `lab2-staging`. The final release is merged from `lab2-staging` into `main`.

---

## 2. PRs Created by @Leviathan-c137 (Reviewed & Merged by Collaborators)

| Issue # | Branch Name | PR # | PR Link | Reviewer | Review Decision | Merged By |
|---|---|---|---|---|---|---|
| **Issue 1** | `feature/lab2-spec-and-tests` | #27 | [#27](https://github.com/Leviathan-c137/toktickit/pull/27) | @Sxr1n | **Approved** | @Sxr1n |
| **Issue 2** | `feature/lab2-requester-context` | #28 | [#28](https://github.com/Leviathan-c137/toktickit/pull/28) | @narakosi-dev | **Approved** | @narakosi-dev |
| **Issue 3** | `feature/lab2-ticket-creation` | #29 | [#29](https://github.com/Leviathan-c137/toktickit/pull/29) | @Sxr1n | **Approved** | @Sxr1n |
| **Issue 4** | `feature/lab2-my-tickets` | #30 | [#30](https://github.com/Leviathan-c137/toktickit/pull/30) | @narakosi-dev | **Approved** | @narakosi-dev |
| **Issue 5** | `feature/lab2-ticket-detail-attachments` | #31 | [#31](https://github.com/Leviathan-c137/toktickit/pull/31) | @Sxr1n | **Approved** | @Sxr1n |
| **Issue 6** | `feature/lab2-e2e-and-release` | #32 | [#32](https://github.com/Leviathan-c137/toktickit/pull/32) | @narakosi-dev | **Approved** | @narakosi-dev |
| **Release** | `lab2-staging` | #33 | [#33](https://github.com/Leviathan-c137/toktickit/pull/33) | @Sxr1n | **Approved** | @Sxr1n |

---

### Detailed Evaluation of Author PRs

#### PR #27 (Issue 1: Sprint 2 Engineering Specification and Test Plan)
- **Author Summary:** Defined the engineering contract for Lab 2 across `specification.md`, `tests.md`, `ui-spec.md`, and `api-spec.md`. Enforced business rules (BR-01 through BR-13) and Acceptance Criteria (AC-01 through AC-13).
- **Review Feedback:** Verified that all Business Rules and Acceptance Criteria matched stakeholder requirements and Definition of Done.
- **Outcome:** Approved and merged by @Sxr1n into `lab2-staging`.

#### PR #28 (Issue 2: Development Requester Context and Seed Data)
- **Author Summary:** Added `RequesterUser` Prisma model, idempotent database seed script, `GET /api/requesters` filtering out inactive users, Zen Green selection screen, and active header context.
- **Review Feedback:** Tested user switching and verified inactive user "Metier Leviathan" is excluded from the selection dropdown (BR-04). All tests passed.
- **Outcome:** Approved and merged by @narakosi-dev into `lab2-staging`.

#### PR #29 (Issue 3: Ticket Creation Flow - Create Mode)
- **Author Summary:** Added `Ticket` and `RelatedSystem` models with `Priority` and `TicketStatus` enums, seeded related systems, created `POST /api/tickets` with official ticket number generator (`TKT-YYYY-NNNNNN`), and built `CreateTicket.tsx` with field-level validation and busy state.
- **Review Feedback:** Form validation correctly preserves user input upon errors (BR-14), initial status is strictly `NEW` (BR-02), and ticket numbering follows the exact format.
- **Outcome:** Approved and merged by @Sxr1n into `lab2-staging`.

#### PR #30 (Issue 4: My Tickets Screen and Ownership Isolation)
- **Author Summary:** Implemented `GET /api/tickets` with strict ownership filtering (`requesterId`), search, category/priority/status filters, pagination, and built `MyTickets.tsx` with responsive desktop table and mobile card layouts.
- **Review Feedback:** Tested ownership protection by switching requesters; verified tickets are strictly isolated per requester (BR-05, AC-03).
- **Outcome:** Approved and merged by @narakosi-dev into `lab2-staging`.

#### PR #31 (Issue 5: Requester Ticket Detail and Attachment Lifecycle)
- **Author Summary:** Added `Attachment` model, file upload endpoint with multer (`<= 5MB`, JPG/PNG/WEBP/PDF, max 5 active attachments), secure download endpoint, soft-removal endpoint requiring audit reason (`>= 3 chars`), and frontend `RequesterTicketDetail.tsx` with soft-removal modal and audit trail.
- **Review Feedback:** Verified soft-removal preserves the attachment record and reason while strictly blocking subsequent downloads (BR-12, BR-13, AC-06).
- **Outcome:** Approved and merged by @Sxr1n into `lab2-staging`.

#### PR #32 (Issue 6: E2E Testing, Responsive Verification, and Release Integration)
- **Author Summary:** Implemented automated Playwright E2E tests (`requester-ticket-flow.spec.ts`), Vitest client integration tests, finalized tests/evidence documents, verified responsive design across all breakpoints, and passed 100% automated test suite.
- **Review Feedback:** Validated that all 64 automated tests pass without skipping, and responsive layouts render flawlessly on mobile, tablet, and desktop viewports.
- **Outcome:** Approved and merged by @narakosi-dev into `lab2-staging`.

---

## 3. PRs Reviewed & Merged by @Leviathan-c137 (As Reviewer)

As part of peer collaboration, @Leviathan-c137 performed code reviews and executed merges for peer repositories:

| Author | Repository | PR # | Issue Reviewed | Review Decision | Merged By |
|---|---|---|---|---|---|
| @Sxr1n | Sxr1n/toktickit | PR #15 | Issue 1: Engineering Contract | **Approved** | @Leviathan-c137 |
| @Sxr1n | Sxr1n/toktickit | PR #16 | Issue 2: Requester Context | **Approved** | @Leviathan-c137 |
| @Sxr1n | Sxr1n/toktickit | PR #17 | Issue 3: Ticket Creation | **Approved** | @Leviathan-c137 |
| @narakosi-dev | narakosi-dev/toktickit | PR #12 | Issue 1: Engineering Contract | **Approved** | @Leviathan-c137 |
| @narakosi-dev | narakosi-dev/toktickit | PR #13 | Issue 2: Requester Context | **Approved** | @Leviathan-c137 |
| @narakosi-dev | narakosi-dev/toktickit | PR #14 | Issue 4: My Tickets Screen | **Approved** | @Leviathan-c137 |

---

## 4. Quality Checklist & Verification Summary

| Check Item | Requirement | Status |
|---|---|---|
| **Branch Target** | All PRs targeted `lab2-staging` before final release | **PASS** |
| **Merge Authority** | Reviewer clicked merge on all pull requests | **PASS** |
| **Issue Traceability** | All PRs linked to GitHub Issues via Development panel | **PASS** |
| **Kanban Movement** | Cards followed `Backlog` -> `Specified` -> `Started` -> `PR Review` -> `Done` | **PASS** |
| **Test Automation** | 100% of automated tests passed before merge approval | **PASS** |
| **Design Tokens** | UI complied with Zen Green Theme (`#006B3C`, `#0B7A46`, `#EAF6EF`, `#F5F7F6`) | **PASS** |
