import React, { useState, useEffect } from "react";
import { Requester } from "../types.js";
import { fetchActiveRequesters } from "../api.js";
import { useRequester } from "../context/RequesterContext.js";

interface RequesterSelectorProps {
  onSuccess?: () => void;
}

export const RequesterSelector: React.FC<RequesterSelectorProps> = ({ onSuccess }) => {
  const { currentRequester, selectRequester } = useRequester();
  const [requesters, setRequesters] = useState<Requester[]>([]);
  const [selectedId, setSelectedId] = useState<number | "">("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadRequesters = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchActiveRequesters();
      setRequesters(data);
      if (data.length > 0) {
        // Pre-select current if exists, or first requester
        if (currentRequester && data.some((r) => r.id === currentRequester.id)) {
          setSelectedId(currentRequester.id);
        } else {
          setSelectedId(data[0].id);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load active requesters from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequesters();
  }, []);

  const handleContinue = () => {
    if (selectedId === "") return;
    const chosen = requesters.find((r) => r.id === Number(selectedId));
    if (chosen) {
      selectRequester(chosen);
      if (onSuccess) {
        onSuccess();
      }
    }
  };

  return (
    <div className="container py-4" style={{ maxWidth: "560px" }}>
      <div className="card shadow-sm border-0 rounded-3 overflow-hidden">
        <div
          className="card-header py-3 px-4 text-white"
          style={{ backgroundColor: "#006B3C" }}
        >
          <div className="d-flex align-items-center gap-2">
            <span style={{ fontSize: "1.3rem" }}>👤</span>
            <h2 className="h5 mb-0 fw-semibold">Development Requester Selector</h2>
          </div>
        </div>

        <div className="card-body p-4 bg-white">
          {/* Notice Callout Banner */}
          <div
            className="alert border-0 d-flex gap-3 align-items-start mb-4 rounded-2"
            style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}
            role="note"
          >
            <span style={{ fontSize: "1.2rem", lineHeight: "1.2" }}>⚠️</span>
            <div style={{ fontSize: "0.875rem", lineHeight: "1.4" }}>
              <strong>Notice:</strong> Select a Development Requester to test requester-specific ticket behavior.
              This is not a login screen. Authentication and role-based access will be introduced in Lab 3.
            </div>
          </div>

          {loading && (
            <div className="text-center py-4">
              <div className="spinner-border text-success" role="status">
                <span className="visually-hidden">Loading requesters...</span>
              </div>
              <p className="mt-2 text-muted" style={{ fontSize: "0.9rem" }}>
                Loading active requesters...
              </p>
            </div>
          )}

          {error && (
            <div className="alert alert-danger mb-4" role="alert">
              <div className="fw-semibold">Error</div>
              <div style={{ fontSize: "0.9rem" }}>{error}</div>
              <button
                className="btn btn-outline-danger btn-sm mt-2"
                onClick={loadRequesters}
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && (
            <div>
              <div className="mb-4">
                <label
                  htmlFor="requester-select"
                  className="form-label fw-semibold text-secondary"
                  style={{ fontSize: "0.9rem" }}
                >
                  Active Requester <span className="text-danger">*</span>
                </label>
                <select
                  id="requester-select"
                  data-testid="requester-select"
                  className="form-select form-select-lg"
                  value={selectedId}
                  onChange={(e) => setSelectedId(Number(e.target.value))}
                  style={{ borderColor: "#D1D5DB" }}
                >
                  {requesters.map((req) => (
                    <option key={req.id} value={req.id}>
                      {req.fullName} {req.department ? `— ${req.department}` : ""} ({req.email})
                    </option>
                  ))}
                </select>
                <div className="form-text text-muted mt-2" style={{ fontSize: "0.825rem" }}>
                  Selected requester will simulate the session across all ticket actions and APIs.
                </div>
              </div>

              <div className="d-grid gap-2">
                <button
                  type="button"
                  data-testid="continue-btn"
                  className="btn btn-lg text-white fw-semibold"
                  style={{ backgroundColor: "#006B3C", borderColor: "#006B3C" }}
                  onClick={handleContinue}
                  disabled={selectedId === ""}
                >
                  Continue
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
