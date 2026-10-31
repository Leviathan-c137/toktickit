import React, { useState, useEffect, useCallback } from "react";
import { StaffDashboardData, TicketStatus, User } from "../types.js";
import { fetchStaffDashboard } from "../api.js";

interface StaffDashboardProps {
  currentUser?: User | null;
  onCreateTicket?: () => void;
  onViewQueue: (filter?: { status?: string; ownerId?: string }) => void;
  onSelectTicket: (ticketId: number) => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  currentUser,
  onCreateTicket,
  onViewQueue,
  onSelectTicket,
}) => {
  const [data, setData] = useState<StaffDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadDashboard = useCallback(async () => {
    try {
      setError(null);
      const res = await fetchStaffDashboard();
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load staff dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadDashboard();
  }, [loadDashboard]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case "New":
        return <span className="badge" style={{ backgroundColor: "#E0E7FF", color: "#3730A3" }}>New</span>;
      case "Open":
        return <span className="badge" style={{ backgroundColor: "#DBEAFE", color: "#1E40AF" }}>Open</span>;
      case "InProgress":
        return <span className="badge" style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}>In Progress</span>;
      case "WaitingForRequester":
      case "Pending":
        return <span className="badge" style={{ backgroundColor: "#F3E8FF", color: "#6B21A8" }}>Waiting Req</span>;
      case "Resolved":
        return <span className="badge" style={{ backgroundColor: "#D1FAE5", color: "#065F46" }}>Resolved</span>;
      case "Closed":
        return <span className="badge" style={{ backgroundColor: "#F3F4F6", color: "#374151" }}>Closed</span>;
      case "Cancelled":
        return <span className="badge" style={{ backgroundColor: "#FEE2E2", color: "#991B1B" }}>Cancelled</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Urgent":
        return <span className="badge bg-danger">Urgent</span>;
      case "High":
        return <span className="badge" style={{ backgroundColor: "#FED7AA", color: "#9A3412" }}>High</span>;
      case "Medium":
        return <span className="badge" style={{ backgroundColor: "#FEF08A", color: "#854D0E" }}>Medium</span>;
      case "Low":
        return <span className="badge" style={{ backgroundColor: "#E2E8F0", color: "#334155" }}>Low</span>;
      default:
        return <span className="badge bg-light text-dark">{priority}</span>;
    }
  };

  if (loading && !data) {
    return (
      <div className="container py-5 text-center" data-testid="staff-dashboard-loading">
        <div className="spinner-border" style={{ color: "#006B3C" }} role="status">
          <span className="visually-hidden">Loading queue metrics...</span>
        </div>
        <p className="text-muted mt-2">Loading IT Staff service desk dashboard...</p>
      </div>
    );
  }

  const staffName = currentUser?.fullName?.split(" ")[0] || "Staff";
  const metrics = data?.metrics || {
    newTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    waitingForRequesterTickets: 0,
    myAssignedTickets: 0,
    unassignedTickets: 0,
  };
  const recentTickets = data?.recentTickets || [];

  return (
    <div className="container py-4" style={{ maxWidth: 1200 }} data-testid="staff-dashboard">
      {/* Header & Refresh */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h1 className="h3 fw-bold mb-1" style={{ color: "#1F2937" }}>
            Welcome back, {staffName}!
          </h1>
          <p className="text-muted mb-0" style={{ fontSize: "0.95rem" }}>
            Here is what's happening with your queue today:
          </p>
        </div>
        <button
          className="btn btn-outline-success btn-sm d-flex align-items-center gap-2 fw-semibold"
          onClick={handleRefresh}
          disabled={refreshing}
          data-testid="refresh-staff-dashboard-btn"
        >
          {refreshing ? (
            <>
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
              <span>Refreshing...</span>
            </>
          ) : (
            <>
              <span>↻</span>
              <span>Refresh Data</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="alert alert-danger shadow-sm border-0 mb-4" role="alert">
          {error}
        </div>
      )}

      {/* 5 Metric Summary Cards (UI Spec 3.1, 4.1) */}
      <div className="row g-3 mb-4" data-testid="staff-metric-cards">
        {/* Card 1: New */}
        <div className="col-12 col-sm-6 col-md-4 col-xl" style={{ minWidth: "180px" }}>
          <div
            className="card border-0 shadow-sm rounded-3 h-100"
            style={{ borderLeft: "4px solid #6366F1", backgroundColor: "#FFFFFF" }}
            data-testid="metric-card-new"
          >
            <div className="card-body p-3 d-flex flex-column justify-content-between">
              <div>
                <span className="text-uppercase fw-semibold" style={{ fontSize: "0.75rem", color: "#6B7280" }}>
                  New
                </span>
                <div className="display-6 fw-bold my-1" style={{ color: "#4F46E5" }}>
                  {metrics.newTickets}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-link p-0 text-start text-decoration-none fw-semibold"
                style={{ color: "#4F46E5", fontSize: "0.85rem" }}
                onClick={() => onViewQueue({ status: "New" })}
                data-testid="drilldown-new"
              >
                View all →
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Open */}
        <div className="col-12 col-sm-6 col-md-4 col-xl" style={{ minWidth: "180px" }}>
          <div
            className="card border-0 shadow-sm rounded-3 h-100"
            style={{ borderLeft: "4px solid #006B3C", backgroundColor: "#FFFFFF" }}
            data-testid="metric-card-open"
          >
            <div className="card-body p-3 d-flex flex-column justify-content-between">
              <div>
                <span className="text-uppercase fw-semibold" style={{ fontSize: "0.75rem", color: "#6B7280" }}>
                  Open
                </span>
                <div className="display-6 fw-bold my-1" style={{ color: "#006B3C" }}>
                  {metrics.openTickets}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-link p-0 text-start text-decoration-none fw-semibold"
                style={{ color: "#006B3C", fontSize: "0.85rem" }}
                onClick={() => onViewQueue({ status: "Open" })}
                data-testid="drilldown-open"
              >
                View all →
              </button>
            </div>
          </div>
        </div>

        {/* Card 3: In Progress */}
        <div className="col-12 col-sm-6 col-md-4 col-xl" style={{ minWidth: "180px" }}>
          <div
            className="card border-0 shadow-sm rounded-3 h-100"
            style={{ borderLeft: "4px solid #2563EB", backgroundColor: "#FFFFFF" }}
            data-testid="metric-card-inprogress"
          >
            <div className="card-body p-3 d-flex flex-column justify-content-between">
              <div>
                <span className="text-uppercase fw-semibold" style={{ fontSize: "0.75rem", color: "#6B7280" }}>
                  In Progress
                </span>
                <div className="display-6 fw-bold my-1" style={{ color: "#2563EB" }}>
                  {metrics.inProgressTickets}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-link p-0 text-start text-decoration-none fw-semibold"
                style={{ color: "#2563EB", fontSize: "0.85rem" }}
                onClick={() => onViewQueue({ status: "InProgress" })}
                data-testid="drilldown-inprogress"
              >
                View all →
              </button>
            </div>
          </div>
        </div>

        {/* Card 4: Waiting Req */}
        <div className="col-12 col-sm-6 col-md-4 col-xl" style={{ minWidth: "180px" }}>
          <div
            className="card border-0 shadow-sm rounded-3 h-100"
            style={{ borderLeft: "4px solid #8B5CF6", backgroundColor: "#FFFFFF" }}
            data-testid="metric-card-waiting"
          >
            <div className="card-body p-3 d-flex flex-column justify-content-between">
              <div>
                <span className="text-uppercase fw-semibold" style={{ fontSize: "0.75rem", color: "#6B7280" }}>
                  Waiting Req
                </span>
                <div className="display-6 fw-bold my-1" style={{ color: "#7C3AED" }}>
                  {metrics.waitingForRequesterTickets}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-link p-0 text-start text-decoration-none fw-semibold"
                style={{ color: "#7C3AED", fontSize: "0.85rem" }}
                onClick={() => onViewQueue({ status: "WaitingForRequester" })}
                data-testid="drilldown-waiting"
              >
                View all →
              </button>
            </div>
          </div>
        </div>

        {/* Card 5: My Assigned */}
        <div className="col-12 col-sm-6 col-md-4 col-xl" style={{ minWidth: "180px" }}>
          <div
            className="card border-0 shadow-sm rounded-3 h-100"
            style={{ borderLeft: "4px solid #059669", backgroundColor: "#FFFFFF" }}
            data-testid="metric-card-my-assigned"
          >
            <div className="card-body p-3 d-flex flex-column justify-content-between">
              <div>
                <span className="text-uppercase fw-semibold" style={{ fontSize: "0.75rem", color: "#6B7280" }}>
                  My Assigned
                </span>
                <div className="display-6 fw-bold my-1" style={{ color: "#059669" }}>
                  {metrics.myAssignedTickets}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-link p-0 text-start text-decoration-none fw-semibold"
                style={{ color: "#059669", fontSize: "0.85rem" }}
                onClick={() => onViewQueue({ ownerId: currentUser ? String(currentUser.id) : undefined })}
                data-testid="drilldown-my-assigned"
              >
                View all →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Section: Recent Queue Tickets (70%) + Quick Actions (30%) */}
      <div className="row g-4">
        {/* Recent Tickets Table */}
        <div className="col-12 col-lg-8">
          <div className="card border-0 shadow-sm rounded-3 h-100">
            <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
              <h2 className="h5 fw-bold mb-0" style={{ color: "#1F2937" }}>
                Recent Tickets
              </h2>
              <button
                type="button"
                className="btn btn-link btn-sm p-0 text-decoration-none fw-semibold"
                style={{ color: "#006B3C" }}
                onClick={() => onViewQueue()}
                data-testid="view-all-queue-btn"
              >
                View all tickets →
              </button>
            </div>

            <div className="card-body p-0">
              {recentTickets.length === 0 ? (
                <div className="text-center py-5 px-3" data-testid="empty-recent-queue-tickets">
                  <div className="mb-2" style={{ fontSize: "2.5rem", color: "#9CA3AF" }}>
                    📥
                  </div>
                  <h3 className="h6 fw-bold text-dark mb-1">Queue is clear!</h3>
                  <p className="text-muted mb-0" style={{ fontSize: "0.875rem" }}>
                    There are no recent tickets requiring attention.
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0" data-testid="staff-recent-tickets-table">
                    <thead className="table-light">
                      <tr style={{ fontSize: "0.8rem", textTransform: "uppercase" }}>
                        <th style={{ width: "16%" }}>Ticket ID</th>
                        <th style={{ width: "36%" }}>Summary</th>
                        <th style={{ width: "14%" }}>Status</th>
                        <th style={{ width: "12%" }}>Priority</th>
                        <th style={{ width: "14%" }}>Requester</th>
                        <th style={{ width: "8%" }} className="text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTickets.map((t) => (
                        <tr
                          key={t.id}
                          style={{ cursor: "pointer" }}
                          onClick={() => onSelectTicket(t.id)}
                          data-testid={`staff-recent-ticket-row-${t.id}`}
                        >
                          <td className="fw-semibold text-dark" style={{ fontSize: "0.9rem" }}>
                            {t.ticketNumber}
                          </td>
                          <td>
                            <div className="text-truncate fw-medium text-dark" style={{ maxWidth: 280 }}>
                              {t.summary}
                            </div>
                            <small className="text-muted">
                              {t.owner ? `Assigned to: ${t.owner.fullName}` : "Unassigned"}
                            </small>
                          </td>
                          <td>{getStatusBadge(t.status)}</td>
                          <td>{getPriorityBadge(t.itPriority)}</td>
                          <td className="text-truncate" style={{ maxWidth: 120 }}>
                            <span style={{ fontSize: "0.875rem" }}>{t.requester.fullName}</span>
                          </td>
                          <td className="text-end">
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm py-0 px-2"
                              style={{ fontSize: "0.8rem" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectTicket(t.id);
                              }}
                              data-testid={`staff-view-ticket-${t.id}`}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions Sidebar */}
        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm rounded-3">
            <div className="card-header bg-white border-bottom py-3">
              <h2 className="h5 fw-bold mb-0" style={{ color: "#1F2937" }}>
                Quick Actions
              </h2>
            </div>
            <div className="card-body p-3 d-flex flex-column gap-3">
              {onCreateTicket && (
                <button
                  type="button"
                  className="btn btn-success d-flex align-items-center justify-content-between p-3 rounded-3 text-white fw-semibold shadow-sm"
                  style={{ backgroundColor: "#006B3C", borderColor: "#006B3C" }}
                  onClick={onCreateTicket}
                  data-testid="staff-quick-create-ticket"
                >
                  <div className="d-flex align-items-center gap-2">
                    <span style={{ fontSize: "1.2rem" }}>+</span>
                    <span>Create Ticket</span>
                  </div>
                  <span>→</span>
                </button>
              )}

              <button
                type="button"
                className="btn btn-outline-secondary d-flex align-items-center justify-content-between p-3 rounded-3 fw-semibold text-dark"
                onClick={() => onViewQueue()}
                data-testid="staff-quick-search-queue"
              >
                <div className="d-flex align-items-center gap-2">
                  <span style={{ fontSize: "1.1rem" }}>🔍</span>
                  <span>Search Queue</span>
                </div>
                <span>→</span>
              </button>

              <button
                type="button"
                className="btn btn-outline-success d-flex align-items-center justify-content-between p-3 rounded-3 fw-semibold"
                style={{ color: "#006B3C", borderColor: "#A7F3D0" }}
                onClick={() => onViewQueue({ ownerId: currentUser ? String(currentUser.id) : undefined })}
                data-testid="staff-quick-my-queue"
              >
                <div className="d-flex align-items-center gap-2">
                  <span style={{ fontSize: "1.1rem" }}>📌</span>
                  <span>My Queue</span>
                </div>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
