import { useState } from "react";
import { RequesterProvider, useRequester } from "./context/RequesterContext.js";
import { RequesterSelector } from "./components/RequesterSelector.js";
import { AppHeader } from "./components/AppHeader.js";
import { checkSystem, Category } from "./api.js";

type UiState = "idle" | "loading" | "success" | "error";

function MainContent() {
  const { currentRequester } = useRequester();
  const [activeTab, setActiveTab] = useState<string>("tickets");
  const [isChangingRequester, setIsChangingRequester] = useState<boolean>(false);

  // Lab 1 Status Check state
  const [checkState, setCheckState] = useState<UiState>("idle");
  const [categories, setCategories] = useState<Category[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");

  async function handleCheck() {
    setCheckState("loading");
    setErrorMessage("");
    try {
      const res = await checkSystem();
      setCategories(res.categories);
      setCheckState("success");
    } catch (err: any) {
      setErrorMessage(err.message || "Unable to connect to TokTickIT API");
      setCheckState("error");
    }
  }

  // Requester Gate (FR-01, FR-02, BR-04, AC-01):
  // If no requester is selected, or if user explicitly requested change, show Selector
  const showSelector = !currentRequester || isChangingRequester;

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: "#F5F7F6" }}>
      <AppHeader
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setIsChangingRequester(false);
        }}
        onChangeRequester={() => setIsChangingRequester(true)}
      />

      <main className="flex-grow-1 py-4">
        {showSelector ? (
          <div>
            <RequesterSelector
              onSuccess={() => {
                setIsChangingRequester(false);
                setActiveTab("tickets");
              }}
            />

            {/* Collapsible Lab 1 System Health Check for verification & backwards compatibility */}
            <div className="container mt-4" style={{ maxWidth: 640 }}>
              <div className="card shadow-sm border-0 rounded-3">
                <div className="card-body p-4">
                  <h1 className="h3 mb-4">
                    TokTickIT <span className="text-success">IT Service Desk</span>
                  </h1>
                  <button
                    className="btn btn-success"
                    onClick={handleCheck}
                    disabled={checkState === "loading"}
                  >
                    {checkState === "loading" ? "Loading…" : "Check System"}
                  </button>

                  {checkState === "success" && (
                    <div className="mt-4">
                      <div className="alert alert-success d-flex align-items-center" role="alert">
                        <span className="fw-bold">Status: Online</span>
                      </div>
                      <h2 className="h5 mt-3 mb-3">Service Categories</h2>
                      <ul className="list-group">
                        {categories.map((cat) => (
                          <li key={cat.id} className="list-group-item">
                            {cat.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {checkState === "error" && (
                    <div className="mt-4">
                      <div className="alert alert-danger d-flex align-items-center" role="alert">
                        <span className="fw-bold">Status: Offline — {errorMessage}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="container py-3">
            {activeTab === "system-check" ? (
              <div className="container" style={{ maxWidth: 640 }}>
                <div className="card shadow-sm border-0 rounded-3">
                  <div className="card-body p-4">
                    <h1 className="h3 mb-4">
                      TokTickIT <span className="text-success">IT Service Desk</span>
                    </h1>
                    <button
                      className="btn btn-success"
                      onClick={handleCheck}
                      disabled={checkState === "loading"}
                    >
                      {checkState === "loading" ? "Loading…" : "Check System"}
                    </button>

                    {checkState === "success" && (
                      <div className="mt-4">
                        <div className="alert alert-success d-flex align-items-center" role="alert">
                          <span className="fw-bold">Status: Online</span>
                        </div>
                        <h2 className="h5 mt-3 mb-3">Service Categories</h2>
                        <ul className="list-group">
                          {categories.map((cat) => (
                            <li key={cat.id} className="list-group-item">
                              {cat.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {checkState === "error" && (
                      <div className="mt-4">
                        <div className="alert alert-danger d-flex align-items-center" role="alert">
                          <span className="fw-bold">Status: Offline — {errorMessage}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {/* Active Requester Welcome Bar */}
                <div
                  className="p-4 mb-4 rounded-3 text-white d-flex justify-content-between align-items-center flex-wrap gap-3"
                  style={{ backgroundColor: "#006B3C" }}
                >
                  <div>
                    <h2 className="h4 mb-1 fw-bold">
                      Welcome, {currentRequester.fullName}
                    </h2>
                    <p className="mb-0 text-white-50" style={{ fontSize: "0.9rem" }}>
                      Department: {currentRequester.department || "General"} | Email: {currentRequester.email}
                    </p>
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-light btn-sm fw-semibold"
                      onClick={() => setActiveTab("create-ticket")}
                    >
                      + Create New Ticket
                    </button>
                    <button
                      className="btn btn-outline-light btn-sm"
                      onClick={() => setIsChangingRequester(true)}
                    >
                      Switch Requester
                    </button>
                  </div>
                </div>

                {/* Main View Placeholder for Issue 3 & Issue 4 */}
                <div className="card shadow-sm border-0 rounded-3 p-5 text-center bg-white">
                  <div className="py-4">
                    <div
                      className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                      style={{
                        width: "64px",
                        height: "64px",
                        backgroundColor: "#EAF6EF",
                        color: "#006B3C",
                        fontSize: "2rem",
                      }}
                    >
                      🎫
                    </div>
                    <h3 className="h5 fw-semibold mb-2">
                      {activeTab === "create-ticket" ? "Create IT Ticket" : "My IT Tickets"}
                    </h3>
                    <p className="text-muted mx-auto" style={{ maxWidth: "480px", fontSize: "0.95rem" }}>
                      {activeTab === "create-ticket"
                        ? "The ticket creation form with categories, systems, priority, and file attachments will be enabled in Issue 3."
                        : "Ticket dashboard with search, filtering, and ownership isolation will be enabled in Issue 4."}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="py-3 text-center text-muted border-top" style={{ fontSize: "0.85rem", backgroundColor: "#FFFFFF" }}>
        University IT Service Desk • Sprint 2 MVP • Portal
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <RequesterProvider>
      <MainContent />
    </RequesterProvider>
  );
}
