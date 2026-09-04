/**
 * Generates an official TokTickIT ticket number following BR-01:
 * Pattern: TKT-YYYY-NNNNNN (e.g. TKT-2026-000001)
 *
 * @param id - Monotonic database sequence ID or ticket index
 * @param year - Optional year override (defaults to current year)
 */
export function generateTicketNumber(id: number, year: number = new Date().getFullYear()): string {
  if (id <= 0 || !Number.isInteger(id)) {
    throw new Error("Ticket ID must be a positive integer");
  }
  const sequence = String(id).padStart(6, "0");
  return `TKT-${year}-${sequence}`;
}
