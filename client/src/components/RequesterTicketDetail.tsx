import React, { useState, useEffect, useCallback, useRef } from "react";
import { Ticket, Attachment, Priority, TicketStatus } from "../types.js";
import {
  fetchTicketDetail,
  uploadTicketAttachment,
  removeAttachment,
  downloadAttachment,
} from "../api.js";
import { useRequester } from "../context/RequesterContext.js";

interface RequesterTicketDetailProps {
  ticketId: number;
  onBack: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];

export const RequesterTicketDetail: React.FC<RequesterTicketDetailProps> = ({
  ticketId,
  onBack,
}) => {
  const { currentRequester } = useRequester();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Add Attachment state
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Soft Removal Modal state
  const [removalTarget, setRemovalTarget] = useState<Attachment | null>(null);
  const [removalReason, setRemovalReason] = useState<string>("");
  const [removalError, setRemovalError] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState<boolean>(false);

  // Download state
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const loadTicket = useCallback(async () => {
    if (!currentRequester) return;

    setLoading(true);
    setError(null);

    try {
      const data = await fetchTicketDetail(currentRequester.id, ticketId);
      setTicket(data);
    } catch (err: any) {
      setError(err.message || "Failed to load ticket details.");
    } finally {
      setLoading(false);
    }
  }, [currentRequester, ticketId]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  // Format file bytes helper
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return "-";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  // Upload handler (FR-11, AC-12)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile || !currentRequester) return;

    setUploadError(null);

    // Client validation
    const ext = "." + selectedFile.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setUploadError(
        `Unsupported file type "${ext}". Allowed: JPG, PNG, WEBP, PDF.`
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setUploadError(
        `File "${selectedFile.name}" exceeds the 5 MB limit (${formatBytes(
          selectedFile.size
        )}).`
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploading(true);
    try {
      const newAttachment = await uploadTicketAttachment(
        currentRequester.id,
        ticketId,
        selectedFile
      );
      setTicket((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          attachments: [...prev.attachments, newAttachment],
        };
      });
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload attachment.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Download handler (AC-12)
  const handleDownload = async (attachment: Attachment) => {
    if (!currentRequester) return;

    setDownloadError(null);
    setDownloadingId(attachment.id);

    try {
      await downloadAttachment(
        currentRequester.id,
        attachment.id,
        attachment.originalName
      );
    } catch (err: any) {
      setDownloadError(err.message || "Unable to download attachment.");
    } finally {
      setDownloadingId(null);
    }
  };

  // Soft-remove confirmation handler (AC-12, BR-11)
  const handleConfirmRemoval = async () => {
    if (!removalTarget || !currentRequester) return;

    const trimmed = removalReason.trim();
    if (trimmed.length < 3) {
      setRemovalError("Removal reason must be at least 3 characters.");
      return;
    }

    setIsRemoving(true);
    setRemovalError(null);

    try {
      const updatedAttachment = await removeAttachment(
        currentRequester.id,
        removalTarget.id,
        trimmed
      );

      setTicket((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          attachments: prev.attachments.map((a) =>
            a.id === updatedAttachment.id
              ? {
                  ...a,
                  isRemoved: true,
                  removedAt: updatedAttachment.removedAt,
                  removalReason: updatedAttachment.removalReason,
                }
              : a
          ),
        };
      });

      setRemovalTarget(null);
      setRemovalReason("");
    } catch (err: any) {
      setRemovalError(err.message || "Failed to remove attachment.");
    } finally {
      setIsRemoving(false);
    }
  };

  // Badges
  const renderPriorityBadge = (priority: Priority) => {
    const colors: Record<Priority, { bg: string; color: string }> = {
      Urgent: { bg: "#FEE2E2", color: "#DC2626" },
      High: { bg: "#FFEDD5", color: "#C2410C" },
      Medium: { bg: "#FEF3C7", color: "#B45309" },
      Low: { bg: "#E0F2FE", color: "#0369A1" },
    };
    const c = colors[priority] || colors.Low;
    return (
      <span
        className="badge rounded-pill px-2 py-1"
        style={{ backgroundColor: c.bg, color: c.color, fontWeight: 600 }}
      >
        ● {priority}
      </span>
    );
  };

  const renderStatusBadge = (ticketStatus: TicketStatus) => {
    const colors: Record<string, { bg: string; color: string }> = {
      New: { bg: "#EAF6EF", color: "#006B3C" },
      Open: { bg: "#E0F2FE", color: "#0284C7" },
      InProgress: { bg: "#FEF9C3", color: "#A16207" },
      Pending: { bg: "#F3E8FF", color: "#7E22CE" },
      Resolved: { bg: "#DCFCE7", color: "#15803D" },
      Closed: { bg: "#F3F4F6", color: "#4B5563" },
      Cancelled: { bg: "#FEE2E2", color: "#991B1B" },
    };
    const c = colors[ticketStatus] || { bg: "#E5E7EB", color: "#374151" };
    return (
      <span
        className="badge rounded-pill px-3 py-1"
        style={{ backgroundColor: c.bg, color: c.color, fontWeight: 600, fontSize: "0.85rem" }}
      >
        {ticketStatus}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="container py-4" style={{ maxWidth: 880 }}>
        <div className="card border-0 shadow-sm rounded-3 p-5 text-center bg-white" data-testid="detail-loading">
          <div className="py-5">
            <div className="spinner-border text-success mb-3" role="status" style={{ width: "3rem", height: "3rem" }}>
              <span className="visually-hidden">Loading ticket details...</span>
            </div>
            <p className="text-muted fw-semibold">Loading ticket details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="container py-4" style={{ maxWidth: 880 }}>
        <div className="card border-0 shadow-sm rounded-3 p-5 text-center bg-white">
          <div className="py-4">
            <div className="text-danger mb-3" style={{ fontSize: "2.5rem" }}>
              ⚠️
            </div>
            <h2 className="h5 fw-bold text-danger mb-2">Unable to Load Ticket</h2>
            <p className="text-muted mx-auto" style={{ maxWidth: 450 }}>
              {error || "Ticket not found."}
            </p>
            <div className="d-flex justify-content-center gap-2 mt-3">
              <button className="btn btn-outline-secondary" onClick={onBack}>
                ← Back to My Tickets
              </button>
              <button className="btn btn-success" onClick={loadTicket}>
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activeAttachments = ticket.attachments.filter((a) => !a.isRemoved);
  const removedAttachments = ticket.attachments.filter((a) => a.isRemoved);

  return (
    <div className="container py-3" style={{ maxWidth: 920 }}>
      {/* 1. Header Navigation Bar */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <button
          className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 fw-semibold"
          onClick={onBack}
          data-testid="back-to-tickets-btn"
        >
          <span>←</span> Back to My Tickets
        </button>

        <div className="text-muted small">
          Ticket ID: <span className="font-monospace fw-semibold">{ticket.id}</span>
        </div>
      </div>

      {downloadError && (
        <div className="alert alert-danger alert-dismissible fade show mb-3" role="alert">
          {downloadError}
          <button type="button" className="btn-close" onClick={() => setDownloadError(null)}></button>
        </div>
      )}

      {/* 2. Main Ticket Detail Card */}
      <div className="card shadow-sm border-0 rounded-3 overflow-hidden bg-white mb-4">
        {/* Card Header */}
        <div
          className="card-header py-3 px-4 text-white"
          style={{ backgroundColor: "#006B3C" }}
        >
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div>
              <span className="small text-white-50 d-block">Official Ticket Number</span>
              <h1 className="h4 mb-0 fw-bold font-monospace" data-testid="detail-ticket-number">
                {ticket.ticketNumber}
              </h1>
            </div>
            <div>{renderStatusBadge(ticket.status)}</div>
          </div>
        </div>

        <div className="card-body p-4">
          {/* Read-Only System Information Bar (AC-10) */}
          <div
            className="p-3 mb-4 rounded-3 border"
            style={{ backgroundColor: "#F0F4F1", borderColor: "#E5E7EB" }}
            data-testid="ticket-metadata-grid"
          >
            <div className="row g-3">
              <div className="col-6 col-md-3">
                <span className="text-secondary small fw-semibold d-block">Incident Category</span>
                <span className="fw-medium text-dark" data-testid="detail-category">
                  {ticket.category?.name || "General"}
                </span>
              </div>
              <div className="col-6 col-md-3">
                <span className="text-secondary small fw-semibold d-block">Related System</span>
                <span className="fw-medium text-dark" data-testid="detail-system">
                  {ticket.relatedSystem?.name || "None"}
                </span>
              </div>
              <div className="col-6 col-md-3">
                <span className="text-secondary small fw-semibold d-block">Requested Priority</span>
                <div data-testid="detail-requested-priority">
                  {renderPriorityBadge(ticket.requestedPriority)}
                </div>
              </div>
              <div className="col-6 col-md-3">
                <span className="text-secondary small fw-semibold d-block">IT Priority</span>
                <div data-testid="detail-it-priority">
                  {renderPriorityBadge(ticket.itPriority)}
                </div>
              </div>
              <div className="col-6 col-md-3">
                <span className="text-secondary small fw-semibold d-block">Requester</span>
                <span className="text-dark" data-testid="detail-requester">
                  {ticket.requester?.fullName}
                </span>
              </div>
              <div className="col-6 col-md-3">
                <span className="text-secondary small fw-semibold d-block">Department</span>
                <span className="text-dark">
                  {ticket.requester?.department || "General"}
                </span>
              </div>
              <div className="col-6 col-md-3">
                <span className="text-secondary small fw-semibold d-block">Created Date</span>
                <span className="text-dark small">{formatDate(ticket.createdAt)}</span>
              </div>
              <div className="col-6 col-md-3">
                <span className="text-secondary small fw-semibold d-block">Last Updated</span>
                <span className="text-dark small">{formatDate(ticket.updatedAt)}</span>
              </div>
            </div>
          </div>

          {/* Read-Only Summary & Description (AC-10) */}
          <div className="mb-4">
            <label className="form-label fw-bold text-secondary mb-1" style={{ fontSize: "0.9rem" }}>
              Summary
            </label>
            <div
              className="p-3 rounded-2 border"
              style={{ backgroundColor: "#F0F4F1", color: "#1F2937", fontWeight: 500 }}
              data-testid="detail-summary"
            >
              {ticket.summary}
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label fw-bold text-secondary mb-1" style={{ fontSize: "0.9rem" }}>
              Detailed Description
            </label>
            <div
              className="p-3 rounded-2 border"
              style={{
                backgroundColor: "#F0F4F1",
                color: "#1F2937",
                whiteSpace: "pre-wrap",
                minHeight: "100px",
                lineHeight: "1.6",
              }}
              data-testid="detail-description"
            >
              {ticket.description}
            </div>
          </div>

          <hr className="my-4" />

          {/* 3. Attachment Lifecycle Section (AC-12, FR-11, BR-10, BR-11) */}
          <div data-testid="attachment-section">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h2 className="h5 fw-bold mb-0 text-dark">Attachments</h2>
                <small className="text-muted">
                  Max 5 active attachments allowed per ticket (PDF, JPG, PNG, WEBP &le; 5 MB)
                </small>
              </div>

              {/* Add Attachment Button (active < 5) */}
              {activeAttachments.length < 5 ? (
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="d-none"
                    accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleFileChange}
                    data-testid="detail-file-input"
                  />
                  <button
                    className="btn btn-outline-success btn-sm fw-semibold d-flex align-items-center gap-1"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="add-attachment-btn"
                  >
                    <span>{isUploading ? "Uploading..." : "+ Add Attachment"}</span>
                  </button>
                </div>
              ) : (
                <span className="badge bg-secondary py-2 px-3" data-testid="attachment-limit-badge">
                  Maximum 5 Active Attachments Reached
                </span>
              )}
            </div>

            {uploadError && (
              <div className="alert alert-danger py-2 small mb-3" role="alert">
                {uploadError}
              </div>
            )}

            {/* Active Attachments List */}
            <div className="mb-4">
              <h3 className="h6 fw-semibold text-secondary mb-2">
                Active Attachments ({activeAttachments.length})
              </h3>
              {activeAttachments.length === 0 ? (
                <div className="p-3 border rounded-2 bg-light text-muted small text-center" data-testid="no-active-attachments">
                  No active attachments for this ticket.
                </div>
              ) : (
                <div className="list-group shadow-none" data-testid="active-attachments-list">
                  {activeAttachments.map((att) => (
                    <div
                      key={att.id}
                      className="list-group-item d-flex justify-content-between align-items-center flex-wrap gap-2 py-3"
                      data-testid={`attachment-item-${att.id}`}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <span style={{ fontSize: "1.3rem" }}>📄</span>
                        <div>
                          <div className="fw-semibold text-dark text-break" data-testid="attachment-name">
                            {att.originalName}
                          </div>
                          <small className="text-muted">
                            {formatBytes(att.fileSizeBytes)} • Uploaded {formatDate(att.createdAt)}
                          </small>
                        </div>
                      </div>

                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          disabled={downloadingId === att.id}
                          onClick={() => handleDownload(att)}
                          data-testid={`download-attachment-${att.id}`}
                        >
                          {downloadingId === att.id ? "Downloading..." : "Download"}
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => {
                            setRemovalTarget(att);
                            setRemovalReason("");
                            setRemovalError(null);
                          }}
                          data-testid={`remove-attachment-${att.id}`}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Soft-Removed Attachments List (AC-12, UI-08) */}
            {removedAttachments.length > 0 && (
              <div className="mt-4" data-testid="removed-attachments-section">
                <h3 className="h6 fw-semibold text-danger mb-2">
                  Removed Attachments ({removedAttachments.length})
                </h3>
                <div className="list-group shadow-none">
                  {removedAttachments.map((att) => (
                    <div
                      key={att.id}
                      className="list-group-item list-group-item-light border-danger-subtle py-3"
                      data-testid={`removed-attachment-item-${att.id}`}
                    >
                      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <span style={{ fontSize: "1.3rem" }}>🗑️</span>
                          <div>
                            <span className="text-decoration-line-through text-muted fw-semibold">
                              {att.originalName}
                            </span>
                            <span
                              className="badge rounded-pill ms-2"
                              style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}
                              data-testid="removed-badge"
                            >
                              Removed
                            </span>
                            <div className="text-muted small">
                              {formatBytes(att.fileSizeBytes)} • Removed {formatDate(att.removedAt)}
                            </div>
                          </div>
                        </div>

                        {/* Download button is blocked and disabled (BR-11, AC-12, UI-08) */}
                        <button
                          className="btn btn-secondary btn-sm disabled opacity-50"
                          disabled
                          title="File is soft-removed and download is permanently blocked"
                          data-testid={`download-disabled-${att.id}`}
                        >
                          Download Disabled (410)
                        </button>
                      </div>

                      {/* Reason Banner */}
                      <div
                        className="p-2 rounded-2 small mt-2 border border-danger-subtle"
                        style={{ backgroundColor: "#FEF2F2", color: "#991B1B" }}
                        data-testid={`removal-reason-${att.id}`}
                      >
                        <strong>Reason for removal: </strong>
                        <span>{att.removalReason || "No reason recorded"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Soft-Removal Confirmation Modal (AC-12, BR-11) */}
      {removalTarget && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          data-testid="removal-modal"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-3 border-0 shadow">
              <div className="modal-header border-bottom-0 pb-0">
                <h5 className="modal-title fw-bold text-danger">Confirm Attachment Removal</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setRemovalTarget(null)}
                  disabled={isRemoving}
                ></button>
              </div>
              <div className="modal-body py-3">
                <p className="small text-muted mb-3">
                  You are about to remove <strong>{removalTarget.originalName}</strong>. This file will be marked as removed and cannot be downloaded again, but the audit record will be preserved.
                </p>

                <div className="mb-3">
                  <label htmlFor="removalReason" className="form-label fw-semibold small text-dark">
                    Reason for removal <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="removalReason"
                    className={`form-control form-control-sm ${removalError ? "is-invalid" : ""}`}
                    rows={3}
                    placeholder="Provide a mandatory reason (minimum 3 characters, e.g. Uploaded incorrect log file)"
                    value={removalReason}
                    onChange={(e) => {
                      setRemovalReason(e.target.value);
                      if (removalError) setRemovalError(null);
                    }}
                    data-testid="removal-reason-input"
                  />
                  {removalError && (
                    <div className="text-danger small mt-1" data-testid="removal-reason-error">
                      {removalError}
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer border-top-0 pt-0">
                <button
                  type="button"
                  className="btn btn-light btn-sm"
                  onClick={() => setRemovalTarget(null)}
                  disabled={isRemoving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm fw-semibold"
                  onClick={handleConfirmRemoval}
                  disabled={isRemoving || removalReason.trim().length < 3}
                  data-testid="confirm-removal-btn"
                >
                  {isRemoving ? "Removing..." : "Remove Attachment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
