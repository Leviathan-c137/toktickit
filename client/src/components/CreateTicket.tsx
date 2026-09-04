import React, { useState, useEffect, useRef } from "react";
import { Category, RelatedSystem, Ticket, Priority } from "../types.js";
import { fetchCategories, fetchRelatedSystems, createTicket } from "../api.js";
import { useRequester } from "../context/RequesterContext.js";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];

interface CreateTicketProps {
  onSuccess?: (ticket: Ticket) => void;
  onCancel?: () => void;
}

export const CreateTicket: React.FC<CreateTicketProps> = ({ onSuccess, onCancel }) => {
  const { currentRequester } = useRequester();

  // Form Field States
  const [categories, setCategories] = useState<Category[]>([]);
  const [relatedSystems, setRelatedSystems] = useState<RelatedSystem[]>([]);
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [relatedSystemId, setRelatedSystemId] = useState<number | "">("");
  const [requestedPriority, setRequestedPriority] = useState<Priority>("Medium");
  const [summary, setSummary] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);

  // Validation & UI States
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [fileError, setFileError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdTicket, setCreatedTicket] = useState<Ticket | null>(null);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load reference categories & systems on mount
  useEffect(() => {
    async function loadReferenceData() {
      setLoadingData(true);
      try {
        const [cats, systems] = await Promise.all([
          fetchCategories(),
          fetchRelatedSystems(),
        ]);
        setCategories(cats);
        setRelatedSystems(systems);
        if (cats.length > 0) setCategoryId(cats[0].id);
        if (systems.length > 0) setRelatedSystemId(systems[0].id);
      } catch (err: any) {
        setApiError("Failed to load categories or systems. Please refresh the page.");
      } finally {
        setLoadingData(false);
      }
    }
    loadReferenceData();
  }, []);

  // Format file size helper
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Handle file selection with validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    if (!e.target.files) return;

    const incoming = Array.from(e.target.files);
    const validNewFiles: File[] = [];

    for (const file of incoming) {
      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

      // Check file type
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setFileError(
          `File "${file.name}" has an unsupported format. Allowed formats: JPG, PNG, WEBP, PDF.`
        );
        return;
      }

      // Check file size (BR-10, AC-05)
      if (file.size > MAX_FILE_SIZE) {
        setFileError(
          `File "${file.name}" exceeds the maximum allowed limit of 5 MB (${formatBytes(file.size)}).`
        );
        return;
      }

      validNewFiles.push(file);
    }

    if (files.length + validNewFiles.length > 5) {
      setFileError("You can attach a maximum of 5 files per ticket.");
      return;
    }

    setFiles((prev) => [...prev, ...validNewFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFileError(null);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    const newErrors: { [key: string]: string } = {};

    // Validate Summary (BR-06: 5–150 chars)
    const trimmedSummary = summary.trim();
    if (!trimmedSummary) {
      newErrors.summary = "Ticket summary is required.";
    } else if (trimmedSummary.length < 5) {
      newErrors.summary = "Summary must be at least 5 characters.";
    } else if (trimmedSummary.length > 150) {
      newErrors.summary = "Summary cannot exceed 150 characters.";
    }

    // Validate Description (BR-07: 10–2000 chars)
    const trimmedDescription = description.trim();
    if (!trimmedDescription) {
      newErrors.description = "Ticket description is required.";
    } else if (trimmedDescription.length < 10) {
      newErrors.description = "Description must be at least 10 characters.";
    } else if (trimmedDescription.length > 2000) {
      newErrors.description = "Description cannot exceed 2000 characters.";
    }

    // Validate Category and System
    if (!categoryId) newErrors.categoryId = "Please select a Category.";
    if (!relatedSystemId) newErrors.relatedSystemId = "Please select a Related System.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!currentRequester) {
      setApiError("No active requester session found. Please select a requester.");
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("categoryId", String(categoryId));
      formData.append("relatedSystemId", String(relatedSystemId));
      formData.append("requestedPriority", requestedPriority);
      formData.append("summary", trimmedSummary);
      formData.append("description", trimmedDescription);

      for (const f of files) {
        formData.append("files", f);
      }

      const ticket = await createTicket(currentRequester.id, formData);
      setCreatedTicket(ticket);
      if (onSuccess) onSuccess(ticket);
    } catch (err: any) {
      // Form state preservation on failure (BR-13, AC-06)
      setApiError(err.message || "Failed to submit ticket. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setCreatedTicket(null);
    setSummary("");
    setDescription("");
    setFiles([]);
    setErrors({});
    setApiError(null);
    setFileError(null);
    setRequestedPriority("Medium");
  };

  // If ticket was successfully created, render confirmation card
  if (createdTicket) {
    return (
      <div className="container py-4" style={{ maxWidth: "720px" }}>
        <div className="card shadow-sm border-0 rounded-3 overflow-hidden">
          <div
            className="card-header py-3 px-4 text-white d-flex align-items-center justify-content-between"
            style={{ backgroundColor: "#006B3C" }}
          >
            <div className="d-flex align-items-center gap-2">
              <span style={{ fontSize: "1.3rem" }}>✓</span>
              <h2 className="h5 mb-0 fw-semibold">Ticket Created Successfully</h2>
            </div>
            <span className="badge bg-light text-dark px-2 py-1">
              Status: {createdTicket.status}
            </span>
          </div>

          <div className="card-body p-4 bg-white">
            <div
              className="alert border-0 rounded-3 p-3 mb-4"
              style={{ backgroundColor: "#EAF6EF", color: "#006B3C" }}
            >
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="small text-muted mb-1">Official Ticket Identifier</div>
                  <div className="h4 fw-bold mb-0" data-testid="created-ticket-number">
                    {createdTicket.ticketNumber}
                  </div>
                </div>
                <span className="badge text-bg-success px-3 py-2" style={{ fontSize: "0.85rem" }}>
                  Assigned IT Priority: {createdTicket.itPriority}
                </span>
              </div>
            </div>

            <div className="mb-3">
              <div className="fw-semibold text-secondary small">Summary</div>
              <div className="lead fs-6 fw-medium">{createdTicket.summary}</div>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-sm-4">
                <div className="small text-muted">Category</div>
                <div className="fw-medium">{createdTicket.category?.name}</div>
              </div>
              <div className="col-sm-4">
                <div className="small text-muted">Related System</div>
                <div className="fw-medium">{createdTicket.relatedSystem?.name}</div>
              </div>
              <div className="col-sm-4">
                <div className="small text-muted">Requested Priority</div>
                <span
                  className="badge px-2 py-1"
                  style={{
                    backgroundColor:
                      createdTicket.requestedPriority === "Urgent"
                        ? "#FEE2E2"
                        : createdTicket.requestedPriority === "High"
                        ? "#FFEDD5"
                        : "#FEF3C7",
                    color:
                      createdTicket.requestedPriority === "Urgent"
                        ? "#B91C1C"
                        : createdTicket.requestedPriority === "High"
                        ? "#C2410C"
                        : "#B45309",
                  }}
                >
                  {createdTicket.requestedPriority}
                </span>
              </div>
            </div>

            {createdTicket.attachments && createdTicket.attachments.length > 0 && (
              <div className="mb-4">
                <div className="small text-muted mb-2">Attachments ({createdTicket.attachments.length})</div>
                <ul className="list-group list-group-flush border rounded-2">
                  {createdTicket.attachments.map((att) => (
                    <li key={att.id} className="list-group-item d-flex justify-content-between align-items-center py-2">
                      <span>📄 {att.originalName}</span>
                      <span className="small text-muted">{formatBytes(att.fileSizeBytes)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="d-flex gap-2 pt-2">
              <button
                type="button"
                className="btn btn-outline-success fw-semibold"
                onClick={handleResetForm}
              >
                + Create Another Ticket
              </button>
              {onCancel && (
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={onCancel}
                >
                  Back to Dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-3" style={{ maxWidth: "800px" }}>
      {/* Breadcrumb Header */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb mb-1" style={{ fontSize: "0.85rem" }}>
          <li className="breadcrumb-item text-muted">Home</li>
          <li className="breadcrumb-item active text-success fw-semibold" aria-current="page">
            Create Ticket
          </li>
        </ol>
      </nav>

      <div className="card shadow-sm border-0 rounded-3 overflow-hidden">
        <div
          className="card-header py-3 px-4 text-white"
          style={{ backgroundColor: "#006B3C" }}
        >
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <h1 className="h5 mb-0 fw-semibold">Create IT Support Ticket</h1>
              <small className="text-white-50">Report an incident or IT service request</small>
            </div>
            <span
              className="badge px-3 py-1 fw-normal"
              style={{ backgroundColor: "#0B7A46", fontSize: "0.8rem" }}
            >
              Zen Green Portal
            </span>
          </div>
        </div>

        <div className="card-body p-4 bg-white">
          {/* Read-Only System Information Bar (UI Spec 3.3) */}
          <div
            className="p-3 mb-4 rounded-3 border"
            style={{ backgroundColor: "#F0F4F1", borderColor: "#E5E7EB" }}
          >
            <div className="row g-2 align-items-center" style={{ fontSize: "0.875rem" }}>
              <div className="col-md-4">
                <span className="text-secondary fw-semibold">Requester: </span>
                <span className="fw-medium text-dark">
                  {currentRequester?.fullName || "Not Selected"}
                </span>
              </div>
              <div className="col-md-3">
                <span className="text-secondary fw-semibold">Date: </span>
                <span className="text-dark">
                  {new Date().toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="col-md-3">
                <span className="text-secondary fw-semibold">Status: </span>
                <span
                  className="badge px-2 py-1"
                  style={{ backgroundColor: "#EAF6EF", color: "#006B3C", border: "1px solid #A7F3D0" }}
                >
                  New
                </span>
              </div>
              <div className="col-md-2 text-md-end">
                <span
                  className="badge px-2 py-1"
                  style={{ backgroundColor: "#FEF3C7", color: "#B45309" }}
                >
                  IT: Medium
                </span>
              </div>
            </div>
          </div>

          {/* Error Banner on API Failure (AC-06, BR-13) */}
          {apiError && (
            <div className="alert alert-danger mb-4 d-flex align-items-center" role="alert">
              <span className="me-2" style={{ fontSize: "1.2rem" }}>⚠️</span>
              <div>
                <strong>Submission Error: </strong>
                <span>{apiError}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Row 1: Category & Related System */}
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label
                  htmlFor="categoryId"
                  className="form-label fw-semibold text-secondary"
                  style={{ fontSize: "0.9rem" }}
                >
                  Category <span className="text-danger">*</span>
                </label>
                <select
                  id="categoryId"
                  data-testid="category-select"
                  className={`form-select ${errors.categoryId ? "is-invalid" : ""}`}
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(Number(e.target.value));
                    if (errors.categoryId) setErrors((prev) => ({ ...prev, categoryId: "" }));
                  }}
                  disabled={loadingData}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <div className="text-danger small mt-1">{errors.categoryId}</div>
                )}
              </div>

              <div className="col-md-6">
                <label
                  htmlFor="relatedSystemId"
                  className="form-label fw-semibold text-secondary"
                  style={{ fontSize: "0.9rem" }}
                >
                  Related Campus System <span className="text-danger">*</span>
                </label>
                <select
                  id="relatedSystemId"
                  data-testid="system-select"
                  className={`form-select ${errors.relatedSystemId ? "is-invalid" : ""}`}
                  value={relatedSystemId}
                  onChange={(e) => {
                    setRelatedSystemId(Number(e.target.value));
                    if (errors.relatedSystemId) setErrors((prev) => ({ ...prev, relatedSystemId: "" }));
                  }}
                  disabled={loadingData}
                >
                  {relatedSystems.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {errors.relatedSystemId && (
                  <div className="text-danger small mt-1">{errors.relatedSystemId}</div>
                )}
              </div>
            </div>

            {/* Row 2: Requested Priority */}
            <div className="mb-3">
              <label
                htmlFor="requestedPriority"
                className="form-label fw-semibold text-secondary"
                style={{ fontSize: "0.9rem" }}
              >
                Requested Priority <span className="text-danger">*</span>
              </label>
              <select
                id="requestedPriority"
                data-testid="priority-select"
                className="form-select"
                style={{ maxWidth: "240px" }}
                value={requestedPriority}
                onChange={(e) => setRequestedPriority(e.target.value as Priority)}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
              <div className="form-text text-muted" style={{ fontSize: "0.8rem" }}>
                IT Staff will review and confirm final IT Priority based on campus operational impact.
              </div>
            </div>

            {/* Row 3: Summary */}
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center">
                <label
                  htmlFor="summary"
                  className="form-label fw-semibold text-secondary mb-1"
                  style={{ fontSize: "0.9rem" }}
                >
                  Ticket Summary <span className="text-danger">*</span>
                </label>
                <span className="small text-muted">{summary.length}/150</span>
              </div>
              <input
                type="text"
                id="summary"
                data-testid="summary-input"
                className={`form-control ${errors.summary ? "is-invalid" : ""}`}
                placeholder="Brief summary of the issue (min 5 characters)"
                value={summary}
                maxLength={150}
                onChange={(e) => {
                  setSummary(e.target.value);
                  if (errors.summary) setErrors((prev) => ({ ...prev, summary: "" }));
                }}
              />
              {errors.summary && (
                <div className="text-danger small mt-1" data-testid="summary-error">
                  {errors.summary}
                </div>
              )}
            </div>

            {/* Row 4: Description */}
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center">
                <label
                  htmlFor="description"
                  className="form-label fw-semibold text-secondary mb-1"
                  style={{ fontSize: "0.9rem" }}
                >
                  Detailed Description <span className="text-danger">*</span>
                </label>
                <span className="small text-muted">{description.length}/2000</span>
              </div>
              <textarea
                id="description"
                data-testid="description-input"
                rows={4}
                className={`form-control ${errors.description ? "is-invalid" : ""}`}
                placeholder="Describe what happened, error messages, and steps to reproduce (min 10 characters)"
                value={description}
                maxLength={2000}
                style={{ minHeight: "120px" }}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description) setErrors((prev) => ({ ...prev, description: "" }));
                }}
              />
              {errors.description && (
                <div className="text-danger small mt-1" data-testid="description-error">
                  {errors.description}
                </div>
              )}
            </div>

            {/* File Attachments Dropzone / Selector */}
            <div className="mb-4">
              <label
                className="form-label fw-semibold text-secondary mb-1"
                style={{ fontSize: "0.9rem" }}
              >
                File Attachments (Optional)
              </label>

              <div
                className="p-3 border border-2 border-dashed rounded-3 text-center bg-light"
                style={{ borderColor: "#CBD5E1" }}
              >
                <div className="d-flex flex-column align-items-center gap-1">
                  <span style={{ fontSize: "1.5rem" }}>📎</span>
                  <div className="small fw-semibold text-dark">
                    Select images or PDF documents
                  </div>
                  <div className="small text-muted" style={{ fontSize: "0.8rem" }}>
                    Accepted: JPG, JPEG, PNG, WEBP, PDF • Max 5 MB each • Up to 5 files
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    data-testid="file-input"
                    multiple
                    accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                    className="d-none"
                    onChange={handleFileChange}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm mt-2"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={files.length >= 5}
                  >
                    {files.length >= 5 ? "Maximum 5 Files Reached" : "Choose Files..."}
                  </button>
                </div>
              </div>

              {/* Immediate File Validation Error (AC-05) */}
              {fileError && (
                <div className="text-danger small mt-2" data-testid="file-error">
                  ⚠️ {fileError}
                </div>
              )}

              {/* Staged Files List */}
              {files.length > 0 && (
                <div className="mt-3">
                  <div className="small fw-semibold text-secondary mb-2">
                    Staged Attachments ({files.length}/5):
                  </div>
                  <div className="d-flex flex-column gap-2">
                    {files.map((file, idx) => (
                      <div
                        key={`${file.name}-${idx}`}
                        className="d-flex justify-content-between align-items-center p-2 rounded-2 border bg-white"
                        style={{ fontSize: "0.85rem" }}
                      >
                        <div className="d-flex align-items-center gap-2 overflow-hidden text-truncate">
                          <span>📄</span>
                          <span className="text-truncate fw-medium">{file.name}</span>
                          <span className="text-muted small">({formatBytes(file.size)})</span>
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger py-0 px-2"
                          style={{ fontSize: "0.75rem" }}
                          onClick={() => removeFile(idx)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div className="d-flex justify-content-end gap-2 pt-2 border-top">
              {onCancel && (
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                data-testid="submit-ticket-btn"
                className="btn text-white fw-semibold px-4"
                style={{ backgroundColor: "#006B3C", borderColor: "#006B3C" }}
                disabled={isSubmitting || loadingData}
              >
                {isSubmitting ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    />
                    Submitting Ticket...
                  </>
                ) : (
                  "+ Submit Ticket"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
