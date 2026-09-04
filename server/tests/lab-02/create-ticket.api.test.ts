import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("Lab 2 Issue 3: Ticket Creation API (POST /api/tickets)", () => {
  const activeRequesterId = "1"; // Jennifer Anderson

  it("API-02: creates a valid ticket with an attachment (AC-03, FR-03)", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .set("x-requester-id", activeRequesterId)
      .field("categoryId", 2) // Hardware
      .field("relatedSystemId", 7) // Corporate Laptop
      .field("requestedPriority", "High")
      .field("summary", "Laptop keyboard keys not responding")
      .field(
        "description",
        "The spacebar and enter keys have completely stopped responding after the latest reboot."
      )
      .attach(
        "files",
        Buffer.from("dummy png content for testing"),
        { filename: "keyboard-photo.png", contentType: "image/png" }
      );

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.ticketNumber).toMatch(/^TKT-\d{4}-\d{6}$/);
    expect(res.body.status).toBe("New");
    expect(res.body.itPriority).toBe("Medium");
    expect(res.body.requestedPriority).toBe("High");
    expect(res.body.summary).toBe("Laptop keyboard keys not responding");
    expect(res.body.requester.id).toBe(1);
    expect(res.body.category.id).toBe(2);
    expect(res.body.relatedSystem.id).toBe(7);
    expect(res.body.attachments).toHaveLength(1);
    expect(res.body.attachments[0].originalName).toBe("keyboard-photo.png");
    expect(res.body.attachments[0].isRemoved).toBe(false);
  });

  it("API-03: rejects ticket creation with summary shorter than 5 chars (AC-04, BR-06)", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .set("x-requester-id", activeRequesterId)
      .field("categoryId", 1)
      .field("relatedSystemId", 1)
      .field("requestedPriority", "Medium")
      .field("summary", "Help") // Only 4 characters
      .field(
        "description",
        "This is a valid long description explaining the problem in detail."
      );

    expect(res.status).toBe(400);
    expect(res.body.statusCode).toBe(400);
    expect(res.body.message).toMatch(/summary must be between 5 and 150 characters/i);
  });

  it("API-04: rejects ticket creation with oversized attachment > 5 MB (AC-05, BR-10)", async () => {
    // 5.5 MB dummy buffer
    const oversizedBuffer = Buffer.alloc(5.5 * 1024 * 1024);

    const res = await request(app)
      .post("/api/tickets")
      .set("x-requester-id", activeRequesterId)
      .field("categoryId", 1)
      .field("relatedSystemId", 1)
      .field("requestedPriority", "Medium")
      .field("summary", "Valid ticket summary for oversized test")
      .field("description", "Valid ticket description for oversized test.")
      .attach(
        "files",
        oversizedBuffer,
        { filename: "large_file.pdf", contentType: "application/pdf" }
      );

    expect(res.status).toBe(413);
    expect(res.body.statusCode).toBe(413);
    expect(res.body.message).toMatch(/exceeds the maximum allowed limit of 5 MB/i);
  });

  it("rejects ticket creation with unsupported attachment file type (AC-05, BR-10)", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .set("x-requester-id", activeRequesterId)
      .field("categoryId", 1)
      .field("relatedSystemId", 1)
      .field("requestedPriority", "Medium")
      .field("summary", "Valid ticket summary with invalid file")
      .field("description", "Valid ticket description with invalid file.")
      .attach(
        "files",
        Buffer.from("malicious binary content"),
        { filename: "virus.exe", contentType: "application/x-msdownload" }
      );

    expect(res.status).toBe(415);
    expect(res.body.statusCode).toBe(415);
    expect(res.body.message).toMatch(/unsupported/i);
  });

  it("rejects ticket creation when x-requester-id header is missing (401)", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .field("categoryId", 1)
      .field("relatedSystemId", 1)
      .field("summary", "Valid summary here")
      .field("description", "Valid description here.");

    expect(res.status).toBe(401);
  });
});
