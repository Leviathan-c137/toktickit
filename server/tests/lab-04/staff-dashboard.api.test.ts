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

    // Clean up any previous test tickets created by staff-dashboard suite
    await prisma.ticket.deleteMany({
      where: {
        OR: [
          { ownerId: itStaffUser.id },
          { ticketNumber: { startsWith: "TKT-STAFFDASH-" } },
        ],
      },
    });

    const cat = await prisma.category.findFirst();
    const sys = await prisma.relatedSystem.findFirst();
    const reqUser = await prisma.user.findFirst({ where: { email: "dash.requester@toktickit.com" } });
    const now = Date.now();

    // Seed known set of tickets:
    // 1. New ticket, unassigned
    const tNew = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-STAFFDASH-NEW-${now}`,
        summary: "Staff Dash New Ticket",
        description: "Deterministic test new ticket",
        requestedPriority: Priority.Medium,
        itPriority: Priority.Medium,
        status: TicketStatus.New,
        requesterId: reqUser!.id,
        ownerId: null,
        categoryId: cat!.id,
        relatedSystemId: sys!.id,
      },
    });
    createdTicketIds.push(tNew.id);

    // 2. Open ticket, unassigned
    const tOpen = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-STAFFDASH-OPEN-${now}`,
        summary: "Staff Dash Open Ticket",
        description: "Deterministic test open ticket",
        requestedPriority: Priority.High,
        itPriority: Priority.High,
        status: TicketStatus.Open,
        requesterId: reqUser!.id,
        ownerId: null,
        categoryId: cat!.id,
        relatedSystemId: sys!.id,
      },
    });
    createdTicketIds.push(tOpen.id);

    // 3. Reopened ticket, assigned to staff
    const tReopen = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-STAFFDASH-REO-${now}`,
        summary: "Staff Dash Reopened Ticket",
        description: "Deterministic test reopened ticket",
        requestedPriority: Priority.Urgent,
        itPriority: Priority.Urgent,
        status: TicketStatus.Reopened,
        requesterId: reqUser!.id,
        ownerId: itStaffUser.id,
        categoryId: cat!.id,
        relatedSystemId: sys!.id,
      },
    });
    createdTicketIds.push(tReopen.id);

    // 4. InProgress ticket, assigned to staff
    const tInp = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-STAFFDASH-INP-${now}`,
        summary: "Staff Dash InProgress Ticket",
        description: "Deterministic test inprogress ticket",
        requestedPriority: Priority.High,
        itPriority: Priority.High,
        status: TicketStatus.InProgress,
        requesterId: reqUser!.id,
        ownerId: itStaffUser.id,
        categoryId: cat!.id,
        relatedSystemId: sys!.id,
      },
    });
    createdTicketIds.push(tInp.id);

    // 5. WaitingForRequester ticket, assigned to staff
    const tWait = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-STAFFDASH-WAIT-${now}`,
        summary: "Staff Dash Waiting Ticket",
        description: "Deterministic test waiting ticket",
        requestedPriority: Priority.Low,
        itPriority: Priority.Low,
        status: TicketStatus.WaitingForRequester,
        requesterId: reqUser!.id,
        ownerId: itStaffUser.id,
        categoryId: cat!.id,
        relatedSystemId: sys!.id,
      },
    });
    createdTicketIds.push(tWait.id);

    // 6. Pending ticket, unassigned
    const tPend = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-STAFFDASH-PEND-${now}`,
        summary: "Staff Dash Pending Ticket",
        description: "Deterministic test pending ticket",
        requestedPriority: Priority.Medium,
        itPriority: Priority.Medium,
        status: TicketStatus.Pending,
        requesterId: reqUser!.id,
        ownerId: null,
        categoryId: cat!.id,
        relatedSystemId: sys!.id,
      },
    });
    createdTicketIds.push(tPend.id);

    // 7. Closed ticket, assigned to staff (must NOT be counted in myAssignedTickets!)
    const tClosed = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-STAFFDASH-CLO-${now}`,
        summary: "Staff Dash Closed Ticket",
        description: "Deterministic test closed ticket",
        requestedPriority: Priority.Low,
        itPriority: Priority.Low,
        status: TicketStatus.Closed,
        requesterId: reqUser!.id,
        ownerId: itStaffUser.id,
        categoryId: cat!.id,
        relatedSystemId: sys!.id,
      },
    });
    createdTicketIds.push(tClosed.id);

    // 8. Cancelled ticket, assigned to staff (must NOT be counted in myAssignedTickets!)
    const tCancelled = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-STAFFDASH-CAN-${now}`,
        summary: "Staff Dash Cancelled Ticket",
        description: "Deterministic test cancelled ticket",
        requestedPriority: Priority.Low,
        itPriority: Priority.Low,
        status: TicketStatus.Cancelled,
        requesterId: reqUser!.id,
        ownerId: itStaffUser.id,
        categoryId: cat!.id,
        relatedSystemId: sys!.id,
      },
    });
    createdTicketIds.push(tCancelled.id);
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
    it("returns authoritative metrics verifying exact counts for known tickets and excludes inactive assigned (AC-09, BR-10)", async () => {
      const prisma = getPrisma();
      const res = await request(app)
        .get("/api/staff/dashboard")
        .set("Authorization", `Bearer ${itStaffToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("metrics");
      expect(res.body).toHaveProperty("recentTickets");

      const { metrics } = res.body;

      // itStaffUser has 3 active assigned tickets (Reopened, InProgress, WaitingForRequester)
      // and 2 inactive assigned tickets (Closed, Cancelled).
      // AC-10 / BR-10: myAssignedTickets must count ONLY active tickets!
      expect(metrics.myAssignedTickets).toBe(3);

      // Verify exact metrics match authoritative database counts
      const [dbNew, dbOpen, dbInProgress, dbWaiting, dbUnassigned] = await Promise.all([
        prisma.ticket.count({ where: { status: TicketStatus.New } }),
        prisma.ticket.count({ where: { status: { in: [TicketStatus.Open, TicketStatus.Reopened] } } }),
        prisma.ticket.count({ where: { status: TicketStatus.InProgress } }),
        prisma.ticket.count({
          where: { status: { in: [TicketStatus.WaitingForRequester, TicketStatus.Pending] } },
        }),
        prisma.ticket.count({ where: { ownerId: null } }),
      ]);

      expect(metrics.newTickets).toBe(dbNew);
      expect(metrics.openTickets).toBe(dbOpen);
      expect(metrics.inProgressTickets).toBe(dbInProgress);
      expect(metrics.waitingForRequesterTickets).toBe(dbWaiting);
      expect(metrics.unassignedTickets).toBe(dbUnassigned);

      // Verify expected minimums from seeded known tickets
      expect(metrics.newTickets).toBeGreaterThanOrEqual(1);
      expect(metrics.openTickets).toBeGreaterThanOrEqual(2); // 1 Open + 1 Reopened
      expect(metrics.inProgressTickets).toBeGreaterThanOrEqual(1);
      expect(metrics.waitingForRequesterTickets).toBeGreaterThanOrEqual(2); // 1 Waiting + 1 Pending
      expect(metrics.unassignedTickets).toBeGreaterThanOrEqual(3); // New + Open + Pending
    });

    it("verifies user isolation for myAssignedTickets and recent tickets schema", async () => {
      // Query dashboard as adminUser who has 0 assigned tickets
      const adminRes = await request(app)
        .get("/api/staff/dashboard")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(adminRes.status).toBe(200);
      expect(adminRes.body.metrics.myAssignedTickets).toBe(0);

      // Verify recentTickets includes tickets sorted by updatedAt desc
      expect(Array.isArray(adminRes.body.recentTickets)).toBe(true);
      const recent = adminRes.body.recentTickets;
      expect(recent.length).toBeLessThanOrEqual(5);

      if (recent.length > 0) {
        const first = recent[0];
        expect(first).toHaveProperty("id");
        expect(first).toHaveProperty("ticketNumber");
        expect(first).toHaveProperty("summary");
        expect(first).toHaveProperty("status");
        expect(first).toHaveProperty("itPriority");
        expect(first).toHaveProperty("requester");
        expect(first.requester).toHaveProperty("fullName");
        expect(first).toHaveProperty("updatedAt");

        for (let i = 0; i < recent.length - 1; i++) {
          const t1 = new Date(recent[i].updatedAt).getTime();
          const t2 = new Date(recent[i + 1].updatedAt).getTime();
          expect(t1).toBeGreaterThanOrEqual(t2);
        }
      }
    });
  });
});
