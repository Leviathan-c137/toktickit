import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import bcrypt from "bcryptjs";
import { Role, Priority, TicketStatus } from "@prisma/client";

describe("Lab 4 Issue 5: Requester Dashboard API (API-08, API-10, AC-08, AC-11, BR-09, BR-10, BR-12, FR-10)", () => {
  let requester1: { id: number; email: string };
  let requester2: { id: number; email: string };
  let emptyRequester: { id: number; email: string };
  let requester1Token: string;
  let emptyRequesterToken: string;
  let requester2Token: string;

  beforeAll(async () => {
    const prisma = getPrisma();
    const hash = await bcrypt.hash("Password123!", 10);

    // 1. Create Requester 1
    const r1 = await prisma.user.upsert({
      where: { email: "dash.req1@toktickit.com" },
      update: { passwordHash: hash, isActive: true, role: Role.Requester, mustChangePassword: false },
      create: {
        fullName: "Dashboard Requester One",
        email: "dash.req1@toktickit.com",
        passwordHash: hash,
        role: Role.Requester,
        department: "Computer Engineering",
        isActive: true,
        mustChangePassword: false,
      },
    });
    requester1 = { id: r1.id, email: r1.email };

    // 2. Create Requester 2 (for data isolation testing)
    const r2 = await prisma.user.upsert({
      where: { email: "dash.req2@toktickit.com" },
      update: { passwordHash: hash, isActive: true, role: Role.Requester, mustChangePassword: false },
      create: {
        fullName: "Dashboard Requester Two",
        email: "dash.req2@toktickit.com",
        passwordHash: hash,
        role: Role.Requester,
        department: "Civil Engineering",
        isActive: true,
        mustChangePassword: false,
      },
    });
    requester2 = { id: r2.id, email: r2.email };

    // 3. Create Empty Requester (0 tickets)
    const rEmpty = await prisma.user.upsert({
      where: { email: "dash.empty@toktickit.com" },
      update: { passwordHash: hash, isActive: true, role: Role.Requester, mustChangePassword: false },
      create: {
        fullName: "Empty Dashboard Requester",
        email: "dash.empty@toktickit.com",
        passwordHash: hash,
        role: Role.Requester,
        department: "Architecture",
        isActive: true,
        mustChangePassword: false,
      },
    });
    emptyRequester = { id: rEmpty.id, email: rEmpty.email };

    // Login Requester 1
    const res1 = await request(app)
      .post("/api/auth/login")
      .send({ email: "dash.req1@toktickit.com", password: "Password123!" });
    requester1Token = res1.body.token;

    // Login Requester 2
    const res2 = await request(app)
      .post("/api/auth/login")
      .send({ email: "dash.req2@toktickit.com", password: "Password123!" });
    requester2Token = res2.body.token;

    // Login Empty Requester
    const resEmpty = await request(app)
      .post("/api/auth/login")
      .send({ email: "dash.empty@toktickit.com", password: "Password123!" });
    emptyRequesterToken = resEmpty.body.token;

    // Clear any previous test tickets for these requesters
    await prisma.ticket.deleteMany({
      where: { requesterId: { in: [requester1.id, requester2.id, emptyRequester.id] } },
    });

    const cat = await prisma.category.findFirst();
    const sys = await prisma.relatedSystem.findFirst();

    // Seed tickets for Requester 1:
    // 1 New, 1 Open, 2 InProgress, 1 WaitingForRequester, 2 Resolved, 3 Closed
    const now = Date.now();
    await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-REQ1-NEW-${now}`,
        summary: "Laptop battery draining fast",
        description: "Battery discharges in 30 minutes",
        requestedPriority: Priority.High,
        itPriority: Priority.High,
        status: TicketStatus.New,
        requesterId: requester1.id,
        categoryId: cat!.id,
        relatedSystemId: sys!.id,
        updatedAt: new Date(now - 10000),
      },
    });
    await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-REQ1-OPEN-${now}`,
        summary: "Monitor flickering issue",
        description: "External monitor flickers intermittently",
        requestedPriority: Priority.Medium,
        itPriority: Priority.Medium,
        status: TicketStatus.Open,
        requesterId: requester1.id,
        categoryId: cat!.id,
        relatedSystemId: sys!.id,
        updatedAt: new Date(now - 8000),
      },
    });
    await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-REQ1-REO-${now}`,
        summary: "Monitor flickering recurring issue",
        description: "Reopened as issue returned after update",
        requestedPriority: Priority.Medium,
        itPriority: Priority.Medium,
        status: TicketStatus.Reopened,
        requesterId: requester1.id,
        categoryId: cat!.id,
        relatedSystemId: sys!.id,
        updatedAt: new Date(now - 7000),
      },
    });
    await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-REQ1-INP1-${now}`,
        summary: "VPN access disconnected",
        description: "Cannot connect to campus subnet",
        requestedPriority: Priority.High,
        itPriority: Priority.High,
        status: TicketStatus.InProgress,
        requesterId: requester1.id,
        categoryId: cat!.id,
        relatedSystemId: sys!.id,
        updatedAt: new Date(now - 6000),
      },
    });
    await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-REQ1-INP2-${now}`,
        summary: "IDE license activation failure",
        description: "License server unreachable",
        requestedPriority: Priority.Urgent,
        itPriority: Priority.Urgent,
        status: TicketStatus.InProgress,
        requesterId: requester1.id,
        categoryId: cat!.id,
        relatedSystemId: sys!.id,
        updatedAt: new Date(now - 4000),
      },
    });
    await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-REQ1-WAIT-${now}`,
        summary: "Need replacement mouse",
        description: "Scroll wheel broken",
        requestedPriority: Priority.Low,
        itPriority: Priority.Low,
        status: TicketStatus.WaitingForRequester,
        requesterId: requester1.id,
        categoryId: cat!.id,
        relatedSystemId: sys!.id,
        updatedAt: new Date(now - 3000),
      },
    });
    await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-REQ1-RES1-${now}`,
        summary: "Printer toner replaced",
        description: "Black toner empty",
        requestedPriority: Priority.Medium,
        itPriority: Priority.Medium,
        status: TicketStatus.Resolved,
        requesterId: requester1.id,
        categoryId: cat!.id,
        relatedSystemId: sys!.id,
        updatedAt: new Date(now - 2000),
      },
    });
    await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-REQ1-RES2-${now}`,
        summary: "Software installed successfully",
        description: "MATLAB package",
        requestedPriority: Priority.Medium,
        itPriority: Priority.Medium,
        status: TicketStatus.Resolved,
        requesterId: requester1.id,
        categoryId: cat!.id,
        relatedSystemId: sys!.id,
        updatedAt: new Date(now - 1000),
      },
    });
    await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-REQ1-CLO1-${now}`,
        summary: "Account password reset",
        description: "Completed last week",
        requestedPriority: Priority.Low,
        itPriority: Priority.Low,
        status: TicketStatus.Closed,
        requesterId: requester1.id,
        categoryId: cat!.id,
        relatedSystemId: sys!.id,
        updatedAt: new Date(now - 500),
      },
    });

    // Seed tickets for Requester 2 (different user)
    await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-REQ2-INP-${now}`,
        summary: "Requester 2 ticket should be isolated",
        description: "Isolation test",
        requestedPriority: Priority.High,
        itPriority: Priority.High,
        status: TicketStatus.InProgress,
        requesterId: requester2.id,
        categoryId: cat!.id,
        relatedSystemId: sys!.id,
      },
    });
  });

  // ---------------------------------------------------------------------------
  // API-08: Authoritative Metrics & Requester Data Isolation (AC-08, BR-09, FR-10)
  // ---------------------------------------------------------------------------
  describe("API-08: Requester Dashboard Operational Metrics (AC-08, BR-09, FR-10)", () => {
    it("rejects unauthenticated requests without token or requester-id with 401 Unauthorized", async () => {
      const res = await request(app).get("/api/requester/dashboard");
      expect(res.status).toBe(401);
    });

    it("returns authoritative metrics for authenticated Requester using JWT Bearer token", async () => {
      const res = await request(app)
        .get("/api/requester/dashboard")
        .set("Authorization", `Bearer ${requester1Token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("metrics");
      expect(res.body).toHaveProperty("recentTickets");

      const { metrics } = res.body;
      // 1 New + 1 Open + 1 Reopened = 3 OpenTickets
      expect(metrics.openTickets).toBe(3);
      expect(metrics.inProgress).toBe(2);
      expect(metrics.waitingForRequester).toBe(1);
      expect(metrics.resolved).toBe(2);
      expect(metrics.closed).toBe(1);
    });

    it("rejects requests providing only x-requester-id header without JWT token with 401 Unauthorized (BR-09)", async () => {
      const res = await request(app)
        .get("/api/requester/dashboard")
        .set("x-requester-id", String(requester1.id));

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("enforces strict requester data isolation using JWT session (BR-09)", async () => {
      // Requester 2 only has 1 InProgress ticket
      const res = await request(app)
        .get("/api/requester/dashboard")
        .set("Authorization", `Bearer ${requester2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.metrics.inProgress).toBe(1);
      expect(res.body.metrics.openTickets).toBe(0);
      expect(res.body.metrics.waitingForRequester).toBe(0);
      expect(res.body.metrics.resolved).toBe(0);
      expect(res.body.metrics.closed).toBe(0);

      // Verify recentTickets contains only Requester 2's tickets
      expect(res.body.recentTickets.length).toBe(1);
      expect(res.body.recentTickets[0].summary).toContain("Requester 2 ticket");
    });

    it("returns recentTickets with proper schema and descending sort order by updatedAt", async () => {
      const res = await request(app)
        .get("/api/requester/dashboard")
        .set("Authorization", `Bearer ${requester1Token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.recentTickets)).toBe(true);
      expect(res.body.recentTickets.length).toBeLessThanOrEqual(5);

      const ticket = res.body.recentTickets[0];
      expect(ticket).toHaveProperty("id");
      expect(ticket).toHaveProperty("ticketNumber");
      expect(ticket).toHaveProperty("summary");
      expect(ticket).toHaveProperty("status");
      expect(ticket).toHaveProperty("requestedPriority");
      expect(ticket).toHaveProperty("category");
      expect(ticket.category).toHaveProperty("name");
      expect(ticket).toHaveProperty("updatedAt");

      // Verify descending sort by updatedAt
      for (let i = 0; i < res.body.recentTickets.length - 1; i++) {
        const t1 = new Date(res.body.recentTickets[i].updatedAt).getTime();
        const t2 = new Date(res.body.recentTickets[i + 1].updatedAt).getTime();
        expect(t1).toBeGreaterThanOrEqual(t2);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // API-10: Safe Empty Fallback & Zero Counts (AC-11, BR-12)
  // ---------------------------------------------------------------------------
  describe("API-10: Safe Empty State Fallback (AC-11, BR-12)", () => {
    it("safely returns 0 counts and empty recentTickets array for requester with no tickets", async () => {
      const res = await request(app)
        .get("/api/requester/dashboard")
        .set("Authorization", `Bearer ${emptyRequesterToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        metrics: {
          openTickets: 0,
          inProgress: 0,
          waitingForRequester: 0,
          resolved: 0,
          closed: 0,
        },
        recentTickets: [],
      });
    });
  });
});

