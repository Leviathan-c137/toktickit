import React from "react";
import { useRequester } from "../context/RequesterContext.js";
import { User } from "../types.js";

interface AppHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onChangeRequester: () => void;
  user?: User | null;
  onLogout?: () => void;
  onLoginClick?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  activeTab,
  setActiveTab,
  onChangeRequester,
  user,
  onLogout,
  onLoginClick,
}) => {
  const { currentRequester } = useRequester();

  const isAdmin = user?.role === "Administrator" || (user?.role as string) === "Admin";
  const isStaff = user?.role === "ITStaff" || (user?.role as string) === "IT_Staff";
  const isRequester = user?.role === "Requester";

  const getRoleBadge = (role: string) => {
    if (role === "Admin" || role === "Administrator") {
      return (
        <span
          className="badge rounded-pill ms-2"
          style={{ backgroundColor: "#FEF3C7", color: "#92400E", fontSize: "0.75rem" }}
        >
          Admin
        </span>
      );
    }
    if (role === "IT_Staff" || role === "ITStaff") {
      return (
        <span
          className="badge rounded-pill ms-2"
          style={{ backgroundColor: "#DBEAFE", color: "#1E40AF", fontSize: "0.75rem" }}
        >
          IT Staff
        </span>
      );
    }
    return (
      <span
        className="badge rounded-pill ms-2"
        style={{ backgroundColor: "#E5E7EB", color: "#374151", fontSize: "0.75rem" }}
      >
        Requester
      </span>
    );
  };

  return (
    <header
      className="navbar navbar-expand-lg sticky-top shadow-sm px-3"
      style={{ backgroundColor: "#006B3C" }}
    >
      <div className="container-fluid">
        {/* Brand */}
        <div
          className="navbar-brand d-flex align-items-center text-white cursor-pointer me-4"
          style={{ cursor: "pointer", fontWeight: 600, fontSize: "1.2rem" }}
          onClick={() => {
            if (isAdmin) {
              setActiveTab("user-management");
            } else if (isStaff) {
              setActiveTab("staff-queue");
            } else {
              setActiveTab("tickets");
            }
          }}
        >
          <span
            className="d-inline-flex align-items-center justify-content-center me-2 rounded-circle"
            style={{
              width: "32px",
              height: "32px",
              backgroundColor: "#EAF6EF",
              color: "#006B3C",
              fontWeight: "bold",
              fontSize: "0.95rem",
            }}
          >
            ✓
          </span>
          <span>TokTick IT</span>
          <span
            className="badge ms-2 fw-normal"
            style={{ backgroundColor: "#0B7A46", fontSize: "0.75rem" }}
          >
            Service Desk
          </span>
        </div>

        {/* Navigation Tabs */}
        <ul className="navbar-nav me-auto mb-2 mb-lg-0 gap-1">
          {user ? (
            <>
              {isAdmin && (
                <>
                  <li className="nav-item">
                    <button
                      type="button"
                      data-testid="nav-user-management"
                      className={`btn btn-sm ${
                        activeTab === "user-management"
                          ? "btn-light text-dark fw-semibold"
                          : "btn-link text-white-50 text-decoration-none"
                      }`}
                      onClick={() => setActiveTab("user-management")}
                    >
                      User Management
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      type="button"
                      data-testid="nav-ticket-queue"
                      className={`btn btn-sm ${
                        activeTab === "staff-queue" || activeTab === "staff-ticket-detail"
                          ? "btn-light text-dark fw-semibold"
                          : "btn-link text-white-50 text-decoration-none"
                      }`}
                      onClick={() => setActiveTab("staff-queue")}
                    >
                      Ticket Queue
                    </button>
                  </li>
                </>
              )}

              {isStaff && (
                <li className="nav-item">
                  <button
                    type="button"
                    data-testid="nav-ticket-queue"
                    className={`btn btn-sm ${
                      activeTab === "staff-queue" || activeTab === "staff-ticket-detail"
                        ? "btn-light text-dark fw-semibold"
                        : "btn-link text-white-50 text-decoration-none"
                      }`}
                    onClick={() => setActiveTab("staff-queue")}
                  >
                    Ticket Queue
                  </button>
                </li>
              )}

              {isRequester && (
                <>
                  <li className="nav-item">
                    <button
                      type="button"
                      data-testid="nav-my-tickets"
                      className={`btn btn-sm ${
                        activeTab === "tickets" || activeTab === "ticket-detail"
                          ? "btn-light text-dark fw-semibold"
                          : "btn-link text-white-50 text-decoration-none"
                      }`}
                      onClick={() => setActiveTab("tickets")}
                    >
                      My Tickets
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      type="button"
                      data-testid="nav-create-ticket"
                      className={`btn btn-sm ${
                        activeTab === "create-ticket"
                          ? "btn-light text-dark fw-semibold"
                          : "btn-link text-white-50 text-decoration-none"
                      }`}
                      onClick={() => setActiveTab("create-ticket")}
                    >
                      + Create Ticket
                    </button>
                  </li>
                </>
              )}
            </>
          ) : currentRequester ? (
            <>
              <li className="nav-item">
                <button
                  type="button"
                  data-testid="nav-my-tickets"
                  className={`btn btn-sm ${
                    activeTab === "tickets" || activeTab === "ticket-detail"
                      ? "btn-light text-dark fw-semibold"
                      : "btn-link text-white-50 text-decoration-none"
                  }`}
                  onClick={() => setActiveTab("tickets")}
                >
                  My Tickets
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  data-testid="nav-create-ticket"
                  className={`btn btn-sm ${
                    activeTab === "create-ticket"
                      ? "btn-light text-dark fw-semibold"
                      : "btn-link text-white-50 text-decoration-none"
                  }`}
                  onClick={() => setActiveTab("create-ticket")}
                >
                  + Create Ticket
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  data-testid="nav-ticket-queue"
                  className={`btn btn-sm ${
                    activeTab === "staff-queue" || activeTab === "staff-ticket-detail"
                      ? "btn-light text-dark fw-semibold"
                      : "btn-link text-white-50 text-decoration-none"
                  }`}
                  onClick={() => setActiveTab("staff-queue")}
                >
                  Ticket Queue
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  data-testid="nav-user-management"
                  className={`btn btn-sm ${
                    activeTab === "user-management"
                      ? "btn-light text-dark fw-semibold"
                      : "btn-link text-white-50 text-decoration-none"
                  }`}
                  onClick={() => setActiveTab("user-management")}
                >
                  User Management
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={`btn btn-sm ${
                    activeTab === "system-check"
                      ? "btn-light text-dark fw-semibold"
                      : "btn-link text-white-50 text-decoration-none"
                  }`}
                  onClick={() => setActiveTab("system-check")}
                >
                  System Status
                </button>
              </li>
            </>
          ) : null}
        </ul>

        {/* Right side: User Context or Requester Pill */}
        <div className="d-flex align-items-center ms-auto gap-2">
          {user ? (
            <div
              className="d-flex align-items-center px-3 py-1 rounded-pill"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.15)", color: "#FFFFFF" }}
              data-testid="user-profile-badge"
            >
              <div
                className="rounded-circle d-flex align-items-center justify-content-center me-2"
                style={{
                  width: "28px",
                  height: "28px",
                  backgroundColor: "#EAF6EF",
                  color: "#006B3C",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                }}
              >
                {user.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="me-2 text-start d-none d-sm-block">
                <span className="fw-semibold" style={{ fontSize: "0.85rem" }}>
                  {user.fullName}
                </span>
                {getRoleBadge(user.role)}
              </div>
              {onLogout && (
                <button
                  type="button"
                  data-testid="logout-btn"
                  className="btn btn-sm btn-outline-light py-0 px-2 ms-2"
                  style={{ fontSize: "0.75rem", borderRadius: "12px" }}
                  onClick={onLogout}
                >
                  Sign Out
                </button>
              )}
            </div>
          ) : currentRequester ? (
            <div
              className="d-flex align-items-center px-3 py-1 rounded-pill"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.15)", color: "#FFFFFF" }}
            >
              <div
                className="rounded-circle d-flex align-items-center justify-content-center me-2"
                style={{
                  width: "28px",
                  height: "28px",
                  backgroundColor: "#EAF6EF",
                  color: "#006B3C",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                }}
              >
                {currentRequester.fullName.charAt(0)}
              </div>
              <div className="me-3 text-start d-none d-sm-block">
                <div style={{ fontSize: "0.85rem", fontWeight: 600, lineHeight: 1.1 }}>
                  {currentRequester.fullName}
                </div>
                {currentRequester.department && (
                  <div style={{ fontSize: "0.7rem", opacity: 0.8, lineHeight: 1.1 }}>
                    {currentRequester.department}
                  </div>
                )}
              </div>
              <button
                type="button"
                data-testid="change-requester-btn"
                className="btn btn-sm btn-outline-light py-0 px-2"
                style={{ fontSize: "0.75rem", borderRadius: "12px" }}
                onClick={onChangeRequester}
              >
                Change
              </button>
            </div>
          ) : (
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-sm btn-light fw-semibold"
                onClick={onChangeRequester}
              >
                Select Requester
              </button>
            </div>
          )}

          {/* Sign In CTA if not authenticated */}
          {!user && onLoginClick && (
            <button
              type="button"
              data-testid="header-sign-in-btn"
              className="btn btn-sm btn-light fw-semibold text-success ms-1"
              style={{ borderRadius: "12px" }}
              onClick={onLoginClick}
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
