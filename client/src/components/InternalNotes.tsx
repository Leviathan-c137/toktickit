import React, { useState, useEffect } from "react";
import { InternalNote } from "../types.js";
import { fetchInternalNotes, createInternalNote } from "../api.js";

interface InternalNotesProps {
  ticketId: number;
}

export const InternalNotes: React.FC<InternalNotesProps> = ({ ticketId }) => {
  const [notes, setNotes] = useState<InternalNote[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [newContent, setNewContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const loadNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchInternalNotes(ticketId);
      setNotes(data);
    } catch (err: any) {
      setError(err.message || "Failed to load internal notes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [ticketId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) {
      setError("Note content cannot be empty");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const added = await createInternalNote(ticketId, newContent.trim());
      setNotes((prev) => [...prev, added]);
      setNewContent("");
    } catch (err: any) {
      setError(err.message || "Failed to post internal note");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    if (role === "Administrator") {
      return { backgroundColor: "#FEF3C7", color: "#92400E" };
    }
    return { backgroundColor: "#DBEAFE", color: "#1E40AF" };
  };

  return (
    <div className="card border-0 shadow-sm rounded-3" style={{ backgroundColor: "#FFFFFF" }}>
      <div className="card-body p-4">
        {/* Header with Confidential Indicator */}
        <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2 flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <span style={{ fontSize: "1.1rem" }}>🔒</span>
            <h5 className="mb-0 fw-semibold" style={{ color: "#92400E" }}>
              Internal Notes ({notes.length})
            </h5>
          </div>
          <span
            className="badge rounded-pill px-3 py-1 fw-medium"
            style={{ backgroundColor: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A", fontSize: "0.8rem" }}
          >
            🔒 Confidential • IT Staff & Admin Only
          </span>
        </div>

        {error && (
          <div className="alert alert-danger py-2 small mb-3" role="alert">
            {error}
          </div>
        )}

        {/* Notes Feed */}
        {loading ? (
          <div className="text-center py-4 text-muted small">
            <div className="spinner-border spinner-border-sm text-warning me-2" role="status">
              <span className="visually-hidden">Loading notes...</span>
            </div>
            Loading internal notes...
          </div>
        ) : notes.length === 0 ? (
          <div
            className="text-center py-4 mb-3 rounded-3"
            style={{ backgroundColor: "#FFFBEB", border: "1px dashed #FCD34D" }}
          >
            <p className="text-muted small mb-0">
              No internal notes recorded yet. Notes posted here are strictly private to IT staff.
            </p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3 mb-4" style={{ maxHeight: "400px", overflowY: "auto" }}>
            {notes.map((note) => (
              <div
                key={note.id}
                className="p-3 rounded-3"
                style={{
                  backgroundColor: "#FFFBEB",
                  borderLeft: "4px solid #D97706",
                  borderTop: "1px solid #FEF3C7",
                  borderRight: "1px solid #FEF3C7",
                  borderBottom: "1px solid #FEF3C7",
                }}
              >
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <span className="fw-semibold text-dark" style={{ fontSize: "0.9rem" }}>
                      {note.author.fullName}
                    </span>
                    <span
                      className="badge px-2 py-0"
                      style={{
                        ...getRoleBadgeStyle(note.author.role),
                        fontSize: "0.75rem",
                        borderRadius: "10px",
                      }}
                    >
                      {note.author.role === "ITStaff" ? "IT Staff" : note.author.role}
                    </span>
                  </div>
                  <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                    {formatDateTime(note.createdAt)}
                  </span>
                </div>
                <p className="mb-0 text-dark" style={{ fontSize: "0.9rem", whiteSpace: "pre-wrap" }}>
                  {note.content}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Note Post Form */}
        <form onSubmit={handleSubmit} className="mt-3">
          <div className="mb-2">
            <label htmlFor="internal-note-input" className="form-label small fw-semibold text-secondary mb-1">
              Add Internal Investigation / Operational Note
            </label>
            <textarea
              id="internal-note-input"
              className="form-control"
              rows={3}
              placeholder="Record diagnostic steps, spare part status, vendor contacts, or triage thoughts..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              maxLength={2000}
              disabled={submitting}
              style={{ fontSize: "0.9rem", borderColor: "#FCD34D" }}
            />
          </div>
          <div className="d-flex align-items-center justify-content-between">
            <span className="text-muted small" style={{ fontSize: "0.75rem" }}>
              {newContent.length}/2000 characters
            </span>
            <button
              type="submit"
              className="btn btn-sm px-4 fw-semibold text-white"
              disabled={submitting || !newContent.trim()}
              style={{
                backgroundColor: "#D97706",
                borderColor: "#D97706",
                borderRadius: "6px",
              }}
            >
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
                  Saving Note...
                </>
              ) : (
                "Post Internal Note"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InternalNotes;
