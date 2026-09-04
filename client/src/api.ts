import { Attachment, Category, RelatedSystem, Requester, SystemStatus, Ticket } from "./types.js";
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


