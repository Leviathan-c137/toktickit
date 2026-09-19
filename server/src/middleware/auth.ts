import { Request, Response, NextFunction } from "express";
import { getPrisma } from "../prisma.js";
import { verifyToken, COOKIE_NAME } from "../utils/auth.js";
import { Role, User } from "@prisma/client";

export interface AuthenticatedUserRequest extends Request {
  user?: User;
}

/**
 * Middleware to authenticate requests using cookie or Authorization: Bearer token header.
 */
export async function authenticateToken(
  req: AuthenticatedUserRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  let token: string | undefined;

  // 1. Check HTTP-only cookie
  if (req.cookies && req.cookies[COOKIE_NAME]) {
    token = req.cookies[COOKIE_NAME];
  }

  // 2. Check Authorization Bearer header
  const authHeader = req.headers["authorization"];
  if (!token && authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  }

  if (!token) {
    res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({
      error: {
        code: "INVALID_TOKEN",
        message: "Invalid or expired authentication token",
      },
    });
    return;
  }

  try {
    const user = await getPrisma().user.findUnique({
      where: { id: payload.id },
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        error: {
          code: "ACCOUNT_INACTIVE",
          message: "Account does not exist or is inactive",
        },
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to authenticate user",
      },
    });
  }
}

/**
 * Middleware to enforce role-based access control (RBAC).
 */
export function requireRole(...allowedRoles: Role[]) {
  return (req: AuthenticatedUserRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: `Access denied. Permitted roles: ${allowedRoles.join(", ")}`,
        },
      });
      return;
    }

    next();
  };
}

/**
 * Middleware to ensure user has completed mandatory password change.
 */
export function requirePasswordChanged(
  req: AuthenticatedUserRequest,
  res: Response,
  next: NextFunction
): void {
  if (req.user && req.user.mustChangePassword) {
    res.status(403).json({
      error: {
        code: "MUST_CHANGE_PASSWORD",
        message: "Mandatory password change required before accessing this resource",
      },
    });
    return;
  }
  next();
}
