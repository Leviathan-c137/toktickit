import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import bcrypt from "bcryptjs";
import { Role, Priority, TicketStatus } from "@prisma/client";

describe("Lab 4 Issue 4: Ticket Workflow, Permitted Status Transitions, and Resolution Gate (API-05, API-06, API-07)", () => {
  let itStaffToken: string;
  let adminToken: string;
  let requesterToken: string;
  let ticketId: number;
  let requesterUserId: number;

  beforeAll(async () => {
    const prisma = getPrisma();
    const hash = await bcrypt.hash("Password123!", 10);

    // 1. Seed or find IT Staff
    await prisma.user.upsert({
      where: { email: "mbrown@toktickit.com" },
      update: { passwordHash: hash, isActive: true, role: Role.ITStaff, mustChangePassword: false },
      create: {
        fullName: "Michael Brown",
        email: "mbrown@toktickit.com",
        passwordHash: hash,
        role: Role.ITStaff,
        isActive: true,
        mustChangePassword: false,
      },
    });

    // 2. Seed or find Admin
    await prisma.user.upsert({
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

    // 3. Seed or find Requester
    const requester = await prisma.user.upsert({
      where: { email: "janderson@toktickit.com" },
      update: { passwordHash: hash, isActive: true, role: Role.Requester, mustChangePassword: false },
      create: {
        fullName: "Jennifer Anderson",
        email: "janderson@toktickit.com",
        passwordHash: hash,
        role: Role.Requester,
        isActive: true,
        mustChangePassword: false,
      },
    });
    requesterUserId = requester.id;

    // Login users to get session tokens
    const staffRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "mbrown@toktickit.com", password: "Password123!" });
    itStaffToken = staffRes.body.token;

    const adminRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@toktickit.com", password: "Password123!" });
    adminToken = adminRes.body.token;

    const reqRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "janderson@toktickit.com", password: "Password123!" });
    requesterToken = reqRes.body.token;

    // Get categories and systems
    const cat = await prisma.category.findFirst();
    const sys = await prisma.relatedSystem.findFirst();

    // Create a test ticket in 'New' status
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-TEST-WF-${Date.now()}`,
        summary: "Workflow State Transition Test Ticket",
        description: "Testing strict state machine transitions and resolution gates",
        requestedPriority: Priority.Medium,
        itPriority: Priority.Medium,
        status: TicketStatus.New,
        requesterId: requesterUserId,
        categoryId: cat!.id,
        relatedSystemId: sys!.id,
      },
    });
    ticketId = ticket.id;
  });

  // ---------------------------------------------------------------------------
  // API-05: Status Transition State Machine Rules (AC-05, BR-06, FR-07)
  // ---------------------------------------------------------------------------
  describe("API-05: State Machine Permitted and Forbidden Transitions (AC-05, BR-06, FR-07)", () => {
    it("rejects illegal direct transition: New -> Resolved with 400 Bad Request", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ status: TicketStatus.Resolved });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_STATUS_TRANSITION");
      expect(res.body.error.message).toContain("Cannot transition status from New to Resolved");
    });

    it("rejects illegal direct transition: New -> Closed with 400 Bad Request", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ status: TicketStatus.Closed });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_STATUS_TRANSITION");
    });

    it("allows valid status transition: New -> Open", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ status: TicketStatus.Open });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(TicketStatus.Open);
      expect(res.body).toHaveProperty("updatedAt");
    });

    it("allows valid status transition: Open -> InProgress", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ status: TicketStatus.InProgress });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(TicketStatus.InProgress);
    });

    it("allows valid status transition: InProgress -> WaitingForRequester", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ status: TicketStatus.WaitingForRequester });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(TicketStatus.WaitingForRequester);
    });

    it("allows valid status transition: WaitingForRequester -> InProgress", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ status: TicketStatus.InProgress });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(TicketStatus.InProgress);
    });

    it("allows valid status transition: InProgress -> Resolved", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ status: TicketStatus.Resolved });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(TicketStatus.Resolved);
    });

    it("rejects illegal direct transition: Resolved -> InProgress with 400 Bad Request", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ status: TicketStatus.InProgress });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_STATUS_TRANSITION");
    });

    it("allows valid status transition: Resolved -> Reopened", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ status: TicketStatus.Reopened });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(TicketStatus.Reopened);
    });

    it("rejects illegal direct transition: Reopened -> Closed with 400 Bad Request", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ status: TicketStatus.Closed });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_STATUS_TRANSITION");
    });

    it("allows valid status transition: Reopened -> InProgress -> Resolved -> Closed", async () => {
      // Reopened -> InProgress
      const res1 = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ status: TicketStatus.InProgress });
      expect(res1.status).toBe(200);

      // InProgress -> Resolved
      const res2 = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ status: TicketStatus.Resolved });
      expect(res2.status).toBe(200);

      // Resolved -> Closed
      const res3 = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ status: TicketStatus.Closed });
      expect(res3.status).toBe(200);
      expect(res3.body.status).toBe(TicketStatus.Closed);
    });

    it("allows Closed -> Reopened -> Cancelled and enforces Cancelled as terminal state", async () => {
      // Closed -> Reopened
      const resReopen = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ status: TicketStatus.Reopened });
      expect(resReopen.status).toBe(200);

      // Reopened -> Cancelled
      const resCancel = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ status: TicketStatus.Cancelled });
      expect(resCancel.status).toBe(200);
      expect(resCancel.body.status).toBe(TicketStatus.Cancelled);

      // Cancelled is terminal: cannot transition to any other state
      const resAfterCancel = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ status: TicketStatus.Open });
      expect(resAfterCancel.status).toBe(400);
      expect(resAfterCancel.body.error.code).toBe("INVALID_STATUS_TRANSITION");
    });
  });

  // ---------------------------------------------------------------------------
  // API-06: Resolution Gate Authorization (AC-06, BR-07, FR-08)
  // ---------------------------------------------------------------------------
  describe("API-06: Resolution Gate Authorization & Advisory Indication (AC-06, BR-07, FR-08)", () => {
    let freshTicketId: number;

    beforeAll(async () => {
      const prisma = getPrisma();
      const cat = await prisma.category.findFirst();
      const sys = await prisma.relatedSystem.findFirst();
      const t = await prisma.ticket.create({
        data: {
          ticketNumber: `TKT-GATE-${Date.now()}`,
          summary: "Resolution Gate Verification Ticket",
          description: "Verifying Requester role separation and advisory indicators",
          requestedPriority: Priority.High,
          itPriority: Priority.High,
          status: TicketStatus.InProgress,
          requesterId: requesterUserId,
          categoryId: cat!.id,
          relatedSystemId: sys!.id,
        },
      });
      freshTicketId = t.id;
    });

    it("strictly blocks Requester from calling PATCH /api/staff/tickets/:id/status (403 Forbidden)", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${freshTicketId}/status`)
        .set("Authorization", `Bearer ${requesterToken}`)
        .send({ status: TicketStatus.Resolved });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("strictly blocks unauthenticated requests from modifying status (401 Unauthorized)", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${freshTicketId}/status`)
        .send({ status: TicketStatus.Resolved });

      expect(res.status).toBe(401);
    });

    it("allows Administrator to formally transition ticket to Resolved (200 OK)", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${freshTicketId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: TicketStatus.Resolved });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(TicketStatus.Resolved);
    });

    it("verifies Requester advisory indication does NOT alter ticket status", async () => {
      const prisma = getPrisma();
      const cat = await prisma.category.findFirst();
      const sys = await prisma.relatedSystem.findFirst();
      const t = await prisma.ticket.create({
        data: {
          ticketNumber: `TKT-ADVISORY-${Date.now()}`,
          summary: "Advisory Indication Verification Ticket",
          description: "Verifying problem-resolved does not mutate status directly",
          requestedPriority: Priority.Medium,
          itPriority: Priority.Medium,
          status: TicketStatus.InProgress,
          requesterId: requesterUserId,
          categoryId: cat!.id,
          relatedSystemId: sys!.id,
        },
      });

      // Requester sends advisory indication
      const res = await request(app)
        .post(`/api/tickets/${t.id}/resolve-indication`)
        .set("Authorization", `Bearer ${requesterToken}`);

      expect(res.status).toBe(200);

      // Verify authoritative database status remains InProgress (NOT Resolved)
      const after = await prisma.ticket.findUnique({ where: { id: t.id } });
      expect(after?.status).toBe(TicketStatus.InProgress);
    });
  });

  // ---------------------------------------------------------------------------
  // API-07: Concurrency & Stale Update Conflict Handling (AC-07, BR-08, FR-09)
  // ---------------------------------------------------------------------------
  describe("API-07: Status Concurrency & Stale Update Defense (AC-07, BR-08, FR-09)", () => {
    let concurTicketId: number;

    beforeAll(async () => {
      const prisma = getPrisma();
      const cat = await prisma.category.findFirst();
      const sys = await prisma.relatedSystem.findFirst();
      const t = await prisma.ticket.create({
        data: {
          ticketNumber: `TKT-CONCUR-${Date.now()}`,
          summary: "Concurrency Status Transition Ticket",
          description: "Testing optimistic locking during status mutations",
          requestedPriority: Priority.Low,
          itPriority: Priority.Low,
          status: TicketStatus.Open,
          requesterId: requesterUserId,
          categoryId: cat!.id,
          relatedSystemId: sys!.id,
        },
      });
      concurTicketId = t.id;
    });

    it("successfully updates status when expectedUpdatedAt matches database timestamp", async () => {
      const prisma = getPrisma();
      const current = await prisma.ticket.findUnique({ where: { id: concurTicketId } });

      const res = await request(app)
        .patch(`/api/staff/tickets/${concurTicketId}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({
          status: TicketStatus.InProgress,
          expectedUpdatedAt: current!.updatedAt.toISOString(),
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(TicketStatus.InProgress);
    });

    it("rejects status update with 409 Conflict when expectedUpdatedAt is stale", async () => {
      const staleTimestamp = new Date(Date.now() - 7200000).toISOString(); // 2 hours ago

      const res = await request(app)
        .patch(`/api/staff/tickets/${concurTicketId}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({
          status: TicketStatus.WaitingForRequester,
          expectedUpdatedAt: staleTimestamp,
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("CONFLICT");
      expect(res.body.error.message).toContain("modified by another user");
    });

    it("returns 404 Not Found when updating status of non-existent ticket", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/999999/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ status: TicketStatus.InProgress });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });
  });
});
