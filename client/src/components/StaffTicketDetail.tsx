import React, { useState, useEffect, useCallback } from "react";
import {
  StaffTicketDetailData,
  StaffUser,
  Priority,
  TicketStatus,
} from "../types.js";
import {
  fetchStaffTicketDetail,
  updateTicketOwner,
  updateTicketPriority,
  updateTicketStatus,
  fetchActiveStaffUsers,
} from "../api.js";
import { PublicComments } from "./PublicComments.js";
import { InternalNotes } from "./InternalNotes.js";

interface StaffTicketDetailProps {
  ticketId: number;
  onBack: () => void;
}

export const StaffTicketDetail: React.FC<StaffTicketDetailProps> = ({
  ticketId,
  onBack,
}) => {
  const [ticket, setTicket] = useState<StaffTicketDetailData | null>(null);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingOwner, setUpdatingOwner] = useState<boolean>(false);
  const [updatingPriority, setUpdatingPriority] = useState<boolean>(false);
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"comments" | "notes">("comments");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [ticketData, usersData] = await Promise.all([
        fetchStaffTicketDetail(ticketId),
        fetchActiveStaffUsers().catch(() => [] as StaffUser[]),
      ]);
      setTicket(ticketData);
      setStaffUsers(usersData);
    } catch (err: any) {
      setError(err.message || "Failed to load ticket details");
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const showNotification = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  // Ownership Claim / Reassign
  const handleAssignOwner = async (ownerId: number | null) => {
    if (!ticket) return;
    try {
      setUpdatingOwner(true);
      setError(null);
      const res = await updateTicketOwner(ticket.id, ownerId);
      setTicket((prev) => (prev ? { ...prev, owner: res.owner } : null));
      showNotification(
        ownerId ? `Assigned to ${res.owner?.fullName || "Staff"}` : "Unassigned ticket"
      );
    } catch (err: any) {
      setError(err.message || "Failed to update ticket owner");
    } finally {
      setUpdatingOwner(false);
    }
  };

  // IT Priority Update
  const handlePriorityChange = async (newPriority: Priority) => {
    if (!ticket || newPriority === ticket.itPriority) return;
    try {
      setUpdatingPriority(true);
      setError(null);
      const res = await updateTicketPriority(ticket.id, newPriority);
      setTicket((prev) => (prev ? { ...prev, itPriority: res.itPriority } : null));
      showNotification(`IT Priority updated to ${res.itPriority}`);
    } catch (err: any) {
      setError(err.message || "Failed to update priority");
    } finally {
      setUpdatingPriority(false);
    }
  };

  // Status Transition
  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!ticket || newStatus === ticket.status) return;
    try {
      setUpdatingStatus(true);
      setError(null);
      const res = await updateTicketStatus(ticket.id, newStatus);
      setTicket((prev) => (prev ? { ...prev, status: res.status } : null));
      showNotification(`Ticket status updated to ${res.status}`);
    } catch (err: any) {
      setError(err.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Permitted status transitions helper
  const getAllowedTransitions = (currentStatus: TicketStatus): TicketStatus[] => {
    switch (currentStatus) {
      case "New":
        return ["Open", "InProgress", "Cancelled"];
      case "Open":
        return ["InProgress", "WaitingForRequester", "Resolved", "Cancelled"];
      case "InProgress":
        return ["WaitingForRequester", "Resolved", "Cancelled"];
      case "WaitingForRequester":
        return ["InProgress", "Resolved", "Cancelled"];
      case "Resolved":
        return ["Closed", "Reopened"];
      case "Closed":
        return ["Reopened"];
      case "Reopened":
        return ["InProgress", "Resolved"];
      case "Cancelled":
        return [];
      default:
        return ["InProgress", "Resolved", "Closed", "Cancelled"];
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading ticket details...</span>
        </div>
        <p className="text-muted mt-2">Loading ticket details...</p>
      </div>
    );
  }

  if (error && !ticket) {
    return (
      <div className="container py-4" style={{ maxWidth: 800 }}>
        <div className="alert alert-danger" role="alert">
          <h5 className="alert-heading">Error Loading Ticket</h5>
          <p className="mb-3">{error}</p>
          <button className="btn btn-outline-danger btn-sm" onClick={onBack}>
            ← Back to Ticket Queue
          </button>
        </div>
      </div>
    );
  }

  if (!ticket) return null;

  const allowedStatuses = getAllowedTransitions(ticket.status);

  return (
    <div className="container-fluid px-4 py-3">
      {/* Breadcrumb & Top Bar */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item">
              <button
                type="button"
                className="btn btn-link p-0 text-decoration-none fw-semibold"
                style={{ color: "#006B3C" }}
                onClick={onBack}
              >
                ← Ticket Queue
              </button>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              {ticket.ticketNumber}
            </li>
          </ol>
        </nav>
        <button className="btn btn-outline-secondary btn-sm" onClick={onBack}>
          Back to Queue
        </button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show py-2 mb-3 small" role="alert">
          ✓ {successMessage}
        </div>
      )}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show py-2 mb-3 small" role="alert">
          ⚠ {error}
        </div>
      )}

      {/* Top Action Bar Card */}
      <div
        className="card border-0 shadow-sm rounded-3 mb-4"
        style={{ backgroundColor: "#FFFFFF", borderLeft: "4px solid #006B3C" }}
      >
        <div className="card-body p-3">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            {/* Ticket Header & Title */}
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <h2 className="h4 mb-0 fw-bold text-dark">{ticket.ticketNumber}</h2>
                <span className="badge bg-light text-dark border">{ticket.category?.name}</span>
                <span className="badge bg-light text-secondary border">{ticket.relatedSystem?.name}</span>
              </div>
              <p className="text-muted small mb-0">
                Created: {new Date(ticket.createdAt).toLocaleString()} • Last Updated:{" "}
                {new Date(ticket.updatedAt).toLocaleString()}
              </p>
            </div>

            {/* Workflow Action Controls */}
            <div className="d-flex align-items-center gap-3 flex-wrap">
              {/* Ownership Control */}
              <div className="d-flex align-items-center gap-2">
                <span className="small text-muted fw-semibold">Owner:</span>
                {ticket.owner ? (
                  <select
                    id="ticket-owner-select"
                    className="form-select form-select-sm"
                    style={{ minWidth: "170px" }}
                    value={ticket.owner.id}
                    disabled={updatingOwner}
                    onChange={(e) => handleAssignOwner(Number(e.target.value))}
                  >
                    <option value={ticket.owner.id}>👤 {ticket.owner.fullName}</option>
                    {staffUsers
                      .filter((u) => u.id !== ticket.owner?.id)
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          👤 {u.fullName} ({u.role})
                        </option>
                      ))}
                    <option value="unassign">Unassign Ticket</option>
                  </select>
                ) : (
                  <div className="d-flex gap-2">
                    <span className="badge bg-warning-subtle text-warning-emphasis align-self-center py-2 px-3 border border-warning-subtle">
                      Unassigned
                    </span>
                    {staffUsers.length > 0 && (
                      <select
                        id="ticket-claim-select"
                        className="form-select form-select-sm"
                        style={{ minWidth: "160px" }}
                        defaultValue=""
                        disabled={updatingOwner}
                        onChange={(e) => {
                          if (e.target.value) handleAssignOwner(Number(e.target.value));
                        }}
                      >
                        <option value="" disabled>
                          Claim / Assign To...
                        </option>
                        {staffUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            👤 {u.fullName}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>

              {/* IT Priority Dropdown */}
              <div className="d-flex align-items-center gap-2">
                <span className="small text-muted fw-semibold">IT Priority:</span>
                <select
                  id="ticket-it-priority-select"
                  className="form-select form-select-sm fw-semibold"
                  style={{ minWidth: "120px" }}
                  value={ticket.itPriority}
                  disabled={updatingPriority}
                  onChange={(e) => handlePriorityChange(e.target.value as Priority)}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              {/* Status Transition Dropdown */}
              <div className="d-flex align-items-center gap-2">
                <span className="small text-muted fw-semibold">Status:</span>
                <select
                  id="ticket-status-select"
                  className="form-select form-select-sm fw-semibold"
                  style={{ minWidth: "140px" }}
                  value={ticket.status}
                  disabled={updatingStatus || allowedStatuses.length === 0}
                  onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                >
                  <option value={ticket.status}>{ticket.status} (Current)</option>
                  {allowedStatuses.map((st) => (
                    <option key={st} value={st}>
                      → {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dual-Column Content */}
      <div className="row g-4">
        {/* Left Column: Ticket Details, Requester Info & Attachments */}
        <div className="col-12 col-lg-7">
          <div className="card border-0 shadow-sm rounded-3 mb-4" style={{ backgroundColor: "#FFFFFF" }}>
            <div className="card-body p-4">
              <h3 className="h5 fw-bold text-dark mb-3">{ticket.summary}</h3>
              <div
                className="p-3 rounded-3 mb-4 text-dark"
                style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB", whiteSpace: "pre-wrap" }}
              >
                {ticket.description}
              </div>

              {/* Requester & Priority Grid */}
              <div className="row g-3 p-3 rounded-3 mb-4" style={{ backgroundColor: "#F5F7F6" }}>
                <div className="col-6 col-md-3">
                  <div className="text-muted small">Requester</div>
                  <div className="fw-semibold text-dark">{ticket.requester.fullName}</div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="text-muted small">Department</div>
                  <div className="fw-semibold text-dark">{ticket.requester.department || "General"}</div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="text-muted small">Requester Priority</div>
                  <div>
                    <span className="badge bg-secondary-subtle text-secondary border">
                      {ticket.requestedPriority} (Fixed)
                    </span>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="text-muted small">Assigned IT Priority</div>
                  <div>
                    <span className="badge bg-primary-subtle text-primary border">
                      {ticket.itPriority}
                    </span>
                  </div>
                </div>
              </div>

              {/* Attachments Section */}
              <div className="border-top pt-3">
                <h5 className="h6 fw-bold text-dark mb-3">
                  📎 Attachments ({ticket.attachments.filter((a) => !a.isRemoved).length})
                </h5>
                {ticket.attachments.length === 0 ? (
                  <p className="text-muted small mb-0">No files attached to this ticket.</p>
                ) : (
                  <ul className="list-group list-group-flush">
                    {ticket.attachments.map((att) => (
                      <li
                        key={att.id}
                        className="list-group-item d-flex justify-content-between align-items-center px-0 py-2"
                      >
                        <div className="d-flex align-items-center gap-2">
                          <span>📄</span>
                          <div>
                            <div className={`small fw-medium ${att.isRemoved ? "text-decoration-line-through text-muted" : "text-dark"}`}>
                              {att.originalName}
                            </div>
                            <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                              {(att.fileSizeBytes / 1024).toFixed(1)} KB • {att.mimeType}
                              {att.isRemoved && (
                                <span className="text-danger ms-2">
                                  [Removed: {att.removalReason || "Administrative removal"}]
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Tabbed Activity Feed (Public Comments vs Internal Notes) */}
        <div className="col-12 col-lg-5">
          {/* Tabs Navigation */}
          <ul className="nav nav-pills nav-fill mb-3 p-1 rounded-3 bg-white shadow-sm border">
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link fw-semibold ${activeTab === "comments" ? "active bg-success text-white" : "text-secondary"}`}
                onClick={() => setActiveTab("comments")}
              >
                💬 Public Comments
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link fw-semibold ${
                  activeTab === "notes" ? "active text-white" : "text-secondary"
                }`}
                style={activeTab === "notes" ? { backgroundColor: "#D97706" } : {}}
                onClick={() => setActiveTab("notes")}
              >
                🔒 Internal Notes
              </button>
            </li>
          </ul>

          {/* Active Tab View */}
          {activeTab === "comments" ? (
            <PublicComments ticketId={ticket.id} />
          ) : (
            <InternalNotes ticketId={ticket.id} />
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffTicketDetail;
