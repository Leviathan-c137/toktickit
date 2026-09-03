# Lab 2 Sprint Engineering Specification

## 1. Sprint Goal
Deliver an end-user (Requester) ticketing Minimum Viable Product (MVP) for TokTickIT adhering to a cohesive Zen Green design system. This increment enables seeded Requesters to create IT support tickets with validated file attachments, receive official backend-generated ticket numbers, view and manage their own tickets with search, filtering, sorting, and pagination, and inspect ticket details with soft-removal capabilities for attachments, all while enforcing strict data ownership isolation before full authentication is introduced in Lab 3.

---

## 2. Stakeholder Request Interpretation
The IT department requires a professional, responsive ticketing portal for university requesters (faculty, staff, students) to report IT incidents and service requests. Requesters must be able to select pre-configured incident categories and affected campus systems, describe problems with rich summaries and descriptions, submit attachments (images and PDFs) under size and quantity constraints, and trace ticket progress through an intuitive dashboard. Because authentic single-sign-on (SSO) and authentication arrive in Sprint 3, this sprint must provide a Development Requester selector to test and verify multi-user ticket ownership isolation.

---

## 3. Scope

### 3.1. Included Scope
1. **Development Requester Selector**:
   - Temporary testing mechanism simulating login.
   - Dropdown populated with active Requesters from PostgreSQL (`RequesterUser` model).
   - Display of current Requester name and clear "Change Requester" action across all views.
   - Persistent client-side session context (e.g. `localStorage`).
2. **Create Ticket Flow (Create Mode)**:
   - Form fields: Category, Related System, Summary, Description, Requested Priority, and File Attachments.
   - Unique official Ticket Number generated exclusively by the backend (e.g., `TKT-YYYY-NNNNNN`).
   - File attachment support for JPG/JPEG, PNG, WEBP, and PDF up to 5 MB each (max 5 active attachments per ticket).
   - Form state preservation upon API failure and client-side/server-side validation error handling.
3. **My Tickets Screen**:
   - Paginated list of tickets owned strictly by the currently selected Requester.
   - Full search over Ticket Number and Summary.
   - Multi-field filtering (Category, Requested Priority, Status).
   - Multi-column sorting (Ticket Number, Created Date, Last Updated).
   - Clear loading, empty list (no tickets created yet), no-results (search/filter mismatch), and API error states.
4. **Requester Ticket Detail Screen (View Mode)**:
   - Read-only display of ticket attributes (Ticket Number, Date, Category, Related System, Requester, Priorities, Status, Summary, Description).
   - Active attachment list with secure download links.
   - Attachment upload action directly from the detail screen (respecting the 5 active attachments limit).
   - Attachment soft-removal workflow requiring a mandatory removal reason.
   - Prevention of preview/download for soft-removed attachments while preserving audit metadata.
5. **Ownership & Security Isolation**:
   - Prevention of cross-requester ticket viewing or attachment manipulation. If Requester B requests Requester A's ticket or attachment, the API returns a 403 Forbidden or 404 Not Found error.
6. **Zen Green Design Language & Responsive UI**:
   - Unified color tokens (`#006B3C`, `#0B7A46`, `#EAF6EF`, `#F5F7F6`).
   - Full responsiveness across Desktop ($\ge 992$px), Tablet ($768 - 991$px), and Mobile ($< 768$px).

### 3.2. Explicitly Excluded Scope
1. **Authentication & Identity Management**: Real passwords, password hashing (bcrypt/argon2), JWT/session cookies, login/logout screens, and role-based access control (RBAC).
2. **IT Staff Operations**: IT Staff dashboard, ticket claiming, ticket assignment/reassignment, and changing IT Priority.
3. **Collaboration & Work Tracking**: Public Comments, Internal Notes, and Actions Taken work logs.
4. **Post-Creation Lifecycle**: Ticket status transitions beyond "New" (no resolving, closing, reopening, or cancelling tickets).
5. **Administration**: Admin screens for managing categories, related systems, or requester accounts.

---

## 4. Functional Requirements

- **FR-01 (Requester Identity Selection)**: The application shall allow selecting an active Requester from the database to establish the current session context. Inactive Requesters must be excluded from selection.
- **FR-02 (Requester Context Persistence & Switch)**: The application shell shall display the active Requester's name and allow switching to a different Requester at any time, reloading all data for the newly selected user.
- **FR-03 (Ticket Submission)**: A selected Requester shall be able to submit a ticket by providing Category, Related System, Summary, Description, Requested Priority, and optional Attachments.
- **FR-04 (Ticket Number Generation)**: The backend shall generate a unique official Ticket Number in format `TKT-YYYY-NNNNNN` upon ticket creation.
- **FR-05 (Default Values)**: A newly created ticket shall automatically initialize with `status = 'New'`, `itPriority = 'Medium'`, `createdAt = now()`, and `updatedAt = now()`.
- **FR-06 (Attachment Validation)**: The application shall accept only attachments with extensions/MIME types `image/jpeg`, `image/png`, `image/webp`, and `application/pdf`, sized $\le 5$ MB, and at most 5 active attachments per ticket.
- **FR-07 (My Tickets Listing)**: The application shall display a paginated list of tickets belonging strictly to the active Requester, showing Ticket Number, Created Date, Summary, Category, Requested Priority, IT Priority, Status, and Last Updated.
- **FR-08 (Search & Filtering)**: The ticket list shall support case-insensitive substring search (Ticket Number, Summary) and exact filtering by Category, Requested Priority, and Status.
- **FR-09 (Sorting & Pagination)**: The ticket list shall support sorting by Created Date (default descending), Ticket Number, or Last Updated, and configurable pagination with standard page sizes (e.g., 5, 10, 20).
- **FR-10 (Ticket Detail Inspection)**: The application shall allow the ticket owner to view full ticket details in read-only format.
- **FR-11 (Add Attachment to Existing Ticket)**: The ticket owner shall be able to upload additional valid attachments to their existing ticket up to the active limit of 5.
- **FR-12 (Attachment Soft Removal)**: The ticket owner shall be able to mark an attachment as removed by supplying a non-empty removal reason. Soft-removed attachments remain visible as metadata (with reason and removal timestamp) but downloads and previews must be blocked.
- **FR-13 (Ownership Protection)**: Direct API requests or URL access to tickets or attachments belonging to another Requester shall be rejected with 403 Forbidden or 404 Not Found.

---

## 5. Business Rules

- **BR-01 (Unique Ticket Identifier)**: The official Ticket Number is generated exclusively by the backend service during creation, follows the pattern `TKT-YYYY-NNNNNN` (where YYYY is current year and NNNNNN is a 6-digit zero-padded sequence), and must be strictly unique across the database.
- **BR-02 (Initial Ticket State)**: Every newly created ticket begins with Current Status `New` and IT Priority `Medium`. Requesters cannot alter IT Priority or Status during creation.
- **BR-03 (Development Requester Simulation)**: Lab 2 uses a Development Requester selector instead of login. The selected identity is solely for testing data isolation and is not a secure authentication mechanism.
- **BR-04 (Requester Selection Gate)**: All ticketing routes (`/tickets`, `/tickets/new`, `/tickets/:id`) require an active Requester context. If none is selected, the user must be redirected to the Development Requester selection view.
- **BR-05 (Inactive Requester Exclusion)**: Inactive Requesters (`isActive = false`) must never appear in the selector dropdown, and the backend must reject any ticket creation or retrieval attempts associated with an inactive requester.
- **BR-06 (Summary Length & Sanitation)**: Ticket Summary is required, trimmed of leading/trailing whitespace, minimum 5 characters, maximum 150 characters.
- **BR-07 (Description Length & Sanitation)**: Description is required, trimmed of leading/trailing whitespace, minimum 10 characters, maximum 2000 characters.
- **BR-08 (Priority Options)**: Requested Priority must be one of `Low`, `Medium`, `High`, or `Urgent`. Default selection is `Medium`.
- **BR-09 (Valid Category & Related System)**: Both Category and Related System must reference active, existing records in the database.
- **BR-10 (Attachment File Constraints)**:
  - Allowed file extensions: `.jpg`, `.jpeg`, `.png`, `.webp`, `.pdf`.
  - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`.
  - Maximum size per file: 5,242,880 bytes (5 MB).
  - Maximum active attachments per ticket: 5.
- **BR-11 (Attachment Soft Removal Rules)**:
  - Removal of an attachment must never delete the database record or physical file permanently.
  - Removal requires a non-empty removal reason (minimum 3 characters).
  - Once removed (`isRemoved = true`), `removedAt` and `removalReason` are recorded.
  - Soft-removed attachments do not count against the 5 active attachments limit.
  - Soft-removed files must return HTTP 410 Gone or 404 Not Found upon download/preview attempt.
- **BR-12 (Ticket Ownership Isolation)**: A Requester may only retrieve, list, view, or modify attachments for tickets where `ticket.requesterId == currentRequester.id`. Cross-user access attempts must be rejected with HTTP 403 Forbidden.
- **BR-13 (Error State Preservation)**: If ticket creation fails (e.g. server down or validation failure), the frontend must preserve all entered form values so the user does not lose input data.

---

## 6. UI Specification Summary

- **Theme**: TokTickIT Zen Green Design System.
  - Header / Primary Buttons: `#006B3C`
  - Hover / Accents / Active Links: `#0B7A46`
  - Pale Green (Selected / Highlights / Success): `#EAF6EF`
  - Background: `#F5F7F6`
  - Surface Cards: `#FFFFFF` with neutral border `#E5E7EB`
  - Typography: System sans-serif / Inter, dark charcoal-green text `#1F2937`
- **Component Conventions**:
  - Labels placed above controls with bold weight.
  - Required fields highlighted with a red asterisk `*`.
  - Field-level validation messages rendered directly beneath the invalid control in red `#DC2626`.
  - Buttons feature visible text; loading/busy spinners disable the button during API calls.
  - Read-only fields rendered with distinct light green-gray background `#F0F4F1`.
  - Badges: Priority badges (Low: Blue/Gray, Medium: Pale Amber, High: Dark Orange, Urgent: Red) and Status badges (New: Pale Green).
- **Responsive Layout**:
  - Desktop ($\ge 992$px): Multi-column grid layout, table view for My Tickets.
  - Tablet ($768 - 991$px): 2-column layout, compact table or card view.
  - Mobile ($< 768$px): 1-column stacked form, card list view for tickets, touch-friendly tap targets ($\ge 44$px).

Detailed layout wireframes and token tables are documented in `docs/lab-02/ui-spec.md`.

---

## 7. Data Changes

### 7.1. Prisma Schema Additions

```prisma
enum Priority {
  Low
  Medium
  High
  Urgent
}

enum TicketStatus {
  New
  Open
  InProgress
  Pending
  Resolved
  Closed
  Cancelled
}

model RequesterUser {
  id        Int      @id @default(autoincrement())
  fullName  String
  email     String   @unique
  department String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  tickets   Ticket[]
}

model RelatedSystem {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  tickets   Ticket[]
}

model Category {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  tickets   Ticket[]
}

model Ticket {
  id                Int           @id @default(autoincrement())
  ticketNumber      String        @unique
  summary           String
  description       String
  requestedPriority Priority      @default(Medium)
  itPriority        Priority      @default(Medium)
  status            TicketStatus  @default(New)
  
  requesterId       Int
  requester         RequesterUser @relation(fields: [requesterId], references: [id])
  
  categoryId        Int
  category          Category      @relation(fields: [categoryId], references: [id])
  
  relatedSystemId   Int
  relatedSystem     RelatedSystem @relation(fields: [relatedSystemId], references: [id])
  
  attachments       Attachment[]
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  @@index([requesterId])
  @@index([status])
  @@index([categoryId])
  @@index([createdAt])
}

model Attachment {
  id            Int       @id @default(autoincrement())
  ticketId      Int
  ticket        Ticket    @relation(fields: [ticketId], references: [id])
  originalName  String
  storedFilename String
  mimeType      String
  fileSizeBytes Int
  
  isRemoved     Boolean   @default(false)
  removedAt     DateTime?
  removalReason String?

  createdAt     DateTime  @default(now())

  @@index([ticketId])
  @@index([isRemoved])
}
```

### 7.2. Seed Data Strategy
An idempotent seed script will populate:
- **4 Categories**: `Account and Access`, `Hardware`, `Software`, `Network`.
- **6+ Related Systems**: `Email`, `Campus Wi-Fi`, `VPN`, `LEB2 App`, `Grade Submission App`, `Printer`, `Corporate Laptop`.
- **4 Active Requesters**:
  1. `Jennifer Anderson` (jennifer.anderson@kmutt.ac.th)
  2. `Michael Brown` (michael.brown@kmutt.ac.th)
  3. `Sarah Johnson` (sarah.johnson@kmutt.ac.th)
  4. `David Lee` (david.lee@kmutt.ac.th)
- **1 Inactive Requester**:
  5. `Inactive User` (inactive.user@kmutt.ac.th, `isActive = false`)

---

## 8. API Contract Summary

| Method | Endpoint | Description | Auth/Header | Success | Errors |
|---|---|---|---|---|---|
| `GET` | `/api/requesters/active` | List active development requesters | None | 200 OK | 500 |
| `GET` | `/api/categories` | List active categories | None | 200 OK | 500 |
| `GET` | `/api/related-systems` | List active related systems | None | 200 OK | 500 |
| `POST` | `/api/tickets` | Create ticket with optional attachments | `x-requester-id` | 201 Created | 400, 413, 415, 500 |
| `GET` | `/api/tickets` | Paginated ticket list for active requester | `x-requester-id` | 200 OK | 400, 403, 500 |
| `GET` | `/api/tickets/:id` | Read-only details of owned ticket | `x-requester-id` | 200 OK | 403, 404, 500 |
| `POST` | `/api/tickets/:id/attachments` | Add attachment to existing owned ticket | `x-requester-id` | 201 Created | 400, 403, 413, 415, 500 |
| `GET` | `/api/attachments/:id/download` | Download active file attachment | `x-requester-id` | 200 (Stream) | 403, 404, 410, 500 |
| `DELETE`| `/api/attachments/:id` | Soft-remove attachment with reason | `x-requester-id` | 200 OK | 400, 403, 404, 500 |

Detailed schemas and request/response payloads are defined in `docs/lab-02/api-spec.md`.

---

## 9. Acceptance Criteria

- **AC-01 (Requester Selection)**: Given the user opens the application with no requester selected, when navigating to `/tickets`, then the user is redirected to the Development Requester selection view showing only active requesters.
- **AC-02 (Requester Context Header)**: Given Requester Jennifer Anderson is selected, when viewing any screen, then the header displays "Jennifer Anderson" and offers a "Change Requester" action.
- **AC-03 (Successful Ticket Creation)**: Given valid ticket form data (Category, System, Priority, Summary, Description) and 1 valid PNG attachment (2 MB), when the requester submits the form, then a ticket is saved in the database, a unique Ticket Number (`TKT-YYYY-NNNNNN`) is generated, and a success confirmation is displayed.
- **AC-04 (Validation Failures on Create)**: Given the summary is fewer than 5 characters or empty, when submitting the form, then an inline error message appears beneath the Summary field and no API call is made.
- **AC-05 (Attachment Constraint Enforcement)**: Given an attachment exceeding 5 MB or with an unsupported MIME type (e.g. `.exe` or `.zip`), when selecting the file, then an immediate validation error is shown and submission is prevented.
- **AC-06 (Form Values Preserved on Failure)**: Given the backend server is temporarily unavailable or returns HTTP 500, when the requester submits a valid ticket, then a clear error banner is displayed and all entered input values remain intact in the form.
- **AC-07 (My Tickets Ownership Separation)**: Given Requester A has 3 tickets and Requester B has 2 tickets, when Requester A views My Tickets, then only Requester A's 3 tickets are displayed. When switching to Requester B, only Requester B's 2 tickets appear.
- **AC-08 (My Tickets Search & Filter)**: Given a requester has multiple tickets, when typing "laptop" into the search box or filtering by "Hardware", then only matching tickets appear in the list.
- **AC-09 (Empty State & No Results)**: Given a requester with 0 tickets, when opening My Tickets, then an informative Empty State with a "Create Ticket" button is displayed. When a search filter yields 0 matches, a No-Results State with a "Clear Filters" button is displayed.
- **AC-10 (Ticket Detail Read-Only)**: Given an owned ticket, when the requester opens Ticket Detail, then all ticket fields (Ticket Number, Summary, Category, Description, etc.) are rendered in read-only format.
- **AC-11 (Unauthorized Ticket Access)**: Given Ticket #1 belongs to Requester A, when Requester B attempts to open `/tickets/1` directly via URL or API, then the application rejects access with a 403 Forbidden message.
- **AC-12 (Attachment Soft Removal)**: Given an owned ticket with an active attachment, when the requester submits a soft-removal with reason "Uploaded wrong version", then the attachment status becomes removed, the removal reason and timestamp are displayed, and subsequent download requests return HTTP 410 Gone.
- **AC-13 (Responsive Presentation)**: Given the application is rendered on Desktop ($\ge 992$px), Tablet (768px), or Mobile (375px), then all layouts adjust cleanly without overlapping elements, clipping, or unintended horizontal scrolling.

---

## 10. Definition of Done (DoD)

### 10.1. Product Completion Checklist
- [ ] All functional requirements (FR-01 to FR-13) and business rules (BR-01 to BR-13) implemented.
- [ ] PostgreSQL Prisma schema migrated with `RequesterUser`, `RelatedSystem`, `Category`, `Ticket`, and `Attachment`.
- [ ] Database seed script verified idempotent (safe to run repeatedly).
- [ ] All API endpoints implemented and strictly validated.
- [ ] All UI screens built conforming to Zen Green specification and responsive design.
- [ ] Automated tests implemented covering Unit, API, Component, and E2E levels.
- [ ] 100% automated test suite passing in clean run on `main`.

### 10.2. Course Delivery Checklist
- [ ] Git workflow strictly followed (feature branches $\to$ `lab2-staging` $\to$ `main`).
- [ ] Every PR accompanied by collaborator peer review documented in `docs/lab-02/reviewer.md`.
- [ ] GitHub Issues tracked and verified in "Done" column on GitHub Project board.
- [ ] Spec-DD and Test-DD evidence files completed before implementation completion.
- [ ] AI prompt log and reflection documented in `docs/lab-02/ai-use.md`.
- [ ] Required screenshots captured across Desktop, Tablet, and Mobile viewports in `artifacts/lab-02/screenshots/`.
- [ ] Final 9-part PDF report compiled according to instructor rubric.

---

## 11. Assumptions and Decisions

1. **Storage of Uploaded Files**: Uploaded files are stored in a local designated directory (`server/uploads/`) with sanitized UUID-prefixed filenames to prevent directory traversal and filename collision attacks. Original filenames are preserved in metadata for download presentation.
2. **Identification of Current Requester**: Until Lab 3 introduces JWT/session cookies, the active requester ID is passed via a standard HTTP request header `x-requester-id: <id>` and persisted on the client in browser `localStorage`.
3. **Soft-removal Status Code**: When a user attempts to download an attachment that has been marked as removed, the backend responds with HTTP 410 (Gone) with a JSON explanation, signaling that the resource once existed but has been purposefully revoked.
4. **Ticket Number Format**: Ticket numbers will use format `TKT-YYYY-NNNNNN` where YYYY is the creation year and NNNNNN is a monotonic 6-digit sequence padded with leading zeros based on database ID.
