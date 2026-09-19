import { useState, useEffect } from "react";
import { RequesterProvider, useRequester } from "./context/RequesterContext.js";
import { RequesterSelector } from "./components/RequesterSelector.js";
import { AppHeader } from "./components/AppHeader.js";
import { CreateTicket } from "./components/CreateTicket.js";
import { MyTickets } from "./components/MyTickets.js";
import { RequesterTicketDetail } from "./components/RequesterTicketDetail.js";
import { StaffTicketQueue } from "./components/StaffTicketQueue.js";
import { StaffTicketDetail } from "./components/StaffTicketDetail.js";
import { UserManagement } from "./components/UserManagement.js";
import { Login } from "./components/Login.js";
import { checkSystem, Category, fetchCurrentUser, logoutUser } from "./api.js";
import { User } from "./types.js";

type UiState = "idle" | "loading" | "success" | "error";

function MainContent() {
  const { currentRequester } = useRequester();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>("tickets");
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [isChangingRequester, setIsChangingRequester] = useState<boolean>(false);

  // Check existing auth session on mount
  useEffect(() => {
    fetchCurrentUser()
      .then((user) => {
        if (user) {
          setCurrentUser(user);
          const role = user.role as string;
          if (role === "Admin" || role === "Administrator") {
            setActiveTab("user-management");
          } else if (role === "IT_Staff" || role === "ITStaff") {
            setActiveTab("staff-queue");
          } else {
            setActiveTab("tickets");
          }
        }
      })
      .catch(() => {
        // No active session, ignore
      });
  }, []);

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

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
      // ignore
    }
    setCurrentUser(null);
    setSelectedTicketId(null);
    setActiveTab("login");
  };

  // Requester Gate (FR-01, FR-02, BR-04, AC-01):
  // If no user is logged in AND (no requester is selected OR user requested change), show Selector
  const showSelector = !currentUser && (!currentRequester || isChangingRequester);

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: "#F5F7F6" }}>
      <AppHeader
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedTicketId(null);
          setIsChangingRequester(false);
        }}
        onChangeRequester={() => {
          setIsChangingRequester(true);
          setSelectedTicketId(null);
        }}
        user={currentUser}
        onLogout={handleLogout}
        onLoginClick={() => {
          setSelectedTicketId(null);
          setActiveTab("login");
        }}
      />

      <main className="flex-grow-1 py-4">
        {activeTab === "login" ? (
          <Login
            initialUser={currentUser}
            onSuccess={(user) => {
              setCurrentUser(user);
              const role = user.role as string;
              if (role === "Admin" || role === "Administrator") {
                setActiveTab("user-management");
              } else if (role === "IT_Staff" || role === "ITStaff") {
                setActiveTab("staff-queue");
              } else {
                setActiveTab("tickets");
              }
            }}
            onCancel={() => {
              setActiveTab("tickets");
            }}
          />
        ) : showSelector ? (
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
                onCancel={() => {
                  setSelectedTicketId(null);
                  setActiveTab("tickets");
                }}
              />
            ) : activeTab === "staff-queue" ? (
              <StaffTicketQueue
                onSelectTicket={(ticketId) => {
                  setSelectedTicketId(ticketId);
                  setActiveTab("staff-ticket-detail");
                }}
              />
            ) : activeTab === "staff-ticket-detail" && selectedTicketId ? (
              <StaffTicketDetail
                ticketId={selectedTicketId}
                onBack={() => {
                  setSelectedTicketId(null);
                  setActiveTab("staff-queue");
                }}
              />
            ) : activeTab === "ticket-detail" && selectedTicketId ? (
              <RequesterTicketDetail
                ticketId={selectedTicketId}
                onBack={() => {
                  setSelectedTicketId(null);
                  setActiveTab("tickets");
                }}
              />
            ) : activeTab === "user-management" ? (
              <UserManagement
                currentUser={currentUser}
                onBack={() => {
                  setSelectedTicketId(null);
                  setActiveTab("tickets");
                }}
              />
            ) : (
              <div>
                {/* Active Requester Welcome Bar (when in requester mode) */}
                {currentRequester && (
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
                        onClick={() => {
                          setSelectedTicketId(null);
                          setActiveTab("create-ticket");
                        }}
                      >
                        + Create New Ticket
                      </button>
                      <button
                        className="btn btn-outline-light btn-sm"
                        onClick={() => {
                          setSelectedTicketId(null);
                          setIsChangingRequester(true);
                        }}
                      >
                        Switch Requester
                      </button>
                    </div>
                  </div>
                )}

                {/* My Tickets View (Issue 4) */}
                <MyTickets
                  onCreateTicket={() => {
                    setSelectedTicketId(null);
                    setActiveTab("create-ticket");
                  }}
                  onSelectTicket={(ticketId) => {
                    setSelectedTicketId(ticketId);
                    setActiveTab("ticket-detail");
                  }}
                />
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="py-3 text-center text-muted border-top" style={{ fontSize: "0.85rem", backgroundColor: "#FFFFFF" }}>
        University IT Service Desk • Sprint 3 MVP • Portal
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
