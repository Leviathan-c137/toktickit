import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app, ALLOWED_STATUS_TRANSITIONS } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import bcrypt from "bcryptjs";
import { Role, Priority, TicketStatus } from "@prisma/client";

describe("Lab 4 Issue 4: Ticket Workflow, Permitted Status Transitions, and Resolution Gate (API-05, API-06, API-07)", () => {
  let itStaffToken: string;
  let adminToken: string;
  let requesterToken: string;
  let ticketId: number;
  let requesterUserId: number;
  let staffUserId: number;

  const getExpectedUpdatedAt = async (id: number): Promise<string> => {
    const prisma = getPrisma();
    const t = await prisma.ticket.findUnique({ where: { id } });
    return t!.updatedAt.toISOString();
  };

  beforeAll(async () => {
    const prisma = getPrisma();
    const hash = await bcrypt.hash("Password123!", 10);

    // 1. Seed or find IT Staff
    const staff = await prisma.user.upsert({
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
    staffUserId = staff.id;

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
  // Transition Matrix Export Verification (BR-06)
  // ---------------------------------------------------------------------------
  describe("ALLOWED_STATUS_TRANSITIONS Export (BR-06)", () => {
    it("exports permitted transitions mapping strictly adhering to BR-06", () => {
      expect(ALLOWED_STATUS_TRANSITIONS).toBeDefined();
      expect(ALLOWED_STATUS_TRANSITIONS[TicketStatus.New]).toEqual([TicketStatus.Open, TicketStatus.Cancelled]);
      expect(ALLOWED_STATUS_TRANSITIONS[TicketStatus.Open]).toEqual([
        TicketStatus.InProgress,
        TicketStatus.WaitingForRequester,
        TicketStatus.Resolved,
        TicketStatus.Cancelled,
      ]);
      expect(ALLOWED_STATUS_TRANSITIONS[TicketStatus.InProgress]).toEqual([
        TicketStatus.WaitingForRequester,
        TicketStatus.Resolved,
        TicketStatus.Cancelled,
      ]);
      expect(ALLOWED_STATUS_TRANSITIONS[TicketStatus.WaitingForRequester]).toEqual([
        TicketStatus.InProgress,
        TicketStatus.Resolved,
        TicketStatus.Cancelled,
      ]);
      expect(ALLOWED_STATUS_TRANSITIONS[TicketStatus.Resolved]).toEqual([TicketStatus.Closed, TicketStatus.Reopened]);
      expect(ALLOWED_STATUS_TRANSITIONS[TicketStatus.Closed]).toEqual([TicketStatus.Reopened]);
      expect(ALLOWED_STATUS_TRANSITIONS[TicketStatus.Reopened]).toEqual([
        TicketStatus.InProgress,
        TicketStatus.WaitingForRequester,
        TicketStatus.Resolved,
        TicketStatus.Cancelled,
      ]);
      expect(ALLOWED_STATUS_TRANSITIONS[TicketStatus.Cancelled]).toEqual([]);
      expect(ALLOWED_STATUS_TRANSITIONS[TicketStatus.Pending]).toEqual([
        TicketStatus.InProgress,
        TicketStatus.WaitingForRequester,
        TicketStatus.Resolved,
        TicketStatus.Cancelled,
      ]);
    });
  });

  // ---------------------------------------------------------------------------
  // API-05: Status Transition State Machine Rules (AC-05, BR-06, FR-07)
  // ---------------------------------------------------------------------------
  describe("API-05: State Machine Permitted and Forbidden Transitions (AC-05, BR-06, FR-07)", () => {
    it("rejects illegal direct transition: New -> Resolved with 400 Bad Request", async () => {
      const expectedUpdatedAt = await getExpectedUpdatedAt(ticketId);
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ status: TicketStatus.Resolved, expectedUpdatedAt });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_STATUS_TRANSITION");
      expect(res.body.error.message).toContain("Cannot transition status from New to Resolved");
    });

    it("rejects illegal direct transition: New -> Closed with 400 Bad Request", async () => {
      const expectedUpdatedAt = await getExpectedUpdatedAt(ticketId);
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ status: TicketStatus.Closed, expectedUpdatedAt });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_STATUS_TRANSITION");
    });

    it("rejects illegal direct transition: New -> InProgress with 400 Bad Request (BR-06)", async () => {
      const expectedUpdatedAt = await getExpectedUpdatedAt(ticketId);
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ status: TicketStatus.InProgress, expectedUpdatedAt });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_STATUS_TRANSITION");
      expect(res.body.error.message).toContain("Cannot transition status from New to InProgress");
    });

    it("allows valid status transition: New -> Open", async () => {
      const expectedUpdatedAt = await getExpectedUpdatedAt(ticketId);
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ status: TicketStatus.Open, expectedUpdatedAt });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(TicketStatus.Open);
      expect(res.body).toHaveProperty("updatedAt");
    });

    it("allows valid status transition: Open -> InProgress", async () => {
      const expectedUpdatedAt = await getExpectedUpdatedAt(ticketId);
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ status: TicketStatus.InProgress, expectedUpdatedAt });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(TicketStatus.InProgress);
    });

    it("allows valid status transition: InProgress -> WaitingForRequester", async () => {
      const expectedUpdatedAt = await getExpectedUpdatedAt(ticketId);
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ status: TicketStatus.WaitingForRequester, expectedUpdatedAt });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(TicketStatus.WaitingForRequester);
    });

    it("allows valid status transition: WaitingForRequester -> InProgress", async () => {
      const expectedUpdatedAt = await getExpectedUpdatedAt(ticketId);
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ status: TicketStatus.InProgress, expectedUpdatedAt });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(TicketStatus.InProgress);
    });

    it("blocks transition InProgress -> Resolved when no Action Taken exists (BR-07 Resolution Gate)", async () => {
      const expectedUpdatedAt = await getExpectedUpdatedAt(ticketId);
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ status: TicketStatus.Resolved, expectedUpdatedAt });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("RESOLUTION_GATE_VIOLATION");
      expect(res.body.error.message).toContain("Action Taken");
    });

    it("allows valid status transition: InProgress -> Resolved once Action Taken is recorded", async () => {
      const prisma = getPrisma();
      await prisma.actionTaken.create({
        data: {
          ticketId,
          performedById: staffUserId,
          actionDateTime: new Date(),
          description: "Diagnosed issue and replaced motherboard capacitor",
          result: "Voltages restored to factory specifications",
        },
      });

      const expectedUpdatedAt = await getExpectedUpdatedAt(ticketId);
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ status: TicketStatus.Resolved, expectedUpdatedAt });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(TicketStatus.Resolved);
    });

    it("rejects illegal direct transition: Resolved -> InProgress with 400 Bad Request", async () => {
      const expectedUpdatedAt = await getExpectedUpdatedAt(ticketId);
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ status: TicketStatus.InProgress, expectedUpdatedAt });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_STATUS_TRANSITION");
    });

    it("allows valid status transition: Resolved -> Reopened", async () => {
      const expectedUpdatedAt = await getExpectedUpdatedAt(ticketId);
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ status: TicketStatus.Reopened, expectedUpdatedAt });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(TicketStatus.Reopened);
    });

    it("rejects illegal direct transition: Reopened -> Closed with 400 Bad Request", async () => {
      const expectedUpdatedAt = await getExpectedUpdatedAt(ticketId);
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ status: TicketStatus.Closed, expectedUpdatedAt });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_STATUS_TRANSITION");
    });

    it("allows valid status transition: Reopened -> InProgress -> Resolved -> Closed", async () => {
      // Reopened -> InProgress
      const res1 = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ status: TicketStatus.InProgress, expectedUpdatedAt: await getExpectedUpdatedAt(ticketId) });
      expect(res1.status).toBe(200);

      // InProgress -> Resolved (ActionTaken already exists from previous test)
      const res2 = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ status: TicketStatus.Resolved, expectedUpdatedAt: await getExpectedUpdatedAt(ticketId) });
      expect(res2.status).toBe(200);

      // Resolved -> Closed
      const res3 = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ status: TicketStatus.Closed, expectedUpdatedAt: await getExpectedUpdatedAt(ticketId) });
      expect(res3.status).toBe(200);
      expect(res3.body.status).toBe(TicketStatus.Closed);
    });

    it("allows Closed -> Reopened -> Cancelled and enforces Cancelled as terminal state", async () => {
      // Closed -> Reopened
      const resReopen = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ status: TicketStatus.Reopened, expectedUpdatedAt: await getExpectedUpdatedAt(ticketId) });
      expect(resReopen.status).toBe(200);

      // Reopened -> Cancelled
      const resCancel = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ status: TicketStatus.Cancelled, expectedUpdatedAt: await getExpectedUpdatedAt(ticketId) });
      expect(resCancel.status).toBe(200);
      expect(resCancel.body.status).toBe(TicketStatus.Cancelled);

      // Cancelled is terminal: cannot transition to any other state
      const resAfterCancel = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ status: TicketStatus.Open, expectedUpdatedAt: await getExpectedUpdatedAt(ticketId) });
      expect(resAfterCancel.status).toBe(400);
      expect(resAfterCancel.body.error.code).toBe("INVALID_STATUS_TRANSITION");
    });

    it("allows valid status transition from legacy Pending status: Pending -> InProgress", async () => {
      const prisma = getPrisma();
      const cat = await prisma.category.findFirst();
      const sys = await prisma.relatedSystem.findFirst();
      const pendingTicket = await prisma.ticket.create({
        data: {
          ticketNumber: `TKT-PENDING-${Date.now()}`,
          summary: "Legacy Pending Status Transition Ticket",
          description: "Testing backwards compatibility transition from Pending",
          requestedPriority: Priority.Low,
          itPriority: Priority.Low,
          status: TicketStatus.Pending,
          requesterId: requesterUserId,
          categoryId: cat!.id,
          relatedSystemId: sys!.id,
        },
      });

      const res = await request(app)
        .patch(`/api/staff/tickets/${pendingTicket.id}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({
          status: TicketStatus.InProgress,
          expectedUpdatedAt: pendingTicket.updatedAt.toISOString(),
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(TicketStatus.InProgress);
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
        .send({ status: TicketStatus.Resolved, expectedUpdatedAt: await getExpectedUpdatedAt(freshTicketId) });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("strictly blocks unauthenticated requests from modifying status (401 Unauthorized)", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${freshTicketId}/status`)
        .send({ status: TicketStatus.Resolved, expectedUpdatedAt: new Date().toISOString() });

      expect(res.status).toBe(401);
    });

    it("rejects transition to Resolved without any Action Taken (400 RESOLUTION_GATE_VIOLATION)", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${freshTicketId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: TicketStatus.Resolved, expectedUpdatedAt: await getExpectedUpdatedAt(freshTicketId) });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("RESOLUTION_GATE_VIOLATION");
    });

    it("allows Administrator to formally transition ticket to Resolved once Action Taken is recorded (200 OK)", async () => {
      const prisma = getPrisma();
      await prisma.actionTaken.create({
        data: {
          ticketId: freshTicketId,
          performedById: staffUserId,
          actionDateTime: new Date(),
          description: "Applied security patch and rebooted server cluster",
          result: "Services restored with 100% availability",
        },
      });

      const res = await request(app)
        .patch(`/api/staff/tickets/${freshTicketId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: TicketStatus.Resolved, expectedUpdatedAt: await getExpectedUpdatedAt(freshTicketId) });

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

    it("rejects status update with 400 Bad Request when expectedUpdatedAt is missing (BR-08)", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${concurTicketId}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ status: TicketStatus.InProgress });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("BAD_REQUEST");
      expect(res.body.error.message).toContain("expectedUpdatedAt concurrency token is required");
    });

    it("rejects status update with 400 Bad Request when expectedUpdatedAt is invalid format", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${concurTicketId}/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({ status: TicketStatus.InProgress, expectedUpdatedAt: "invalid-iso-date" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("BAD_REQUEST");
      expect(res.body.error.message).toContain("must be an ISO date string");
    });

    it("successfully updates status when expectedUpdatedAt matches database timestamp", async () => {
      const current = await getPrisma().ticket.findUnique({ where: { id: concurTicketId } });

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

    it("handles simultaneous concurrent status updates on the same ticket (atomic race defense)", async () => {
      const prisma = getPrisma();
      const cat = await prisma.category.findFirst();
      const sys = await prisma.relatedSystem.findFirst();

      const raceTicket = await prisma.ticket.create({
        data: {
          ticketNumber: `TKT-RACE-${Date.now()}`,
          summary: "Simultaneous Status Update Race Test",
          description: "Two staff members attempting status transition simultaneously",
          requestedPriority: Priority.High,
          itPriority: Priority.High,
          status: TicketStatus.Open,
          requesterId: requesterUserId,
          categoryId: cat!.id,
          relatedSystemId: sys!.id,
        },
      });

      const initialUpdatedAt = raceTicket.updatedAt.toISOString();

      // Fire both requests concurrently with the identical token
      const [res1, res2] = await Promise.all([
        request(app)
          .patch(`/api/staff/tickets/${raceTicket.id}/status`)
          .set("Authorization", `Bearer ${itStaffToken}`)
          .send({ status: TicketStatus.InProgress, expectedUpdatedAt: initialUpdatedAt }),
        request(app)
          .patch(`/api/staff/tickets/${raceTicket.id}/status`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ status: TicketStatus.Cancelled, expectedUpdatedAt: initialUpdatedAt }),
      ]);

      const statuses = [res1.status, res2.status].sort();
      expect(statuses).toEqual([200, 409]);

      const conflictRes = res1.status === 409 ? res1 : res2;
      expect(conflictRes.body.error.code).toBe("CONFLICT");
    });

    it("returns 404 Not Found when updating status of non-existent ticket", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/999999/status`)
        .set("Authorization", `Bearer ${itStaffToken}`)
        .send({
          status: TicketStatus.InProgress,
          expectedUpdatedAt: new Date().toISOString(),
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });
  });
});
