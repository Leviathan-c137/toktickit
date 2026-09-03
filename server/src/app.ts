import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { getPrisma } from "./prisma.js";

// The Express app is exported separately from app.listen() (see index.ts) so
// Supertest can import `app` without opening a port. Do not merge these files.
export const app = express();

app.use(cors()); // already wired: lets the Vite dev server call this API
app.use(express.json());

// ---------------------------------------------------------------------------
// Lab 2 Requester Authentication Middleware (Simulated via x-requester-id)
// ---------------------------------------------------------------------------
export interface AuthenticatedRequest extends Request {
  requester?: {
    id: number;
    fullName: string;
    email: string;
    department: string | null;
    isActive: boolean;
  };
}

export async function requireRequester(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const requesterIdHeader = req.headers["x-requester-id"];

  if (!requesterIdHeader) {
    res.status(401).json({
      statusCode: 401,
      error: "Unauthorized",
      message: "x-requester-id header is required to identify current requester",
    });
    return;
  }

  const requesterId = parseInt(String(requesterIdHeader), 10);
  if (isNaN(requesterId)) {
    res.status(400).json({
      statusCode: 400,
      error: "Bad Request",
      message: "Invalid x-requester-id header format",
    });
    return;
  }

  try {
    const requester = await getPrisma().requesterUser.findUnique({
      where: { id: requesterId },
    });

    if (!requester || !requester.isActive) {
      res.status(403).json({
        statusCode: 403,
        error: "Forbidden",
        message: "Requester is inactive or does not exist",
      });
      return;
    }

    req.requester = requester;
    next();
  } catch {
    res.status(500).json({
      statusCode: 500,
      error: "Internal Server Error",
      message: "Failed to validate requester context",
    });
  }
}

// ---------------------------------------------------------------------------
// Issue 2 (Lab 1) — API health check
// ---------------------------------------------------------------------------
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "TokTickIT API" });
});

// ---------------------------------------------------------------------------
// Issue 4 (Lab 1) / Sprint 2 — Category list
// ---------------------------------------------------------------------------
app.get("/api/categories", async (_req: Request, res: Response) => {
  try {
    const categories = await getPrisma().category.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" },
      select: { id: true, name: true },
    });
    res.status(200).json(categories);
  } catch {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// ---------------------------------------------------------------------------
// Lab 2 Issue 2 — Development Requester & Reference Data Endpoints
// ---------------------------------------------------------------------------

// GET /api/requesters/active — list active development requesters
app.get("/api/requesters/active", async (_req: Request, res: Response) => {
  try {
    const requesters = await getPrisma().requesterUser.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" },
      select: {
        id: true,
        fullName: true,
        email: true,
        department: true,
      },
    });
    res.status(200).json(requesters);
  } catch {
    res.status(500).json({
      statusCode: 500,
      error: "Internal Server Error",
      message: "Failed to fetch active requesters",
    });
  }
});

// GET /api/related-systems — list active related campus systems
app.get("/api/related-systems", async (_req: Request, res: Response) => {
  try {
    const systems = await getPrisma().relatedSystem.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" },
      select: {
        id: true,
        name: true,
      },
    });
    res.status(200).json(systems);
  } catch {
    res.status(500).json({
      statusCode: 500,
      error: "Internal Server Error",
      message: "Failed to fetch related systems",
    });
  }
});

export default app;
