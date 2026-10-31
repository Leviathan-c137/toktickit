# Lab 4 Sprint Engineering Specification

## 1. Sprint Goal
Complete the core TokTickIT service-desk workflow by delivering IT Staff Actions Taken tracking, role-appropriate dashboards for Requesters, IT Staff, and Administrators, formal Ticket status transition and resolution enforcement, and comprehensive regression hardening across the entire application built in Labs 1 to 3. The final product preserves the Zen Green design system, enforces strict server-side authorization, and guarantees responsiveness, accessibility, and robust error handling.

---

## 2. Stakeholder Request Interpretation
The university service desk currently receives tickets and facilitates communication between Requesters and IT Staff via public comments and internal notes. However, IT operations lack a structured, auditable mechanism to plan, execute, and record actual technical actions performed on each ticket. The stakeholder requires:
1. **Actions Taken Sub-Records**: Under each ticket, IT Staff and Administrators must be able to record granular actions including Action Date/Time, Action Description, Result, Performed By (automatically captured), Follow-Up Required toggle, Follow-Up Note (mandatory when follow-up is required), and Attachment Notes. While a ticket has one primary Ticket Owner, different IT Staff members can perform and log actions. Requesters must have read-only visibility into actions taken on their own tickets.
2. **Authoritative Ticket Lifecycle & Resolution Gate**: A formal status transition engine must control ticket progression (`New`, `Open`, `In Progress`, `Waiting for Requester`, `Resolved`, `Closed`, `Reopened`, `Cancelled`). While Requesters may indicate that an issue appears resolved (advisory indicator), only IT Staff or Administrators may formally transition a ticket to `Resolved`.
3. **Role-Appropriate Operational Dashboards**: Requesters, IT Staff, and Administrators need concise operational dashboards summarizing authoritative metrics with seamless drill-down links to detailed filtered queues without replacing the detail views.
4. **Final Regression & Polish**: Full regression verification ensuring all prior authentication, comments, notes, attachments, and user administration features work seamlessly under the Zen Green design language.

---

## 3. Scope

### 3.1. Included Scope
1. **Actions Taken Sub-System**:
   - One-to-many relationship: One Ticket has zero or more Actions Taken records.
   - IT Staff and Administrators can create and update Actions Taken records on accessible tickets.
   - Requesters can view Actions Taken records for tickets they own (read-only mode).
   - Server-side validation enforcing mandatory `followUpNote` when `followUpRequired` is true.
   - Audit trail capturing `performedById` automatically from the authenticated session.
2. **Ticket Workflow & Resolution Gate**:
   - Status transitions constrained by a strict permitted transition matrix.
   - Resolution rule: Transitioning to `Resolved` or `Closed` restricted to IT Staff and Administrator roles.
   - Requester "Problem Appears Resolved" indication remains purely advisory and does not mutate ticket status directly.
   - Concurrency and stale-update detection (optimistic locking / timestamp comparison) returning HTTP 409 Conflict.
3. **Role-Appropriate Dashboards**:
   - **Requester Dashboard**: Total open tickets, tickets waiting for requester, recently updated tickets, recently resolved tickets, recent ticket list, and quick actions (`+ Create Ticket`, `View My Tickets`).
   - **IT Staff Dashboard**: Metrics for `New`, `Open`, `In Progress`, `Waiting for Requester`, and `My Assigned` tickets, recent tickets list, and quick actions (`Create Ticket`, `Search Tickets`, `My Queue`).
   - **Administrator Dashboard**: Reuses IT Staff dashboard metrics plus user account operational counts.
   - Interactive drill-down navigation from dashboard metric cards to filtered queue views.
4. **Database & REST API Increments**:
   - Prisma schema addition for `ActionTaken` model with foreign keys to `Ticket` and `User`.
   - Idempotent seed data supporting tickets with 0, 1, and multiple Actions Taken, realistic statuses, and non-zero/zero metrics.
   - REST endpoints: `GET/POST /api/tickets/:id/actions`, `PATCH /api/tickets/:id/actions/:actionId`, `GET /api/requester/dashboard`, `GET /api/staff/dashboard`.
5. **Zen Green UI Polish, Accessibility, and Final Hardening**:
   - Consistent Zen Green tokens across all new views.
   - Fully responsive across Desktop (1280px), Tablet (820px), and Mobile (375px).
   - WCAG 2.1 AA accessibility (keyboard focus, semantic labels, non-color cues, no overflow).

### 3.2. Explicitly Excluded Scope
1. Automatic SLA countdown clocks, escalation triggers, and on-call scheduling engines.
2. External notifications via Email, SMS, LINE, or mobile push services.
3. Inventory management, spare-parts consumption, and service cost billing/payroll.
4. Multi-level approval workflows and cryptographic electronic signatures.
5. Complex Business Intelligence (BI) report builders and external data warehouse pipelines.
6. Multi-tenant SaaS isolation and multi-region cloud deployment.

---

## 4. Functional Requirements

| FR ID | Module | Functional Requirement Description |
|---|---|---|
| **FR-01** | Actions Taken | IT Staff and Administrators shall be able to create an Action Taken record under any accessible ticket. |
| **FR-02** | Actions Taken | IT Staff and Administrators shall be able to edit an existing Action Taken record under a ticket. |
| **FR-03** | Actions Taken | The system shall automatically record the authenticated user as the `performedBy` actor. |
| **FR-04** | Actions Taken | The system shall require a `followUpNote` when `followUpRequired` is set to true. |
| **FR-05** | Actions Taken | Requesters shall be able to view all Actions Taken records on tickets they own in read-only mode. |
| **FR-06** | Actions Taken | Requesters shall be strictly forbidden from creating, updating, or deleting Actions Taken records (HTTP 403). |
| **FR-07** | Workflow | The system shall enforce permitted status transitions across all 8 ticket statuses via the backend API. |
| **FR-08** | Workflow | The system shall restrict status change to `Resolved` and `Closed` to IT Staff and Administrators. |
| **FR-09** | Workflow | The system shall detect concurrent/stale updates when modifying a ticket or action taken and return HTTP 409 Conflict. |
| **FR-10** | Dashboards | The backend shall provide a Requester Dashboard endpoint returning authoritative metrics for the authenticated user. |
| **FR-11** | Dashboards | The backend shall provide an IT Staff Dashboard endpoint returning operational queue metrics. |
| **FR-12** | Dashboards | Each dashboard metric card shall provide an accessible drill-down link navigating to the filtered ticket view. |
| **FR-13** | Dashboards | The dashboard UI shall provide dedicated empty state presentations when metric counts or recent lists have no records. |
| **FR-14** | Hardening | The full application shall pass all regression test suites across authentication, comments, notes, attachments, and user admin. |

---

## 5. Business Rules

| BR ID | Name | Rule Statement |
|---|---|---|
| **BR-01** | Parent Ticket Belonging | Every Action Taken record belongs to exactly one Ticket (`ticketId` is mandatory and immutable). |
| **BR-02** | Independent Performer | The primary Ticket Owner coordinates the ticket, but any active IT Staff or Administrator may perform and log an Action Taken. |
| **BR-03** | Role Access Gate | Only `ITStaff` and `Administrator` roles may create or update Actions Taken records. `Requester` role has read-only access to actions on owned tickets. |
| **BR-04** | Follow-Up Conditional Requirement | If `followUpRequired` is `true`, `followUpNote` must be non-empty (minimum 3 characters). If `false`, `followUpNote` is optional or cleared. |
| **BR-05** | Append-Only & Audit Integrity | Actions Taken records are returned in chronological order. Creation timestamp and initial creator identity cannot be retroactively altered. |
| **BR-06** | Permitted Status Transitions | Ticket status transitions must strictly adhere to the permitted transition matrix: <br>• `New` → `Open`, `Cancelled` <br>• `Open` → `InProgress`, `WaitingForRequester`, `Resolved`, `Cancelled` <br>• `InProgress` → `WaitingForRequester`, `Resolved`, `Cancelled` <br>• `WaitingForRequester` → `InProgress`, `Resolved`, `Cancelled` <br>• `Resolved` → `Closed`, `Reopened` <br>• `Closed` → `Reopened` <br>• `Reopened` → `InProgress`, `WaitingForRequester`, `Resolved`, `Cancelled` <br>• `Cancelled` → (Terminal state; no outbound transitions) <br>• `Pending` → `InProgress`, `WaitingForRequester`, `Resolved`, `Cancelled` *(Legacy compatibility row)* |
| **BR-07** | Resolution Gate Authority | Only IT Staff and Administrators may transition a ticket to `Resolved` or `Closed`. A Requester's "Problem Appears Resolved" indication is advisory only and shall never directly alter the ticket status. |
| **BR-08** | Stale Update Protection | Modification of a Ticket status or Action Taken record requires a matching concurrency token or last modified timestamp. Mismatches return HTTP 409 Conflict. |
| **BR-09** | Requester Data Isolation | Requester Dashboard queries strictly filter by `requesterId == authenticatedUser.id`. No other user's tickets or metrics may be returned or inferred. |
| **BR-10** | Authoritative Operational Metrics | All dashboard metrics must be computed on the server using authoritative database queries. The frontend shall never calculate metrics by querying raw entire ticket collections. |
| **BR-11** | Inactive User Exclusion | Action Taken cannot be assigned to or recorded by an inactive user (`isActive == false`). |
| **BR-12** | Safe Null & Empty Fallback | If a ticket has zero Actions Taken or a dashboard query returns 0 items, the API and UI must safely render valid empty arrays/counts rather than null pointer errors. |

---

## 6. UI Specification Summary
*(Refer to `docs/lab-04/ui-spec.md` for full design tokens, visual specifications, and breakpoint details)*

1. **IT Staff Dashboard (`/staff/dashboard`)**:
   - Greeting header with authenticated user's name and quick refresh trigger.
   - Five metric summary cards: `New`, `Open`, `In Progress`, `Waiting for Requester`, and `My Assigned`.
   - Each card features a numerical count, semantic color accent, and click action navigating to the filtered queue.
   - "My Recent Tickets" list showing Ticket Number, Summary, Status pill, and last updated timestamp.
   - Quick Action buttons: `+ Create Ticket`, `Search Tickets`, `My Queue`.
2. **Requester Dashboard (`/requester/dashboard`)**:
   - Greeting header for requester with refresh trigger.
   - Four metric cards: `My Open Tickets`, `In Progress`, `Resolved`, `Closed`.
   - "My Recent Tickets" list with clickable items leading to Requester Ticket Detail.
   - Quick Action buttons: `+ Create Ticket`, `View My Tickets`.
3. **Actions Taken on Ticket Detail**:
   - Prominently placed on the Ticket Detail screen below ticket metadata and internal notes.
   - **List/Table Mode**: Displays chronological work entries with Action Date/Time, Description, Result, Performed By badge, Follow-Up indicator, Follow-Up Note, and Attachment Notes.
   - **Create / Edit Mode**: Clean modal dialog or inline collapsible drawer with real-time validation for `followUpNote`.
   - **Role Behavior**: Read-only rendering for Requesters (action buttons hidden; API endpoints blocked).
4. **Ticket Workflow Controls**:
   - Status transition dropdown/buttons displaying only permitted next statuses based on BR-06.
   - Instant visual update upon transition with optimistic UI and error recovery on network/conflict failure.

---

## 7. Data Changes & Migration

### 7.1. Prisma Model Additions

```prisma
model ActionTaken {
  id                Int       @id @default(autoincrement())
  ticketId          Int
  ticket            Ticket    @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  
  performedById     Int
  performedBy       User      @relation(fields: [performedById], references: [id])
  
  actionDateTime    DateTime  @default(now())
  description       String
  result            String
  
  followUpRequired  Boolean   @default(false)
  followUpNote      String?
  attachmentNotes   String?
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([ticketId])
  @@index([performedById])
  @@index([actionDateTime])
}
```

### 7.2. Database Design Justifications
1. **Relational Sub-Record vs. JSON Blob**: Modeling `ActionTaken` as a dedicated relational table with foreign keys to `Ticket` and `User` guarantees referential integrity, supports index-accelerated queries on `ticketId` and `actionDateTime`, and enables direct joining for audit reporting without expensive JSON parsing.
2. **Cascade Deletion on Ticket**: Using `onDelete: Cascade` on the `ticketId` relation ensures that if a ticket is purged in testing or admin cleanup, associated actions taken are cleanly purged without orphaned child records.
3. **Server-Generated Timestamps & PerformedBy**: Storing `performedById` as a foreign key ensures that the user who executed the action is immutably linked to the authoritative `User` table, preventing spoofing.

### 7.3. Migration & Backfill Strategy
- Migration is non-destructive: Existing `Ticket`, `User`, `Attachment`, `PublicComment`, and `InternalNote` tables remain untouched.
- Existing legacy tickets naturally have zero `ActionTaken` entries. All dashboard queries utilize SQL `COUNT` and outer joins, cleanly treating zero child records as count 0.
- Rollback plan: Dropping table `ActionTaken` restores the exact Lab 3 schema without data loss.

### 7.4. Seed Data Requirements
- Idempotent seed script (`server/prisma/seed.ts`) populating:
  - Tickets with 0 Actions Taken (demonstrating empty states).
  - Tickets with 1 Action Taken.
  - Tickets with multiple Actions Taken performed by different IT Staff members.
  - Distribution of tickets covering all 8 statuses and all priorities to verify non-zero and zero dashboard metrics.

---

## 8. REST API Contract Summary
*(Refer to `docs/lab-04/api-spec.md` for full JSON payloads and response schemas)*

| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/api/tickets/:id/actions` | Requester (owner), ITStaff, Admin | Retrieve chronological list of actions taken for ticket |
| `POST` | `/api/tickets/:id/actions` | ITStaff, Admin | Create new action taken record under ticket |
| `PATCH` | `/api/tickets/:id/actions/:actionId` | ITStaff, Admin | Edit existing action taken record |
| `GET` | `/api/requester/dashboard` | Requester | Get authoritative dashboard metrics & recent tickets for user |
| `GET` | `/api/staff/dashboard` | ITStaff, Admin | Get authoritative operational metrics & recent tickets |
| `PATCH` | `/api/staff/tickets/:id/status` | ITStaff, Admin | Transition ticket status adhering to state machine |

---

## 9. Acceptance Criteria

| AC ID | Acceptance Criterion |
|---|---|
| **AC-01** | Given an authenticated IT Staff user, when submitting a valid Action Taken with description and result, then it is saved with the authenticated user as `performedBy` and returned with HTTP 201. |
| **AC-02** | Given an IT Staff user submitting an Action Taken with `followUpRequired = true` and an empty `followUpNote`, then the request is rejected with HTTP 400 Bad Request. |
| **AC-03** | Given an authenticated Requester user, when requesting `GET /api/tickets/:id/actions` for a ticket they own, all actions taken are returned with HTTP 200; when attempting `POST` or `PATCH`, HTTP 403 Forbidden is returned. |
| **AC-04** | Given a Ticket with multiple Actions Taken performed by different IT Staff members, when the list is retrieved, all actions are returned in stable chronological order. |
| **AC-05** | Given an IT Staff user attempting an invalid status transition (e.g. `New` → `Resolved`), then the server rejects the transition with HTTP 400 and does not mutate ticket state. |
| **AC-06** | Given a Requester user attempting to call `/api/staff/tickets/:id/status`, the request is rejected with HTTP 403 Forbidden. |
| **AC-07** | Given two concurrent updates to the same ticket status or action, if a conflict occurs, the second request safely fails with HTTP 409 Conflict. |
| **AC-08** | Given an authenticated Requester calling `GET /api/requester/dashboard`, only metrics and recent tickets belonging to that Requester are returned. |
| **AC-09** | Given an authenticated IT Staff user calling `GET /api/staff/dashboard`, accurate counts for `New`, `Open`, `InProgress`, `WaitingForRequester`, and `MyAssigned` are returned matching authoritative database counts. |
| **AC-10** | Given a user clicking any dashboard metric card, the UI navigates to the ticket queue pre-filtered to the corresponding status/ownership criteria. |
| **AC-11** | Given a dashboard query or ticket queue with zero records matching, a clean Zen Green empty-state graphic and text are rendered without errors. |
| **AC-12** | Given the completed application, all regression features (auth, comments, notes, attachments, user management) continue functioning with 100% test pass rate. |

---

## 10. Product Definition of Done (DoD)
- [ ] Database migration successfully applied and backward-compatible with Lab 1-3 data.
- [ ] Idempotent seed script populated with rich multi-action ticket datasets.
- [ ] All REST endpoints implemented with strict RBAC and validation.
- [ ] Ticket status state machine enforced on both frontend and backend.
- [ ] Actions Taken UI implemented with Create, Edit, List, and Requester Read-Only modes.
- [ ] Requester and IT Staff Dashboards implemented with interactive drill-down navigation.
- [ ] Zen Green design language maintained across all views without clipping or horizontal overflow.
- [ ] 100% pass rate across server API tests, client component tests, and Playwright E2E suites.
- [ ] Responsive layouts verified across Desktop (1280px), Tablet (820px), and Mobile (375px).
- [ ] All 6 GitHub issues completed, peer-reviewed, and merged via Pull Requests.

---

## 11. Assumptions and Architectural Decisions
1. **Action Editing Scope**: When editing an Action Taken, only descriptive content (`description`, `result`, `followUpRequired`, `followUpNote`, `attachmentNotes`) may be modified; `performedById` and `ticketId` remain immutable for audit integrity.
2. **Dashboard Performance**: Metrics are queried using Prisma's `count` and aggregation primitives directly on indexed columns rather than loading in-memory records.
3. **Advisory Resolution Indication**: Requesters retain the "Problem Appears Resolved" toggle introduced in Lab 3. When toggled, it appends a system public comment and notifies staff, but the formal status remains unchanged until an IT Staff member verifies the resolution.
