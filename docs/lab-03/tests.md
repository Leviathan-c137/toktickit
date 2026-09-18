# Lab 3 Test Plan and Traceability Matrix

## 1. Test Strategy Overview

The Lab 3 test suite provides comprehensive coverage across unit, API/integration, UI component, authorization security, regression, and end-to-end (E2E) testing. Every Acceptance Criterion (AC-01 through AC-11) is mapped directly to one or more automated test suites.

---

## 2. Test Cases & Traceability Matrix

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File Path | Status |
|---|---|---|---|---|---|---|
| **API-01** | API | AC-01, FR-01 | Valid user login | Returns 200 OK, sets session cookie, returns user role data | `server/tests/lab-03/auth.api.test.ts` | Pass |
| **API-02** | API | BR-01 | Inactive user login attempt | Returns 401 Unauthorized with generic error message | `server/tests/lab-03/auth.api.test.ts` | Pass |
| **API-03** | API | AC-02, BR-02 | Mandatory password change enforcement | Blocks API requests when `mustChangePassword == true` until password is updated | `server/tests/lab-03/auth.api.test.ts` | Pass |
| **API-04** | API | AC-03, FR-05 | Requester data isolation | `/api/tickets` returns strictly tickets owned by authenticated user | `server/tests/lab-03/authorization.api.test.ts` | Pass |
| **API-05** | API | AC-04, BR-05 | Requester forbidden access to Internal Notes | Requests to `/api/staff/tickets/:id/notes` by Requester role return 403 Forbidden | `server/tests/lab-03/authorization.api.test.ts` | Planned |
| **API-06** | API | AC-05, FR-09 | IT Staff Queue query parameters | Supports search, category, priority, status filters, and sorting | `server/tests/lab-03/staff-queue.api.test.ts` | Planned |
| **API-07** | API | AC-06, FR-10 | Ticket ownership claim / reassign | Updates `ownerId` to claiming IT Staff ID | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Planned |
| **API-08** | API | AC-07, FR-07 | Public Comments submission and retrieval | Appends public comment visible to Requester, IT Staff, and Admin | `server/tests/lab-03/comments-notes.api.test.ts` | Pass |
| **API-09** | API | AC-08, FR-08 | Internal Notes submission and retrieval | Appends internal note visible only to IT Staff and Admin | `server/tests/lab-03/comments-notes.api.test.ts` | Planned |
| **API-10** | API | AC-09, FR-14 | Admin user creation | Validates email uniqueness and sets initial `mustChangePassword = true` | `server/tests/lab-03/users-admin.api.test.ts` | Planned |
| **API-11** | API | AC-10, BR-12 | Admin self-deactivation prevention | Returns 400 Bad Request when Admin attempts self-deactivation | `server/tests/lab-03/users-admin.api.test.ts` | Planned |
| **API-12** | API | AC-11, BR-13 | Last active Admin protection | Returns 400 Bad Request when attempting to deactivate the last active Admin | `server/tests/lab-03/users-admin.api.test.ts` | Planned |
| **UI-01** | UI | AC-01, AC-02 | Login & First-Password Change component flow | Renders login form, handles validation, and redirects to mandatory password screen if needed | `client/tests/lab-03/Login.test.tsx` | Planned |
| **UI-02** | UI | FR-09, AC-05 | IT Staff Ticket Queue UI component | Renders queue table, search box, filter dropdowns, and pagination controls | `client/tests/lab-03/StaffTicketQueue.test.tsx` | Planned |
| **UI-03** | UI | FR-10, FR-11 | IT Staff Ticket Detail UI component | Renders claim button, priority selector, status dropdown, public comments & internal notes tabs | `client/tests/lab-03/StaffTicketDetail.test.tsx` | Planned |
| **UI-04** | UI | FR-13, FR-14 | Admin User Management UI component | Renders searchable user table, role badges, create/edit user drawer | `client/tests/lab-03/UserManagement.test.tsx` | Planned |
| **E2E-01** | E2E | AC-01, AC-02 | Full Authentication & Password Change E2E | User logs in, changes initial password, accesses dashboard, and logs out | `e2e/lab-03/authentication.spec.ts` | Planned |
| **E2E-02** | E2E | AC-05, AC-06, AC-07 | Full IT Staff Ticket Workflow E2E | IT Staff views queue, claims ticket, updates priority/status, posts comment & note | `e2e/lab-03/staff-ticket-flow.spec.ts` | Planned |
| **E2E-03** | E2E | AC-09, AC-10 | Full Admin User Administration E2E | Admin creates new user, edits profile, resets password, and verifies self-deactivation block | `e2e/lab-03/user-administration.spec.ts` | Planned |

---

## 3. Execution Verification Procedure

1. **Server API Tests**: `cd server && npm test`
2. **Client UI Component Tests**: `cd client && npm test`
3. **End-to-End Tests**: `npx playwright test e2e/lab-03/`
