import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("Lab 2 Issue 5: Ticket Detail API (GET /api/tickets/:id)", () => {
  const requesterA = "1"; // Jennifer Anderson
  const requesterB = "2"; // Michael Brown

  let ticketAId: number;
  let ticketBId: number;

  beforeAll(async () => {
    const prisma = getPrisma();

    // Clean up existing test tickets and their attachments if any
    await prisma.attachment.deleteMany({
      where: {
        ticket: {
          ticketNumber: {
            in: ["TKT-2026-800001", "TKT-2026-800002"],
          },
        },
      },
    });
    await prisma.ticket.deleteMany({
      where: {
        ticketNumber: {
          in: ["TKT-2026-800001", "TKT-2026-800002"],
        },
      },
    });

    // Create a ticket for Requester A with attachment
    const ticketA = await prisma.ticket.create({
      data: {
        ticketNumber: "TKT-2026-800001",
        summary: "DETAIL-TEST-A: Monitor display flickering",
        description: "External monitor in office 401 flickers intermittently over HDMI.",
        requestedPriority: "Medium",
        itPriority: "Medium",
        status: "Open",
        requesterId: 1,
        categoryId: 2, // Hardware
        relatedSystemId: 7, // Corporate Laptop
        attachments: {
          create: {
            originalName: "flicker-screenshot.png",
            storedFilename: "test-stored-screenshot.png",
            mimeType: "image/png",
            fileSizeBytes: 1024,
          },
        },
      },
    });
    ticketAId = ticketA.id;

    // Create a ticket for Requester B
    const ticketB = await prisma.ticket.create({
      data: {
        ticketNumber: "TKT-2026-800002",
        summary: "DETAIL-TEST-B: Cannot log in to Canvas LMS",
        description: "Invalid credentials error when attempting login.",
        requestedPriority: "High",
        itPriority: "High",
        status: "New",
        requesterId: 2,
        categoryId: 1, // Account and Access
        relatedSystemId: 4, // LEB2 App
      },
    });
    ticketBId = ticketB.id;
  });

  it("API-07: retrieves full details of an owned ticket (AC-10, FR-10)", async () => {
    const res = await request(app)
      .get(`/api/tickets/${ticketAId}`)
      .set("x-requester-id", requesterA);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(ticketAId);
    expect(res.body.ticketNumber).toBe("TKT-2026-800001");
    expect(res.body.summary).toBe("DETAIL-TEST-A: Monitor display flickering");
    expect(res.body.description).toContain("External monitor in office 401");
    expect(res.body.status).toBe("Open");
    expect(res.body.requestedPriority).toBe("Medium");
    expect(res.body.itPriority).toBe("Medium");

    // Check relations
    expect(res.body.requester.id).toBe(1);
    expect(res.body.requester.fullName).toBeDefined();
    expect(res.body.category.id).toBe(2);
    expect(res.body.relatedSystem.id).toBe(7);

    // Check attachments
    expect(Array.isArray(res.body.attachments)).toBe(true);
    expect(res.body.attachments.length).toBe(1);
    expect(res.body.attachments[0].originalName).toBe("flicker-screenshot.png");
    expect(res.body.attachments[0].isRemoved).toBe(false);
  });

  it("API-08: rejects cross-requester ticket retrieval with 403 Forbidden (AC-11, BR-12)", async () => {
    // Requester B attempts to view Requester A's ticket
    const res = await request(app)
      .get(`/api/tickets/${ticketAId}`)
      .set("x-requester-id", requesterB);

    expect(res.status).toBe(403);
    expect(res.body.statusCode).toBe(403);
    expect(res.body.message).toMatch(/permission to view this ticket/i);
  });

  it("returns 404 when ticket ID does not exist", async () => {
    const res = await request(app)
      .get("/api/tickets/999999")
      .set("x-requester-id", requesterA);

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/Ticket not found/i);
  });

  it("returns 401 when x-requester-id header is missing", async () => {
    const res = await request(app).get(`/api/tickets/${ticketAId}`);
    expect(res.status).toBe(401);
  });
});
