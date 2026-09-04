import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import fs from "fs";
import path from "path";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { UPLOAD_DIR } from "../../src/utils/upload.js";

describe("Lab 2 Issue 5: Attachment Lifecycle APIs (POST, GET download, DELETE)", () => {
  const requesterA = "1"; // Jennifer Anderson
  const requesterB = "2"; // Michael Brown

  let ticketAId: number;
  let ticketBId: number;
  let activeAttachmentId: number;
  let attachmentStoredFile: string;

  beforeAll(async () => {
    const prisma = getPrisma();

    // Clean up test attachments and tickets if previously run
    await prisma.attachment.deleteMany({
      where: {
        ticket: {
          ticketNumber: {
            in: ["TKT-2026-850001", "TKT-2026-850002"],
          },
        },
      },
    });
    await prisma.ticket.deleteMany({
      where: {
        ticketNumber: {
          in: ["TKT-2026-850001", "TKT-2026-850002"],
        },
      },
    });

    // Prepare dummy file on disk for download tests
    attachmentStoredFile = `test-file-${Date.now()}.png`;
    const filePath = path.join(UPLOAD_DIR, attachmentStoredFile);
    fs.writeFileSync(filePath, Buffer.from("dummy active file content for testing"));

    // Create ticket for Requester A
    const ticketA = await prisma.ticket.create({
      data: {
        ticketNumber: "TKT-2026-850001",
        summary: "ATTACH-TEST-A: Software install request",
        description: "Need Docker Desktop license and setup on workstation.",
        requestedPriority: "Low",
        itPriority: "Low",
        status: "New",
        requesterId: 1,
        categoryId: 3, // Software
        relatedSystemId: 7, // Corporate Laptop
        attachments: {
          create: {
            originalName: "docker-request.png",
            storedFilename: attachmentStoredFile,
            mimeType: "image/png",
            fileSizeBytes: 100,
          },
        },
      },
      include: {
        attachments: true,
      },
    });
    ticketAId = ticketA.id;
    activeAttachmentId = ticketA.attachments[0].id;

    // Create ticket for Requester B
    const ticketB = await prisma.ticket.create({
      data: {
        ticketNumber: "TKT-2026-850002",
        summary: "ATTACH-TEST-B: Campus VPN connection error",
        description: "Error 403 on VPN gateway.",
        requestedPriority: "Medium",
        itPriority: "Medium",
        status: "Open",
        requesterId: 2,
        categoryId: 4, // Network
        relatedSystemId: 3, // VPN
      },
    });
    ticketBId = ticketB.id;
  });

  it("API-09: adds an attachment to existing owned ticket (AC-12, FR-11)", async () => {
    const res = await request(app)
      .post(`/api/tickets/${ticketAId}/attachments`)
      .set("x-requester-id", requesterA)
      .attach("file", Buffer.from("another test file"), {
        filename: "second-file.pdf",
        contentType: "application/pdf",
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.originalName).toBe("second-file.pdf");
    expect(res.body.mimeType).toBe("application/pdf");
    expect(res.body.isRemoved).toBe(false);

    // Verify ticket now has 2 attachments in database
    const prisma = getPrisma();
    const count = await prisma.attachment.count({
      where: { ticketId: ticketAId, isRemoved: false },
    });
    expect(count).toBe(2);
  });

  it("rejects adding attachment to another user's ticket with 403 Forbidden (BR-12)", async () => {
    const res = await request(app)
      .post(`/api/tickets/${ticketAId}/attachments`)
      .set("x-requester-id", requesterB)
      .attach("file", Buffer.from("unauthorized upload"), {
        filename: "unauthorized.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(403);
  });

  it("rejects adding attachment exceeding 5 active attachments limit (FR-06, BR-10)", async () => {
    const prisma = getPrisma();

    // Fill ticketA attachments to 5
    const currentCount = await prisma.attachment.count({
      where: { ticketId: ticketAId, isRemoved: false },
    });

    for (let i = currentCount; i < 5; i++) {
      await prisma.attachment.create({
        data: {
          ticketId: ticketAId,
          originalName: `filler-${i}.png`,
          storedFilename: `filler-${i}.png`,
          mimeType: "image/png",
          fileSizeBytes: 100,
        },
      });
    }

    // Try to attach a 6th file
    const res = await request(app)
      .post(`/api/tickets/${ticketAId}/attachments`)
      .set("x-requester-id", requesterA)
      .attach("file", Buffer.from("6th file buffer"), {
        filename: "extra.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/maximum of 5 active attachments/i);
  });

  it("API-12: rejects downloading attachment belonging to another requester with 403 (BR-12)", async () => {
    // Requester B attempts to download Requester A's attachment
    const res = await request(app)
      .get(`/api/attachments/${activeAttachmentId}/download`)
      .set("x-requester-id", requesterB);

    expect(res.status).toBe(403);
  });

  it("downloads active attachment successfully with 200 OK", async () => {
    const res = await request(app)
      .get(`/api/attachments/${activeAttachmentId}/download`)
      .set("x-requester-id", requesterA);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("image/png");
    expect(res.headers["content-disposition"]).toContain("docker-request.png");
  });

  it("API-10: soft-removes attachment with valid reason (AC-12, BR-11)", async () => {
    const res = await request(app)
      .delete(`/api/attachments/${activeAttachmentId}`)
      .set("x-requester-id", requesterA)
      .send({ removalReason: "Uploaded outdated diagnostic report" });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(activeAttachmentId);
    expect(res.body.isRemoved).toBe(true);
    expect(res.body.removalReason).toBe("Uploaded outdated diagnostic report");
    expect(res.body.removedAt).toBeDefined();

    // Verify record in database is soft-removed but still exists (BR-11)
    const prisma = getPrisma();
    const dbRecord = await prisma.attachment.findUnique({
      where: { id: activeAttachmentId },
    });
    expect(dbRecord).not.toBeNull();
    expect(dbRecord?.isRemoved).toBe(true);
    expect(dbRecord?.removalReason).toBe("Uploaded outdated diagnostic report");
  });

  it("API-11: blocks downloading soft-removed attachment with 410 Gone (AC-12, BR-11)", async () => {
    const res = await request(app)
      .get(`/api/attachments/${activeAttachmentId}/download`)
      .set("x-requester-id", requesterA);

    expect(res.status).toBe(410);
    expect(res.body.statusCode).toBe(410);
    expect(res.body.error).toBe("Gone");
    expect(res.body.removalReason).toBe("Uploaded outdated diagnostic report");
  });

  it("rejects soft-removal with missing or too short reason (< 3 chars) with 400 Bad Request", async () => {
    const res = await request(app)
      .delete(`/api/attachments/${activeAttachmentId}`)
      .set("x-requester-id", requesterA)
      .send({ removalReason: "no" }); // 2 chars

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Removal reason is required and must be at least 3 characters/i);
  });
});
