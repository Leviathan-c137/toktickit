# Lab 2 REST API Specification

## 1. Overview and Standards

All endpoints follow RESTful conventions. Responses are returned with `Content-Type: application/json` unless downloading a binary stream.

### 1.1. Requester Context & Security Header
Until authentic session authentication is implemented in Lab 3, the selected Development Requester identity must be supplied in HTTP requests via the header:
```http
x-requester-id: <integer>
```
If the header is omitted on endpoints requiring ownership or context, the API responds with:
```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "x-requester-id header is required to identify current requester"
}
```
If the requester ID refers to a non-existent or inactive user, the API responds with:
```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Requester is inactive or does not exist"
}
```

### 1.2. Standard Error Envelope
All error responses adhere to the following schema:
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Human-readable explanation of error",
  "details": [
    {
      "field": "summary",
      "issue": "Summary must be at least 5 characters"
    }
  ]
}
```

---

## 2. Endpoints

### 2.1. Reference Data Endpoints

#### 2.1.1. `GET /api/requesters/active`
Retrieves all active Development Requesters for the selector screen. Inactive requesters are excluded.

- **Request Headers**: None required
- **Response `200 OK`**:
```json
[
  {
    "id": 1,
    "fullName": "Jennifer Anderson",
    "email": "jennifer.anderson@kmutt.ac.th",
    "department": "Computer Engineering"
  },
  {
    "id": 2,
    "fullName": "Michael Brown",
    "email": "michael.brown@kmutt.ac.th",
    "department": "Information Technology"
  }
]
```

#### 2.1.2. `GET /api/categories`
Retrieves all active ticket categories.

- **Response `200 OK`**:
```json
[
  { "id": 1, "name": "Account and Access" },
  { "id": 2, "name": "Hardware" },
  { "id": 3, "name": "Software" },
  { "id": 4, "name": "Network" }
]
```

#### 2.1.3. `GET /api/related-systems`
Retrieves all active related systems.

- **Response `200 OK`**:
```json
[
  { "id": 1, "name": "Email" },
  { "id": 2, "name": "Campus Wi-Fi" },
  { "id": 3, "name": "VPN" },
  { "id": 4, "name": "LEB2 App" },
  { "id": 5, "name": "Grade Submission App" },
  { "id": 6, "name": "Printer" },
  { "id": 7, "name": "Corporate Laptop" }
]
```

---

### 2.2. Ticket Management Endpoints

#### 2.2.1. `POST /api/tickets`
Creates a new ticket for the active requester. Supports optional file attachments via `multipart/form-data`.

- **Headers**:
  - `x-requester-id: <number>` (Required)
  - `Content-Type: multipart/form-data`
- **Form Fields (Payload)**:
  - `categoryId` (number, required)
  - `relatedSystemId` (number, required)
  - `requestedPriority` (string, required: `Low` | `Medium` | `High` | `Urgent`)
  - `summary` (string, required, length 5–150 chars)
  - `description` (string, required, length 10–2000 chars)
  - `files` (array of files, optional, max 5 files, $\le 5$ MB each, JPG/PNG/WEBP/PDF)
- **Response `201 Created`**:
```json
{
  "id": 42,
  "ticketNumber": "TKT-2026-000042",
  "summary": "Laptop battery drains quickly",
  "description": "My laptop battery drains in less than 30 minutes after update.",
  "requestedPriority": "Medium",
  "itPriority": "Medium",
  "status": "New",
  "requesterId": 1,
  "requester": {
    "id": 1,
    "fullName": "Jennifer Anderson",
    "email": "jennifer.anderson@kmutt.ac.th"
  },
  "categoryId": 2,
  "category": { "id": 2, "name": "Hardware" },
  "relatedSystemId": 7,
  "relatedSystem": { "id": 7, "name": "Corporate Laptop" },
  "attachments": [
    {
      "id": 10,
      "originalName": "battery-report.pdf",
      "mimeType": "application/pdf",
      "fileSizeBytes": 245000,
      "isRemoved": false,
      "createdAt": "2026-09-03T15:30:00.000Z"
    }
  ],
  "createdAt": "2026-09-03T15:30:00.000Z",
  "updatedAt": "2026-09-03T15:30:00.000Z"
}
```
- **Error Responses**:
  - `400 Bad Request`: Validation failure on summary, description, priority, category, or related system.
  - `413 Payload Too Large`: Any uploaded file exceeds 5 MB.
  - `415 Unsupported Media Type`: Any uploaded file has an unsupported extension or MIME type.

---

#### 2.2.2. `GET /api/tickets`
Retrieves a paginated list of tickets owned strictly by the requester specified in `x-requester-id`.

- **Headers**:
  - `x-requester-id: <number>` (Required)
- **Query Parameters**:
  - `search` (string, optional): Substring match on `ticketNumber` or `summary` (case-insensitive).
  - `categoryId` (number, optional): Exact filter by Category ID.
  - `requestedPriority` (string, optional: `Low` | `Medium` | `High` | `Urgent`).
  - `status` (string, optional: `New` | `Open` | `InProgress` | `Resolved` | `Closed` | `Cancelled`).
  - `sortBy` (string, optional: `createdAt` | `ticketNumber` | `updatedAt`, default `createdAt`).
  - `sortOrder` (string, optional: `asc` | `desc`, default `desc`).
  - `page` (number, optional, default `1`).
  - `limit` (number, optional, default `10`, max `50`).
- **Response `200 OK`**:
```json
{
  "items": [
    {
      "id": 42,
      "ticketNumber": "TKT-2026-000042",
      "summary": "Laptop battery drains quickly",
      "category": { "id": 2, "name": "Hardware" },
      "relatedSystem": { "id": 7, "name": "Corporate Laptop" },
      "requestedPriority": "Medium",
      "itPriority": "Medium",
      "status": "New",
      "createdAt": "2026-09-03T15:30:00.000Z",
      "updatedAt": "2026-09-03T15:30:00.000Z",
      "activeAttachmentsCount": 1
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalItems": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```
- **Error Responses**:
  - `400 Bad Request`: Invalid pagination or filter parameters.
  - `401 Unauthorized`: Missing `x-requester-id`.

---

#### 2.2.3. `GET /api/tickets/:id`
Retrieves full details of a specific ticket. Strictly verifies that the ticket is owned by the requester in `x-requester-id`.

- **Headers**:
  - `x-requester-id: <number>` (Required)
- **Response `200 OK`**: Full ticket object with Category, RelatedSystem, Requester, and Attachments list.
- **Error Responses**:
  - `403 Forbidden`: Ticket exists but belongs to a different requester.
  - `404 Not Found`: Ticket with specified ID does not exist.

---

### 2.3. Attachment Endpoints

#### 2.3.1. `POST /api/tickets/:id/attachments`
Uploads a new attachment to an existing owned ticket.

- **Headers**:
  - `x-requester-id: <number>` (Required)
  - `Content-Type: multipart/form-data`
- **Form Data**:
  - `file`: The file to attach.
- **Rules**:
  - Requester must own ticket `:id`.
  - Max 5 active attachments per ticket (returns `400 Bad Request` if ticket already has 5 active attachments).
  - File size $\le 5$ MB.
  - Allowed types: JPG, PNG, WEBP, PDF.
- **Response `201 Created`**: Returns created Attachment metadata object.
- **Error Responses**:
  - `400 Bad Request`: Already has 5 active attachments or missing file.
  - `403 Forbidden`: Requester does not own ticket.
  - `413 Payload Too Large`: File exceeds 5 MB.
  - `415 Unsupported Media Type`: Invalid file extension or MIME type.

---

#### 2.3.2. `GET /api/attachments/:id/download`
Streams and downloads the active attachment file.

- **Headers**:
  - `x-requester-id: <number>` (Required)
- **Response `200 OK`**:
  - `Content-Type: <mimeType>`
  - `Content-Disposition: attachment; filename="<originalName>"`
  - Binary stream of file.
- **Error Responses**:
  - `403 Forbidden`: Ticket containing this attachment is not owned by requesting user.
  - `404 Not Found`: Attachment ID does not exist.
  - `410 Gone`: Attachment has been soft-removed; download is permanently prohibited.
```json
{
  "statusCode": 410,
  "error": "Gone",
  "message": "This attachment has been removed and is no longer available for download",
  "removalReason": "Uploaded incorrect log file",
  "removedAt": "2026-09-03T16:00:00.000Z"
}
```

---

#### 2.3.3. `DELETE /api/attachments/:id`
Performs soft-removal of an attachment belonging to an owned ticket.

- **Headers**:
  - `x-requester-id: <number>` (Required)
  - `Content-Type: application/json`
- **Request Body**:
```json
{
  "removalReason": "Uploaded outdated configuration file"
}
```
- **Validation**:
  - `removalReason` is required, non-empty, and $\ge 3$ characters.
  - User must own the parent ticket.
  - Attachment must not already be removed.
- **Response `200 OK`**:
```json
{
  "id": 10,
  "isRemoved": true,
  "removedAt": "2026-09-03T16:00:00.000Z",
  "removalReason": "Uploaded outdated configuration file",
  "message": "Attachment soft-removed successfully"
}
```
- **Error Responses**:
  - `400 Bad Request`: Missing or too short `removalReason`, or attachment already removed.
  - `403 Forbidden`: Requester does not own ticket.
  - `404 Not Found`: Attachment not found.
