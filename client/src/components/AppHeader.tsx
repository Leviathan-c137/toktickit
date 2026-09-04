import React from "react";
import { useRequester } from "../context/RequesterContext.js";

interface AppHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onChangeRequester: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  activeTab,
  setActiveTab,
  onChangeRequester,
}) => {
  const { currentRequester } = useRequester();

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
          onClick={() => setActiveTab("tickets")}
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
        {currentRequester && (
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 gap-1">
            <li className="nav-item">
              <button
                type="button"
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
          </ul>
        )}

        {/* Right side: Active Requester Context Pill */}
        <div className="d-flex align-items-center ms-auto">
          {currentRequester ? (
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
            <button
              type="button"
              className="btn btn-sm btn-light fw-semibold"
              onClick={onChangeRequester}
            >
              Select Requester
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
