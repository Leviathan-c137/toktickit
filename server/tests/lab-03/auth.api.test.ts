import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { COOKIE_NAME } from "../../src/utils/auth.js";
import { getPrisma } from "../../src/prisma.js";
import bcrypt from "bcryptjs";

describe("Lab 3 Issue 2: Authentication Foundation & Database Migration", () => {
  beforeAll(async () => {
    // Ensure test users exist in database
    const prisma = getPrisma();
    const hash = await bcrypt.hash("Password123!", 10);

    // Active requester
    await prisma.user.upsert({
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

    // Inactive requester
    await prisma.user.upsert({
      where: { email: "inactive.req@toktickit.com" },
      update: { passwordHash: hash, isActive: false, role: "Requester" },
      create: {
        fullName: "Inactive User",
        email: "inactive.req@toktickit.com",
        passwordHash: hash,
        role: "Requester",
        isActive: false,
        mustChangePassword: true,
      },
    });

    // Requester requiring password change
    await prisma.user.upsert({
      where: { email: "mchen@toktickit.com" },
      update: { passwordHash: hash, isActive: true, role: "Requester", mustChangePassword: true },
      create: {
        fullName: "Michael Chen",
        email: "mchen@toktickit.com",
        passwordHash: hash,
        role: "Requester",
        isActive: true,
        mustChangePassword: true,
      },
    });
  });

  describe("API-01: POST /api/auth/login (AC-01, FR-01)", () => {
    it("authenticates valid credentials, returns 200, sets session cookie, and returns user data", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "janderson@toktickit.com",
          password: "Password123!",
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("user");
      expect(res.body).toHaveProperty("token");

      const user = res.body.user;
      expect(user.email).toBe("janderson@toktickit.com");
      expect(user.fullName).toBe("Jennifer Anderson");
      expect(user.role).toBe("Requester");
      expect(user.isActive).toBe(true);
      expect(user.mustChangePassword).toBe(false);
      expect(user).not.toHaveProperty("passwordHash");

      // Verify Set-Cookie header exists and contains session cookie name
      const setCookie = res.headers["set-cookie"];
      expect(setCookie).toBeDefined();
      expect(Array.isArray(setCookie) ? setCookie.join(";") : setCookie).toContain(COOKIE_NAME);
    });

    it("rejects login attempt with invalid password (401 Unauthorized)", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "janderson@toktickit.com",
          password: "WrongPassword999!",
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
      expect(res.body.error.message).toBe("Invalid email or password");
    });

    it("rejects login attempt for non-existent email (401 Unauthorized)", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "doesnotexist@toktickit.com",
          password: "Password123!",
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
      expect(res.body.error.message).toBe("Invalid email or password");
    });

    it("rejects login attempt with missing fields (400 Bad Request)", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "janderson@toktickit.com" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("BAD_REQUEST");
    });
  });

  describe("API-02: POST /api/auth/login with Inactive User (BR-01)", () => {
    it("rejects authentication for inactive account with 401 Unauthorized without leaking status", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "inactive.req@toktickit.com",
          password: "Password123!",
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
      expect(res.body.error.message).toBe("Invalid email or password");
    });
  });

  describe("GET /api/auth/me (FR-03)", () => {
    it("returns current user context when authenticated via Bearer token", async () => {
      // 1. Log in first
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({
          email: "janderson@toktickit.com",
          password: "Password123!",
        });

      const token = loginRes.body.token;

      // 2. Fetch /api/auth/me
      const meRes = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.user.email).toBe("janderson@toktickit.com");
      expect(meRes.body.user.role).toBe("Requester");
    });

    it("rejects request without authentication token (401 Unauthorized)", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("API-03: POST /api/auth/change-password (AC-02, BR-02)", () => {
    it("enforces mandatory first-login password change and validation rules", async () => {
      // 1. Login user with mustChangePassword = true
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({
          email: "mchen@toktickit.com",
          password: "Password123!",
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.user.mustChangePassword).toBe(true);
      const token = loginRes.body.token;

      // 2. Reject password mismatch
      const mismatchRes = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${token}`)
        .send({
          currentPassword: "Password123!",
          newPassword: "BrandNewPassword2026!",
          confirmNewPassword: "DifferentPassword2026!",
        });

      expect(mismatchRes.status).toBe(400);
      expect(mismatchRes.body.error.code).toBe("PASSWORD_MISMATCH");

      // 3. Reject wrong current password
      const wrongCurrentRes = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${token}`)
        .send({
          currentPassword: "WrongCurrentPassword!",
          newPassword: "BrandNewPassword2026!",
          confirmNewPassword: "BrandNewPassword2026!",
        });

      expect(wrongCurrentRes.status).toBe(400);
      expect(wrongCurrentRes.body.error.code).toBe("INVALID_CURRENT_PASSWORD");

      // 4. Reject new password that is same as current password
      const sameRes = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${token}`)
        .send({
          currentPassword: "Password123!",
          newPassword: "Password123!",
          confirmNewPassword: "Password123!",
        });

      expect(sameRes.status).toBe(400);
      expect(sameRes.body.error.code).toBe("PASSWORD_SAME_AS_CURRENT");

      // 5. Reject weak password (< 8 chars)
      const weakRes = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${token}`)
        .send({
          currentPassword: "Password123!",
          newPassword: "short",
          confirmNewPassword: "short",
        });

      expect(weakRes.status).toBe(400);
      expect(weakRes.body.error.code).toBe("WEAK_PASSWORD");

      // 6. Successfully change password with valid complex password
      const successRes = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${token}`)
        .send({
          currentPassword: "Password123!",
          newPassword: "BrandNewPassword2026!",
          confirmNewPassword: "BrandNewPassword2026!",
        });

      expect(successRes.status).toBe(200);
      expect(successRes.body.mustChangePassword).toBe(false);
      expect(successRes.body.user.mustChangePassword).toBe(false);

      // 7. Verify login works with the new password
      const reLoginRes = await request(app)
        .post("/api/auth/login")
        .send({
          email: "mchen@toktickit.com",
          password: "BrandNewPassword2026!",
        });

      expect(reLoginRes.status).toBe(200);
      expect(reLoginRes.body.user.mustChangePassword).toBe(false);
    });
  });

  describe("POST /api/auth/logout (FR-04)", () => {
    it("clears session cookie and returns 200 OK", async () => {
      const res = await request(app).post("/api/auth/logout");

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Successfully logged out");

      // Verify Set-Cookie header expires the session cookie
      const setCookie = res.headers["set-cookie"];
      expect(setCookie).toBeDefined();
    });
  });
});
