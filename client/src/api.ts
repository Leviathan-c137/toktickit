import { Attachment, Category, RelatedSystem, Requester, SystemStatus, Ticket, User, PublicComment } from "./types.js";
export * from "./types.js";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

// ---------------------------------------------------------------------------
// Lab 1 System Status check (preserved for backwards compatibility & tests)
// ---------------------------------------------------------------------------
export async function checkSystem(): Promise<SystemStatus> {
  const healthRes = await fetch(`${API_URL}/api/health`);
  if (!healthRes.ok) {
    throw new Error("Unable to connect to TokTickIT API");
  }
  const healthData = await healthRes.json();
  if (healthData.status !== "ok") {
    throw new Error("Unable to connect to TokTickIT API");
  }

  const catRes = await fetch(`${API_URL}/api/categories`);
  if (!catRes.ok) {
    throw new Error("Unable to connect to TokTickIT API");
  }
  const categories: Category[] = await catRes.json();

  return { online: true, categories };
}

// ---------------------------------------------------------------------------
// Lab 2 Reference Data & Requester APIs
// ---------------------------------------------------------------------------

/**
 * Fetch active development requesters for the context selector.
 */
export async function fetchActiveRequesters(): Promise<Requester[]> {
  const res = await fetch(`${API_URL}/api/requesters/active`);
  if (!res.ok) {
    throw new Error("Failed to fetch active requesters");
  }
  return res.json();
}

/**
 * Fetch all active incident categories.
 */
export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_URL}/api/categories`);
  if (!res.ok) {
    throw new Error("Failed to fetch categories");
  }
  return res.json();
}

/**
 * Fetch all active campus related systems.
 */
export async function fetchRelatedSystems(): Promise<RelatedSystem[]> {
  const res = await fetch(`${API_URL}/api/related-systems`);
  if (!res.ok) {
    throw new Error("Failed to fetch related systems");
  }
  return res.json();
}

/**
 * Create a new ticket with optional attachments.
 */
export async function createTicket(
  requesterId: number,
  formData: FormData
): Promise<Ticket> {
  const res = await fetch(`${API_URL}/api/tickets`, {
    method: "POST",
    headers: {
      "x-requester-id": String(requesterId),
    },
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to create ticket (${res.status})`);
  }

  return res.json();
}

/**
 * Fetch tickets owned strictly by the active requester with optional filters & pagination.
 */
export async function fetchMyTickets(
  requesterId: number,
  filters?: import("./types.js").TicketFilters
): Promise<import("./types.js").PaginatedTickets> {
  const params = new URLSearchParams();
  if (filters?.search) params.append("search", filters.search);
  if (filters?.categoryId !== undefined && filters.categoryId !== null) {
    params.append("categoryId", String(filters.categoryId));
  }
  if (filters?.requestedPriority) params.append("requestedPriority", filters.requestedPriority);
  if (filters?.status) params.append("status", filters.status);
  if (filters?.sortBy) params.append("sortBy", filters.sortBy);
  if (filters?.sortOrder) params.append("sortOrder", filters.sortOrder);
  if (filters?.page) params.append("page", String(filters.page));
  if (filters?.limit) params.append("limit", String(filters.limit));

  const qs = params.toString();
  const url = `${API_URL}/api/tickets${qs ? `?${qs}` : ""}`;

  const res = await fetch(url, {
    headers: {
      "x-requester-id": String(requesterId),
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch tickets (${res.status})`);
  }

  return res.json();
}

/**
 * Fetch full details of an owned ticket.
 */
export async function fetchTicketDetail(
  requesterId: number,
  ticketId: number
): Promise<Ticket> {
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}`, {
    headers: {
      "x-requester-id": String(requesterId),
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch ticket (${res.status})`);
  }

  return res.json();
}

/**
 * Upload a new attachment to an existing owned ticket.
 */
export async function uploadTicketAttachment(
  requesterId: number,
  ticketId: number,
  file: File
): Promise<Attachment> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/attachments`, {
    method: "POST",
    headers: {
      "x-requester-id": String(requesterId),
    },
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to upload attachment (${res.status})`);
  }

  return res.json();
}

/**
 * Soft-remove an attachment with mandatory removal reason.
 */
export async function removeAttachment(
  requesterId: number,
  attachmentId: number,
  removalReason: string
): Promise<Attachment> {
  const res = await fetch(`${API_URL}/api/attachments/${attachmentId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "x-requester-id": String(requesterId),
    },
    body: JSON.stringify({ removalReason }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to remove attachment (${res.status})`);
  }

  return res.json();
}

/**
 * Download an active attachment file as a blob stream.
 */
export async function downloadAttachment(
  requesterId: number,
  attachmentId: number,
  originalName: string
): Promise<void> {
  const res = await fetch(`${API_URL}/api/attachments/${attachmentId}/download`, {
    headers: {
      "x-requester-id": String(requesterId),
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to download file (${res.status})`);
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = originalName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Lab 3 Authentication & Public Comments APIs
// ---------------------------------------------------------------------------

/**
 * Fetch public comments for a ticket.
 */
export async function fetchPublicComments(ticketId: number): Promise<PublicComment[]> {
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/comments`, {
    credentials: "include",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || errorData.message || "Failed to fetch comments");
  }
  const data = await res.json();
  return data.comments || [];
}

/**
 * Append a public comment to a ticket.
 */
export async function createPublicComment(ticketId: number, content: string): Promise<PublicComment> {
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || errorData.message || "Failed to post comment");
  }
  const data = await res.json();
  return data.comment;
}

/**
 * Record requester indication that problem appears resolved.
 */
export async function indicateProblemResolved(ticketId: number): Promise<{ message: string; status: string }> {
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/resolve-indication`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || errorData.message || "Failed to record resolution indication");
  }
  return res.json();
}

/**
 * Login user with credentials.
 */
export async function loginUser(email: string, password: string): Promise<{ user: User; token: string }> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || errorData.message || "Invalid email or password");
  }
  return res.json();
}

/**
 * Logout current user.
 */
export async function logoutUser(): Promise<void> {
  await fetch(`${API_URL}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
}

/**
 * Fetch currently authenticated user context.
 */
export async function fetchCurrentUser(): Promise<User | null> {
  const res = await fetch(`${API_URL}/api/auth/me`, {
    credentials: "include",
  });
  if (!res.ok) {
    return null;
  }
  const data = await res.json();
  return data.user;
}

/**
 * Change current user password (AC-02, BR-02).
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string,
  confirmNewPassword: string
): Promise<{ message: string; user: User }> {
  const res = await fetch(`${API_URL}/api/auth/change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || errorData.message || "Failed to change password");
  }
  return res.json();
}

/**
 * Fetch IT Staff Ticket Queue with search, multi-field filters, sorting, and pagination (FR-09, AC-05).
 */
export async function fetchStaffTicketQueue(
  filters?: import("./types.js").StaffQueueFilters
): Promise<import("./types.js").PaginatedStaffTickets> {
  const params = new URLSearchParams();
  if (filters?.search) params.append("search", filters.search);
  if (filters?.categoryId !== undefined && filters.categoryId !== "" && filters.categoryId !== "All") {
    params.append("categoryId", String(filters.categoryId));
  }
  if (filters?.status && filters.status !== "All") {
    params.append("status", filters.status);
  }
  if (filters?.itPriority && filters.itPriority !== "All") {
    params.append("itPriority", filters.itPriority);
  }
  if (filters?.ownerId !== undefined && filters.ownerId !== "" && filters.ownerId !== "All") {
    params.append("ownerId", String(filters.ownerId));
  }
  if (filters?.sortBy) params.append("sortBy", filters.sortBy);
  if (filters?.sortOrder) params.append("sortOrder", filters.sortOrder);
  if (filters?.page) params.append("page", String(filters.page));
  if (filters?.limit) params.append("limit", String(filters.limit));

  const queryString = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(`${API_URL}/api/staff/tickets${queryString}`, {
    credentials: "include",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || errorData.message || `Failed to fetch ticket queue (${res.status})`);
  }

  return res.json();
}

/**
 * Fetch complete ticket detail for IT Staff view (FR-10, FR-11, FR-12).
 */
export async function fetchStaffTicketDetail(
  id: number
): Promise<import("./types.js").StaffTicketDetailData> {
  const res = await fetch(`${API_URL}/api/staff/tickets/${id}`, {
    credentials: "include",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || errorData.message || `Failed to fetch ticket (${res.status})`);
  }
  return res.json();
}

/**
 * Claim or reassign ticket ownership (API-07, FR-10, BR-07).
 */
export async function updateTicketOwner(
  id: number,
  ownerId: number | null
): Promise<{ ticketId: number; owner: any }> {
  const res = await fetch(`${API_URL}/api/staff/tickets/${id}/owner`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ ownerId }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || errorData.message || "Failed to update ticket owner");
  }
  return res.json();
}

/**
 * Update IT Priority independently (FR-11, BR-08).
 */
export async function updateTicketPriority(
  id: number,
  itPriority: import("./types.js").Priority
): Promise<{ ticketId: number; itPriority: import("./types.js").Priority }> {
  const res = await fetch(`${API_URL}/api/staff/tickets/${id}/priority`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ itPriority }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || errorData.message || "Failed to update IT priority");
  }
  return res.json();
}

/**
 * Transition ticket status through permitted workflow states (FR-12, BR-09).
 */
export async function updateTicketStatus(
  id: number,
  status: import("./types.js").TicketStatus
): Promise<{ ticketId: number; status: import("./types.js").TicketStatus }> {
  const res = await fetch(`${API_URL}/api/staff/tickets/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || errorData.message || "Failed to update ticket status");
  }
  return res.json();
}

/**
 * Fetch private Internal Notes for a ticket (API-09, FR-08, BR-05).
 */
export async function fetchInternalNotes(
  ticketId: number
): Promise<import("./types.js").InternalNote[]> {
  const res = await fetch(`${API_URL}/api/staff/tickets/${ticketId}/notes`, {
    credentials: "include",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || errorData.message || "Failed to fetch internal notes");
  }
  const data = await res.json();
  return data.notes;
}

/**
 * Post a private Internal Note (API-09, FR-08, BR-05).
 */
export async function createInternalNote(
  ticketId: number,
  content: string
): Promise<import("./types.js").InternalNote> {
  const res = await fetch(`${API_URL}/api/staff/tickets/${ticketId}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || errorData.message || "Failed to post internal note");
  }
  const data = await res.json();
  return data.note;
}

/**
 * Fetch active staff users for assignment dropdown (BR-07).
 */
export async function fetchActiveStaffUsers(): Promise<import("./types.js").StaffUser[]> {
  const res = await fetch(`${API_URL}/api/staff/users`, {
    credentials: "include",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || errorData.message || "Failed to fetch staff users");
  }
  const data = await res.json();
  return data.users;
}

// ---------------------------------------------------------------------------
// Lab 3 Issue 6 — Administrator User Management API Functions (FR-13 to FR-18)
// ---------------------------------------------------------------------------

/**
 * Fetch paginated user accounts with search and filters (FR-13, AC-09).
 */
export async function fetchAdminUsers(
  filters: import("./types.js").AdminUserFilters = {}
): Promise<import("./types.js").PaginatedAdminUsers> {
  const query = new URLSearchParams();
  if (filters.search) query.set("search", filters.search);
  if (filters.role && filters.role !== "All") query.set("role", filters.role);
  if (filters.isActive && filters.isActive !== "All") query.set("isActive", filters.isActive);
  if (filters.page) query.set("page", String(filters.page));
  if (filters.limit) query.set("limit", String(filters.limit));

  const queryString = query.toString() ? `?${query.toString()}` : "";
  const res = await fetch(`${API_URL}/api/admin/users${queryString}`, {
    credentials: "include",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || errorData.message || "Failed to fetch users");
  }
  return res.json();
}

/**
 * Create a new user account with initial password (FR-14, AC-09, BR-10, BR-11).
 */
export async function createAdminUser(
  input: import("./types.js").CreateAdminUserInput
): Promise<{ user: import("./types.js").AdminUser }> {
  const res = await fetch(`${API_URL}/api/admin/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || errorData.message || "Failed to create user");
  }
  return res.json();
}

/**
 * Update user details and active status (FR-15, AC-10, AC-11, BR-12, BR-13).
 */
export async function updateAdminUser(
  id: number,
  input: import("./types.js").UpdateAdminUserInput
): Promise<{ user: import("./types.js").AdminUser }> {
  const res = await fetch(`${API_URL}/api/admin/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || errorData.message || "Failed to update user");
  }
  return res.json();
}

/**
 * Reset initial password for user (FR-16).
 */
export async function resetAdminUserPassword(
  id: number,
  initialPassword: string
): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/api/admin/users/${id}/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ initialPassword }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || errorData.message || "Failed to reset password");
  }
  return res.json();
}





