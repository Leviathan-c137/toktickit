import { describe, it, expect } from "vitest";
import {
  validateAttachment,
  MAX_FILE_SIZE_BYTES,
} from "../../src/utils/attachmentValidator.js";

describe("UNIT-02: Attachment File Constraint Validator (BR-10, FR-06)", () => {
  it("accepts valid attachments within size limit and supported extensions", () => {
    expect(
      validateAttachment({
        originalname: "screenshot.png",
        mimetype: "image/png",
        size: 1024 * 1024, // 1 MB
      }).valid
    ).toBe(true);

    expect(
      validateAttachment({
        originalname: "document.pdf",
        mimetype: "application/pdf",
        size: 4 * 1024 * 1024, // 4 MB
      }).valid
    ).toBe(true);

    expect(
      validateAttachment({
        originalname: "photo.JPEG",
        mimetype: "image/jpeg",
        size: 500 * 1024,
      }).valid
    ).toBe(true);
  });

  it("rejects files exceeding 5 MB with HTTP 413 error", () => {
    const oversized = validateAttachment({
      originalname: "large_image.png",
      mimetype: "image/png",
      size: MAX_FILE_SIZE_BYTES + 1,
    });

    expect(oversized.valid).toBe(false);
    expect(oversized.statusCode).toBe(413);
    expect(oversized.error).toMatch(/exceeds the maximum allowed limit of 5 MB/i);
  });

  it("rejects unsupported extensions (.exe, .zip, .bat) with HTTP 415 error", () => {
    const exe = validateAttachment({
      originalname: "installer.exe",
      mimetype: "application/x-msdownload",
      size: 1000,
    });
    expect(exe.valid).toBe(false);
    expect(exe.statusCode).toBe(415);
    expect(exe.error).toMatch(/unsupported extension/i);

    const zip = validateAttachment({
      originalname: "archive.zip",
      mimetype: "application/zip",
      size: 1000,
    });
    expect(zip.valid).toBe(false);
    expect(zip.statusCode).toBe(415);
  });

  it("rejects unsupported MIME types with HTTP 415 error", () => {
    const invalidMime = validateAttachment({
      originalname: "data.png",
      mimetype: "text/plain",
      size: 1000,
    });
    expect(invalidMime.valid).toBe(false);
    expect(invalidMime.statusCode).toBe(415);
    expect(invalidMime.error).toMatch(/unsupported MIME type/i);
  });
});
