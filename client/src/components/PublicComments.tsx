import React, { useState, useEffect } from "react";
import { PublicComment } from "../types.js";
import { fetchPublicComments, createPublicComment } from "../api.js";

interface PublicCommentsProps {
  ticketId: number;
}

export const PublicComments: React.FC<PublicCommentsProps> = ({ ticketId }) => {
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [newContent, setNewContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const loadComments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchPublicComments(ticketId);
      setComments(data);
    } catch (err: any) {
      setError(err.message || "Failed to load public comments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [ticketId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) {
      setError("Comment cannot be empty");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const added = await createPublicComment(ticketId, newContent.trim());
      setComments((prev) => [...prev, added]);
      setNewContent("");
    } catch (err: any) {
      setError(err.message || "Failed to post comment");
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
    if (role === "ITStaff") {
      return { backgroundColor: "#DBEAFE", color: "#1E40AF" };
    }
    if (role === "Administrator") {
      return { backgroundColor: "#FEF3C7", color: "#92400E" };
    }
    return { backgroundColor: "#E5E7EB", color: "#374151" };
  };

  return (
    <div className="card mt-4 border-0 shadow-sm" style={{ backgroundColor: "#FFFFFF" }}>
      <div className="card-body p-4">
        <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
          <div className="d-flex align-items-center gap-2">
            <span
              style={{
                display: "inline-block",
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: "#006B3C",
              }}
            ></span>
            <h5 className="mb-0 fw-semibold" style={{ color: "#1F2937" }}>
              Public Comments ({comments.length})
            </h5>
          </div>
          <span
            className="badge rounded-pill px-3 py-1"
            style={{ backgroundColor: "#EAF6EF", color: "#006B3C", fontSize: "0.8rem" }}
          >
            Visible to Requester & IT Staff
          </span>
        </div>

        {error && (
          <div className="alert alert-danger py-2 px-3 mb-3 small" role="alert">
            {error}
          </div>
        )}

        {/* Comment Thread */}
        {loading ? (
          <div className="text-center py-4 text-muted small">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div
            className="text-center py-4 text-muted small rounded mb-3"
            style={{ backgroundColor: "#F9FAFB" }}
          >
            No public comments yet. Post the first message below.
          </div>
        ) : (
          <div className="comment-list d-flex flex-column gap-3 mb-4">
            {comments.map((c) => (
              <div
                key={c.id}
                className="p-3 rounded"
                style={{
                  backgroundColor: "#F4FBF7",
                  borderLeft: "4px solid #006B3C",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                }}
              >
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <span className="fw-semibold text-dark small">
                      {c.author.fullName}
                    </span>
                    <span
                      className="badge rounded-pill"
                      style={{
                        ...getRoleBadgeStyle(c.author.role),
                        fontSize: "0.72rem",
                        padding: "3px 8px",
                      }}
                    >
                      {c.author.role === "ITStaff" ? "IT Support" : c.author.role}
                    </span>
                  </div>
                  <span className="text-muted" style={{ fontSize: "0.78rem" }}>
                    {formatDateTime(c.createdAt)}
                  </span>
                </div>
                <div
                  className="small text-dark"
                  style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}
                >
                  {c.content}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* New Comment Input Form */}
        <form onSubmit={handleSubmit} className="mt-2">
          <div className="mb-2">
            <label
              htmlFor="publicCommentInput"
              className="form-label small fw-semibold text-secondary"
            >
              Add Public Comment
            </label>
            <textarea
              id="publicCommentInput"
              className="form-control form-control-sm"
              rows={3}
              placeholder="Type your message to IT Support..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              disabled={submitting}
              maxLength={2000}
              style={{
                borderRadius: "6px",
                borderColor: "#D1D5DB",
              }}
            />
          </div>
          <div className="d-flex justify-content-between align-items-center">
            <span className="text-muted" style={{ fontSize: "0.75rem" }}>
              {newContent.length} / 2000 characters
            </span>
            <button
              type="submit"
              id="submitCommentBtn"
              className="btn btn-sm text-white px-4 fw-medium"
              disabled={submitting || !newContent.trim()}
              style={{
                backgroundColor: "#006B3C",
                borderColor: "#006B3C",
                borderRadius: "6px",
              }}
            >
              {submitting ? "Posting..." : "Post Comment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PublicComments;
