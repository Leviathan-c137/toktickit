import { Category, RelatedSystem, Requester, SystemStatus, Ticket } from "./types.js";
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
