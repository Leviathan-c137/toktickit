import React, { useState, useEffect, useCallback, useRef } from "react";
import { ActionTaken, CreateActionTakenInput, UpdateActionTakenInput } from "../types.js";
import { fetchActionsTaken, createActionTaken, updateActionTaken } from "../api.js";
import { useAuth } from "../context/AuthContext.js";

interface ActionsTakenProps {
  ticketId: number;
  readOnly?: boolean;
}

export const ActionsTaken: React.FC<ActionsTakenProps> = ({ ticketId, readOnly }) => {
  const { user } = useAuth();
  const isReadOnly = readOnly !== undefined ? readOnly : user?.role === "Requester";

  const [actions, setActions] = useState<ActionTaken[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingAction, setEditingAction] = useState<ActionTaken | null>(null);

  // Form Fields
  const [actionDateTime, setActionDateTime] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [followUpRequired, setFollowUpRequired] = useState<boolean>(false);
  const [followUpNote, setFollowUpNote] = useState<string>("");
  const [attachmentNotes, setAttachmentNotes] = useState<string>("");

  // Form Validation & Submission State
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [formSubmitError, setFormSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const followUpNoteRef = useRef<HTMLTextAreaElement>(null);

  const getCurrentLocalDateTime = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  };

  const loadActions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchActionsTaken(ticketId);
      // Ensure stable chronological sorting (AC-04, BR-05)
      const sorted = [...data].sort(
        (a, b) => new Date(a.actionDateTime).getTime() - new Date(b.actionDateTime).getTime()
      );
      setActions(sorted);
    } catch (err: any) {
      setError(err.message || "Failed to load actions taken");
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    loadActions();
  }, [loadActions]);

  const showNotification = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const openCreateModal = () => {
    setEditingAction(null);
    setActionDateTime(getCurrentLocalDateTime());
    setDescription("");
    setResult("");
    setFollowUpRequired(false);
    setFollowUpNote("");
    setAttachmentNotes("");
    setFormErrors({});
    setFormSubmitError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (action: ActionTaken) => {
    setEditingAction(action);
    const dateVal = action.actionDateTime ? new Date(action.actionDateTime).toISOString().slice(0, 16) : getCurrentLocalDateTime();
    setActionDateTime(dateVal);
    setDescription(action.description);
    setResult(action.result);
    setFollowUpRequired(action.followUpRequired);
    setFollowUpNote(action.followUpNote || "");
    setAttachmentNotes(action.attachmentNotes || "");
    setFormErrors({});
    setFormSubmitError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setIsModalOpen(false);
    setEditingAction(null);
    setFormErrors({});
    setFormSubmitError(null);
  };

  // Toggle follow-up with focus recommendation (Beethoven190 feedback)
  const handleToggleFollowUp = (checked: boolean) => {
    setFollowUpRequired(checked);
    if (checked) {
      setTimeout(() => {
        followUpNoteRef.current?.focus();
      }, 50);
    } else {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next.followUpNote;
        return next;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!description.trim() || description.trim().length < 5) {
      errors.description = "Action description is required (minimum 5 characters).";
    }

    if (!result.trim() || result.trim().length < 3) {
      errors.result = "Result is required (minimum 3 characters).";
    }

    if (followUpRequired && (!followUpNote.trim() || followUpNote.trim().length < 3)) {
      errors.followUpNote = "Follow-up note is mandatory when follow-up is required (minimum 3 characters).";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setFormSubmitError(null);

    try {
      if (editingAction) {
        // Edit flow (AC-07, BR-08 concurrency check)
        const updatePayload: UpdateActionTakenInput = {
          description: description.trim(),
          result: result.trim(),
          actionDateTime: actionDateTime ? new Date(actionDateTime).toISOString() : undefined,
          followUpRequired,
          followUpNote: followUpRequired ? followUpNote.trim() : null as any,
          attachmentNotes: attachmentNotes.trim() || (null as any),
          expectedUpdatedAt: editingAction.updatedAt,
        };

        const updated = await updateActionTaken(ticketId, editingAction.id, updatePayload);
        setActions((prev) =>
          prev.map((a) => (a.id === updated.id ? updated : a))
        );
        showNotification("Action Taken updated successfully.");
      } else {
        // Create flow (AC-01, AC-02, BR-01, BR-02)
        const createPayload: CreateActionTakenInput = {
          description: description.trim(),
          result: result.trim(),
          actionDateTime: actionDateTime ? new Date(actionDateTime).toISOString() : undefined,
          followUpRequired,
          followUpNote: followUpRequired ? followUpNote.trim() : undefined,
          attachmentNotes: attachmentNotes.trim() || undefined,
        };

        const created = await createActionTaken(ticketId, createPayload);
        setActions((prev) => [...prev, created]);
        showNotification("Action Taken recorded successfully.");
      }
      setIsModalOpen(false);
    } catch (err: any) {
      if (err.status === 409 || err.code === "CONFLICT") {
        setFormSubmitError(
          "Conflict detected: This record was modified by another user concurrently. Please close this modal, refresh, and review latest details."
        );
      } else {
        setFormSubmitError(err.message || "Failed to save action taken.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateTime = (isoString?: string | null) => {
    if (!isoString) return "-";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="card border-0 shadow-sm rounded-3 mb-4" data-testid="actions-taken-card">
      <div className="card-body p-4">
        {/* Header Section */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 pb-2 border-bottom">
          <div className="d-flex align-items-center gap-2">
            <h5 className="h6 fw-bold text-dark mb-0 d-flex align-items-center gap-2">
              <span>🛠️ Actions Taken</span>
              <span
                className="badge rounded-pill fw-semibold"
                style={{ backgroundColor: "#EAF6EF", color: "#006B3C", border: "1px solid #10B981" }}
                data-testid="actions-count-badge"
              >
                {actions.length}
              </span>
            </h5>
            {isReadOnly && (
              <span
                className="badge rounded-pill px-2 py-1 text-muted fw-normal"
                style={{ backgroundColor: "#F3F4F6", border: "1px solid #E5E7EB" }}
                data-testid="requester-readonly-badge"
              >
                Actions recorded by IT Staff
              </span>
            )}
          </div>

          {!isReadOnly && (
            <button
              type="button"
              className="btn btn-sm text-white fw-medium d-flex align-items-center gap-1"
              style={{ backgroundColor: "#006B3C", borderColor: "#006B3C" }}
              onClick={openCreateModal}
              data-testid="add-action-taken-btn"
            >
              <span>+</span> Add Action Taken
            </button>
          )}
        </div>

        {/* Global Notifications */}
        {successMessage && (
          <div className="alert alert-success py-2 px-3 mb-3 small" role="alert" data-testid="action-success-alert">
            ✓ {successMessage}
          </div>
        )}

        {error && (
          <div className="alert alert-danger py-2 px-3 mb-3 small" role="alert" data-testid="action-error-alert">
            {error}
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="text-center py-4 text-muted small" data-testid="actions-loading">
            <div className="spinner-border spinner-border-sm text-success me-2" role="status"></div>
            Loading actions taken history...
          </div>
        ) : actions.length === 0 ? (
          /* Empty State (AC-11, BR-12) */
          <div
            className="text-center py-4 px-3 rounded-3"
            style={{ backgroundColor: "#F9FAFB", border: "1px dashed #D1D5DB" }}
            data-testid="actions-empty-state"
          >
            <div className="fs-3 mb-2">📋</div>
            <h6 className="fw-semibold text-secondary mb-1">No Actions Recorded Yet</h6>
            <p className="text-muted small mb-0">
              {isReadOnly
                ? "No technical diagnostic or repair actions have been performed on this ticket yet."
                : "No diagnostic or resolution steps have been logged. Click '+ Add Action Taken' to record technical work."}
            </p>
          </div>
        ) : (
          /* Actions Taken Chronological List */
          <div className="d-flex flex-column gap-3" data-testid="actions-taken-list">
            {actions.map((act) => (
              <div
                key={act.id}
                className="p-3 rounded-3 border"
                style={{ backgroundColor: "#FFFFFF", borderColor: "#E5E7EB" }}
                data-testid={`action-item-${act.id}`}
              >
                {/* Action Item Header */}
                <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
                  <div className="d-flex flex-wrap align-items-center gap-2">
                    <span className="text-muted small fw-medium">
                      📅 {formatDateTime(act.actionDateTime)}
                    </span>
                    <span
                      className="badge rounded-pill fw-normal px-2 py-1"
                      style={{ backgroundColor: "#DBEAFE", color: "#1E40AF" }}
                      data-testid={`action-performer-${act.id}`}
                    >
                      👤 {act.performedBy?.fullName || "IT Staff"}
                      {act.performedBy?.role && ` (${act.performedBy.role})`}
                    </span>
                    {act.followUpRequired && (
                      <span
                        className="badge rounded-pill fw-semibold px-2 py-1"
                        style={{ backgroundColor: "#FEF3C7", color: "#B45309", border: "1px solid #F59E0B" }}
                        data-testid={`action-followup-badge-${act.id}`}
                      >
                        ⚠️ Follow-Up Required
                      </span>
                    )}
                  </div>

                  {!isReadOnly && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm py-0 px-2 fw-medium"
                      style={{ fontSize: "0.75rem" }}
                      onClick={() => openEditModal(act)}
                      data-testid={`edit-action-btn-${act.id}`}
                    >
                      ✏️ Edit
                    </button>
                  )}
                </div>

                {/* Description */}
                <div className="mb-2">
                  <div className="text-muted small fw-semibold">Action Description:</div>
                  <div className="text-dark small text-break" style={{ whiteSpace: "pre-wrap" }}>
                    {act.description}
                  </div>
                </div>

                {/* Result */}
                <div className="mb-2">
                  <div className="text-muted small fw-semibold">Result / Outcome:</div>
                  <div className="text-dark small text-break" style={{ whiteSpace: "pre-wrap" }}>
                    {act.result}
                  </div>
                </div>

                {/* Follow-Up Note Box */}
                {act.followUpRequired && act.followUpNote && (
                  <div
                    className="p-2 rounded-2 mb-2"
                    style={{ backgroundColor: "#FFFBEB", borderLeft: "3px solid #F59E0B" }}
                    data-testid={`action-followup-note-${act.id}`}
                  >
                    <div className="small fw-semibold" style={{ color: "#B45309" }}>
                      Follow-Up Note:
                    </div>
                    <div className="small text-dark text-break" style={{ whiteSpace: "pre-wrap" }}>
                      {act.followUpNote}
                    </div>
                  </div>
                )}

                {/* Attachment / Hardware Notes */}
                {act.attachmentNotes && (
                  <div className="text-muted small mt-1">
                    <span className="fw-medium">📎 Diagnostic Notes: </span>
                    <span>{act.attachmentNotes}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modal: Record or Edit Action Taken (AC-01, AC-02, BR-04) */}
        {isModalOpen && (
          <div
            className="modal d-block"
            tabIndex={-1}
            style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
            data-testid="action-modal"
          >
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content rounded-3 border-0 shadow">
                <form onSubmit={handleSubmit} noValidate>
                  {/* Modal Header */}
                  <div className="modal-header border-bottom pb-2">
                    <h5 className="modal-title fw-bold text-dark fs-5">
                      {editingAction ? "✏️ Edit Action Taken" : "🛠️ Record Action Taken"}
                    </h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={closeModal}
                      disabled={submitting}
                      data-testid="close-action-modal-btn"
                    ></button>
                  </div>

                  {/* Modal Body */}
                  <div className="modal-body py-3">
                    {formSubmitError && (
                      <div className="alert alert-danger py-2 px-3 mb-3 small" role="alert" data-testid="action-form-error">
                        {formSubmitError}
                      </div>
                    )}

                    {/* Action Date & Time */}
                    <div className="mb-3">
                      <label htmlFor="actionDateTime" className="form-label fw-semibold small text-dark mb-1">
                        Action Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        id="actionDateTime"
                        className="form-control form-control-sm"
                        value={actionDateTime}
                        onChange={(e) => setActionDateTime(e.target.value)}
                        data-testid="action-datetime-input"
                      />
                    </div>

                    {/* Action Description */}
                    <div className="mb-3">
                      <label htmlFor="actionDescription" className="form-label fw-semibold small text-dark mb-1">
                        Action Description <span className="text-danger">*</span>
                      </label>
                      <textarea
                        id="actionDescription"
                        rows={3}
                        className={`form-control form-control-sm ${formErrors.description ? "is-invalid" : ""}`}
                        placeholder="Detailed technical description of actions performed (e.g., reseated RAM, reinstalled driver, patched kernel)..."
                        value={description}
                        onChange={(e) => {
                          setDescription(e.target.value);
                          if (formErrors.description) {
                            setFormErrors((prev) => {
                              const next = { ...prev };
                              delete next.description;
                              return next;
                            });
                          }
                        }}
                        data-testid="action-description-input"
                      />
                      {formErrors.description && (
                        <div className="invalid-feedback small" data-testid="action-description-error">
                          {formErrors.description}
                        </div>
                      )}
                    </div>

                    {/* Result */}
                    <div className="mb-3">
                      <label htmlFor="actionResult" className="form-label fw-semibold small text-dark mb-1">
                        Result / Outcome <span className="text-danger">*</span>
                      </label>
                      <textarea
                        id="actionResult"
                        rows={2}
                        className={`form-control form-control-sm ${formErrors.result ? "is-invalid" : ""}`}
                        placeholder="Outcome of the action (e.g., successful boot, zero packet drops, verified with user)..."
                        value={result}
                        onChange={(e) => {
                          setResult(e.target.value);
                          if (formErrors.result) {
                            setFormErrors((prev) => {
                              const next = { ...prev };
                              delete next.result;
                              return next;
                            });
                          }
                        }}
                        data-testid="action-result-input"
                      />
                      {formErrors.result && (
                        <div className="invalid-feedback small" data-testid="action-result-error">
                          {formErrors.result}
                        </div>
                      )}
                    </div>

                    {/* Follow-Up Required Toggle Switch */}
                    <div className="form-check form-switch mb-3 p-2 rounded-2" style={{ backgroundColor: "#F9FAFB" }}>
                      <input
                        className="form-check-input ms-0 me-2"
                        type="checkbox"
                        role="switch"
                        id="action-follow-up-toggle"
                        checked={followUpRequired}
                        onChange={(e) => handleToggleFollowUp(e.target.checked)}
                        data-testid="follow-up-toggle"
                      />
                      <label className="form-check-label fw-semibold small text-dark" htmlFor="action-follow-up-toggle">
                        Follow-Up Required
                      </label>
                      <div className="text-muted" style={{ fontSize: "0.75rem", marginLeft: "2.5rem" }}>
                        Check if additional diagnostics, monitoring, or hardware replacements are scheduled.
                      </div>
                    </div>

                    {/* Follow-Up Note (Conditionally mandatory if toggle is ON - BR-04, AC-02) */}
                    {followUpRequired && (
                      <div className="mb-3 p-3 rounded-2" style={{ backgroundColor: "#FEF3C7", border: "1px solid #FDE68A" }}>
                        <label htmlFor="action-follow-up-note" className="form-label fw-bold small text-dark mb-1">
                          Follow-Up Note <span className="text-danger">*</span>
                        </label>
                        <textarea
                          id="action-follow-up-note"
                          ref={followUpNoteRef}
                          rows={2}
                          className={`form-control form-control-sm ${formErrors.followUpNote ? "is-invalid" : ""}`}
                          placeholder="Provide details on the required follow-up (e.g., Monitor memory leak for 48 hours)..."
                          value={followUpNote}
                          onChange={(e) => {
                            setFollowUpNote(e.target.value);
                            if (formErrors.followUpNote) {
                              setFormErrors((prev) => {
                                const next = { ...prev };
                                delete next.followUpNote;
                                return next;
                              });
                            }
                          }}
                          data-testid="follow-up-note-input"
                        />
                        {formErrors.followUpNote && (
                          <div className="text-danger small mt-1 fw-medium" data-testid="follow-up-note-error">
                            {formErrors.followUpNote}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Attachment / Diagnostic Notes */}
                    <div className="mb-3">
                      <label htmlFor="actionAttachmentNotes" className="form-label fw-semibold small text-dark mb-1">
                        Attachment / Diagnostic Notes <span className="text-muted fw-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        id="actionAttachmentNotes"
                        className="form-control form-control-sm"
                        placeholder="e.g., Corresponds to diagnostic log file attached above..."
                        value={attachmentNotes}
                        onChange={(e) => setAttachmentNotes(e.target.value)}
                        data-testid="action-attachment-notes-input"
                      />
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="modal-footer border-top pt-2">
                    <button
                      type="button"
                      className="btn btn-light btn-sm"
                      onClick={closeModal}
                      disabled={submitting}
                      data-testid="cancel-action-btn"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-sm text-white fw-semibold"
                      style={{ backgroundColor: "#006B3C", borderColor: "#006B3C" }}
                      disabled={submitting}
                      data-testid="submit-action-btn"
                    >
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                          Saving...
                        </>
                      ) : editingAction ? (
                        "Save Changes"
                      ) : (
                        "Record Action"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionsTaken;
