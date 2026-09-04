import path from "path";

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB = 5,242,880 bytes
export const MAX_ACTIVE_ATTACHMENTS = 5;

export const ALLOWED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".pdf",
]);

export const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

export interface ValidationResult {
  valid: boolean;
  error?: string;
  statusCode?: number;
}

/**
 * Validates a file attachment according to BR-10 and FR-06:
 * - Extension must be .jpg, .jpeg, .png, .webp, or .pdf
 * - MIME type must be image/jpeg, image/png, image/webp, or application/pdf
 * - File size must not exceed 5 MB (5,242,880 bytes)
 */
export function validateAttachment(file: {
  originalname: string;
  mimetype?: string;
  size: number;
}): ValidationResult {
  // Check file size (BR-10: <= 5 MB)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      statusCode: 413,
      error: `File "${file.originalname}" exceeds the maximum allowed limit of 5 MB`,
    };
  }

  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      statusCode: 415,
      error: `File "${file.originalname}" has unsupported extension "${ext}". Allowed: .jpg, .jpeg, .png, .webp, .pdf`,
    };
  }

  // Check MIME type if provided
  if (file.mimetype && !ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase())) {
    return {
      valid: false,
      statusCode: 415,
      error: `File "${file.originalname}" has unsupported MIME type "${file.mimetype}". Allowed: image/jpeg, image/png, image/webp, application/pdf`,
    };
  }

  return { valid: true };
}
