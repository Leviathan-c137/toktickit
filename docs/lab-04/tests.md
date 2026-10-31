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
| **API-08** | API | AC-08, BR-09, FR-10 | Requester dashboard authoritative metrics | Returns only metrics and recent tickets owned by authenticated requester | `server/tests/lab-04/requester-dashboard.api.test.ts` | Pass |
| **API-09** | API | AC-09, BR-10, FR-11 | IT Staff dashboard operational metrics | Accurate counts for New, Open, InProgress, Waiting, MyAssigned | `server/tests/lab-04/staff-dashboard.api.test.ts` | Pass |
| **API-10** | API | AC-11, BR-12 | Empty state metrics and zero results | Safely returns 0 counts and empty arrays without errors | `server/tests/lab-04/requester-dashboard.api.test.ts` | Pass |
| **UI-01** | UI | AC-01, AC-02, FR-01 | Actions Taken list & create/edit form | Renders list, validates follow-up requirement, triggers create callback | `client/tests/lab-04/ActionsTaken.test.tsx` | Pass |
| **UI-02** | UI | AC-03, FR-05, FR-06 | Actions Taken Requester read-only view | Renders action history without "+ Add Action" or "Edit" buttons | `client/tests/lab-04/ActionsTaken.test.tsx` | Pass |
| **UI-03** | UI | AC-05, AC-06, FR-07 | Ticket workflow & status transition UI | Shows permitted status transitions and resolution gate controls | `client/tests/lab-04/TicketWorkflow.test.tsx` | Pass |
| **UI-04** | UI | AC-08, AC-10, FR-10 | Requester Dashboard component & drill-down | Renders 4 metric cards, recent tickets, and drill-down links | `client/tests/lab-04/RequesterDashboard.test.tsx` | Pass |
| **UI-05** | UI | AC-09, AC-10, FR-11 | Staff Dashboard component & drill-down | Renders 5 metric cards, recent queue tickets, and drill-down links | `client/tests/lab-04/StaffDashboard.test.tsx` | Pass |
| **E2E-01** | E2E (Playwright) | AC-01, AC-03, AC-04 | End-to-end Actions Taken complete flow | Live browser test: IT Staff logs actions, follow-up note validation, edits record, Requester views read-only | `client/e2e/lab-04/actions-taken-flow.spec.ts` | Pass |
| **E2E-02** | E2E (Playwright) | AC-05, AC-06, AC-07 | End-to-end Ticket resolution & workflow | Live browser test: Requester advisory indication, Resolution Gate enforcement, action logging, resolution, terminal Closed modal | `client/e2e/lab-04/ticket-resolution.spec.ts` | Pass |
| **E2E-03** | E2E (Playwright) | AC-08, AC-09, AC-10 | End-to-end Dashboards & drill-down | Live browser test: Requester & Staff operational dashboards, metric counts, and interactive filter drill-downs | `client/e2e/lab-04/dashboards.spec.ts` | Pass |
| **E2E-04** | E2E (Playwright) | Non-functional, UI | Responsive & WCAG 2.1 AA Accessibility | Live browser test: Desktop, tablet, mobile viewports, touch targets >= 38-44px, Zen Green contrast >= 4.5:1 | `client/e2e/lab-04/responsive.spec.ts` | Pass |
| **INT-01** | Component Integration | UI-01 to UI-05 | Full IT Staff component integration mock flow | Dashboard drill-down, actions taken attribution, status selector | `client/tests/lab-04/E2EIntegration.test.tsx` | Pass |
| **INT-02** | Component Integration | UI-01 to UI-05 | Full Requester component integration mock flow | Dashboard drill-down to MyTickets, detail view, read-only actions badge | `client/tests/lab-04/E2EIntegration.test.tsx` | Pass |
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


---

## 4. End-to-End Test Execution Logs & Evidence

The log below records the official execution evidence of the automated Playwright browser test suite (`client/e2e/lab-04/`) running against live backend and frontend server processes:

```text
Running 7 tests using 1 worker

  ok 1 [chromium] › e2e\lab-04\actions-taken-flow.spec.ts:22:3 › Lab 4 E2E-01: Actions Taken Sub-Record Workflow (AC-01, AC-02, AC-03, AC-04, FR-01 to FR-06) › E2E-01: IT Staff logs actions, enforces follow-up note, edits record, and Requester views read-only history (4.2s)
  ok 2 [chromium] › e2e\lab-04\dashboards.spec.ts:11:3 › Lab 4 E2E-03: Operational Dashboards & Interactive Drill-Down (AC-08, AC-09, AC-10, FR-10 to FR-13) › E2E-03: Requester Dashboard and IT Staff Dashboard metric verification and drill-down navigation (2.6s)
  ok 3 [chromium] › e2e\lab-04\responsive.spec.ts:36:3 › Lab 4 Responsive Layout and Accessibility Verification › Desktop Viewport (1280x800): Dual-column layouts and comprehensive dashboard metrics (1.6s)
  ok 4 [chromium] › e2e\lab-04\responsive.spec.ts:62:3 › Lab 4 Responsive Layout and Accessibility Verification › Tablet Viewport (820x1180): Flexible card grid and responsive actions taken table (1.6s)
  ok 5 [chromium] › e2e\lab-04\responsive.spec.ts:86:3 › Lab 4 Responsive Layout and Accessibility Verification › Mobile Viewport (375x667): Stacked cards, touch target sizing, and accessibility (1.6s)
  ok 6 [chromium] › e2e\lab-04\responsive.spec.ts:117:3 › Lab 4 Responsive Layout and Accessibility Verification › Accessibility: WCAG 2.1 AA Color Contrast Verification for Zen Green Palette (1.3s)
  ok 7 [chromium] › e2e\lab-04\ticket-resolution.spec.ts:23:3 › Lab 4 E2E-02: Ticket Workflow, Permitted Transitions, and Resolution Gate (AC-05, AC-06, AC-07, BR-06, BR-07) › E2E-02: Full lifecycle — Requester advisory indication, Resolution Gate rejection without action, action logging, and resolution (2.3s)

  7 passed (26.4s)
```

The raw run evidence log is committed in [`docs/lab-04/e2e-test-results.txt`](file:///c:/Users/admin/Downloads/Lab1_Starter_Scaffold/toktickit/docs/lab-04/e2e-test-results.txt).
