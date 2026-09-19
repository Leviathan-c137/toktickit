import React, { useState, useEffect, useCallback } from "react";
import {
  StaffTicketItem,
  StaffTicketPagination,
  Category,
  Priority,
  TicketStatus,
} from "../types.js";
import { fetchStaffTicketQueue, fetchCategories } from "../api.js";

interface StaffTicketQueueProps {
  onSelectTicket?: (ticketId: number) => void;
}

export const StaffTicketQueue: React.FC<StaffTicketQueueProps> = ({
  onSelectTicket,
}) => {
  // Data states
  const [tickets, setTickets] = useState<StaffTicketItem[]>([]);
  const [pagination, setPagination] = useState<StaffTicketPagination>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search states
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("All");
  const [status, setStatus] = useState<string>("All");
  const [itPriority, setItPriority] = useState<string>("All");
  const [ownerId, setOwnerId] = useState<string>("All");
  const [sortValue, setSortValue] = useState<string>("createdAt:desc");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Load available categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const cats = await fetchCategories();
        setCategories(cats);
      } catch {
        // Non-blocking fallback
      }
    }
    loadCategories();
  }, []);

  // Fetch queue tickets
  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [sortBy, sortOrder] = sortValue.split(":") as [any, any];

    try {
      const res = await fetchStaffTicketQueue({
        search: debouncedSearch.trim() || undefined,
        categoryId: categoryId !== "All" ? categoryId : undefined,
        status: status !== "All" ? status : undefined,
        itPriority: itPriority !== "All" ? itPriority : undefined,
        ownerId: ownerId !== "All" ? ownerId : undefined,
        sortBy,
        sortOrder,
        page,
        limit,
      });

      setTickets(res.tickets);
      setPagination(res.pagination);
    } catch (err: any) {
      setError(err.message || "Failed to load staff ticket queue");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, categoryId, status, itPriority, ownerId, sortValue, page, limit]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  // Reset filters
  const handleResetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setCategoryId("All");
    setStatus("All");
    setItPriority("All");
    setOwnerId("All");
    setSortValue("createdAt:desc");
    setPage(1);
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    categoryId !== "All" ||
    status !== "All" ||
    itPriority !== "All" ||
    ownerId !== "All";

  // Helpers for badge styling
  const getStatusBadge = (ticketStatus: TicketStatus) => {
    switch (ticketStatus) {
      case "New":
        return <span className="badge bg-info text-dark">New</span>;
      case "Open":
        return <span className="badge bg-primary">Open</span>;
      case "InProgress":
        return (
          <span
            className="badge"
            style={{ backgroundColor: "#2563EB", color: "#FFFFFF" }}
          >
            In Progress
          </span>
        );
      case "Pending":
      case "WaitingForRequester":
        return (
          <span
            className="badge"
            style={{ backgroundColor: "#D97706", color: "#FFFFFF" }}
          >
            {ticketStatus === "WaitingForRequester" ? "Waiting Requester" : "Pending"}
          </span>
        );
      case "Resolved":
        return (
          <span
            className="badge"
            style={{ backgroundColor: "#16A34A", color: "#FFFFFF" }}
          >
            Resolved
          </span>
        );
      case "Closed":
        return <span className="badge bg-secondary">Closed</span>;
      case "Cancelled":
        return <span className="badge bg-danger">Cancelled</span>;
      default:
        return <span className="badge bg-light text-dark">{ticketStatus}</span>;
    }
  };

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case "Low":
        return (
          <span
            className="badge"
            style={{ backgroundColor: "#EAF6EF", color: "#006B3C", border: "1px solid #A7F3D0" }}
          >
            Low
          </span>
        );
      case "Medium":
        return (
          <span
            className="badge"
            style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE" }}
          >
            Medium
          </span>
        );
      case "High":
        return (
          <span
            className="badge"
            style={{ backgroundColor: "#FEF3C7", color: "#B45309", border: "1px solid #FDE68A" }}
          >
            High
          </span>
        );
      case "Urgent":
        return (
          <span
            className="badge"
            style={{ backgroundColor: "#FEE2E2", color: "#B91C1C", border: "1px solid #FECACA" }}
          >
            Urgent
          </span>
        );
      default:
        return <span className="badge bg-light text-dark">{priority}</span>;
    }
  };

  return (
    <div className="container-fluid px-4 py-3">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <div className="d-flex align-items-center gap-3">
            <h1 className="h3 mb-0 fw-bold" style={{ color: "#006B3C" }}>
              IT Staff Ticket Queue
            </h1>
            <span
              className="badge px-3 py-2 rounded-pill fw-semibold"
              style={{ backgroundColor: "#EAF6EF", color: "#006B3C", fontSize: "0.85rem" }}
            >
              {pagination.totalCount} {pagination.totalCount === 1 ? "Ticket" : "Tickets"}
            </span>
          </div>
          <p className="text-muted small mb-0 mt-1">
            Manage, triage, and process incoming support tickets across university systems.
          </p>
        </div>
        <button
          className="btn btn-outline-success btn-sm d-flex align-items-center gap-1"
          onClick={loadQueue}
          disabled={loading}
          title="Refresh ticket queue"
        >
          <span>↻ Refresh</span>
        </button>
      </div>

      {/* Filter Toolbar Card */}
      <div className="card border-0 shadow-sm rounded-3 mb-4" style={{ backgroundColor: "#FFFFFF" }}>
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            {/* Search Input */}
            <div className="col-12 col-md-4 col-lg-3">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light border-end-0">🔍</span>
                <input
                  id="queue-search"
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search ticket # or summary..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    className="btn btn-outline-secondary border-start-0"
                    type="button"
                    onClick={() => setSearch("")}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter */}
            <div className="col-6 col-md-2">
              <select
                id="queue-category-filter"
                className="form-select form-select-sm"
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setPage(1);
                }}
              >
                <option value="All">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="col-6 col-md-2">
              <select
                id="queue-status-filter"
                className="form-select form-select-sm"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="All">All Statuses</option>
                <option value="New">New</option>
                <option value="Open">Open</option>
                <option value="InProgress">In Progress</option>
                <option value="Pending">Pending</option>
                <option value="WaitingForRequester">Waiting for Requester</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* IT Priority Filter */}
            <div className="col-6 col-md-2">
              <select
                id="queue-priority-filter"
                className="form-select form-select-sm"
                value={itPriority}
                onChange={(e) => {
                  setItPriority(e.target.value);
                  setPage(1);
                }}
              >
                <option value="All">All IT Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            {/* Owner Filter */}
            <div className="col-6 col-md-2 col-lg-1">
              <select
                id="queue-owner-filter"
                className="form-select form-select-sm"
                value={ownerId}
                onChange={(e) => {
                  setOwnerId(e.target.value);
                  setPage(1);
                }}
              >
                <option value="All">All Owners</option>
                <option value="unassigned">Unassigned</option>
                <option value="me">Assigned to Me</option>
              </select>
            </div>

            {/* Sort & Reset Actions */}
            <div className="col-12 col-lg-2 d-flex gap-2">
              <select
                id="queue-sort-filter"
                className="form-select form-select-sm"
                value={sortValue}
                onChange={(e) => {
                  setSortValue(e.target.value);
                  setPage(1);
                }}
              >
                <option value="createdAt:desc">Created (Newest)</option>
                <option value="createdAt:asc">Created (Oldest)</option>
                <option value="ticketNumber:asc">Ticket # (A-Z)</option>
                <option value="ticketNumber:desc">Ticket # (Z-A)</option>
                <option value="updatedAt:desc">Last Updated</option>
                <option value="itPriority:desc">IT Priority</option>
              </select>

              {hasActiveFilters && (
                <button
                  className="btn btn-outline-secondary btn-sm flex-shrink-0"
                  onClick={handleResetFilters}
                  title="Clear all filters"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger d-flex align-items-center justify-content-between mb-4" role="alert">
          <div>
            <strong>Error: </strong> {error}
          </div>
          <button className="btn btn-outline-danger btn-sm" onClick={loadQueue}>
            Try Again
          </button>
        </div>
      )}

      {/* Main Queue Data Grid Card */}
      <div className="card border-0 shadow-sm rounded-3 overflow-hidden" style={{ backgroundColor: "#FFFFFF" }}>
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading ticket queue...</span>
            </div>
            <p className="text-muted mt-2 mb-0">Loading ticket queue...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-5 px-3">
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
              style={{ width: "64px", height: "64px", backgroundColor: "#EAF6EF", color: "#006B3C", fontSize: "1.75rem" }}
            >
              📋
            </div>
            {hasActiveFilters ? (
              <>
                <h5 className="fw-bold text-dark mb-1">No matching tickets found</h5>
                <p className="text-muted small mb-3">
                  No tickets match your active filter and search criteria.
                </p>
                <button className="btn btn-success btn-sm px-3" onClick={handleResetFilters}>
                  Clear Filters
                </button>
              </>
            ) : (
              <>
                <h5 className="fw-bold text-dark mb-1">The Ticket Queue is Empty</h5>
                <p className="text-muted small mb-0">There are currently no tickets in the system.</p>
              </>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ minWidth: "900px" }}>
              <thead style={{ backgroundColor: "#F9FAFB", fontSize: "0.85rem", color: "#4B5563" }}>
                <tr>
                  <th scope="col" style={{ width: "160px" }}>Ticket No</th>
                  <th scope="col" style={{ width: "130px" }}>Created</th>
                  <th scope="col">Summary</th>
                  <th scope="col" style={{ width: "130px" }}>Category</th>
                  <th scope="col" style={{ width: "150px" }}>Requester</th>
                  <th scope="col" style={{ width: "110px" }}>Req. Priority</th>
                  <th scope="col" style={{ width: "110px" }}>IT Priority</th>
                  <th scope="col" style={{ width: "120px" }}>Status</th>
                  <th scope="col" style={{ width: "140px" }}>Owner</th>
                  <th scope="col" className="text-end" style={{ width: "110px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id} style={{ cursor: onSelectTicket ? "pointer" : "default" }}>
                    <td className="fw-semibold">
                      <span
                        className="text-decoration-none"
                        style={{ color: "#006B3C", cursor: "pointer" }}
                        onClick={() => onSelectTicket && onSelectTicket(t.id)}
                      >
                        {t.ticketNumber}
                      </span>
                    </td>
                    <td className="text-muted small">
                      {new Date(t.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td>
                      <div className="fw-medium text-dark text-truncate" style={{ maxWidth: "320px" }}>
                        {t.summary}
                      </div>
                      <div className="text-muted small" style={{ fontSize: "0.75rem" }}>
                        System: {t.relatedSystem?.name || "General"}
                        {t._count && t._count.attachments > 0 && ` • 📎 ${t._count.attachments}`}
                        {t._count && t._count.publicComments > 0 && ` • 💬 ${t._count.publicComments}`}
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">
                        {t.category?.name || "Uncategorized"}
                      </span>
                    </td>
                    <td>
                      <div className="small fw-semibold text-dark">{t.requester?.fullName}</div>
                      {t.requester?.department && (
                        <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                          {t.requester.department}
                        </div>
                      )}
                    </td>
                    <td>{getPriorityBadge(t.requestedPriority)}</td>
                    <td>{getPriorityBadge(t.itPriority)}</td>
                    <td>{getStatusBadge(t.status)}</td>
                    <td>
                      {t.owner ? (
                        <span className="badge bg-light text-dark border d-inline-flex align-items-center gap-1">
                          👤 {t.owner.fullName}
                        </span>
                      ) : (
                        <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-outline-success"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectTicket) onSelectTicket(t.id);
                        }}
                      >
                        View Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && tickets.length > 0 && (
          <div className="card-footer bg-white border-top py-3 px-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div className="text-muted small">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{" "}
              <strong>{pagination.totalCount}</strong> tickets
            </div>

            <div className="d-flex align-items-center gap-3">
              {/* Limit selector */}
              <div className="d-flex align-items-center gap-1 small text-muted">
                <span>Show</span>
                <select
                  className="form-select form-select-sm"
                  style={{ width: "auto" }}
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              {/* Pagination navigation buttons */}
              <div className="btn-group btn-group-sm" role="group">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <span className="btn btn-outline-secondary disabled text-dark">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffTicketQueue;
