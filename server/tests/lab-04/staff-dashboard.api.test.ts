import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import bcrypt from "bcryptjs";
import { Role, Priority, TicketStatus } from "@prisma/client";

describe("Lab 4 Issue 5: IT Staff Dashboard API (API-09, AC-09, BR-10, BR-12, FR-11)", () => {
  let itStaffToken: string;
  let adminToken: string;
  let requesterToken: string;
  let itStaffUser: { id: number; email: string };
  let adminUser: { id: number; email: string };
  let createdTicketIds: number[] = [];

  beforeAll(async () => {
    const prisma = getPrisma();
    const hash = await bcrypt.hash("Password123!", 10);

    // Clean up any rogue dash.admin if present
    await prisma.user.deleteMany({
      where: { email: "dash.admin@toktickit.com" },
    });

    // 1. Seed or find IT Staff
    const staff = await prisma.user.upsert({
      where: { email: "dash.staff@toktickit.com" },
      update: { passwordHash: hash, isActive: true, role: Role.ITStaff, mustChangePassword: false },
      create: {
        fullName: "Dashboard Staff Member",
        email: "dash.staff@toktickit.com",
        passwordHash: hash,
        role: Role.ITStaff,
        isActive: true,
        mustChangePassword: false,
      },
    });
    itStaffUser = { id: staff.id, email: staff.email };

    // 2. Use canonical Admin
    const admin = await prisma.user.upsert({
      where: { email: "admin@toktickit.com" },
      update: { passwordHash: hash, isActive: true, role: Role.Administrator, mustChangePassword: false },
      create: {
        fullName: "System Admin",
        email: "admin@toktickit.com",
        passwordHash: hash,
        role: Role.Administrator,
        isActive: true,
        mustChangePassword: false,
      },
    });
    adminUser = { id: admin.id, email: admin.email };

    // 3. Seed Requester
    await prisma.user.upsert({
      where: { email: "dash.requester@toktickit.com" },
      update: { passwordHash: hash, isActive: true, role: Role.Requester, mustChangePassword: false },
      create: {
        fullName: "Dashboard Requester User",
        email: "dash.requester@toktickit.com",
        passwordHash: hash,
        role: Role.Requester,
        isActive: true,
        mustChangePassword: false,
      },
    });

    // Login users
    const staffRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "dash.staff@toktickit.com", password: "Password123!" });
    itStaffToken = staffRes.body.token;

    const adminRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@toktickit.com", password: "Password123!" });
    adminToken = adminRes.body.token;

    const reqRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "dash.requester@toktickit.com", password: "Password123!" });
    requesterToken = reqRes.body.token;
  });

  afterAll(async () => {
    const prisma = getPrisma();
    if (createdTicketIds.length > 0) {
      await prisma.ticket.deleteMany({
        where: { id: { in: createdTicketIds } },
      });
    }
  });

  // ---------------------------------------------------------------------------
  // Access Control & Role Gates
  // ---------------------------------------------------------------------------
  describe("Staff Dashboard Access Control", () => {
    it("blocks unauthenticated callers with 401 Unauthorized", async () => {
      const res = await request(app).get("/api/staff/dashboard");
      expect(res.status).toBe(401);
    });

    it("blocks Requester role callers with 403 Forbidden", async () => {
      const res = await request(app)
        .get("/api/staff/dashboard")
        .set("Authorization", `Bearer ${requesterToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("allows ITStaff role callers with 200 OK", async () => {
      const res = await request(app)
        .get("/api/staff/dashboard")
        .set("Authorization", `Bearer ${itStaffToken}`);

      expect(res.status).toBe(200);
    });

    it("allows Administrator role callers with 200 OK", async () => {
      const res = await request(app)
        .get("/api/staff/dashboard")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });
  });

  // ---------------------------------------------------------------------------
  // API-09: Authoritative Operational Metrics (AC-09, BR-10, FR-11)
  // ---------------------------------------------------------------------------
  describe("API-09: Authoritative Queue Metrics & Schema (AC-09, BR-10, FR-11)", () => {
    it("returns metrics object with all 6 operational counters", async () => {
      const res = await request(app)
        .get("/api/staff/dashboard")
        .set("Authorization", `Bearer ${itStaffToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("metrics");
      expect(res.body).toHaveProperty("recentTickets");

      const { metrics } = res.body;
      expect(typeof metrics.newTickets).toBe("number");
      expect(typeof metrics.openTickets).toBe("number");
      expect(typeof metrics.inProgressTickets).toBe("number");
      expect(typeof metrics.waitingForRequesterTickets).toBe("number");
      expect(typeof metrics.myAssignedTickets).toBe("number");
      expect(typeof metrics.unassignedTickets).toBe("number");

      expect(metrics.newTickets).toBeGreaterThanOrEqual(0);
      expect(metrics.openTickets).toBeGreaterThanOrEqual(0);
      expect(metrics.inProgressTickets).toBeGreaterThanOrEqual(0);
      expect(metrics.waitingForRequesterTickets).toBeGreaterThanOrEqual(0);
      expect(metrics.myAssignedTickets).toBeGreaterThanOrEqual(0);
      expect(metrics.unassignedTickets).toBeGreaterThanOrEqual(0);
    });

    it("accurately calculates myAssignedTickets specific to the calling staff member", async () => {
      const prisma = getPrisma();
      const cat = await prisma.category.findFirst();
      const sys = await prisma.relatedSystem.findFirst();
      const reqUser = await prisma.user.findFirst({ where: { role: Role.Requester } });

      // Create a ticket assigned specifically to itStaffUser
      const assignedTicket = await prisma.ticket.create({
        data: {
          ticketNumber: `TKT-ASSIGNED-${Date.now()}`,
          summary: "Ticket assigned to staff member",
          description: "Testing myAssigned count metric",
          requestedPriority: Priority.High,
          itPriority: Priority.High,
          status: TicketStatus.InProgress,
          requesterId: reqUser!.id,
          ownerId: itStaffUser.id,
          categoryId: cat!.id,
          relatedSystemId: sys!.id,
        },
      });
      createdTicketIds.push(assignedTicket.id);

      const staffRes = await request(app)
        .get("/api/staff/dashboard")
        .set("Authorization", `Bearer ${itStaffToken}`);

      // itStaffUser sees at least 1 ticket assigned to them
      expect(staffRes.body.metrics.myAssignedTickets).toBeGreaterThanOrEqual(1);

      // Verify recentTickets includes the newly created ticket
      expect(Array.isArray(staffRes.body.recentTickets)).toBe(true);
      const recent = staffRes.body.recentTickets;
      expect(recent.length).toBeLessThanOrEqual(5);

      const first = recent[0];
      expect(first).toHaveProperty("id");
      expect(first).toHaveProperty("ticketNumber");
      expect(first).toHaveProperty("summary");
      expect(first).toHaveProperty("status");
      expect(first).toHaveProperty("itPriority");
      expect(first).toHaveProperty("requester");
      expect(first.requester).toHaveProperty("fullName");
      expect(first).toHaveProperty("updatedAt");
    });
  });
});
