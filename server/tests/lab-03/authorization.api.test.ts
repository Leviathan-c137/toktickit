import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import bcrypt from "bcryptjs";

describe("Lab 3 Issue 3: Authorization & Requester Ownership Isolation", () => {
  let requesterTokenA: string;
  let requesterTokenB: string;
  let userAId: number;
  let userBId: number;
  let ticketIdB: number;

  beforeAll(async () => {
    const prisma = getPrisma();
    const hash = await bcrypt.hash("Password123!", 10);

    // User A
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
    userAId = userA.id;

    // User B
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
    userBId = userB.id;

    // Login A
    const resA = await request(app)
      .post("/api/auth/login")
      .send({ email: "janderson@toktickit.com", password: "Password123!" });
    requesterTokenA = resA.body.token;

    // Login B
    const resB = await request(app)
      .post("/api/auth/login")
      .send({ email: "pkatip@toktickit.com", password: "Password123!" });
    requesterTokenB = resB.body.token;

    // Ticket belonging to User B
    const cat = await prisma.category.findFirst();
    const sys = await prisma.relatedSystem.findFirst();
    let ticketB = await prisma.ticket.findFirst({ where: { requesterId: userBId } });
    if (!ticketB) {
      ticketB = await prisma.ticket.create({
        data: {
          ticketNumber: "TKT-2026-ISOLATION01",
          summary: "Isolation Test Ticket for User B",
          description: "Confidential ticket description for User B",
          requesterId: userBId,
          categoryId: cat!.id,
          relatedSystemId: sys!.id,
        },
      });
    }
    ticketIdB = ticketB.id;
  });

  describe("API-04: Requester Data Isolation (AC-03, FR-05, BR-03)", () => {
    it("GET /api/tickets returns strictly tickets belonging to authenticated requester", async () => {
      const res = await request(app)
        .get("/api/tickets")
        .set("Authorization", `Bearer ${requesterTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("items");

      // Verify no tickets in the list belong to User B
      const ids = res.body.items.map((t: any) => t.id);
      expect(ids).not.toContain(ticketIdB);
    });

    it("GET /api/tickets/:id rejects access to another requester's ticket with 403 Forbidden", async () => {
      const res = await request(app)
        .get(`/api/tickets/${ticketIdB}`)
        .set("Authorization", `Bearer ${requesterTokenA}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Forbidden");
    });
  });
});
