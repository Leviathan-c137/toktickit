import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { generateToken, COOKIE_NAME } from "../../src/utils/auth.js";
import { Role } from "@prisma/client";

describe("Lab 3 Issue 6: Administrator User Management API Tests (API-10, API-11, API-12, BR-10 to BR-14)", () => {
  const prisma = getPrisma();

  let adminUser: any;
  let adminToken: string;
  let adminCookie: string;

  let itStaffUser: any;
  let itStaffCookie: string;

  let requesterUser: any;
  let requesterCookie: string;

  beforeAll(async () => {
    // Find or fetch existing seed users
    adminUser = await prisma.user.findFirst({
      where: { role: Role.Administrator, isActive: true },
    });
    if (!adminUser) {
      throw new Error("No active Administrator user found in database");
    }
    adminToken = generateToken({
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      mustChangePassword: false,
    });
    adminCookie = `${COOKIE_NAME}=${adminToken}`;

    itStaffUser = await prisma.user.findFirst({
      where: { role: Role.ITStaff, isActive: true },
    });
    if (itStaffUser) {
      const itToken = generateToken({
        id: itStaffUser.id,
        email: itStaffUser.email,
        role: itStaffUser.role,
        mustChangePassword: false,
      });
      itStaffCookie = `${COOKIE_NAME}=${itToken}`;
    }

    requesterUser = await prisma.user.findFirst({
      where: { role: Role.Requester, isActive: true },
    });
    if (requesterUser) {
      const reqToken = generateToken({
        id: requesterUser.id,
        email: requesterUser.email,
        role: requesterUser.role,
        mustChangePassword: false,
      });
      requesterCookie = `${COOKIE_NAME}=${reqToken}`;
    }
  });

  describe("1. RBAC Authorization & Security", () => {
    it("returns 401 Unauthorized when unauthenticated", async () => {
      const res = await request(app).get("/api/admin/users");
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("returns 403 Forbidden when accessed by Requester role", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Cookie", requesterCookie);
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("returns 403 Forbidden when accessed by ITStaff role", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Cookie", itStaffCookie);
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("returns 200 OK when accessed by Administrator role", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Cookie", adminCookie);
      expect(res.status).toBe(200);
      expect(res.body.users).toBeDefined();
      expect(Array.isArray(res.body.users)).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });
  });

  describe("2. GET /api/admin/users — List, Search, Filter & Pagination", () => {
    it("lists users and omits passwordHash from response", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.users.length).toBeGreaterThan(0);
      const user = res.body.users[0];
      expect(user.id).toBeDefined();
      expect(user.fullName).toBeDefined();
      expect(user.email).toBeDefined();
      expect(user.role).toBeDefined();
      expect(user.passwordHash).toBeUndefined();
    });

    it("filters users by role", async () => {
      const res = await request(app)
        .get("/api/admin/users?role=ITStaff")
        .set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      for (const u of res.body.users) {
        expect(u.role).toBe("ITStaff");
      }
    });

    it("searches users by name or email substring", async () => {
      const res = await request(app)
        .get(`/api/admin/users?search=${encodeURIComponent(adminUser.fullName.substring(0, 4))}`)
        .set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.users.length).toBeGreaterThan(0);
      const found = res.body.users.some((u: any) => u.id === adminUser.id);
      expect(found).toBe(true);
    });

    it("supports pagination with limit and page", async () => {
      const res = await request(app)
        .get("/api/admin/users?page=1&limit=2")
        .set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.users.length).toBeLessThanOrEqual(2);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(2);
      expect(res.body.pagination.totalPages).toBeGreaterThanOrEqual(1);
    });
  });

  describe("3. POST /api/admin/users — User Creation (API-10, AC-09, FR-14, BR-10, BR-11)", () => {
    const timestamp = Date.now();
    const newUserEmail = `test.user.${timestamp}@toktickit.com`;

    it("rejects user creation with missing required fields", async () => {
      const res = await request(app)
        .post("/api/admin/users")
        .set("Cookie", adminCookie)
        .send({ fullName: "Incomplete User" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("BAD_REQUEST");
    });

    it("rejects user creation with invalid email format", async () => {
      const res = await request(app)
        .post("/api/admin/users")
        .set("Cookie", adminCookie)
        .send({
          fullName: "Invalid Email",
          email: "not-an-email",
          role: "ITStaff",
          initialPassword: "Password123!",
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/valid email/i);
    });

    it("rejects user creation with weak initial password", async () => {
      const res = await request(app)
        .post("/api/admin/users")
        .set("Cookie", adminCookie)
        .send({
          fullName: "Weak Pass User",
          email: `weak.${timestamp}@toktickit.com`,
          role: "ITStaff",
          initialPassword: "weak",
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("WEAK_PASSWORD");
    });

    it("creates a new user account with mustChangePassword = true (AC-09, FR-14)", async () => {
      const res = await request(app)
        .post("/api/admin/users")
        .set("Cookie", adminCookie)
        .send({
          fullName: "Alex Thompson",
          email: newUserEmail,
          role: "ITStaff",
          department: "Infrastructure",
          initialPassword: "InitialPassword123!",
          isActive: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.id).toBeDefined();
      expect(res.body.user.fullName).toBe("Alex Thompson");
      expect(res.body.user.email).toBe(newUserEmail);
      expect(res.body.user.role).toBe("ITStaff");
      expect(res.body.user.department).toBe("Infrastructure");
      expect(res.body.user.isActive).toBe(true);
      expect(res.body.user.mustChangePassword).toBe(true);
      expect(res.body.user.passwordHash).toBeUndefined();
    });

    it("rejects duplicate email with 409 Conflict (BR-11)", async () => {
      const res = await request(app)
        .post("/api/admin/users")
        .set("Cookie", adminCookie)
        .send({
          fullName: "Duplicate Alex",
          email: newUserEmail.toUpperCase(), // Test case-insensitive duplicate check
          role: "Requester",
          initialPassword: "InitialPassword123!",
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("CONFLICT");
      expect(res.body.error.message).toMatch(/already exists/i);
    });
  });

  describe("4. PATCH /api/admin/users/:id — User Update & Safety Guardrails (API-11, API-12, BR-12, BR-13)", () => {
    let testSubject: any;

    beforeAll(async () => {
      // Create a dedicated test user to edit
      testSubject = await prisma.user.create({
        data: {
          fullName: "Subject For Edit",
          email: `edit.subject.${Date.now()}@toktickit.com`,
          passwordHash: "dummyhash",
          role: Role.ITStaff,
          department: "Support",
          isActive: true,
          mustChangePassword: true,
        },
      });
    });

    it("returns 404 for non-existent user", async () => {
      const res = await request(app)
        .patch("/api/admin/users/999999")
        .set("Cookie", adminCookie)
        .send({ fullName: "Ghost" });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });

    it("successfully updates user details", async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${testSubject.id}`)
        .set("Cookie", adminCookie)
        .send({
          fullName: "Subject Updated Name",
          department: "Tier 2 Support",
        });

      expect(res.status).toBe(200);
      expect(res.body.user.fullName).toBe("Subject Updated Name");
      expect(res.body.user.department).toBe("Tier 2 Support");
    });

    it("rejects duplicate email on update with 409 Conflict (BR-11)", async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${testSubject.id}`)
        .set("Cookie", adminCookie)
        .send({ email: adminUser.email });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("CONFLICT");
    });

    it("API-11 (BR-12): rejects admin self-deactivation when multiple admins exist", async () => {
      // Create a 2nd active admin so activeAdminCount > 1
      const secondAdmin = await prisma.user.create({
        data: {
          fullName: "Second Active Admin",
          email: `second.admin.${Date.now()}@toktickit.com`,
          passwordHash: "dummyhash",
          role: Role.Administrator,
          isActive: true,
          mustChangePassword: false,
        },
      });

      const secondToken = generateToken({
        id: secondAdmin.id,
        email: secondAdmin.email,
        role: secondAdmin.role,
        mustChangePassword: false,
      });
      const secondCookie = `${COOKIE_NAME}=${secondToken}`;

      // secondAdmin tries to deactivate themselves
      const res = await request(app)
        .patch(`/api/admin/users/${secondAdmin.id}`)
        .set("Cookie", secondCookie)
        .send({ isActive: false });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("SELF_DEACTIVATION_PROHIBITED");
      expect(res.body.error.message).toMatch(/cannot deactivate their own account/i);

      // secondAdmin tries to demote themselves
      const demoteRes = await request(app)
        .patch(`/api/admin/users/${secondAdmin.id}`)
        .set("Cookie", secondCookie)
        .send({ role: "Requester" });

      expect(demoteRes.status).toBe(400);
      expect(demoteRes.body.error.code).toBe("SELF_DEMOTION_PROHIBITED");
      expect(demoteRes.body.error.message).toMatch(/cannot remove their own Administrator role/i);

      // adminUser deactivates secondAdmin (allowed because 2 admins exist)
      const deactRes = await request(app)
        .patch(`/api/admin/users/${secondAdmin.id}`)
        .set("Cookie", adminCookie)
        .send({ isActive: false });
      expect(deactRes.status).toBe(200);

      // Clean up secondAdmin
      await prisma.user.delete({
        where: { id: secondAdmin.id },
      });
    });

    it("API-12 (BR-13): rejects deactivating or demoting the last active Administrator", async () => {
      // With secondAdmin deleted, adminUser is the sole active Administrator
      const soleAttempt = await request(app)
        .patch(`/api/admin/users/${adminUser.id}`)
        .set("Cookie", adminCookie)
        .send({ isActive: false });

      expect(soleAttempt.status).toBe(400);
      expect(soleAttempt.body.error.code).toBe("LAST_ADMIN_PROTECTED");
      expect(soleAttempt.body.error.message).toMatch(/last active Administrator/i);

      // Attempting to demote the sole active admin also triggers LAST_ADMIN_PROTECTED
      const demoteSole = await request(app)
        .patch(`/api/admin/users/${adminUser.id}`)
        .set("Cookie", adminCookie)
        .send({ role: "ITStaff" });

      expect(demoteSole.status).toBe(400);
      expect(demoteSole.body.error.code).toBe("LAST_ADMIN_PROTECTED");
    });
  });

  describe("5. POST /api/admin/users/:id/reset-password (FR-16)", () => {
    let targetUser: any;

    beforeAll(async () => {
      targetUser = await prisma.user.create({
        data: {
          fullName: "Reset Pass Target",
          email: `reset.target.${Date.now()}@toktickit.com`,
          passwordHash: "dummyhash",
          role: Role.Requester,
          isActive: true,
          mustChangePassword: false,
        },
      });
    });

    it("rejects reset with weak password", async () => {
      const res = await request(app)
        .post(`/api/admin/users/${targetUser.id}/reset-password`)
        .set("Cookie", adminCookie)
        .send({ initialPassword: "short" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("WEAK_PASSWORD");
    });

    it("resets user password and sets mustChangePassword = true (FR-16)", async () => {
      const newInitialPassword = "NewInitialPass123!";
      const res = await request(app)
        .post(`/api/admin/users/${targetUser.id}/reset-password`)
        .set("Cookie", adminCookie)
        .send({ initialPassword: newInitialPassword });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/initial password set successfully/i);

      // Verify user record in database
      const updated = await prisma.user.findUnique({
        where: { id: targetUser.id },
      });
      expect(updated!.mustChangePassword).toBe(true);

      // Verify login with the new initial password
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({
          email: targetUser.email,
          password: newInitialPassword,
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.user.mustChangePassword).toBe(true);
    });
  });
});
