import { describe, it, expect } from "vitest";
import request from "supertest";
import { app, requireRequester, AuthenticatedRequest } from "../../src/app.js";
import { Response } from "express";

// Create a test route to verify requireRequester middleware
app.get("/api/test-auth-requester", requireRequester as any, (req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({ status: "authorized", requester: req.requester });
});

describe("Lab 2 Issue 2: Development Requester Context & Reference Data", () => {
  describe("API-01: GET /api/requesters/active", () => {
    it("returns HTTP 200 and only active development requesters", async () => {
      const res = await request(app).get("/api/requesters/active");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      // Verify 4 active requesters are returned
      expect(res.body.length).toBe(4);

      // Verify inactive user is excluded
      const emails = res.body.map((r: any) => r.email);
      expect(emails).not.toContain("inactive.user@kmutt.ac.th");
      expect(emails).toContain("jennifer.anderson@kmutt.ac.th");
      expect(emails).toContain("michael.brown@kmutt.ac.th");
      expect(emails).toContain("sarah.johnson@kmutt.ac.th");
      expect(emails).toContain("david.lee@kmutt.ac.th");

      // Verify payload structure matches contract
      const first = res.body[0];
      expect(first).toHaveProperty("id");
      expect(first).toHaveProperty("fullName");
      expect(first).toHaveProperty("email");
      expect(first).toHaveProperty("department");
    });
  });

  describe("GET /api/related-systems", () => {
    it("returns HTTP 200 and all active related systems", async () => {
      const res = await request(app).get("/api/related-systems");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(7);

      const systemNames = res.body.map((s: any) => s.name);
      expect(systemNames).toContain("Email");
      expect(systemNames).toContain("Campus Wi-Fi");
      expect(systemNames).toContain("VPN");
      expect(systemNames).toContain("LEB2 App");
      expect(systemNames).toContain("Grade Submission App");
      expect(systemNames).toContain("Printer");
      expect(systemNames).toContain("Corporate Laptop");
    });
  });

  describe("Requester Authentication Simulation (x-requester-id)", () => {
    it("returns HTTP 401 when x-requester-id header is missing", async () => {
      const res = await request(app).get("/api/test-auth-requester");

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        statusCode: 401,
        error: "Unauthorized",
        message: "x-requester-id header is required to identify current requester",
      });
    });

    it("returns HTTP 403 when x-requester-id refers to an inactive user", async () => {
      // Fetch all to find the inactive user id or use id 5
      const res = await request(app)
        .get("/api/test-auth-requester")
        .set("x-requester-id", "5");

      expect(res.status).toBe(403);
      expect(res.body).toMatchObject({
        statusCode: 403,
        error: "Forbidden",
        message: "Requester is inactive or does not exist",
      });
    });

    it("returns HTTP 403 when x-requester-id does not exist", async () => {
      const res = await request(app)
        .get("/api/test-auth-requester")
        .set("x-requester-id", "9999");

      expect(res.status).toBe(403);
      expect(res.body).toMatchObject({
        statusCode: 403,
        error: "Forbidden",
        message: "Requester is inactive or does not exist",
      });
    });

    it("returns HTTP 200 when x-requester-id is an active user", async () => {
      const res = await request(app)
        .get("/api/test-auth-requester")
        .set("x-requester-id", "1");

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("authorized");
      expect(res.body.requester.id).toBe(1);
      expect(res.body.requester.fullName).toBe("Jennifer Anderson");
    });
  });
});
