import { useState } from "react";
import { RequesterProvider, useRequester } from "./context/RequesterContext.js";
import { RequesterSelector } from "./components/RequesterSelector.js";
import { AppHeader } from "./components/AppHeader.js";
import { CreateTicket } from "./components/CreateTicket.js";
import { MyTickets } from "./components/MyTickets.js";
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
            ) : activeTab === "create-ticket" ? (
              <CreateTicket
                onSuccess={() => {
                  // Stay on success view rendered by CreateTicket
                }}
                onCancel={() => setActiveTab("tickets")}
              />
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

                {/* My Tickets View (Issue 4) */}
                <MyTickets
                  onCreateTicket={() => setActiveTab("create-ticket")}
                  onSelectTicket={(ticketId) => {
                    // Ready for Ticket Detail view in Issue 5
                    console.log("Selected ticket:", ticketId);
                  }}
                />
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
