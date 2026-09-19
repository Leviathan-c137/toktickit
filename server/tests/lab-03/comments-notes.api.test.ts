import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import bcrypt from "bcryptjs";

describe("Lab 3 Issue 3: Public Comments & Resolution Indication API", () => {
  let requesterTokenA: string;
  let requesterTokenB: string;
  let ticketIdA: number;
  let ticketIdB: number;

  beforeAll(async () => {
    const prisma = getPrisma();
    const hash = await bcrypt.hash("Password123!", 10);

    // 1. User A (Jennifer Anderson)
    const userA = await prisma.user.upsert({
      where: { email: "janderson@toktickit.com" },
      update: { passwordHash: hash, isActive: true, role: "Requester" },
      create: {
        fullName: "Jennifer Anderson",
        email: "janderson@toktickit.com",
        passwordHash: hash,
        role: "Requester",
        isActive: true,
        mustChangePassword: false,
      },
    });

    // 2. User B (Prapatsorn Katip)
    const userB = await prisma.user.upsert({
      where: { email: "pkatip@toktickit.com" },
      update: { passwordHash: hash, isActive: true, role: "Requester" },
      create: {
        fullName: "Prapatsorn Katip",
        email: "pkatip@toktickit.com",
        passwordHash: hash,
        role: "Requester",
        isActive: true,
        mustChangePassword: false,
      },
    });

    // Login user A
    const loginResA = await request(app)
      .post("/api/auth/login")
      .send({ email: "janderson@toktickit.com", password: "Password123!" });
    requesterTokenA = loginResA.body.token;

    // Login user B
    const loginResB = await request(app)
      .post("/api/auth/login")
      .send({ email: "pkatip@toktickit.com", password: "Password123!" });
    requesterTokenB = loginResB.body.token;

    // Fetch or create ticket for user A
    let ticketA = await prisma.ticket.findFirst({ where: { requesterId: userA.id } });
    if (!ticketA) {
      const cat = await prisma.category.findFirst();
      const sys = await prisma.relatedSystem.findFirst();
      ticketA = await prisma.ticket.create({
        data: {
          ticketNumber: "TKT-2026-TEST01",
          summary: "Test Ticket A",
          description: "Description for test ticket A",
          requesterId: userA.id,
          categoryId: cat!.id,
          relatedSystemId: sys!.id,
        },
      });
    }
    ticketIdA = ticketA.id;

    // Fetch or create ticket for user B
    let ticketB = await prisma.ticket.findFirst({ where: { requesterId: userB.id } });
    if (!ticketB) {
      const cat = await prisma.category.findFirst();
      const sys = await prisma.relatedSystem.findFirst();
      ticketB = await prisma.ticket.create({
        data: {
          ticketNumber: "TKT-2026-TEST02",
          summary: "Test Ticket B",
          description: "Description for test ticket B",
          requesterId: userB.id,
          categoryId: cat!.id,
          relatedSystemId: sys!.id,
        },
      });
    }
    ticketIdB = ticketB.id;
  });

  describe("API-08: POST /api/tickets/:id/comments (AC-07, FR-07, BR-04)", () => {
    it("successfully creates a public comment on owned ticket", async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticketIdA}/comments`)
        .set("Authorization", `Bearer ${requesterTokenA}`)
        .send({ content: "This is a public comment from requester." });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("comment");
      expect(res.body.comment.content).toBe("This is a public comment from requester.");
      expect(res.body.comment.author.email).toBe("janderson@toktickit.com");
      expect(res.body.comment.author.role).toBe("Requester");
    });

    it("rejects empty or whitespace-only comment content (400 Bad Request)", async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticketIdA}/comments`)
        .set("Authorization", `Bearer ${requesterTokenA}`)
        .send({ content: "   " });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("BAD_REQUEST");
    });

    it("rejects comment on ticket owned by another requester (403 Forbidden)", async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticketIdB}/comments`)
        .set("Authorization", `Bearer ${requesterTokenA}`)
        .send({ content: "Trying to comment on another requester's ticket" });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });
  });

  describe("GET /api/tickets/:id/comments", () => {
    it("retrieves public comments list for owned ticket", async () => {
      const res = await request(app)
        .get(`/api/tickets/${ticketIdA}/comments`)
        .set("Authorization", `Bearer ${requesterTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("comments");
      expect(Array.isArray(res.body.comments)).toBe(true);
      expect(res.body.comments.length).toBeGreaterThanOrEqual(1);

      const comment = res.body.comments[0];
      expect(comment).toHaveProperty("id");
      expect(comment).toHaveProperty("content");
      expect(comment).toHaveProperty("author");
      expect(comment.author).toHaveProperty("fullName");
      expect(comment.author).toHaveProperty("role");
    });

    it("rejects retrieval of comments for ticket owned by another requester (403 Forbidden)", async () => {
      const res = await request(app)
        .get(`/api/tickets/${ticketIdB}/comments`)
        .set("Authorization", `Bearer ${requesterTokenA}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });
  });

  describe("POST /api/tickets/:id/resolve-indication (FR-06, BR-05)", () => {
    it("allows ticket owner to record problem resolved indication", async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticketIdA}/resolve-indication`)
        .set("Authorization", `Bearer ${requesterTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("Resolution indication recorded");

      // Verify a public comment was added indicating requester resolution
      const commentsRes = await request(app)
        .get(`/api/tickets/${ticketIdA}/comments`)
        .set("Authorization", `Bearer ${requesterTokenA}`);

      const contents = commentsRes.body.comments.map((c: any) => c.content);
      expect(contents.some((c: string) => c.includes("Resolution Indication"))).toBe(true);
    });

    it("rejects resolve indication from another requester (403 Forbidden)", async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticketIdB}/resolve-indication`)
        .set("Authorization", `Bearer ${requesterTokenA}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });
  });
});
