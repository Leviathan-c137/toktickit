import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import fs from "fs";
import { getPrisma } from "./prisma.js";
import { upload } from "./utils/upload.js";
import { generateTicketNumber } from "./utils/ticketNumber.js";
import { validateAttachment } from "./utils/attachmentValidator.js";

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

// ---------------------------------------------------------------------------
// Lab 2 Issue 3 — Ticket Creation Endpoint (POST /api/tickets)
// ---------------------------------------------------------------------------

// Multer error handling wrapper
function handleFileUpload(req: Request, res: Response, next: NextFunction) {
  upload.array("files", 5)(req, res, (err: any) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          statusCode: 413,
          error: "Payload Too Large",
          message: "File exceeds the maximum allowed limit of 5 MB",
        });
      }
      if (err.code === "LIMIT_UNEXPECTED_FILE" || err.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({
          statusCode: 400,
          error: "Bad Request",
          message: "A maximum of 5 files can be attached per ticket",
        });
      }
      return res.status(400).json({
        statusCode: 400,
        error: "Bad Request",
        message: err.message || "File upload error",
      });
    }
    next();
  });
}

app.post(
  "/api/tickets",
  requireRequester as any,
  handleFileUpload,
  async (req: AuthenticatedRequest, res: Response) => {
    const prisma = getPrisma();
    const files = (req.files as Express.Multer.File[]) || [];

    // Helper to clean up uploaded files on validation failure
    const cleanupUploadedFiles = () => {
      for (const file of files) {
        if (file.path && fs.existsSync(file.path)) {
          try {
            fs.unlinkSync(file.path);
          } catch {
            // ignore unlink error
          }
        }
      }
    };

    try {
      // 1. Validate Attachments (BR-10, FR-06)
      for (const file of files) {
        const val = validateAttachment({
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
        });

        if (!val.valid) {
          cleanupUploadedFiles();
          return res.status(val.statusCode || 400).json({
            statusCode: val.statusCode || 400,
            error: val.statusCode === 413 ? "Payload Too Large" : "Unsupported Media Type",
            message: val.error,
          });
        }
      }

      // 2. Validate Summary (BR-06: 5–150 chars)
      const summary = typeof req.body.summary === "string" ? req.body.summary.trim() : "";
      if (summary.length < 5 || summary.length > 150) {
        cleanupUploadedFiles();
        return res.status(400).json({
          statusCode: 400,
          error: "Bad Request",
          message: "Summary must be between 5 and 150 characters",
          details: [{ field: "summary", issue: "Summary must be between 5 and 150 characters" }],
        });
      }

      // 3. Validate Description (BR-07: 10–2000 chars)
      const description = typeof req.body.description === "string" ? req.body.description.trim() : "";
      if (description.length < 10 || description.length > 2000) {
        cleanupUploadedFiles();
        return res.status(400).json({
          statusCode: 400,
          error: "Bad Request",
          message: "Description must be between 10 and 2000 characters",
          details: [{ field: "description", issue: "Description must be between 10 and 2000 characters" }],
        });
      }

      // 4. Validate Requested Priority (BR-08: Low, Medium, High, Urgent)
      const allowedPriorities = ["Low", "Medium", "High", "Urgent"];
      const requestedPriority = req.body.requestedPriority || "Medium";
      if (!allowedPriorities.includes(requestedPriority)) {
        cleanupUploadedFiles();
        return res.status(400).json({
          statusCode: 400,
          error: "Bad Request",
          message: "Requested priority must be one of Low, Medium, High, Urgent",
          details: [{ field: "requestedPriority", issue: "Invalid priority value" }],
        });
      }

      // 5. Validate Category (BR-09)
      const categoryId = parseInt(req.body.categoryId, 10);
      if (isNaN(categoryId)) {
        cleanupUploadedFiles();
        return res.status(400).json({
          statusCode: 400,
          error: "Bad Request",
          message: "Category ID is required and must be a number",
          details: [{ field: "categoryId", issue: "Category ID is required" }],
        });
      }
      const category = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!category || !category.isActive) {
        cleanupUploadedFiles();
        return res.status(400).json({
          statusCode: 400,
          error: "Bad Request",
          message: "Selected Category does not exist or is inactive",
          details: [{ field: "categoryId", issue: "Invalid or inactive Category" }],
        });
      }

      // 6. Validate Related System (BR-09)
      const relatedSystemId = parseInt(req.body.relatedSystemId, 10);
      if (isNaN(relatedSystemId)) {
        cleanupUploadedFiles();
        return res.status(400).json({
          statusCode: 400,
          error: "Bad Request",
          message: "Related System ID is required and must be a number",
          details: [{ field: "relatedSystemId", issue: "Related System ID is required" }],
        });
      }
      const relatedSystem = await prisma.relatedSystem.findUnique({ where: { id: relatedSystemId } });
      if (!relatedSystem || !relatedSystem.isActive) {
        cleanupUploadedFiles();
        return res.status(400).json({
          statusCode: 400,
          error: "Bad Request",
          message: "Selected Related System does not exist or is inactive",
          details: [{ field: "relatedSystemId", issue: "Invalid or inactive Related System" }],
        });
      }

      // 7. Atomic Ticket and Attachment Creation
      const createdTicket = await prisma.$transaction(async (tx) => {
        // Step A: Insert ticket with temporary ticketNumber
        const tempTicket = await tx.ticket.create({
          data: {
            ticketNumber: `TEMP-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            summary,
            description,
            requestedPriority: requestedPriority as any,
            itPriority: "Medium",
            status: "New",
            requesterId: req.requester!.id,
            categoryId,
            relatedSystemId,
          },
        });

        // Step B: Generate official monotonic ticket number
        const officialTicketNumber = generateTicketNumber(tempTicket.id);
        await tx.ticket.update({
          where: { id: tempTicket.id },
          data: { ticketNumber: officialTicketNumber },
        });

        // Step C: Record attachments if present
        if (files.length > 0) {
          for (const f of files) {
            await tx.attachment.create({
              data: {
                ticketId: tempTicket.id,
                originalName: f.originalname,
                storedFilename: f.filename,
                mimeType: f.mimetype,
                fileSizeBytes: f.size,
              },
            });
          }
        }

        // Return ticket with relations
        return await tx.ticket.findUnique({
          where: { id: tempTicket.id },
          include: {
            requester: { select: { id: true, fullName: true, email: true } },
            category: { select: { id: true, name: true } },
            relatedSystem: { select: { id: true, name: true } },
            attachments: {
              where: { isRemoved: false },
              select: {
                id: true,
                originalName: true,
                mimeType: true,
                fileSizeBytes: true,
                isRemoved: true,
                createdAt: true,
              },
            },
          },
        });
      });

      return res.status(201).json(createdTicket);
    } catch (err) {
      cleanupUploadedFiles();
      return res.status(500).json({
        statusCode: 500,
        error: "Internal Server Error",
        message: "Failed to create ticket",
      });
    }
  }
);

// ---------------------------------------------------------------------------
// Lab 2 Issue 4 — Ticket Listing Endpoint (GET /api/tickets)
// ---------------------------------------------------------------------------

app.get(
  "/api/tickets",
  requireRequester as any,
  async (req: AuthenticatedRequest, res: Response) => {
    const prisma = getPrisma();

    try {
      // 1. Pagination parameters
      let page = 1;
      if (req.query.page !== undefined) {
        page = parseInt(req.query.page as string, 10);
        if (isNaN(page) || page < 1) {
          return res.status(400).json({
            statusCode: 400,
            error: "Bad Request",
            message: "Page must be a positive integer",
          });
        }
      }

      let limit = 10;
      if (req.query.limit !== undefined) {
        limit = parseInt(req.query.limit as string, 10);
        if (isNaN(limit) || limit < 1 || limit > 50) {
          return res.status(400).json({
            statusCode: 400,
            error: "Bad Request",
            message: "Limit must be between 1 and 50",
          });
        }
      }

      // 2. Sorting parameters
      const validSortFields = ["createdAt", "ticketNumber", "updatedAt"];
      const sortBy = (req.query.sortBy as string) || "createdAt";
      if (!validSortFields.includes(sortBy)) {
        return res.status(400).json({
          statusCode: 400,
          error: "Bad Request",
          message: "Invalid sortBy parameter",
        });
      }

      const validSortOrders = ["asc", "desc"];
      const sortOrder = (req.query.sortOrder as string) || "desc";
      if (!validSortOrders.includes(sortOrder)) {
        return res.status(400).json({
          statusCode: 400,
          error: "Bad Request",
          message: "Invalid sortOrder parameter",
        });
      }

      // 3. Filter criteria (Ownership isolation: BR-12, FR-07, AC-07)
      const where: any = {
        requesterId: req.requester!.id,
      };

      // Search keyword (ticketNumber or summary)
      if (typeof req.query.search === "string" && req.query.search.trim()) {
        const keyword = req.query.search.trim();
        where.OR = [
          { ticketNumber: { contains: keyword, mode: "insensitive" } },
          { summary: { contains: keyword, mode: "insensitive" } },
        ];
      }

      // Category filter
      if (req.query.categoryId !== undefined) {
        const catId = parseInt(req.query.categoryId as string, 10);
        if (isNaN(catId)) {
          return res.status(400).json({
            statusCode: 400,
            error: "Bad Request",
            message: "Invalid categoryId filter",
          });
        }
        where.categoryId = catId;
      }

      // Priority filter
      const validPriorities = ["Low", "Medium", "High", "Urgent"];
      if (req.query.requestedPriority !== undefined) {
        const requestedPriority = req.query.requestedPriority as string;
        if (!validPriorities.includes(requestedPriority)) {
          return res.status(400).json({
            statusCode: 400,
            error: "Bad Request",
            message: "Invalid requestedPriority filter",
          });
        }
        where.requestedPriority = requestedPriority;
      }

      // Status filter
      const validStatuses = [
        "New",
        "Open",
        "InProgress",
        "Pending",
        "Resolved",
        "Closed",
        "Cancelled",
      ];
      if (req.query.status !== undefined) {
        const status = req.query.status as string;
        if (!validStatuses.includes(status)) {
          return res.status(400).json({
            statusCode: 400,
            error: "Bad Request",
            message: "Invalid status filter",
          });
        }
        where.status = status;
      }

      // 4. Count total matching items
      const totalItems = await prisma.ticket.count({ where });
      const totalPages = Math.ceil(totalItems / limit);

      // 5. Query items
      const tickets = await prisma.ticket.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder as "asc" | "desc" },
        include: {
          category: { select: { id: true, name: true } },
          relatedSystem: { select: { id: true, name: true } },
          attachments: {
            where: { isRemoved: false },
            select: { id: true },
          },
        },
      });

      const items = tickets.map((t) => ({
        id: t.id,
        ticketNumber: t.ticketNumber,
        summary: t.summary,
        category: t.category,
        relatedSystem: t.relatedSystem,
        requestedPriority: t.requestedPriority,
        itPriority: t.itPriority,
        status: t.status,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        activeAttachmentsCount: t.attachments.length,
      }));

      return res.status(200).json({
        items,
        pagination: {
          page,
          limit,
          totalItems,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      });
    } catch (err) {
      return res.status(500).json({
        statusCode: 500,
        error: "Internal Server Error",
        message: "Failed to retrieve tickets",
      });
    }
  }
);

export default app;

