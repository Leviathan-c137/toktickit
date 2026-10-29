import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import bcrypt from "bcryptjs";
import { Role, Priority, TicketStatus } from "@prisma/client";

describe("Lab 4 Issue 2: Actions Taken Backend Foundation & REST APIs", () => {
  let itStaffToken1: string;
  let itStaffToken2: string;
  let requesterTokenA: string;
  let requesterTokenB: string;
  let ticketIdA: number;
  let ticketIdB: number;
  let staffUserId1: number;
  let staffUserId2: number;

  beforeAll(async () => {
    const prisma = getPrisma();
    const hash = await bcrypt.hash("Password123!", 10);

    // 1. Seed or find IT Staff 1 (Michael Brown)
    const staff1 = await prisma.user.upsert({
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
    staffUserId1 = staff1.id;

    // 2. Seed or find IT Staff 2 (Sarah Johnson)
    const staff2 = await prisma.user.upsert({
      where: { email: "sjohnson@toktickit.com" },
      update: { passwordHash: hash, isActive: true, role: Role.ITStaff, mustChangePassword: false },
      create: {
        fullName: "Sarah Johnson",
        email: "sjohnson@toktickit.com",
        passwordHash: hash,
        role: Role.ITStaff,
        isActive: true,
        mustChangePassword: false,
      },
    });
    staffUserId2 = staff2.id;

    // 3. Seed Requester A (Jennifer Anderson)
    const userA = await prisma.user.upsert({
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

    // 4. Seed Requester B (Prapatsorn Katip)
    const userB = await prisma.user.upsert({
      where: { email: "pkatip@toktickit.com" },
      update: { passwordHash: hash, isActive: true, role: Role.Requester, mustChangePassword: false },
      create: {
        fullName: "Prapatsorn Katip",
        email: "pkatip@toktickit.com",
        passwordHash: hash,
        role: Role.Requester,
        isActive: true,
        mustChangePassword: false,
      },
    });

    // Authenticate all users
    const loginResStaff1 = await request(app)
      .post("/api/auth/login")
      .send({ email: "mbrown@toktickit.com", password: "Password123!" });
    itStaffToken1 = loginResStaff1.body.token;

    const loginResStaff2 = await request(app)
      .post("/api/auth/login")
      .send({ email: "sjohnson@toktickit.com", password: "Password123!" });
    itStaffToken2 = loginResStaff2.body.token;

    const loginResA = await request(app)
      .post("/api/auth/login")
      .send({ email: "janderson@toktickit.com", password: "Password123!" });
    requesterTokenA = loginResA.body.token;

    const loginResB = await request(app)
      .post("/api/auth/login")
      .send({ email: "pkatip@toktickit.com", password: "Password123!" });
    requesterTokenB = loginResB.body.token;

    // Prepare tickets
    const cat = await prisma.category.findFirst();
    const sys = await prisma.relatedSystem.findFirst();

    // Ticket A owned by Jennifer Anderson
    let ticketA = await prisma.ticket.findFirst({ where: { requesterId: userA.id } });
    if (!ticketA) {
      ticketA = await prisma.ticket.create({
        data: {
          ticketNumber: "TKT-LAB4-TICKET-A",
          summary: "Test Ticket for Actions Taken A",
          description: "Detailed description for Actions Taken testing",
          requesterId: userA.id,
          ownerId: staff1.id,
          categoryId: cat!.id,
          relatedSystemId: sys!.id,
          status: TicketStatus.InProgress,
        },
      });
    }
    ticketIdA = ticketA.id;

    // Ticket B owned by Prapatsorn Katip
    let ticketB = await prisma.ticket.findFirst({ where: { requesterId: userB.id } });
    if (!ticketB) {
      ticketB = await prisma.ticket.create({
        data: {
          ticketNumber: "TKT-LAB4-TICKET-B",
          summary: "Test Ticket for Actions Taken B",
          description: "Detailed description for Actions Taken testing B",
          requesterId: userB.id,
          ownerId: staff2.id,
          categoryId: cat!.id,
          relatedSystemId: sys!.id,
          status: TicketStatus.Open,
        },
      });
    }
    ticketIdB = ticketB.id;
  });

  describe("API-01: POST /api/tickets/:id/actions (AC-01, FR-01, FR-03, BR-01, BR-02, BR-03)", () => {
    it("successfully creates an Action Taken record under a ticket by IT Staff", async () => {
      const payload = {
        actionDateTime: new Date("2026-10-29T10:00:00Z").toISOString(),
        description: "Replaced faulty Ethernet patch cable on desk switch port 3",
        result: "Link speed negotiated at 1000 Mbps Full Duplex without packet drops",
        followUpRequired: false,
        followUpNote: null,
        attachmentNotes: "switch_port_stats.png",
      };

      const res = await request(app)
        .post(`/api/tickets/${ticketIdA}/actions`)
        .set("Authorization", `Bearer ${itStaffToken1}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body.ticketId).toBe(ticketIdA);
      expect(res.body.description).toBe(payload.description);
      expect(res.body.result).toBe(payload.result);
      expect(res.body.followUpRequired).toBe(false);
      expect(res.body.attachmentNotes).toBe("switch_port_stats.png");
      expect(res.body.performedBy.id).toBe(staffUserId1);
      expect(res.body.performedBy.fullName).toBe("Michael Brown");
      expect(res.body.performedBy.role).toBe("ITStaff");
    });

    it("allows a second IT Staff member to record an action on the same ticket (BR-02 distributed actions)", async () => {
      const payload = {
        description: "Configured static IP reservation in DHCP server for new workstation",
        result: "IP assigned correctly and verified with ping test",
        followUpRequired: false,
      };

      const res = await request(app)
        .post(`/api/tickets/${ticketIdA}/actions`)
        .set("Authorization", `Bearer ${itStaffToken2}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.performedBy.id).toBe(staffUserId2);
      expect(res.body.performedBy.fullName).toBe("Sarah Johnson");
    });
  });

  describe("API-02: Follow-Up Validation Enforcement (AC-02, BR-04, FR-04)", () => {
    it("rejects action creation when followUpRequired is true but followUpNote is missing (400 Bad Request)", async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticketIdA}/actions`)
        .set("Authorization", `Bearer ${itStaffToken1}`)
        .send({
          description: "Applied temporary firmware hotfix to avoid system crash",
          result: "Machine operating on interim build",
          followUpRequired: true,
          followUpNote: "", // Missing mandatory follow-up note
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("BAD_REQUEST");
      expect(res.body.error.message).toContain("Follow-up note is required");
    });

    it("rejects action creation when followUpNote is shorter than 3 characters (400 Bad Request)", async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticketIdA}/actions`)
        .set("Authorization", `Bearer ${itStaffToken1}`)
        .send({
          description: "Applied temporary firmware hotfix to avoid system crash",
          result: "Machine operating on interim build",
          followUpRequired: true,
          followUpNote: "ok", // < 3 chars
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("BAD_REQUEST");
    });

    it("accepts action creation when followUpRequired is true and followUpNote is provided", async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticketIdA}/actions`)
        .set("Authorization", `Bearer ${itStaffToken1}`)
        .send({
          description: "Applied temporary firmware hotfix to avoid system crash",
          result: "Machine operating on interim build",
          followUpRequired: true,
          followUpNote: "Must deploy vendor official patch on Tuesday maintenance window",
        });

      expect(res.status).toBe(201);
      expect(res.body.followUpRequired).toBe(true);
      expect(res.body.followUpNote).toBe("Must deploy vendor official patch on Tuesday maintenance window");
    });
  });

  describe("API-03: Role Authorization & Data Isolation (AC-03, FR-05, FR-06, BR-03)", () => {
    it("forbids Requester from creating an Action Taken (403 Forbidden)", async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticketIdA}/actions`)
        .set("Authorization", `Bearer ${requesterTokenA}`)
        .send({
          description: "Attempted action by requester user",
          result: "Should be forbidden",
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("allows Requester to view Actions Taken for owned ticket (200 OK)", async () => {
      const res = await request(app)
        .get(`/api/tickets/${ticketIdA}/actions`)
        .set("Authorization", `Bearer ${requesterTokenA}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty("description");
      expect(res.body[0]).toHaveProperty("performedBy");
    });

    it("forbids Requester from viewing Actions Taken for another requester's ticket (403 Forbidden)", async () => {
      const res = await request(app)
        .get(`/api/tickets/${ticketIdB}/actions`) // Ticket B owned by user B
        .set("Authorization", `Bearer ${requesterTokenA}`); // User A attempting to view

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("forbids Requester from updating an Action Taken (403 Forbidden)", async () => {
      const getRes = await request(app)
        .get(`/api/tickets/${ticketIdA}/actions`)
        .set("Authorization", `Bearer ${itStaffToken1}`);
      const actionId = getRes.body[0].id;

      const res = await request(app)
        .patch(`/api/tickets/${ticketIdA}/actions/${actionId}`)
        .set("Authorization", `Bearer ${requesterTokenA}`)
        .send({ description: "Unauthorized edit attempt" });

      expect(res.status).toBe(403);
    });

    it("rejects unauthenticated requests (401 Unauthorized)", async () => {
      const res = await request(app).get(`/api/tickets/${ticketIdA}/actions`);
      expect(res.status).toBe(401);
    });
  });

  describe("API-04: Chronological Order & Multi-Performer Audit (AC-04, BR-05)", () => {
    it("returns actions in stable chronological order", async () => {
      const res = await request(app)
        .get(`/api/tickets/${ticketIdA}/actions`)
        .set("Authorization", `Bearer ${itStaffToken1}`);

      expect(res.status).toBe(200);
      const actions = res.body;
      expect(actions.length).toBeGreaterThanOrEqual(2);

      // Verify chronological ordering
      for (let i = 0; i < actions.length - 1; i++) {
        const timeA = new Date(actions[i].actionDateTime).getTime();
        const timeB = new Date(actions[i + 1].actionDateTime).getTime();
        expect(timeA).toBeLessThanOrEqual(timeB);
      }
    });
  });

  describe("API-07: Action Update & Concurrency Conflict Defense (AC-07, BR-08)", () => {
    it("successfully updates an existing Action Taken by IT Staff", async () => {
      const getRes = await request(app)
        .get(`/api/tickets/${ticketIdA}/actions`)
        .set("Authorization", `Bearer ${itStaffToken1}`);
      const action = getRes.body[0];

      const res = await request(app)
        .patch(`/api/tickets/${ticketIdA}/actions/${action.id}`)
        .set("Authorization", `Bearer ${itStaffToken1}`)
        .send({
          description: "Updated description after detailed cable testing",
          result: "Confirmed zero packet loss over 10,000 ICMP frames",
          expectedUpdatedAt: action.updatedAt,
        });

      expect(res.status).toBe(200);
      expect(res.body.description).toBe("Updated description after detailed cable testing");
      expect(res.body.result).toBe("Confirmed zero packet loss over 10,000 ICMP frames");
    });

    it("rejects stale update with 409 Conflict when expectedUpdatedAt mismatches", async () => {
      const getRes = await request(app)
        .get(`/api/tickets/${ticketIdA}/actions`)
        .set("Authorization", `Bearer ${itStaffToken1}`);
      const action = getRes.body[0];

      const staleTimestamp = new Date(Date.now() - 3600000).toISOString();

      const res = await request(app)
        .patch(`/api/tickets/${ticketIdA}/actions/${action.id}`)
        .set("Authorization", `Bearer ${itStaffToken1}`)
        .send({
          description: "Concurrent edit overwrite attempt",
          expectedUpdatedAt: staleTimestamp,
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("CONFLICT");
      expect(res.body.error.message).toContain("modified by another user");
    });

    it("returns 404 Not Found when updating a non-existent action", async () => {
      const res = await request(app)
        .patch(`/api/tickets/${ticketIdA}/actions/999999`)
        .set("Authorization", `Bearer ${itStaffToken1}`)
        .send({ description: "Does not exist" });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });
  });
});
