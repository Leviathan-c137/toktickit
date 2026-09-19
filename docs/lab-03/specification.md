# Lab 3 Sprint Engineering Specification

## 1. Sprint Goal
Deliver secure authentication, role-based authorization (RBAC), IT Staff ticket queue/detail management workflows, and minimalist Administrator user management for TokTickIT. This increment replaces the Lab 2 temporary Development Requester selector with real authenticated user identities, extends the database model and REST API without breaking completed Lab 2 functions, introduces visually distinct Public Comments and Internal Notes, and maintains full compliance with the Zen Green design system.

---

## 2. Stakeholder Request Interpretation
The university stakeholder requires replacing the temporary Development Requester selector with production-style authentication. Requesters must log in securely and continue managing their owned tickets. IT Staff need a shared Ticket Queue to locate, claim, reassign, prioritize, update status, and communicate via Public Comments and private Internal Notes. Administrators require a minimalist User Management interface to create accounts, assign a single role (`Requester`, `ITStaff`, `Administrator`), edit user details, activate/deactivate accounts, and set initial passwords. All users signing in with an initial password must change it before accessing the application. Security must be enforced at the server API layer, not merely by hiding UI controls.

---

## 3. Scope

### 3.1. Included Scope
1. **Authentication & Session Management**:
   - Secure login via email and password with bcrypt hashing.
   - Session/Token management with HTTP-only cookies or bearer tokens.
   - Logout endpoint and current-user retrieval (`/api/auth/me`).
   - Mandatory first-login password change for users with `mustChangePassword = true`.
2. **Role-Based Navigation & Server-Side Authorization**:
   - Three roles: `Requester`, `ITStaff`, `Administrator`.
   - Server-side access control for all endpoints (HTTP 401 Unauthenticated, 403 Forbidden).
   - Dynamic navigation bar in Zen Green App Shell showing role badge and permitted navigation items.
3. **Data Model & Migration**:
   - Evolution of `RequesterUser` to `User` with roles, password hash, `mustChangePassword`, `isActive`.
   - Migration of existing Lab 2 ticket ownership to corresponding `User` records.
   - `Ticket` schema extensions: `ownerId` (IT Staff owner), `itPriority`, and 8 permitted statuses.
   - `PublicComment` model (visible to Requester, IT Staff, Admin).
   - `InternalNote` model (visible only to IT Staff, Admin).
   - Idempotent seed data for all roles and sample tickets/comments/notes.
4. **Requester Regression & Workflow Enhancements**:
   - Continued operation of all Lab 2 Requester functions using authenticated identity.
   - Public Comments section on Ticket Detail.
   - "Problem Appears Resolved" action allowing Requesters to indicate resolution.
5. **IT Staff Workflows**:
   - IT Staff Ticket Queue with search, multi-field filtering, multi-column sorting, and pagination.
   - Ticket Detail operational view: Claim, assign, or reassign Ticket Owner.
   - IT Priority management (`Low`, `Medium`, `High`, `Urgent`).
   - Status workflow transitions (`New`, `Open`, `InProgress`, `Waiting for Requester`, `Resolved`, `Closed`, `Reopened`, `Cancelled`).
   - Creation and inspection of Public Comments and Internal Notes.
6. **Administrator User Management**:
   - User listing screen with search by name/email and role filter.
   - Account creation with name, email, one permitted role, activation state, and initial password.
   - Basic user profile editing (name, email, role, activation state).
   - Initial password reset requiring password change at next login.
   - Admin safety guardrails: prevent self-deactivation and prevent deactivating the last active Administrator.
7. **Zen Green UI & Accessibility**:
   - Consistent Zen Green design tokens (`#006B3C`, `#0B7A46`, `#EAF6EF`, `#F5F7F6`).
   - Visually distinct styling for Public Comments vs Internal Notes.
   - Desktop, tablet, and mobile responsiveness.

### 3.2. Explicitly Excluded Scope
1. Multi-factor authentication (MFA), SSO, social logins, self-registration, or email verification.
2. Email delivery of passwords or password reset links.
3. Multiple roles assigned to a single user.
4. User deletion, bulk operations, user import/export, profile photos, or department structures.
5. Actions Taken work log features (deferred to Lab 4).
6. Complex SLA calculations, automated escalation rules, or external notification services.

---

## 4. Functional Requirements

- **FR-01 (User Authentication)**: The backend shall authenticate users given valid email and password credentials, setting a secure session context.
- **FR-02 (Mandatory First-Login Password Change)**: If a user has `mustChangePassword == true`, the application shall restrict access to all normal application views until a valid new password is saved.
- **FR-03 (Authenticated Current User)**: The backend shall expose an endpoint returning the currently authenticated user's ID, name, email, role, and password status.
- **FR-04 (Logout)**: The application shall invalidate the authenticated session upon user logout.
- **FR-05 (Requester Ownership Continuation)**: Requester ticket listing, creation, and detail views shall implicitly scope access to the authenticated user's ID rather than client-supplied requester IDs.
- **FR-06 (Requester Resolution Indication)**: A Requester shall be able to submit an indication that their reported problem appears resolved, updating ticket status to `Waiting for Requester` or `Resolved` per workflow rules.
- **FR-07 (Public Comments)**: Requesters, IT Staff, and Administrators shall be able to append and view Public Comments on a ticket.
- **FR-08 (Internal Notes)**: IT Staff and Administrators shall be able to append and view private Internal Notes on a ticket. Requesters shall be blocked from viewing or creating Internal Notes.
- **FR-09 (IT Staff Queue Retrieval)**: IT Staff and Administrators shall be able to retrieve a paginated queue of tickets with search (ticket number, summary), filters (category, IT priority, status, assigned owner), and sorting (created date, ticket number, last updated).
- **FR-10 (Ticket Ownership Assignment)**: IT Staff and Administrators shall be able to claim unassigned tickets or reassign ownership to another active IT Staff/Admin user.
- **FR-11 (IT Priority Management)**: IT Staff and Administrators shall be able to update a ticket's `itPriority` independent of the Requester's `requestedPriority`.
- **FR-12 (Ticket Status Workflow)**: IT Staff and Administrators shall be able to transition ticket status across permitted states: `New`, `Open`, `InProgress`, `Waiting for Requester`, `Resolved`, `Closed`, `Reopened`, `Cancelled`.
- **FR-13 (Administrator User List)**: Administrators shall be able to view a list of users, with search by name or email and optional role filtering.
- **FR-14 (Administrator User Creation)**: Administrators shall be able to create new user accounts with name, email, one assigned role, activation status, and an initial password.
- **FR-15 (Administrator User Update)**: Administrators shall be able to edit user name, email, role, and activation status (`isActive`).
- **FR-16 (Administrator Password Reset)**: Administrators shall be able to set a new initial password for a user, automatically setting `mustChangePassword = true`.
- **FR-17 (Admin Self-Deactivation Prevention)**: The backend shall reject attempts by an Administrator to deactivate their own account.
- **FR-18 (Last Admin Protection)**: The backend shall reject attempts to deactivate or change the role of the system's last remaining active Administrator.

---

## 5. Business Rules

- **BR-01 (Authentication Gate)**: Only active users (`isActive == true`) with valid credentials may authenticate. Inactive users receive a generic authentication failure.
- **BR-02 (First-Login Password Rule)**: Users marked with `mustChangePassword == true` cannot navigate to application features until saving a new password that differs from their current password and satisfies password strength criteria (minimum 8 characters, upper & lower case, number/special character).
- **BR-03 (Requester Data Protection)**: All Requester ticket endpoints infer identity from the server-side session token. Any client-supplied `requesterId` in payload or query is ignored or validated against session identity.
- **BR-04 (Public Comments Visibility)**: Public Comments are visible to Requester, IT Staff, and Administrator roles. Public Comments are append-only; editing and deletion are forbidden.
- **BR-05 (Internal Notes Restriction)**: Internal Notes are strictly restricted to IT Staff and Administrator roles. Requests by Requesters to fetch or post Internal Notes must yield HTTP 403 Forbidden without leaking note content.
- **BR-06 (Requester Resolution Rule)**: A Requester may mark a ticket as "Problem Appears Resolved", but formally transitioning tickets to final `Closed` or `Resolved` status is managed by IT Staff workflow.
- **BR-07 (IT Staff Ownership)**: Primary Ticket Owner must be an active user with role `ITStaff` or `Administrator`. Requesters cannot own ticket queues or be assigned as ticket owners.
- **BR-08 (IT Priority Isolation)**: `requestedPriority` is set at ticket creation by the Requester and remains immutable. `itPriority` is initialized to match `requestedPriority` and can subsequently be updated only by IT Staff or Administrator.
- **BR-09 (Status Transition Rules)**:
  - `New` -> `Open`, `InProgress`, `Cancelled`
  - `Open` -> `InProgress`, `Waiting for Requester`, `Resolved`, `Cancelled`
  - `InProgress` -> `Waiting for Requester`, `Resolved`, `Cancelled`
  - `Waiting for Requester` -> `InProgress`, `Resolved`, `Cancelled`
  - `Resolved` -> `Closed`, `Reopened`
  - `Closed` -> `Reopened`
  - `Reopened` -> `InProgress`, `Resolved`
  - `Cancelled` -> (terminal state)
- **BR-10 (Administrator Role Assignment)**: Every user has exactly one assigned role: `Requester`, `ITStaff`, or `Administrator`. Multiple roles are prohibited in Lab 3.
- **BR-11 (Unique Email Enforcement)**: User email addresses must be unique (case-insensitive). Duplicate email creation or update attempts must return HTTP 409 Conflict.
- **BR-12 (Admin Self-Deactivation Guard)**: An Administrator cannot deactivate their own user account (`id == currentUserId`). Attempts return HTTP 400 Bad Request.
- **BR-13 (Last Active Admin Guard)**: The system must maintain at least one active user with role `Administrator`. Deactivating or changing the role of the last active Admin returns HTTP 400 Bad Request.
- **BR-14 (Non-Destructive User Deactivation)**: User deletion is forbidden. Account removal is handled exclusively by setting `isActive = false`.

---

## 6. UI Specification Summary

- **Design System**: Zen Green Theme (`#006B3C` primary, `#0B7A46` active, `#EAF6EF` pale accent, `#F5F7F6` page background).
- **Navigation Shell**:
  - Top header displays TokTickIT logo, role-appropriate navigation tabs, user avatar badge with name and role pill, and a `Logout` button.
  - Role Navigation:
    - **Requester**: `My Tickets`, `+ Create Ticket`
    - **IT Staff**: `Ticket Queue`, `My Assigned Queue`
    - **Administrator**: `User Management`, `Ticket Queue`
- **Key Screens**:
  1. **Login & Password Change Screen**: Clean form with validation, error banners, and password strength helper.
  2. **IT Staff Ticket Queue (`/staff/tickets`)**: Paginated data grid with search box, status/priority/owner filter dropdowns, sortable headers, status/priority badges, and direct "Open Detail" action.
  3. **IT Staff Ticket Detail (`/staff/tickets/:id`)**: Dual-column layout showing ticket metadata, editable Owner / IT Priority / Status controls, Attachments, and visually distinct tabbed/card views for Public Comments (green accent) and Internal Notes (amber accent).
  4. **Administrator User Management (`/admin/users`)**: Searchable user table with role badges, active/inactive toggles, Create User modal, and Edit User / Reset Password modal.

---

## 7. Data Model & Migration Decisions

### 7.1. Database Models (`schema.prisma`)
```prisma
enum Role {
  Requester
  ITStaff
  Administrator
}

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
  WaitingForRequester
  Resolved
  Closed
  Reopened
  Cancelled
}

model User {
  id                 Int              @id @default(autoincrement())
  fullName           String
  email              String           @unique
  passwordHash       String
  role               Role             @default(Requester)
  mustChangePassword Boolean          @default(true)
  department         String?
  isActive           Boolean          @default(true)
  createdAt          DateTime         @default(now())
  updatedAt          DateTime         @updatedAt

  ownedTickets       Ticket[]         @relation("TicketRequester")
  assignedTickets    Ticket[]         @relation("TicketOwner")
  publicComments     PublicComment[]
  internalNotes      InternalNote[]
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
  requester         User          @relation("TicketRequester", fields: [requesterId], references: [id])
  
  ownerId           Int?
  owner             User?         @relation("TicketOwner", fields: [ownerId], references: [id])
  
  categoryId        Int
  category          Category      @relation(fields: [categoryId], references: [id])
  
  relatedSystemId   Int
  relatedSystem     RelatedSystem @relation(fields: [relatedSystemId], references: [id])
  
  attachments       Attachment[]
  publicComments    PublicComment[]
  internalNotes     InternalNote[]
  
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  @@index([requesterId])
  @@index([ownerId])
  @@index([status])
  @@index([itPriority])
  @@index([categoryId])
  @@index([createdAt])
}

model PublicComment {
  id        Int      @id @default(autoincrement())
  ticketId  Int
  ticket    Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
  content   String
  createdAt DateTime @default(now())

  @@index([ticketId])
}

model InternalNote {
  id        Int      @id @default(autoincrement())
  ticketId  Int
  ticket    Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
  content   String
  createdAt DateTime @default(now())

  @@index([ticketId])
}
```

### 7.2. Seed Data Strategy
- **Seed Password**: Default development seed password `Password123!` hashed via bcrypt.
- **Accounts**:
  - Requesters (4 Active, 1 Inactive): `janderson@toktickit.com`, `mchen@toktickit.com`, `pkatip@toktickit.com`, `ssangrod@toktickit.com`, `inactive.req@toktickit.com` (Inactive).
  - IT Staff (3 Active, 1 Inactive): `mbrown@toktickit.com`, `sjohnson@toktickit.com`, `dlee@toktickit.com`, `inactive.staff@toktickit.com` (Inactive).
  - Administrators (1 Active): `admin@toktickit.com`.

---

## 8. REST API Contract Summary

| Method | Endpoint | Description | Permitted Roles |
|---|---|---|---|
| `POST` | `/api/auth/login` | Authenticate credentials & return user info | Public |
| `POST` | `/api/auth/logout` | Invalidate session | Authenticated |
| `GET` | `/api/auth/me` | Fetch authenticated user context | Authenticated |
| `POST` | `/api/auth/change-password` | Mandatory initial password change | Authenticated (MustChangePassword) |
| `GET` | `/api/tickets` | List Requester's owned tickets | Requester, ITStaff, Admin |
| `POST` | `/api/tickets` | Create new ticket | Requester, ITStaff, Admin |
| `GET` | `/api/tickets/:id` | Get ticket detail | Owner Requester, ITStaff, Admin |
| `POST` | `/api/tickets/:id/comments` | Add Public Comment | Owner Requester, ITStaff, Admin |
| `GET` | `/api/tickets/:id/comments` | List Public Comments | Owner Requester, ITStaff, Admin |
| `POST` | `/api/tickets/:id/resolve-indication` | Indicate problem resolved | Owner Requester |
| `GET` | `/api/staff/tickets` | Ticket Queue (search, filter, sort, paginate) | ITStaff, Admin |
| `PATCH` | `/api/staff/tickets/:id/owner` | Claim / assign ticket owner | ITStaff, Admin |
| `PATCH` | `/api/staff/tickets/:id/priority` | Update IT Priority | ITStaff, Admin |
| `PATCH` | `/api/staff/tickets/:id/status` | Update ticket status | ITStaff, Admin |
| `GET` | `/api/staff/tickets/:id/notes` | List Internal Notes | ITStaff, Admin |
| `POST` | `/api/staff/tickets/:id/notes` | Add Internal Note | ITStaff, Admin |
| `GET` | `/api/admin/users` | List users (search, role filter) | Admin |
| `POST` | `/api/admin/users` | Create user account | Admin |
| `PATCH` | `/api/admin/users/:id` | Update user details & status | Admin |
| `POST` | `/api/admin/users/:id/reset-password` | Set initial password | Admin |

---

## 9. Acceptance Criteria

- **AC-01**: Given an active user with valid credentials, when they log in, the system returns authenticated session context and role.
- **AC-02**: Given a user with `mustChangePassword == true`, when login succeeds, normal application routes remain blocked until a valid new password is saved.
- **AC-03**: Given an authenticated Requester, when accessing `/api/tickets`, the response contains only tickets where `requesterId == user.id`.
- **AC-04**: Given a Requester account, when an Internal Note endpoint is requested, the server rejects it with HTTP 403 Forbidden.
- **AC-05**: Given an IT Staff user, when viewing `/staff/tickets`, they can filter by status and priority, search by summary, and paginate results.
- **AC-06**: Given an IT Staff user, when clicking "Claim Ticket", `ownerId` updates to the IT Staff user's ID.
- **AC-07**: Given an IT Staff user, when posting a Public Comment, it becomes visible on both IT Staff and Requester detail views.
- **AC-08**: Given an IT Staff user, when posting an Internal Note, it appears with amber internal note styling on staff view and is invisible to requesters.
- **AC-09**: Given an Administrator, when creating a new user, the system validates email uniqueness, role assignment, and sets `mustChangePassword = true`.
- **AC-10**: Given an Administrator, when attempting to deactivate their own account, the request is rejected with HTTP 400 Bad Request.
- **AC-11**: Given an Administrator, when attempting to deactivate the last active Admin, the request is rejected with HTTP 400 Bad Request.

---

## 10. Definition of Done

1. [x] All 6 specification files created in `docs/lab-03/`.
2. [ ] Database schema updated and migrated with `User`, `Ticket` extensions, `PublicComment`, and `InternalNote`.
3. [ ] Idempotent seed script executed supporting all roles and initial password credentials.
4. [ ] Backend REST APIs implemented and protected with RBAC middleware.
5. [ ] Frontend UI implemented adhering to Zen Green design tokens and responsive rules.
6. [ ] Unit, Integration/API, UI component, and E2E tests passing with 100% success.
7. [ ] PRs reviewed, approved, and merged from feature branches -> `lab3-staging` -> `main`.

---

## 11. Assumptions and Decisions

- **Password Hashing**: standard `bcryptjs` with salt rounds = 10.
- **Session Mechanism**: HTTP-Only signed cookie containing JWT session token.
- **Development Seed Password**: `Password123!` for all initial seeded users.
