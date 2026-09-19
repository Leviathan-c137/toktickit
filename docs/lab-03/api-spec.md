# Lab 3 REST API Specification

## 1. Authentication & Base Conventions

- **Base URL**: `/api`
- **Content-Type**: `application/json`
- **Session Transport**: HTTP-Only Signed Cookie (`toktickit_session`) or Bearer Token header (`Authorization: Bearer <token>`).
- **Standard Error Response Format**:
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid email or password",
    "details": null
  }
}
```

---

## 2. Authentication Endpoints

### 2.1. POST `/api/auth/login`
Authenticates a user with email and password.
- **Request Body**:
```json
{
  "email": "janderson@toktickit.com",
  "password": "Password123!"
}
```
- **Response (200 OK)**:
```json
{
  "user": {
    "id": 1,
    "fullName": "Jennifer Anderson",
    "email": "janderson@toktickit.com",
    "role": "Requester",
    "mustChangePassword": false,
    "isActive": true
  }
}
```
- **Error Responses**:
  - `401 Unauthorized`: Invalid credentials or account inactive (`"Invalid email or password"`).

---

### 2.2. POST `/api/auth/logout`
Invalidates the current user session.
- **Response (200 OK)**:
```json
{
  "message": "Successfully logged out"
}
```

---

### 2.3. GET `/api/auth/me`
Retrieves currently authenticated user context.
- **Response (200 OK)**:
```json
{
  "user": {
    "id": 1,
    "fullName": "Jennifer Anderson",
    "email": "janderson@toktickit.com",
    "role": "Requester",
    "mustChangePassword": false,
    "isActive": true
  }
}
```
- **Error Responses**:
  - `401 Unauthorized`: No active session.

---

### 2.4. POST `/api/auth/change-password`
Mandatory initial password change or self password update.
- **Request Body**:
```json
{
  "currentPassword": "Password123!",
  "newPassword": "NewSecurePassword456!",
  "confirmNewPassword": "NewSecurePassword456!"
}
```
- **Response (200 OK)**:
```json
{
  "message": "Password changed successfully",
  "mustChangePassword": false
}
```
- **Error Responses**:
  - `400 Bad Request`: Validation failure (passwords do not match, insufficient strength, or matches current password).

---

## 3. Requester Ticket Endpoints

### 3.1. GET `/api/tickets`
Lists tickets owned by the authenticated Requester.
- **Response (200 OK)**:
```json
{
  "tickets": [
    {
      "id": 10,
      "ticketNumber": "TKT-2026-000010",
      "summary": "Laptop battery drains quickly",
      "requestedPriority": "Medium",
      "itPriority": "Medium",
      "status": "InProgress",
      "category": { "id": 1, "name": "Hardware" },
      "createdAt": "2026-09-18T10:00:00Z"
    }
  ]
}
```

---

### 3.2. POST `/api/tickets/:id/comments`
Appends a Public Comment to a ticket.
- **Request Body**:
```json
{
  "content": "Thank you for the update. Please let me know when it is ready."
}
```
- **Response (201 Created)**:
```json
{
  "comment": {
    "id": 101,
    "ticketId": 10,
    "author": { "id": 1, "fullName": "Jennifer Anderson", "role": "Requester" },
    "content": "Thank you for the update. Please let me know when it is ready.",
    "createdAt": "2026-09-18T11:30:00Z"
  }
}
```

---

### 3.3. POST `/api/tickets/:id/resolve-indication`
Indicates that the reported problem appears resolved from the Requester's perspective.
- **Response (200 OK)**:
```json
{
  "message": "Resolution indication recorded",
  "status": "WaitingForRequester"
}
```

---

## 4. IT Staff Ticket Queue & Operational Endpoints

### 4.1. GET `/api/staff/tickets`
Retrieves paginated IT Staff Ticket Queue with search, filters, and sorting.
- **Query Parameters**:
  - `search`: Substring search over `ticketNumber` and `summary`.
  - `categoryId`: Filter by Category ID.
  - `status`: Filter by status (`New`, `Open`, `InProgress`, etc.).
  - `itPriority`: Filter by IT Priority (`Low`, `Medium`, `High`, `Urgent`).
  - `ownerId`: Filter by owner ID (`unassigned`, `me`, or specific User ID).
  - `sortBy`: Field to sort (`createdAt`, `ticketNumber`, `updatedAt`, `itPriority`).
  - `sortOrder`: `asc` or `desc` (default: `desc`).
  - `page`: Page number (default: `1`).
  - `limit`: Items per page (default: `10`, max `50`).
- **Response (200 OK)**:
```json
{
  "tickets": [
    {
      "id": 10,
      "ticketNumber": "TKT-2026-000010",
      "summary": "Laptop battery drains quickly",
      "requestedPriority": "Medium",
      "itPriority": "High",
      "status": "InProgress",
      "requester": { "id": 1, "fullName": "Jennifer Anderson", "email": "janderson@toktickit.com" },
      "owner": { "id": 5, "fullName": "Michael Brown", "email": "mbrown@toktickit.com" },
      "category": { "id": 1, "name": "Hardware" },
      "createdAt": "2026-09-18T10:00:00Z",
      "updatedAt": "2026-09-18T11:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalCount": 45,
    "totalPages": 5
  }
}
```

---

### 4.2. PATCH `/api/staff/tickets/:id/owner`
Claims or reassigns primary ticket owner.
- **Request Body**:
```json
{
  "ownerId": 5
}
```
- **Response (200 OK)**:
```json
{
  "ticketId": 10,
  "owner": { "id": 5, "fullName": "Michael Brown", "email": "mbrown@toktickit.com" }
}
```

---

### 4.3. PATCH `/api/staff/tickets/:id/priority`
Updates IT Priority.
- **Request Body**:
```json
{
  "itPriority": "High"
}
```
- **Response (200 OK)**:
```json
{
  "ticketId": 10,
  "itPriority": "High"
}
```

---

### 4.4. PATCH `/api/staff/tickets/:id/status`
Updates ticket status according to permitted workflow transitions.
- **Request Body**:
```json
{
  "status": "Resolved"
}
```
- **Response (200 OK)**:
```json
{
  "ticketId": 10,
  "status": "Resolved"
}
```

---

### 4.5. GET & POST `/api/staff/tickets/:id/notes`
Retrieves or posts private Internal Notes (IT Staff and Admin only).
- **POST Request Body**:
```json
{
  "content": "Replaced battery with new OEM part. Testing battery lifecycle now."
}
```
- **Response (201 Created)**:
```json
{
  "note": {
    "id": 201,
    "ticketId": 10,
    "author": { "id": 5, "fullName": "Michael Brown", "role": "ITStaff" },
    "content": "Replaced battery with new OEM part. Testing battery lifecycle now.",
    "createdAt": "2026-09-18T11:45:00Z"
  }
}
```
- **Forbidden Error (403 Forbidden)**: If requested by a `Requester` role.

---

## 5. Administrator User Management Endpoints

### 5.1. GET `/api/admin/users`
Lists user accounts with search and role filtering.
- **Query Parameters**: `search` (name or email), `role` (`Requester`, `ITStaff`, `Administrator`), `page`, `limit`.
- **Response (200 OK)**:
```json
{
  "users": [
    {
      "id": 5,
      "fullName": "Michael Brown",
      "email": "mbrown@toktickit.com",
      "role": "ITStaff",
      "isActive": true,
      "mustChangePassword": false,
      "createdAt": "2026-08-01T00:00:00Z"
    }
  ]
}
```

---

### 5.2. POST `/api/admin/users`
Creates a new user account.
- **Request Body**:
```json
{
  "fullName": "Alex Thompson",
  "email": "alex.thompson@toktickit.com",
  "role": "ITStaff",
  "isActive": true,
  "initialPassword": "Password123!"
}
```
- **Response (201 Created)**:
```json
{
  "user": {
    "id": 12,
    "fullName": "Alex Thompson",
    "email": "alex.thompson@toktickit.com",
    "role": "ITStaff",
    "isActive": true,
    "mustChangePassword": true
  }
}
```

---

### 5.3. PATCH `/api/admin/users/:id`
Updates user account details and active status.
- **Request Body**:
```json
{
  "fullName": "Alex Thompson",
  "email": "alex.thompson@toktickit.com",
  "role": "ITStaff",
  "isActive": false
}
```
- **Error Responses**:
  - `400 Bad Request`: Self-deactivation attempt or attempting to deactivate the last active Administrator.

---

### 5.4. POST `/api/admin/users/:id/reset-password`
Sets a new initial password for a user.
- **Request Body**:
```json
{
  "initialPassword": "TempPassword123!"
}
```
- **Response (200 OK)**:
```json
{
  "message": "Initial password set successfully. User must change password at next login."
}
```
