# Lab 2 Test Plan and Traceability

## 1. Test Strategy
This sprint employs **Test-Driven Development (TDD)** and **Test-Driven Design (Test DD)**. Automated verification is planned across multiple levels to validate functional correctness, security boundaries, edge cases, and UI presentation:
- **Unit Tests**: Generator algorithms (Ticket Number formatting), input sanitization, and file validator logic.
- **API Tests (`server/tests/lab-02/`)**: End-to-end HTTP endpoint tests with Supertest against PostgreSQL, validating database mutations, validation rules, error envelopes, and cross-requester access rejection.
- **UI Component Tests (`client/.../lab-02 tests/`)**: React Testing Library component tests validating form inputs, validation error rendering, busy states, table sorting, empty states, and attachment action modals.
- **End-to-End Tests (`e2e/lab-02/`)**: Playwright automated browser tests covering the full user flow from Requester Selection $\to$ Create Ticket $\to$ My Tickets $\to$ Ticket Detail & Attachment Soft-removal.
- **Visual & Responsive Testing**: Playwright screenshots across standard viewports (Desktop 1280px, Tablet 768px, Mobile 375px).

---

## 2. Planned Tests

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final Status |
|---|---|---|---|---|---|---|
| **UNIT-01** | Unit | BR-01, FR-04 | Ticket Number generator format | Returns `TKT-YYYY-NNNNNN` with 6 digits zero-padded | `server/tests/lab-02/ticket-number.test.ts` | Passed |
| **UNIT-02** | Unit | BR-10, FR-06 | Attachment file constraint validator | Rejects files $> 5$ MB or with invalid extensions (`.exe`, `.zip`) | `server/tests/lab-02/attachment-validator.test.ts` | Passed |
| **API-01** | API | AC-01, FR-01 | Fetch active development requesters | HTTP 200; only active users returned; inactive user excluded | `server/tests/lab-02/requesters.api.test.ts` | Passed |
| **API-02** | API | AC-03, FR-03 | Create valid ticket with attachment | HTTP 201; ticket saved with `TKT-` number; attachment saved; status `New` | `server/tests/lab-02/create-ticket.api.test.ts` | Passed |
| **API-03** | API | AC-04, BR-06 | Ticket creation missing summary | HTTP 400 with validation message; ticket not created | `server/tests/lab-02/create-ticket.api.test.ts` | Passed |
| **API-04** | API | AC-05, BR-10 | Ticket creation with oversized attachment | HTTP 413; file rejected; ticket not created | `server/tests/lab-02/create-ticket.api.test.ts` | Passed |
| **API-05** | API | AC-07, FR-07 | Fetch tickets owned by Requester A | HTTP 200; returns only Requester A's tickets | `server/tests/lab-02/my-tickets.api.test.ts` | Passed |
| **API-06** | API | AC-08, FR-08 | Filter tickets by Category & Search query | HTTP 200; returns only matching filtered subset | `server/tests/lab-02/my-tickets.api.test.ts` | Passed |
| **API-07** | API | AC-10, FR-10 | Retrieve owned ticket detail | HTTP 200; returns full ticket details and attachments | `server/tests/lab-02/ticket-detail.api.test.ts` | Passed |
| **API-08** | API | AC-11, BR-12 | Cross-requester ticket retrieval (Requester B requests Requester A's ticket) | HTTP 403 Forbidden; ticket data not leaked | `server/tests/lab-02/ticket-detail.api.test.ts` | Passed |
| **API-09** | API | AC-12, FR-11 | Add attachment to existing owned ticket | HTTP 201; attachment added; active count incremented | `server/tests/lab-02/attachments.api.test.ts` | Passed |
| **API-10** | API | AC-12, BR-11 | Soft-remove attachment with valid reason | HTTP 200; `isRemoved = true`; removal reason and timestamp recorded | `server/tests/lab-02/attachments.api.test.ts` | Passed |
| **API-11** | API | AC-12, BR-11 | Download soft-removed attachment | HTTP 410 Gone; download stream rejected | `server/tests/lab-02/attachments.api.test.ts` | Passed |
| **API-12** | API | BR-12 | Download attachment belonging to another requester's ticket | HTTP 403 Forbidden | `server/tests/lab-02/attachments.api.test.ts` | Passed |
| **UI-01** | UI | AC-01, FR-01 | Development Requester selector renders active options | Dropdown populates; selecting stores context | `client/tests/lab-02/RequesterSelector.test.tsx` | Passed |
| **UI-02** | UI | AC-04, BR-06 | Create Ticket form client validation | Inline field error appears when summary $< 5$ characters | `client/tests/lab-02/CreateTicket.test.tsx` | Passed |
| **UI-03** | UI | AC-05, BR-10 | Create Ticket file size validation | Error message rendered if file $> 5$ MB | `client/tests/lab-02/CreateTicket.test.tsx` | Passed |
| **UI-04** | UI | AC-06, BR-13 | Create Ticket form state preservation on API failure | Form inputs retained after simulated 500 error | `client/tests/lab-02/CreateTicket.test.tsx` | Passed |
| **UI-05** | UI | AC-07, AC-08 | My Tickets table rendering and filter change | Displays tickets; updates upon filter selection | `client/tests/lab-02/MyTickets.test.tsx` | Passed |
| **UI-06** | UI | AC-09 | My Tickets empty and no-results states | Empty state with Create button; No-results with Clear button | `client/tests/lab-02/MyTickets.test.tsx` | Passed |
| **UI-07** | UI | AC-10 | Ticket Detail renders read-only fields | Input fields are disabled / read-only styled | `client/tests/lab-02/RequesterTicketDetail.test.tsx` | Passed |
| **UI-08** | UI | AC-12 | AttachmentSection displays soft-removed badge and reason | Removed attachment shows badge, reason, download disabled | `client/tests/lab-02/RequesterTicketDetail.test.tsx` | Passed |
| **E2E-01** | E2E | AC-01 to AC-12 | Complete Requester Ticketing lifecycle flow | Requester selection $\to$ ticket creation $\to$ list check $\to$ detail view $\to$ soft removal | `e2e/lab-02/requester-ticket-flow.spec.ts` | Planned |
| **E2E-02** | E2E | AC-07, AC-11 | Multi-requester ownership isolation | Switch to Requester B; Requester A's tickets disappear; direct URL blocked | `e2e/lab-02/requester-ticket-flow.spec.ts` | Planned |

---

## 3. Acceptance-Criterion Traceability Matrix

| Acceptance Criterion | Planned Automated Test(s) |
|---|---|
| **AC-01** (Requester Selection Gate) | `API-01`, `UI-01`, `E2E-01` |
| **AC-02** (Header Identity & Change) | `UI-01`, `E2E-01` |
| **AC-03** (Successful Ticket Creation) | `API-02`, `E2E-01` |
| **AC-04** (Validation Failures) | `API-03`, `UI-02` |
| **AC-05** (Attachment Constraints) | `UNIT-02`, `API-04`, `UI-03` |
| **AC-06** (Form State Preservation) | `UI-04` |
| **AC-07** (Ownership Separation) | `API-05`, `UI-05`, `E2E-02` |
| **AC-08** (Search & Filtering) | `API-06`, `UI-05`, `E2E-01` |
| **AC-09** (Empty & No-Results States) | `UI-06` |
| **AC-10** (Ticket Detail Read-Only) | `API-07`, `UI-07`, `E2E-01` |
| **AC-11** (Unauthorized Access Rejection) | `API-08`, `API-12`, `E2E-02` |
| **AC-12** (Attachment Soft-Removal & Download Block) | `API-09`, `API-10`, `API-11`, `UI-08`, `E2E-01` |
| **AC-13** (Responsive Layouts) | `E2E-01` (Visual snapshot tests) |

---

## 4. Responsive and Visual Checklist

- [ ] Desktop Viewport ($\ge 992$px): Multi-column grid, responsive table with pagination bar aligned.
- [ ] Tablet Viewport ($768 - 991$px): Two-column layout where practical; no horizontal scrolling.
- [ ] Mobile Viewport ($< 768$px): Single column card view; mobile navigation toggle; touch-friendly buttons ($\ge 44$px).
- [ ] Zen Green Theme Consistency: Primary `#006B3C`, Secondary `#0B7A46`, Pale `#EAF6EF`, Background `#F5F7F6`.
- [ ] Accessible Form Elements: Required red asterisk, field-level error messages, clear focus rings.

---

## 5. Test Commands

```bash
# Run server unit & API tests
cd server && npm test

# Run client component tests
cd client && npm test

# Run full Playwright E2E tests
npx playwright test e2e/lab-02
```

---

## 6. Final Results
*(To be recorded upon test execution on `main` branch before final submission)*

---

## 7. Known Limitations or Deferred Tests
- Full authentication tests (passwords, JWT expiry, session renewal) are deferred to Lab 3 as specified by the instructor.
- IT Staff workflow tests (claim, reassign, resolve) are deferred to subsequent sprints.
