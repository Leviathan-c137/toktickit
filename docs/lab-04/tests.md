# Lab 4 Test Plan and Traceability Matrix

## 1. Test Strategy Overview

The Lab 4 test strategy establishes comprehensive quality verification spanning unit tests, API/integration tests, UI component tests, workflow state transitions, security authorization gates, regression coverage of Labs 1–3, and automated Playwright End-to-End (E2E) suites. Every Acceptance Criterion (AC-01 through AC-12) maps to at least one automated test file.

---

## 2. Test Cases & Traceability Matrix

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File Path | Status |
|---|---|---|---|---|---|---|
| **API-01** | API | AC-01, FR-01, FR-03 | Create valid Action Taken by IT Staff | 201 Created, `performedById` matches authenticated user, saved to database | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| **API-02** | API | AC-02, BR-04, FR-04 | Follow-up note validation enforcement | 400 Bad Request when `followUpRequired == true` and `followUpNote` is empty | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| **API-03** | API | AC-03, FR-05, FR-06 | Requester read-only actions and isolation | 200 OK for owned tickets; 403 Forbidden when creating/updating actions | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| **API-04** | API | AC-04, BR-05 | Chronological order and multiple performers | Actions returned in stable chronological order with distinct `performedBy` | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| **API-05** | API | AC-05, BR-06, FR-07 | Status transition state machine rules | Rejects illegal transitions (e.g. `New` → `Resolved`) with 400 Bad Request | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pass |
| **API-06** | API | AC-06, BR-07, FR-08 | Resolution gate authorization | Requesters blocked from changing status directly (403 Forbidden) | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pass |
| **API-07** | API | AC-07, BR-08, FR-09 | Concurrency and stale update handling | 409 Conflict returned when `expectedUpdatedAt` mismatches | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pass |
| **API-08** | API | AC-08, BR-09, FR-10 | Requester dashboard authoritative metrics | Returns only metrics and recent tickets owned by authenticated requester | `server/tests/lab-04/requester-dashboard.api.test.ts` | Planned (Issue 5) |
| **API-09** | API | AC-09, BR-10, FR-11 | IT Staff dashboard operational metrics | Accurate counts for New, Open, InProgress, Waiting, MyAssigned | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned (Issue 5) |
| **API-10** | API | AC-11, BR-12 | Empty state metrics and zero results | Safely returns 0 counts and empty arrays without errors | `server/tests/lab-04/requester-dashboard.api.test.ts` | Planned (Issue 5) |
| **UI-01** | UI | AC-01, AC-02, FR-01 | Actions Taken list & create/edit form | Renders list, validates follow-up requirement, triggers create callback | `client/tests/lab-04/ActionsTaken.test.tsx` | Pass |
| **UI-02** | UI | AC-03, FR-05, FR-06 | Actions Taken Requester read-only view | Renders action history without "+ Add Action" or "Edit" buttons | `client/tests/lab-04/ActionsTaken.test.tsx` | Pass |
| **UI-03** | UI | AC-05, AC-06, FR-07 | Ticket workflow & status transition UI | Shows permitted status transitions and resolution gate controls | `client/tests/lab-04/TicketWorkflow.test.tsx` | Pass |
| **UI-04** | UI | AC-08, AC-10, FR-10 | Requester Dashboard component & drill-down | Renders 4 metric cards, recent tickets, and drill-down links | `client/tests/lab-04/RequesterDashboard.test.tsx` | Planned (Issue 5) |
| **UI-05** | UI | AC-09, AC-10, FR-11 | Staff Dashboard component & drill-down | Renders 5 metric cards, recent queue tickets, and drill-down links | `client/tests/lab-04/StaffDashboard.test.tsx` | Planned (Issue 5) |
| **E2E-01** | E2E | AC-01, AC-03, AC-04 | End-to-end Actions Taken complete flow | IT Staff logs in, adds actions taken, edits action, requester logs in and views | `client/e2e/lab-04/actions-taken-flow.spec.ts` | Planned (Issue 6) |
| **E2E-02** | E2E | AC-05, AC-06, AC-07 | End-to-end Ticket resolution & workflow | Full ticket lifecycle from New through In Progress to Resolved & Closed | `client/e2e/lab-04/ticket-resolution.spec.ts` | Planned (Issue 6) |
| **E2E-03** | E2E | AC-08, AC-09, AC-10 | End-to-end Dashboards & drill-down | Verifies Requester and Staff dashboards and navigation to filtered queues | `client/e2e/lab-04/dashboards.spec.ts` | Planned (Issue 6) |
| **REG-01**| Regression| AC-12, FR-14 | Labs 1-3 Full Regression Suite | Auth, Comments, Notes, Attachments, User Admin remain passing | `server/tests/` & `client/tests/` | Pass |

---

## 3. Test Execution Commands

1. **Backend Server Tests (Vitest)**:
   ```powershell
   cd server
   npm test -- tests/lab-04
   ```
2. **Frontend Client Tests (Vitest)**:
   ```powershell
   cd client
   npm test -- tests/lab-04
   ```
3. **End-to-End Tests (Playwright)**:
   ```powershell
   cd client
   npx playwright test e2e/lab-04/
   ```
