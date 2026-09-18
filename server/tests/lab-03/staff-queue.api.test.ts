import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import bcrypt from "bcryptjs";
import { Role, Priority, TicketStatus } from "@prisma/client";

describe("Lab 3 Issue 4: IT Staff Ticket Queue (API-06, AC-05, FR-09, BR-07)", () => {
  let itStaffToken: string;
  let adminToken: string;
  let requesterToken: string;
  let itStaffId: number;

  beforeAll(async () => {
    const prisma = getPrisma();
    const hash = await bcrypt.hash("Password123!", 10);

    // Ensure IT Staff user
    const staff = await prisma.user.upsert({
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
    itStaffId = staff.id;

    // Ensure Admin user
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

    // Ensure Requester user
    await prisma.user.upsert({
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

    // Obtain tokens via /api/auth/login
    const staffLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "mbrown@toktickit.com", password: "Password123!" });
    itStaffToken = staffLogin.body.token;

    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@toktickit.com", password: "Password123!" });
    adminToken = adminLogin.body.token;

    const reqLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "janderson@toktickit.com", password: "Password123!" });
    requesterToken = reqLogin.body.token;
  });

  describe("Security & Role-Based Access Control", () => {
    it("rejects unauthenticated requests with 401 Unauthorized", async () => {
      const res = await request(app).get("/api/staff/tickets");
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("rejects Requester role with 403 Forbidden", async () => {
      const res = await request(app)
        .get("/api/staff/tickets")
        .set("Authorization", `Bearer ${requesterToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
      expect(res.body.error.message).toContain("ITStaff");
    });

    it("allows ITStaff role with 200 OK", async () => {
      const res = await request(app)
        .get("/api/staff/tickets")
        .set("Authorization", `Bearer ${itStaffToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("tickets");
      expect(res.body).toHaveProperty("pagination");
    });

    it("allows Administrator role with 200 OK", async () => {
      const res = await request(app)
        .get("/api/staff/tickets")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("tickets");
      expect(res.body).toHaveProperty("pagination");
    });
  });

  describe("Query Parameters, Filters & Pagination", () => {
    it("returns paginated queue with required data structure", async () => {
      const res = await request(app)
        .get("/api/staff/tickets?page=1&limit=5")
        .set("Authorization", `Bearer ${itStaffToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.tickets)).toBe(true);
      expect(res.body.pagination).toEqual(
        expect.objectContaining({
          page: 1,
          limit: 5,
          totalCount: expect.any(Number),
          totalPages: expect.any(Number),
        })
      );

      if (res.body.tickets.length > 0) {
        const ticket = res.body.tickets[0];
        expect(ticket).toHaveProperty("id");
        expect(ticket).toHaveProperty("ticketNumber");
        expect(ticket).toHaveProperty("summary");
        expect(ticket).toHaveProperty("requestedPriority");
        expect(ticket).toHaveProperty("itPriority");
        expect(ticket).toHaveProperty("status");
        expect(ticket).toHaveProperty("requester");
        expect(ticket.requester).toHaveProperty("fullName");
        expect(ticket).toHaveProperty("category");
        expect(ticket.category).toHaveProperty("name");
        expect(ticket).toHaveProperty("relatedSystem");
      }
    });

    it("filters tickets by search substring across ticketNumber or summary", async () => {
      const res = await request(app)
        .get("/api/staff/tickets?search=VPN")
        .set("Authorization", `Bearer ${itStaffToken}`);

      expect(res.status).toBe(200);
      for (const t of res.body.tickets) {
        const matches =
          t.ticketNumber.toLowerCase().includes("vpn") ||
          t.summary.toLowerCase().includes("vpn");
        expect(matches).toBe(true);
      }
    });

    it("filters tickets by status", async () => {
      const res = await request(app)
        .get(`/api/staff/tickets?status=${TicketStatus.InProgress}`)
        .set("Authorization", `Bearer ${itStaffToken}`);

      expect(res.status).toBe(200);
      for (const t of res.body.tickets) {
        expect(t.status).toBe(TicketStatus.InProgress);
      }
    });

    it("filters tickets by IT priority", async () => {
      const res = await request(app)
        .get(`/api/staff/tickets?itPriority=${Priority.High}`)
        .set("Authorization", `Bearer ${itStaffToken}`);

      expect(res.status).toBe(200);
      for (const t of res.body.tickets) {
        expect(t.itPriority).toBe(Priority.High);
      }
    });

    it("filters tickets by owner: unassigned", async () => {
      const res = await request(app)
        .get("/api/staff/tickets?ownerId=unassigned")
        .set("Authorization", `Bearer ${itStaffToken}`);

      expect(res.status).toBe(200);
      for (const t of res.body.tickets) {
        expect(t.owner).toBeNull();
      }
    });

    it("filters tickets by owner: assigned to me", async () => {
      const res = await request(app)
        .get("/api/staff/tickets?ownerId=me")
        .set("Authorization", `Bearer ${itStaffToken}`);

      expect(res.status).toBe(200);
      for (const t of res.body.tickets) {
        expect(t.owner?.id).toBe(itStaffId);
      }
    });

    it("sorts tickets by ticketNumber in ascending order", async () => {
      const res = await request(app)
        .get("/api/staff/tickets?sortBy=ticketNumber&sortOrder=asc&limit=10")
        .set("Authorization", `Bearer ${itStaffToken}`);

      expect(res.status).toBe(200);
      const tickets = res.body.tickets;
      for (let i = 1; i < tickets.length; i++) {
        expect(tickets[i].ticketNumber >= tickets[i - 1].ticketNumber).toBe(true);
      }
    });

    it("rejects invalid page number with 400 Bad Request", async () => {
      const res = await request(app)
        .get("/api/staff/tickets?page=0")
        .set("Authorization", `Bearer ${itStaffToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("BAD_REQUEST");
    });
  });
});
