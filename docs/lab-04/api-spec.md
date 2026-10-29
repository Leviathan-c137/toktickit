# Lab 4 REST API Specification

## 1. Overview & Conventions

The TokTickIT REST API provides endpoints for Actions Taken tracking, ticket lifecycle management, and role-appropriate operational dashboards. All endpoints adhere to REST conventions, JSON request/response formats, strict role-based access control, and consistent error reporting.

- **Base URL**: `/api`
- **Authentication**: Session cookie (`token`) or Bearer token header (`Authorization: Bearer <token>`).
- **Standard HTTP Status Codes**:
  - `200 OK`: Request succeeded.
  - `201 Created`: Resource successfully created.
  - `400 Bad Request`: Validation failure or business rule violation.
  - `401 Unauthorized`: Missing or invalid authentication token.
  - `403 Forbidden`: Authenticated user lacks permission for the resource.
  - `404 Not Found`: Resource does not exist.
  - `409 Conflict`: Concurrency conflict (stale update).
  - `500 Internal Server Error`: Unhandled server exception.

---

## 2. Standard Error Response Format

All error responses return a standardized JSON structure:
```json
{
  "error": "BAD_REQUEST",
  "message": "Follow-up note is required when follow-up is requested",
  "details": [
    {
      "field": "followUpNote",
      "issue": "Required when followUpRequired is true"
    }
  ]
}
```

---

## 3. Endpoints Specification

### 3.1. Actions Taken Endpoints

#### 3.1.1. `GET /api/tickets/:id/actions`
Retrieve all Actions Taken records for a specific ticket in stable chronological order.

- **Roles Permitted**:
  - `Requester`: Allowed only if `ticket.requesterId == authenticatedUser.id`. Otherwise returns `403 Forbidden`.
  - `ITStaff`, `Administrator`: Allowed for any ticket.
- **Path Parameters**:
  - `id` (integer): ID of the parent Ticket.
- **Success Response (200 OK)**:
```json
[
  {
    "id": 101,
    "ticketId": 12,
    "actionDateTime": "2026-10-29T10:30:00.000Z",
    "description": "Replaced RAM module and ran diagnostic memory test",
    "result": "Memory test passed with zero errors",
    "followUpRequired": true,
    "followUpNote": "Check with user after 48 hours for system stability",
    "attachmentNotes": "diagnostic_log_20261029.txt",
    "performedBy": {
      "id": 4,
      "fullName": "Michael Chang",
      "email": "michael.it@toktickit.local",
      "role": "ITStaff"
    },
    "createdAt": "2026-10-29T10:35:00.000Z",
    "updatedAt": "2026-10-29T10:35:00.000Z"
  }
]
```

---

#### 3.1.2. `POST /api/tickets/:id/actions`
Create an Action Taken sub-record under a ticket.

- **Roles Permitted**: `ITStaff`, `Administrator` (Requesters receive `403 Forbidden`).
- **Request Body**:
```json
{
  "actionDateTime": "2026-10-29T10:30:00.000Z",
  "description": "Cleaned dust from cooling fan and reapplied thermal paste",
  "result": "CPU temperature dropped from 92C to 58C under load",
  "followUpRequired": false,
  "followUpNote": null,
  "attachmentNotes": "fan_cleaning_photo.jpg"
}
```
- **Validation Rules**:
  - `description`: String, required, minimum 5 characters.
  - `result`: String, required, minimum 3 characters.
  - `followUpRequired`: Boolean, optional (defaults to `false`).
  - `followUpNote`: String, **required** if `followUpRequired` is `true` (minimum 3 characters). If `false`, set to `null` or ignored.
  - `attachmentNotes`: String, optional.
  - `actionDateTime`: ISO 8601 string, optional (defaults to server `now()`).
- **Success Response (201 Created)**:
```json
{
  "id": 102,
  "ticketId": 12,
  "actionDateTime": "2026-10-29T10:30:00.000Z",
  "description": "Cleaned dust from cooling fan and reapplied thermal paste",
  "result": "CPU temperature dropped from 92C to 58C under load",
  "followUpRequired": false,
  "followUpNote": null,
  "attachmentNotes": "fan_cleaning_photo.jpg",
  "performedBy": {
    "id": 4,
    "fullName": "Michael Chang",
    "email": "michael.it@toktickit.local",
    "role": "ITStaff"
  },
  "createdAt": "2026-10-29T10:36:00.000Z",
  "updatedAt": "2026-10-29T10:36:00.000Z"
}
```

---

#### 3.1.3. `PATCH /api/tickets/:id/actions/:actionId`
Update an existing Action Taken record.

- **Roles Permitted**: `ITStaff`, `Administrator`.
- **Request Body**:
```json
{
  "description": "Updated description with additional details",
  "result": "Thermal paste cured, CPU stable at 54C",
  "followUpRequired": true,
  "followUpNote": "Verify temperature during next heavy video rendering",
  "attachmentNotes": "updated_benchmark.png",
  "expectedUpdatedAt": "2026-10-29T10:36:00.000Z"
}
```
- **Concurrency & Validation Rules**:
  - If `expectedUpdatedAt` is supplied and does not match the record's current `updatedAt`, returns `409 Conflict`.
  - `performedById` and `ticketId` cannot be updated.
  - `followUpNote` validation rule (BR-04) strictly applies.
- **Success Response (200 OK)**: Returns updated ActionTaken object.

---

### 3.2. Dashboard Endpoints

#### 3.2.1. `GET /api/requester/dashboard`
Retrieve operational metrics and recent tickets for the authenticated Requester.

- **Roles Permitted**: `Requester`.
- **Query Parameters**: None (strictly bound to authenticated user).
- **Success Response (200 OK)**:
```json
{
  "metrics": {
    "openTickets": 3,
    "inProgress": 2,
    "waitingForRequester": 1,
    "resolved": 5,
    "closed": 12
  },
  "recentTickets": [
    {
      "id": 12,
      "ticketNumber": "TXT-2026-0012",
      "summary": "Laptop thermal throttling during build",
      "status": "InProgress",
      "requestedPriority": "High",
      "category": { "id": 2, "name": "Hardware" },
      "updatedAt": "2026-10-29T10:36:00.000Z"
    }
  ]
}
```

---

#### 3.2.2. `GET /api/staff/dashboard`
Retrieve authoritative operational metrics and recent tickets across the service desk.

- **Roles Permitted**: `ITStaff`, `Administrator`.
- **Success Response (200 OK)**:
```json
{
  "metrics": {
    "newTickets": 14,
    "openTickets": 23,
    "inProgressTickets": 18,
    "waitingForRequesterTickets": 7,
    "myAssignedTickets": 16,
    "unassignedTickets": 8
  },
  "recentTickets": [
    {
      "id": 14,
      "ticketNumber": "TXT-2026-0014",
      "summary": "Cannot connect to campus Wi-Fi",
      "status": "New",
      "itPriority": "Medium",
      "requester": { "id": 9, "fullName": "Alice Walker" },
      "owner": null,
      "updatedAt": "2026-10-29T11:00:00.000Z"
    }
  ]
}
```

---

### 3.3. Ticket Status Workflow Endpoint

#### 3.3.1. `PATCH /api/staff/tickets/:id/status`
Transition ticket status according to the state machine matrix (BR-06, BR-07).

- **Roles Permitted**: `ITStaff`, `Administrator` (Requesters receive `403 Forbidden`).
- **Request Body**:
```json
{
  "status": "Resolved",
  "expectedUpdatedAt": "2026-10-29T10:36:00.000Z"
}
```
- **Error Codes**:
  - `400 Bad Request`: When requested transition is illegal under BR-06 (e.g. `New` -> `Resolved` without passing through `Open`).
  - `409 Conflict`: When `expectedUpdatedAt` does not match the database `updatedAt`.
- **Success Response (200 OK)**:
```json
{
  "id": 12,
  "ticketNumber": "TXT-2026-0012",
  "status": "Resolved",
  "updatedAt": "2026-10-29T11:15:00.000Z"
}
```
