import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const JWT_SECRET = process.env.JWT_SECRET || "toktickit-jwt-super-secret-key-2026";
export const COOKIE_NAME = "toktickit_session";

export interface TokenPayload {
  id: number;
  email: string;
  role: string;
  mustChangePassword: boolean;
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Validates password complexity:
 * - At least 8 characters
 * - Includes uppercase letter
 * - Includes lowercase letter
 * - Includes a number or special character
 */
export function validatePasswordStrength(password: string): { isValid: boolean; message?: string } {
  if (!password || password.length < 8) {
    return { isValid: false, message: "Password must be at least 8 characters long" };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: "Password must contain at least one uppercase letter" };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: "Password must contain at least one lowercase letter" };
  }
  if (!/[0-9!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { isValid: false, message: "Password must contain at least one number or special character" };
  }
  return { isValid: true };
}
