import { describe, it, expect } from "vitest";
import { generateTicketNumber } from "../../src/utils/ticketNumber.js";

describe("UNIT-01: Ticket Number Generator (BR-01, FR-04)", () => {
  it("formats ticket number as TKT-YYYY-NNNNNN with 6-digit zero padding", () => {
    expect(generateTicketNumber(1, 2026)).toBe("TKT-2026-000001");
    expect(generateTicketNumber(42, 2026)).toBe("TKT-2026-000042");
    expect(generateTicketNumber(999999, 2026)).toBe("TKT-2026-999999");
  });

  it("defaults to the current year when year argument is omitted", () => {
    const currentYear = new Date().getFullYear();
    expect(generateTicketNumber(7)).toBe(`TKT-${currentYear}-000007`);
  });

  it("throws error for non-positive or non-integer numbers", () => {
    expect(() => generateTicketNumber(0)).toThrow();
    expect(() => generateTicketNumber(-5)).toThrow();
    expect(() => generateTicketNumber(1.5)).toThrow();
  });
});
