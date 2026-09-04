import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("Lab 2 Issue 4: My Tickets API (GET /api/tickets)", () => {
  const requesterA = "1"; // Jennifer Anderson
  const requesterB = "2"; // Michael Brown

  beforeAll(async () => {
    const prisma = getPrisma();

    // Ensure we have deterministic seed/test tickets for both requesters
    // Clean up existing test tickets if any with special prefix
    await prisma.ticket.deleteMany({
      where: {
        summary: {
          contains: "TEST-TKT-",
        },
      },
    });

    // Create 3 tickets for Requester A
    await prisma.ticket.create({
      data: {
        ticketNumber: "TKT-2026-900001",
        summary: "TEST-TKT-A1: VPN connection drops every hour",
        description: "Frequent disconnection when using Cisco VPN on macOS.",
        requestedPriority: "High",
        itPriority: "High",
        status: "Open",
        requesterId: 1,
        categoryId: 4, // Network
        relatedSystemId: 3, // VPN
      },
    });

    await prisma.ticket.create({
      data: {
        ticketNumber: "TKT-2026-900002",
        summary: "TEST-TKT-A2: Laptop battery replacement request",
        description: "Battery health is at 52% and swells under load.",
        requestedPriority: "Medium",
        itPriority: "Medium",
        status: "New",
        requesterId: 1,
        categoryId: 2, // Hardware
        relatedSystemId: 7, // Corporate Laptop
      },
    });

    await prisma.ticket.create({
      data: {
        ticketNumber: "TKT-2026-900003",
        summary: "TEST-TKT-A3: Campus Wi-Fi weak signal in Building 3",
        description: "Cannot connect to eduroam in room 302.",
        requestedPriority: "Low",
        itPriority: "Low",
        status: "Resolved",
        requesterId: 1,
        categoryId: 4, // Network
        relatedSystemId: 2, // Campus Wi-Fi
      },
    });

    // Create 2 tickets for Requester B
    await prisma.ticket.create({
      data: {
        ticketNumber: "TKT-2026-900004",
        summary: "TEST-TKT-B1: Password reset for student portal",
        description: "Forgot password after summer break.",
        requestedPriority: "Urgent",
        itPriority: "Urgent",
        status: "New",
        requesterId: 2,
        categoryId: 1, // Account and Access
        relatedSystemId: 4, // LEB2 App
      },
    });

    await prisma.ticket.create({
      data: {
        ticketNumber: "TKT-2026-900005",
        summary: "TEST-TKT-B2: Office printer paper jam issue",
        description: "Tray 2 in Department Office reports continuous jam.",
        requestedPriority: "Medium",
        itPriority: "Medium",
        status: "InProgress",
        requesterId: 2,
        categoryId: 2, // Hardware
        relatedSystemId: 6, // Printer
      },
    });
  });

  it("API-05: fetches tickets owned strictly by Requester A (AC-07, FR-07)", async () => {
    const res = await request(app)
      .get("/api/tickets")
      .set("x-requester-id", requesterA);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("items");
    expect(res.body).toHaveProperty("pagination");
    expect(Array.isArray(res.body.items)).toBe(true);

    // All returned tickets must belong to Requester A (id: 1)
    // None should belong to Requester B (e.g. no TEST-TKT-B items)
    const items = res.body.items;
    const testAItems = items.filter((t: any) => t.summary.includes("TEST-TKT-A"));
    const testBItems = items.filter((t: any) => t.summary.includes("TEST-TKT-B"));

    expect(testAItems.length).toBe(3);
    expect(testBItems.length).toBe(0);

    // Check item structure
    const sample = testAItems[0];
    expect(sample).toHaveProperty("id");
    expect(sample).toHaveProperty("ticketNumber");
    expect(sample).toHaveProperty("summary");
    expect(sample).toHaveProperty("category");
    expect(sample.category).toHaveProperty("name");
    expect(sample).toHaveProperty("relatedSystem");
    expect(sample.relatedSystem).toHaveProperty("name");
    expect(sample).toHaveProperty("requestedPriority");
    expect(sample).toHaveProperty("itPriority");
    expect(sample).toHaveProperty("status");
    expect(sample).toHaveProperty("createdAt");
    expect(sample).toHaveProperty("updatedAt");
    expect(sample).toHaveProperty("activeAttachmentsCount");
  });

  it("API-05 (Cross-check): Requester B retrieves only Requester B's tickets (AC-07)", async () => {
    const res = await request(app)
      .get("/api/tickets")
      .set("x-requester-id", requesterB);

    expect(res.status).toBe(200);
    const items = res.body.items;
    const testAItems = items.filter((t: any) => t.summary.includes("TEST-TKT-A"));
    const testBItems = items.filter((t: any) => t.summary.includes("TEST-TKT-B"));

    expect(testBItems.length).toBe(2);
    expect(testAItems.length).toBe(0);
  });

  it("API-06: filters tickets by Category and substring search (AC-08, FR-08)", async () => {
    // Requester A has 2 Network tickets (cat 4) and 1 Hardware ticket (cat 2)
    const resCategory = await request(app)
      .get("/api/tickets")
      .set("x-requester-id", requesterA)
      .query({ categoryId: 4 });

    expect(resCategory.status).toBe(200);
    const catItems = resCategory.body.items.filter((t: any) => t.summary.includes("TEST-TKT-A"));
    expect(catItems.length).toBe(2);
    catItems.forEach((item: any) => {
      expect(item.category.id).toBe(4);
    });

    // Substring search on summary: "battery"
    const resSearchSummary = await request(app)
      .get("/api/tickets")
      .set("x-requester-id", requesterA)
      .query({ search: "battery" });

    expect(resSearchSummary.status).toBe(200);
    const searchItems = resSearchSummary.body.items.filter((t: any) => t.summary.includes("TEST-TKT-A"));
    expect(searchItems.length).toBe(1);
    expect(searchItems[0].summary).toContain("battery");

    // Substring search on ticketNumber: "900001"
    const resSearchTicketNo = await request(app)
      .get("/api/tickets")
      .set("x-requester-id", requesterA)
      .query({ search: "900001" });

    expect(resSearchTicketNo.status).toBe(200);
    const ticketNoItems = resSearchTicketNo.body.items.filter((t: any) => t.summary.includes("TEST-TKT-A"));
    expect(ticketNoItems.length).toBe(1);
    expect(ticketNoItems[0].ticketNumber).toBe("TKT-2026-900001");
  });

  it("filters by requestedPriority and status correctly", async () => {
    // Requester A with High priority
    const resPriority = await request(app)
      .get("/api/tickets")
      .set("x-requester-id", requesterA)
      .query({ requestedPriority: "High" });

    expect(resPriority.status).toBe(200);
    const highItems = resPriority.body.items.filter((t: any) => t.summary.includes("TEST-TKT-A"));
    expect(highItems.length).toBe(1);
    expect(highItems[0].requestedPriority).toBe("High");

    // Requester A with status Resolved
    const resStatus = await request(app)
      .get("/api/tickets")
      .set("x-requester-id", requesterA)
      .query({ status: "Resolved" });

    expect(resStatus.status).toBe(200);
    const resolvedItems = resStatus.body.items.filter((t: any) => t.summary.includes("TEST-TKT-A"));
    expect(resolvedItems.length).toBe(1);
    expect(resolvedItems[0].status).toBe("Resolved");
  });

  it("handles pagination parameters properly", async () => {
    const resPage = await request(app)
      .get("/api/tickets")
      .set("x-requester-id", requesterA)
      .query({ page: 1, limit: 2 });

    expect(resPage.status).toBe(200);
    expect(resPage.body.pagination.page).toBe(1);
    expect(resPage.body.pagination.limit).toBe(2);
    expect(resPage.body.items.length).toBeLessThanOrEqual(2);
  });

  it("rejects request without x-requester-id header with 401 Unauthorized", async () => {
    const res = await request(app).get("/api/tickets");
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/x-requester-id header is required/i);
  });

  it("rejects invalid filter/pagination parameters with 400 Bad Request", async () => {
    const resLimit = await request(app)
      .get("/api/tickets")
      .set("x-requester-id", requesterA)
      .query({ limit: 100 }); // exceeds max 50

    expect(resLimit.status).toBe(400);

    const resPriority = await request(app)
      .get("/api/tickets")
      .set("x-requester-id", requesterA)
      .query({ requestedPriority: "SuperUrgent" });

    expect(resPriority.status).toBe(400);
  });
});
