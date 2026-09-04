import React, { useState, useEffect, useCallback } from "react";
import {
  TicketListItem,
  PaginationMetadata,
  Category,
  Priority,
  TicketStatus,
} from "../types.js";
import { fetchMyTickets, fetchCategories } from "../api.js";
import { useRequester } from "../context/RequesterContext.js";

interface MyTicketsProps {
  onCreateTicket: () => void;
  onSelectTicket?: (ticketId: number) => void;
}

export const MyTickets: React.FC<MyTicketsProps> = ({
  onCreateTicket,
  onSelectTicket,
}) => {
  const { currentRequester } = useRequester();

  // Data & loading states
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMetadata>({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search states
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [requestedPriority, setRequestedPriority] = useState<Priority | "">("");
  const [status, setStatus] = useState<TicketStatus | "">("");
  const [sortBy, setSortBy] = useState<"createdAt" | "ticketNumber" | "updatedAt">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on search change
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Load available categories for filter dropdown
  useEffect(() => {
    async function loadCategories() {
      try {
        const cats = await fetchCategories();
        setCategories(cats);
      } catch {
        // Non-blocking: category filter will just be empty or fallback
      }
    }
    loadCategories();
  }, []);

  // Fetch tickets whenever requester, filters, or pagination change
  const loadTickets = useCallback(async () => {
    if (!currentRequester) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetchMyTickets(currentRequester.id, {
        search: debouncedSearch.trim() || undefined,
        categoryId: categoryId !== "" ? Number(categoryId) : undefined,
        requestedPriority: requestedPriority || undefined,
        status: status || undefined,
        sortBy,
        sortOrder,
        page,
        limit,
      });

      setTickets(res.items);
      setPagination(res.pagination);
    } catch (err: any) {
      setError(err.message || "Failed to load tickets. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [
    currentRequester,
    debouncedSearch,
    categoryId,
    requestedPriority,
    status,
    sortBy,
    sortOrder,
    page,
    limit,
  ]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // Clear filters handler
  const handleClearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setCategoryId("");
    setRequestedPriority("");
    setStatus("");
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    search.trim() ||
      categoryId !== "" ||
      requestedPriority !== "" ||
      status !== ""
  );

  // Priority Badge Helper
  const renderPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case "Urgent":
        return (
          <span
            className="badge rounded-pill px-2 py-1"
            style={{ backgroundColor: "#FEE2E2", color: "#DC2626", fontWeight: 600 }}
          >
            ● Urgent
          </span>
        );
      case "High":
        return (
          <span
            className="badge rounded-pill px-2 py-1"
            style={{ backgroundColor: "#FFEDD5", color: "#C2410C", fontWeight: 600 }}
          >
            ● High
          </span>
        );
      case "Medium":
        return (
          <span
            className="badge rounded-pill px-2 py-1"
            style={{ backgroundColor: "#FEF3C7", color: "#B45309", fontWeight: 600 }}
          >
            ● Medium
          </span>
        );
      case "Low":
      default:
        return (
          <span
            className="badge rounded-pill px-2 py-1"
            style={{ backgroundColor: "#E0F2FE", color: "#0369A1", fontWeight: 600 }}
          >
            ● Low
          </span>
        );
    }
  };

  // Status Badge Helper
  const renderStatusBadge = (ticketStatus: TicketStatus) => {
    switch (ticketStatus) {
      case "New":
        return (
          <span
            className="badge rounded-pill px-2 py-1"
            style={{ backgroundColor: "#EAF6EF", color: "#006B3C", fontWeight: 600 }}
          >
            New
          </span>
        );
      case "Open":
        return (
          <span
            className="badge rounded-pill px-2 py-1"
            style={{ backgroundColor: "#E0F2FE", color: "#0284C7", fontWeight: 600 }}
          >
            Open
          </span>
        );
      case "InProgress":
        return (
          <span
            className="badge rounded-pill px-2 py-1"
            style={{ backgroundColor: "#FEF9C3", color: "#A16207", fontWeight: 600 }}
          >
            In Progress
          </span>
        );
      case "Pending":
        return (
          <span
            className="badge rounded-pill px-2 py-1"
            style={{ backgroundColor: "#F3E8FF", color: "#7E22CE", fontWeight: 600 }}
          >
            Pending
          </span>
        );
      case "Resolved":
        return (
          <span
            className="badge rounded-pill px-2 py-1"
            style={{ backgroundColor: "#DCFCE7", color: "#15803D", fontWeight: 600 }}
          >
            Resolved
          </span>
        );
      case "Closed":
        return (
          <span
            className="badge rounded-pill px-2 py-1"
            style={{ backgroundColor: "#F3F4F6", color: "#4B5563", fontWeight: 600 }}
          >
            Closed
          </span>
        );
      case "Cancelled":
        return (
          <span
            className="badge rounded-pill px-2 py-1"
            style={{ backgroundColor: "#FEE2E2", color: "#991B1B", fontWeight: 600 }}
          >
            Cancelled
          </span>
        );
      default:
        return (
          <span className="badge bg-secondary rounded-pill px-2 py-1">
            {ticketStatus}
          </span>
        );
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="container py-2" style={{ maxWidth: 1100 }}>
      {/* 1. Top Bar */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h1 className="h3 mb-0 fw-bold" style={{ color: "#1F2937" }}>
              My Tickets
            </h1>
            <span
              className="badge rounded-pill px-3 py-1"
              style={{ backgroundColor: "#EAF6EF", color: "#006B3C", fontSize: "0.85rem" }}
              data-testid="ticket-count-badge"
            >
              {pagination.totalItems} {pagination.totalItems === 1 ? "Ticket" : "Tickets"}
            </span>
          </div>
          <p className="text-muted mb-0 mt-1" style={{ fontSize: "0.9rem" }}>
            Track and monitor the status of your IT service requests
          </p>
        </div>
        <button
          className="btn btn-success d-flex align-items-center gap-2 fw-semibold px-3 py-2 shadow-sm"
          style={{ backgroundColor: "#006B3C", borderColor: "#006B3C" }}
          onClick={onCreateTicket}
          data-testid="create-ticket-cta"
        >
          <span>+</span> Create Ticket
        </button>
      </div>

      {/* 2. Filter & Search Bar */}
      <div className="card border-0 shadow-sm rounded-3 mb-4 bg-white">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            {/* Search Input */}
            <div className="col-12 col-md-4">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-muted">
                  🔍
                </span>
                <input
                  type="text"
                  className="form-control bg-light border-start-0"
                  placeholder="Search by ticket # or summary..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  data-testid="search-tickets-input"
                  aria-label="Search tickets"
                />
                {search && (
                  <button
                    className="btn btn-light border"
                    type="button"
                    onClick={() => setSearch("")}
                    title="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter */}
            <div className="col-6 col-md-2">
              <select
                className="form-select bg-light"
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value === "" ? "" : Number(e.target.value));
                  setPage(1);
                }}
                data-testid="category-filter"
                aria-label="Filter by Category"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Requested Priority Filter */}
            <div className="col-6 col-md-2">
              <select
                className="form-select bg-light"
                value={requestedPriority}
                onChange={(e) => {
                  setRequestedPriority(e.target.value as Priority | "");
                  setPage(1);
                }}
                data-testid="priority-filter"
                aria-label="Filter by Priority"
              >
                <option value="">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="col-6 col-md-2">
              <select
                className="form-select bg-light"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as TicketStatus | "");
                  setPage(1);
                }}
                data-testid="status-filter"
                aria-label="Filter by Status"
              >
                <option value="">All Statuses</option>
                <option value="New">New</option>
                <option value="Open">Open</option>
                <option value="InProgress">In Progress</option>
                <option value="Pending">Pending</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Clear Filters Action */}
            <div className="col-6 col-md-2 text-md-end">
              {hasActiveFilters ? (
                <button
                  className="btn btn-outline-secondary w-100 fw-semibold"
                  onClick={handleClearFilters}
                  data-testid="clear-filters-btn"
                >
                  Clear Filters
                </button>
              ) : (
                <select
                  className="form-select bg-light text-muted"
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [sb, so] = e.target.value.split("-") as [
                      "createdAt" | "ticketNumber" | "updatedAt",
                      "asc" | "desc"
                    ];
                    setSortBy(sb);
                    setSortOrder(so);
                    setPage(1);
                  }}
                  aria-label="Sort tickets"
                >
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                  <option value="ticketNumber-desc">Ticket No. (Desc)</option>
                  <option value="ticketNumber-asc">Ticket No. (Asc)</option>
                  <option value="updatedAt-desc">Recently Updated</option>
                </select>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Content: Loading, Error, Empty State, No-Results, or Ticket Table */}
      {loading ? (
        <div
          className="card border-0 shadow-sm rounded-3 p-5 text-center bg-white"
          data-testid="tickets-loading"
        >
          <div className="py-5">
            <div className="spinner-border text-success mb-3" role="status" style={{ width: "3rem", height: "3rem" }}>
              <span className="visually-hidden">Loading tickets...</span>
            </div>
            <p className="text-muted fw-semibold">Loading your tickets...</p>
          </div>
        </div>
      ) : error ? (
        <div className="card border-0 shadow-sm rounded-3 p-5 text-center bg-white">
          <div className="py-4">
            <div className="text-danger mb-3" style={{ fontSize: "2.5rem" }}>
              ⚠️
            </div>
            <h3 className="h5 fw-bold text-danger mb-2">Unable to Load Tickets</h3>
            <p className="text-muted mx-auto" style={{ maxWidth: 450 }}>
              {error}
            </p>
            <button className="btn btn-outline-success mt-2" onClick={loadTickets}>
              Try Again
            </button>
          </div>
        </div>
      ) : tickets.length === 0 && !hasActiveFilters ? (
        /* Empty State (AC-09): User has 0 tickets total */
        <div
          className="card border-0 shadow-sm rounded-3 p-5 text-center bg-white"
          data-testid="empty-tickets-state"
        >
          <div className="py-4">
            <div
              className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
              style={{
                width: "72px",
                height: "72px",
                backgroundColor: "#EAF6EF",
                color: "#006B3C",
                fontSize: "2.2rem",
              }}
            >
              🎫
            </div>
            <h2 className="h4 fw-bold mb-2" style={{ color: "#1F2937" }}>
              No tickets yet
            </h2>
            <p className="text-muted mx-auto mb-4" style={{ maxWidth: "420px", fontSize: "0.95rem" }}>
              Need help from IT? Submit your first service request and our team will get right on it.
            </p>
            <button
              className="btn btn-success fw-semibold px-4 py-2"
              style={{ backgroundColor: "#006B3C", borderColor: "#006B3C" }}
              onClick={onCreateTicket}
              data-testid="empty-create-ticket-btn"
            >
              + Create Ticket
            </button>
          </div>
        </div>
      ) : tickets.length === 0 && hasActiveFilters ? (
        /* No-Results State (AC-09): Search/Filter yielded 0 results */
        <div
          className="card border-0 shadow-sm rounded-3 p-5 text-center bg-white"
          data-testid="no-results-state"
        >
          <div className="py-4">
            <div
              className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
              style={{
                width: "72px",
                height: "72px",
                backgroundColor: "#FEF3C7",
                color: "#B45309",
                fontSize: "2.2rem",
              }}
            >
              🔍
            </div>
            <h2 className="h4 fw-bold mb-2" style={{ color: "#1F2937" }}>
              No tickets match your search
            </h2>
            <p className="text-muted mx-auto mb-4" style={{ maxWidth: "420px", fontSize: "0.95rem" }}>
              Try adjusting your search terms or clearing your filters to see your tickets.
            </p>
            <button
              className="btn btn-outline-secondary fw-semibold px-4 py-2"
              onClick={handleClearFilters}
              data-testid="no-results-clear-btn"
            >
              Clear Filters
            </button>
          </div>
        </div>
      ) : (
        /* Ticket List Container */
        <div>
          {/* Desktop Table View (>= 768px) */}
          <div className="card border-0 shadow-sm rounded-3 overflow-hidden d-none d-md-block bg-white">
            <div className="table-responsive">
              <table
                className="table table-hover align-middle mb-0"
                data-testid="tickets-table"
                style={{ fontSize: "0.92rem" }}
              >
                <thead style={{ backgroundColor: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                  <tr>
                    <th scope="col" className="ps-4 py-3 text-muted fw-semibold" style={{ width: "160px" }}>
                      Ticket No.
                    </th>
                    <th scope="col" className="py-3 text-muted fw-semibold">
                      Summary
                    </th>
                    <th scope="col" className="py-3 text-muted fw-semibold">
                      Category
                    </th>
                    <th scope="col" className="py-3 text-muted fw-semibold">
                      Requested Priority
                    </th>
                    <th scope="col" className="py-3 text-muted fw-semibold">
                      IT Priority
                    </th>
                    <th scope="col" className="py-3 text-muted fw-semibold">
                      Status
                    </th>
                    <th scope="col" className="pe-4 py-3 text-muted fw-semibold text-end">
                      Created / Updated
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => onSelectTicket?.(t.id)}
                      style={{ cursor: onSelectTicket ? "pointer" : "default" }}
                      data-testid={`ticket-row-${t.id}`}
                      className="ticket-row"
                    >
                      {/* Ticket Number */}
                      <td className="ps-4 py-3">
                        <span className="fw-bold font-monospace" style={{ color: "#006B3C" }}>
                          {t.ticketNumber}
                        </span>
                      </td>

                      {/* Summary + Attachments */}
                      <td className="py-3">
                        <div className="d-flex align-items-center gap-2">
                          <span className="fw-medium text-dark text-truncate" style={{ maxWidth: 340 }}>
                            {t.summary}
                          </span>
                          {t.activeAttachmentsCount > 0 && (
                            <span
                              className="badge rounded-pill bg-light text-secondary border"
                              title={`${t.activeAttachmentsCount} attachment(s)`}
                              style={{ fontSize: "0.75rem" }}
                            >
                              📎 {t.activeAttachmentsCount}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3">
                        <span className="text-secondary">{t.category?.name || "General"}</span>
                      </td>

                      {/* Requested Priority */}
                      <td className="py-3">{renderPriorityBadge(t.requestedPriority)}</td>

                      {/* IT Priority */}
                      <td className="py-3">{renderPriorityBadge(t.itPriority)}</td>

                      {/* Status */}
                      <td className="py-3">{renderStatusBadge(t.status)}</td>

                      {/* Dates */}
                      <td className="pe-4 py-3 text-end text-muted" style={{ fontSize: "0.85rem" }}>
                        <div>{formatDate(t.createdAt)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card Stack View (< 768px) */}
          <div className="d-block d-md-none" data-testid="tickets-card-list">
            <div className="d-flex flex-column gap-3">
              {tickets.map((t) => (
                <div
                  key={t.id}
                  className="card border-0 shadow-sm rounded-3 p-3 bg-white"
                  onClick={() => onSelectTicket?.(t.id)}
                  style={{
                    cursor: onSelectTicket ? "pointer" : "default",
                    minHeight: "44px",
                  }}
                  data-testid={`ticket-card-${t.id}`}
                >
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-bold font-monospace" style={{ color: "#006B3C" }}>
                      {t.ticketNumber}
                    </span>
                    <div>{renderStatusBadge(t.status)}</div>
                  </div>

                  <h3 className="h6 fw-semibold text-dark mb-2">{t.summary}</h3>

                  <div className="d-flex flex-wrap gap-2 align-items-center mb-3" style={{ fontSize: "0.85rem" }}>
                    <span className="badge bg-light text-dark border">
                      {t.category?.name || "General"}
                    </span>
                    <div>{renderPriorityBadge(t.requestedPriority)}</div>
                    {t.activeAttachmentsCount > 0 && (
                      <span className="badge bg-light text-secondary border">
                        📎 {t.activeAttachmentsCount}
                      </span>
                    )}
                  </div>

                  <div className="d-flex justify-content-between align-items-center text-muted border-top pt-2" style={{ fontSize: "0.8rem" }}>
                    <span>Created: {formatDate(t.createdAt)}</span>
                    <span className="fw-semibold text-success">View Details →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Pagination Controls */}
          <div className="d-flex flex-wrap justify-content-between align-items-center mt-4 gap-3">
            <div className="text-muted" style={{ fontSize: "0.9rem" }}>
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.totalItems)} of{" "}
              <strong>{pagination.totalItems}</strong> tickets
            </div>

            <div className="d-flex align-items-center gap-3">
              {/* Page size limit */}
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted" style={{ fontSize: "0.85rem" }}>
                  Per page:
                </span>
                <select
                  className="form-select form-select-sm bg-light"
                  style={{ width: "70px" }}
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  data-testid="page-limit-select"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>

              {/* Navigation buttons */}
              <div className="btn-group">
                <button
                  className="btn btn-outline-secondary btn-sm"
                  disabled={!pagination.hasPrevPage || pagination.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  data-testid="pagination-prev"
                >
                  ‹ Previous
                </button>
                <button className="btn btn-light btn-sm text-dark disabled fw-semibold" style={{ minWidth: "80px" }}>
                  Page {pagination.page} / {pagination.totalPages || 1}
                </button>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  disabled={!pagination.hasNextPage}
                  onClick={() => setPage((p) => p + 1)}
                  data-testid="pagination-next"
                >
                  Next ›
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
