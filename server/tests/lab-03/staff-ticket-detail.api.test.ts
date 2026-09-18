import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import bcrypt from "bcryptjs";
import { Role, Priority, TicketStatus } from "@prisma/client";

describe("Lab 3 Issue 5: IT Staff Ticket Detail, Ownership & Internal Notes API (API-05, API-07, API-09, BR-07, BR-08, BR-09)", () => {
  let staffToken1: string;
  let staffToken2: string;
  let adminToken: string;
  let requesterToken: string;
  let staffUser1Id: number;
  let staffUser2Id: number;
  let requesterUserId: number;
  let inactiveStaffId: number;
  let ticketId: number;

  beforeAll(async () => {
    const prisma = getPrisma();
    const hash = await bcrypt.hash("Password123!", 10);

    // 1. Staff 1 (Michael Brown)
    const staff1 = await prisma.user.upsert({
      where: { email: "mbrown@toktickit.com" },
      update: { passwordHash: hash, isActive: true, role: Role.ITStaff, mustChangePassword: false },
      create: {
        fullName: "Michael Brown",
        email: "mbrown@toktickit.com",
        passwordHash: hash,
        role: Role.ITStaff,
        department: "IT Infrastructure",
        isActive: true,
        mustChangePassword: false,
      },
    });
    staffUser1Id = staff1.id;

    // 2. Staff 2 (Sarah Johnson)
    const staff2 = await prisma.user.upsert({
      where: { email: "sjohnson@toktickit.com" },
      update: { passwordHash: hash, isActive: true, role: Role.ITStaff, mustChangePassword: false },
      create: {
        fullName: "Sarah Johnson",
        email: "sjohnson@toktickit.com",
        passwordHash: hash,
        role: Role.ITStaff,
        department: "IT Operations",
        isActive: true,
        mustChangePassword: false,
      },
    });
    staffUser2Id = staff2.id;

    // 3. Admin (System Administrator)
    await prisma.user.upsert({
      where: { email: "admin@toktickit.com" },
      update: { passwordHash: hash, isActive: true, role: Role.Administrator, mustChangePassword: false },
      create: {
        fullName: "System Administrator",
        email: "admin@toktickit.com",
        passwordHash: hash,
        role: Role.Administrator,
        department: "Central IT",
        isActive: true,
        mustChangePassword: false,
      },
    });

    // 4. Requester (Jennifer Anderson)
    const reqUser = await prisma.user.upsert({
      where: { email: "janderson@toktickit.com" },
      update: { passwordHash: hash, isActive: true, role: Role.Requester, mustChangePassword: false },
      create: {
        fullName: "Jennifer Anderson",
        email: "janderson@toktickit.com",
        passwordHash: hash,
        role: Role.Requester,
        department: "Computer Engineering",
        isActive: true,
        mustChangePassword: false,
      },
    });
    requesterUserId = reqUser.id;

    // 5. Inactive Staff user
    const inactStaff = await prisma.user.upsert({
      where: { email: "inactive.staff@toktickit.com" },
      update: { passwordHash: hash, isActive: false, role: Role.ITStaff, mustChangePassword: true },
      create: {
        fullName: "Inactive IT Staff",
        email: "inactive.staff@toktickit.com",
        passwordHash: hash,
        role: Role.ITStaff,
        department: "IT Support",
        isActive: false,
        mustChangePassword: true,
      },
    });
    inactiveStaffId = inactStaff.id;

    // Login users
    const login1 = await request(app)
      .post("/api/auth/login")
      .send({ email: "mbrown@toktickit.com", password: "Password123!" });
    staffToken1 = login1.body.token;

    const login2 = await request(app)
      .post("/api/auth/login")
      .send({ email: "sjohnson@toktickit.com", password: "Password123!" });
    staffToken2 = login2.body.token;

    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@toktickit.com", password: "Password123!" });
    adminToken = adminLogin.body.token;

    const reqLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "janderson@toktickit.com", password: "Password123!" });
    requesterToken = reqLogin.body.token;

    // Create a fresh test ticket
    const cat = await prisma.category.findFirst();
    const sys = await prisma.relatedSystem.findFirst();
    await prisma.ticket.deleteMany({
      where: { ticketNumber: { startsWith: "TKT-2026-DETAIL" } },
    });
    const t = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-2026-DETAIL${Date.now().toString().slice(-6)}`,
        summary: "Staff Detail Test Ticket",
        description: "Testing staff ticket detail endpoints and workflows",
        requestedPriority: Priority.Medium,
        itPriority: Priority.Medium,
        status: TicketStatus.New,
        requesterId: requesterUserId,
        categoryId: cat!.id,
        relatedSystemId: sys!.id,
      },
    });
    ticketId = t.id;
  });

  describe("GET /api/staff/tickets/:id (FR-09, AC-05)", () => {
    it("returns 200 with full ticket details including notes and comments for staff", async () => {
      const res = await request(app)
        .get(`/api/staff/tickets/${ticketId}`)
        .set("Authorization", `Bearer ${staffToken1}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(ticketId);
      expect(res.body.ticketNumber).toMatch(/^TKT-2026-DETAIL/);
      expect(res.body).toHaveProperty("requester");
      expect(res.body).toHaveProperty("category");
      expect(res.body).toHaveProperty("relatedSystem");
      expect(res.body).toHaveProperty("attachments");
      expect(res.body).toHaveProperty("publicComments");
      expect(res.body).toHaveProperty("internalNotes");
    });

    it("rejects Requester role with 403 Forbidden", async () => {
      const res = await request(app)
        .get(`/api/staff/tickets/${ticketId}`)
        .set("Authorization", `Bearer ${requesterToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("returns 404 for nonexistent ticket ID", async () => {
      const res = await request(app)
        .get("/api/staff/tickets/999999")
        .set("Authorization", `Bearer ${staffToken1}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });
  });

  describe("API-07: PATCH /api/staff/tickets/:id/owner (AC-06, FR-10, BR-07)", () => {
    it("allows IT staff to claim unassigned ticket ownership", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/owner`)
        .set("Authorization", `Bearer ${staffToken1}`)
        .send({ ownerId: staffUser1Id });

      expect(res.status).toBe(200);
      expect(res.body.ticketId).toBe(ticketId);
      expect(res.body.owner.id).toBe(staffUser1Id);
      expect(res.body.owner.fullName).toBe("Michael Brown");
    });

    it("allows reassigning ticket owner to another IT staff", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/owner`)
        .set("Authorization", `Bearer ${staffToken1}`)
        .send({ ownerId: staffUser2Id });

      expect(res.status).toBe(200);
      expect(res.body.owner.id).toBe(staffUser2Id);
      expect(res.body.owner.fullName).toBe("Sarah Johnson");
    });

    it("rejects assigning ticket owner to a Requester user (BR-07)", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/owner`)
        .set("Authorization", `Bearer ${staffToken1}`)
        .send({ ownerId: requesterUserId });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_OWNER");
    });

    it("rejects assigning ticket owner to an inactive user (BR-07)", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/owner`)
        .set("Authorization", `Bearer ${staffToken1}`)
        .send({ ownerId: inactiveStaffId });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_OWNER");
    });

    it("rejects Requester role caller with 403 Forbidden", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/owner`)
        .set("Authorization", `Bearer ${requesterToken}`)
        .send({ ownerId: staffUser1Id });

      expect(res.status).toBe(403);
    });
  });

  describe("PATCH /api/staff/tickets/:id/priority (FR-11, BR-08)", () => {
    it("updates IT priority without altering requested priority (BR-08)", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/priority`)
        .set("Authorization", `Bearer ${staffToken1}`)
        .send({ itPriority: Priority.Urgent });

      expect(res.status).toBe(200);
      expect(res.body.itPriority).toBe(Priority.Urgent);

      // Verify requestedPriority remains unchanged
      const detailRes = await request(app)
        .get(`/api/staff/tickets/${ticketId}`)
        .set("Authorization", `Bearer ${staffToken1}`);

      expect(detailRes.body.requestedPriority).toBe(Priority.Medium);
      expect(detailRes.body.itPriority).toBe(Priority.Urgent);
    });

    it("rejects invalid IT priority value", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/priority`)
        .set("Authorization", `Bearer ${staffToken1}`)
        .send({ itPriority: "Extreme" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("BAD_REQUEST");
    });
  });

  describe("PATCH /api/staff/tickets/:id/status (FR-12, BR-09)", () => {
    it("allows valid status transition: New -> InProgress", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/status`)
        .set("Authorization", `Bearer ${staffToken1}`)
        .send({ status: TicketStatus.InProgress });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(TicketStatus.InProgress);
    });

    it("allows valid status transition: InProgress -> Resolved", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/status`)
        .set("Authorization", `Bearer ${staffToken1}`)
        .send({ status: TicketStatus.Resolved });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(TicketStatus.Resolved);
    });

    it("allows valid status transition: Resolved -> Closed", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/status`)
        .set("Authorization", `Bearer ${staffToken1}`)
        .send({ status: TicketStatus.Closed });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(TicketStatus.Closed);
    });

    it("allows valid status transition: Closed -> Reopened", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/status`)
        .set("Authorization", `Bearer ${staffToken1}`)
        .send({ status: TicketStatus.Reopened });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(TicketStatus.Reopened);
    });

    it("rejects invalid status transition: Reopened -> Closed directly (BR-09)", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/status`)
        .set("Authorization", `Bearer ${staffToken1}`)
        .send({ status: TicketStatus.Closed });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_STATUS_TRANSITION");
    });
  });

  describe("API-05 & API-09: Internal Notes APIs (FR-08, BR-05)", () => {
    it("allows IT staff to create a private internal note", async () => {
      const res = await request(app)
        .post(`/api/staff/tickets/${ticketId}/notes`)
        .set("Authorization", `Bearer ${staffToken1}`)
        .send({ content: "Internal diagnostic note: checking power rail resistance." });

      expect(res.status).toBe(201);
      expect(res.body.note.content).toBe("Internal diagnostic note: checking power rail resistance.");
      expect(res.body.note.author.fullName).toBe("Michael Brown");
      expect(res.body.note.author.role).toBe(Role.ITStaff);
    });

    it("allows IT staff to retrieve internal notes list", async () => {
      const res = await request(app)
        .get(`/api/staff/tickets/${ticketId}/notes`)
        .set("Authorization", `Bearer ${staffToken2}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.notes)).toBe(true);
      expect(res.body.notes.length).toBeGreaterThanOrEqual(1);
      expect(res.body.notes[0].content).toContain("Internal diagnostic note");
    });

    it("rejects empty internal note content with 400 Bad Request", async () => {
      const res = await request(app)
        .post(`/api/staff/tickets/${ticketId}/notes`)
        .set("Authorization", `Bearer ${staffToken1}`)
        .send({ content: "   " });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("BAD_REQUEST");
    });

    it("API-05: blocks Requester from reading internal notes with 403 Forbidden (BR-05)", async () => {
      const res = await request(app)
        .get(`/api/staff/tickets/${ticketId}/notes`)
        .set("Authorization", `Bearer ${requesterToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("API-05: blocks Requester from creating internal notes with 403 Forbidden (BR-05)", async () => {
      const res = await request(app)
        .post(`/api/staff/tickets/${ticketId}/notes`)
        .set("Authorization", `Bearer ${requesterToken}`)
        .send({ content: "Attempting to post internal note as requester" });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });
  });

  describe("GET /api/staff/users", () => {
    it("returns active IT staff and admin users for ticket assignment", async () => {
      const res = await request(app)
        .get("/api/staff/users")
        .set("Authorization", `Bearer ${staffToken1}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.users)).toBe(true);

      const roles = res.body.users.map((u: any) => u.role);
      expect(roles.every((r: string) => r === "ITStaff" || r === "Administrator")).toBe(true);

      // Verify inactive staff is excluded
      const ids = res.body.users.map((u: any) => u.id);
      expect(ids).not.toContain(inactiveStaffId);
    });
  });
});
