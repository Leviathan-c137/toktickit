import React, { useState, useEffect, useCallback } from "react";
import { AdminUser, AdminUserFilters, CreateAdminUserInput, UpdateAdminUserInput, Role } from "../types.js";
import {
  fetchAdminUsers,
  createAdminUser,
  updateAdminUser,
  resetAdminUserPassword,
} from "../api.js";
import { useRequester } from "../context/RequesterContext.js";

interface UserManagementProps {
  onBack?: () => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ onBack }) => {
  const { currentRequester } = useRequester();

  // Data & State
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [editUserTarget, setEditUserTarget] = useState<AdminUser | null>(null);
  const [resetPassTarget, setResetPassTarget] = useState<AdminUser | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState<CreateAdminUserInput>({
    fullName: "",
    email: "",
    department: "",
    role: "Requester" as Role,
    isActive: true,
    initialPassword: "",
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSubmitting, setCreateSubmitting] = useState<boolean>(false);

  const [editForm, setEditForm] = useState<UpdateAdminUserInput>({
    fullName: "",
    email: "",
    department: "",
    role: "Requester" as Role,
    isActive: true,
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState<boolean>(false);

  const [resetPasswordInput, setResetPasswordInput] = useState<string>("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSubmitting, setResetSubmitting] = useState<boolean>(false);

  // Fetch Users
  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: AdminUserFilters = {
        search: search.trim() || undefined,
        role: roleFilter !== "All" ? roleFilter : undefined,
        isActive: activeFilter !== "All" ? activeFilter : undefined,
        page: currentPage,
        limit: 10,
      };
      const res = await fetchAdminUsers(filters);
      setUsers(res.users);
      setTotalPages(res.pagination.totalPages);
      setTotalCount(res.pagination.totalCount);
    } catch (err: any) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, activeFilter, currentPage]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Success message auto-dismiss
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Handlers
  const handleClearFilters = () => {
    setSearch("");
    setRoleFilter("All");
    setActiveFilter("All");
    setCurrentPage(1);
  };

  // Open Edit Modal
  const handleOpenEdit = (user: AdminUser) => {
    setEditUserTarget(user);
    setEditForm({
      fullName: user.fullName,
      email: user.email,
      department: user.department || "",
      role: user.role,
      isActive: user.isActive,
    });
    setEditError(null);
  };

  // Open Reset Password Modal
  const handleOpenResetPass = (user: AdminUser) => {
    setResetPassTarget(user);
    setResetPasswordInput("");
    setResetError(null);
  };

  // Submit Create User
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!createForm.fullName.trim()) {
      setCreateError("Full name is required");
      return;
    }
    if (!createForm.email.trim() || !createForm.email.includes("@")) {
      setCreateError("A valid email address is required");
      return;
    }
    if (!createForm.initialPassword || createForm.initialPassword.length < 8) {
      setCreateError("Initial password must be at least 8 characters");
      return;
    }

    setCreateSubmitting(true);
    try {
      await createAdminUser(createForm);
      setShowCreateModal(false);
      setSuccessMessage(`User "${createForm.fullName}" created successfully.`);
      setCreateForm({
        fullName: "",
        email: "",
        department: "",
        role: "Requester",
        isActive: true,
        initialPassword: "",
      });
      loadUsers();
    } catch (err: any) {
      setCreateError(err.message || "Failed to create user");
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Submit Edit User
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUserTarget) return;
    setEditError(null);

    setEditSubmitting(true);
    try {
      await updateAdminUser(editUserTarget.id, editForm);
      setEditUserTarget(null);
      setSuccessMessage(`User "${editForm.fullName}" updated successfully.`);
      loadUsers();
    } catch (err: any) {
      setEditError(err.message || "Failed to update user");
    } finally {
      setEditSubmitting(false);
    }
  };

  // Submit Reset Password
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassTarget) return;
    setResetError(null);

    if (!resetPasswordInput || resetPasswordInput.length < 8) {
      setResetError("Initial password must be at least 8 characters long");
      return;
    }

    setResetSubmitting(true);
    try {
      await resetAdminUserPassword(resetPassTarget.id, resetPasswordInput);
      setResetPassTarget(null);
      setSuccessMessage(`Password for "${resetPassTarget.fullName}" has been reset. User must change it at next login.`);
      loadUsers();
    } catch (err: any) {
      setResetError(err.message || "Failed to reset password");
    } finally {
      setResetSubmitting(false);
    }
  };

  const isCurrentUser = (user: AdminUser): boolean => Boolean(currentRequester && currentRequester.id === user.id);

  return (
    <div className="container py-3">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h1 className="h3 fw-bold mb-0" style={{ color: "#1F2937" }}>
              User Management
            </h1>
            <span
              className="badge rounded-pill px-3 py-1"
              style={{ backgroundColor: "#EAF6EF", color: "#006B3C", fontSize: "0.85rem" }}
            >
              {totalCount} Total Users
            </span>
          </div>
          <p className="text-muted small mb-0">
            Provision accounts, assign roles, configure activation status, and manage password policies.
          </p>
        </div>
        <div className="d-flex gap-2">
          {onBack && (
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm px-3"
              onClick={onBack}
            >
              ← Back
            </button>
          )}
          <button
            type="button"
            id="btn-create-user"
            className="btn btn-sm text-white px-3 fw-semibold shadow-sm"
            style={{ backgroundColor: "#006B3C", borderColor: "#006B3C" }}
            onClick={() => {
              setCreateError(null);
              setShowCreateModal(true);
            }}
          >
            + Create New User
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show shadow-sm border-0 mb-4" role="alert">
          <strong>✓ Success!</strong> {successMessage}
          <button type="button" className="btn-close" onClick={() => setSuccessMessage(null)} aria-label="Close" />
        </div>
      )}

      {/* Global Error Banner */}
      {error && (
        <div className="alert alert-danger shadow-sm border-0 mb-4" role="alert">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="card border-0 shadow-sm rounded-3 mb-4" style={{ backgroundColor: "#FFFFFF" }}>
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            {/* Search */}
            <div className="col-12 col-md-5">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light border-end-0">🔍</span>
                <input
                  type="text"
                  id="search-user-input"
                  className="form-control border-start-0"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>

            {/* Role Filter */}
            <div className="col-6 col-md-3">
              <select
                id="filter-role-select"
                className="form-select form-select-sm"
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="All">All Roles</option>
                <option value="Requester">Requester</option>
                <option value="ITStaff">IT Staff</option>
                <option value="Administrator">Administrator</option>
              </select>
            </div>

            {/* Active Status Filter */}
            <div className="col-6 col-md-3">
              <select
                id="filter-active-select"
                className="form-select form-select-sm"
                value={activeFilter}
                onChange={(e) => {
                  setActiveFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="All">All Status</option>
                <option value="true">Active Only</option>
                <option value="false">Inactive Only</option>
              </select>
            </div>

            {/* Clear Button */}
            <div className="col-12 col-md-1 text-end">
              {(search || roleFilter !== "All" || activeFilter !== "All") && (
                <button
                  type="button"
                  id="btn-clear-filters"
                  className="btn btn-sm btn-link text-muted p-0 text-decoration-none"
                  onClick={handleClearFilters}
                  title="Clear all filters"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* User Table Card */}
      <div className="card border-0 shadow-sm rounded-3 overflow-hidden" style={{ backgroundColor: "#FFFFFF" }}>
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading users...</span>
            </div>
            <p className="text-muted small mt-2">Loading user accounts...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-5">
            <div className="mb-2" style={{ fontSize: "2rem" }}>👤</div>
            <h5 className="h6 fw-semibold text-dark">No users found</h5>
            <p className="text-muted small mb-3">
              {search || roleFilter !== "All" || activeFilter !== "All"
                ? "No users match your filter criteria."
                : "No user accounts provisioned in the system yet."}
            </p>
            {(search || roleFilter !== "All" || activeFilter !== "All") && (
              <button
                type="button"
                className="btn btn-sm btn-outline-success"
                onClick={handleClearFilters}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: "0.875rem" }}>
              <thead className="table-light" style={{ fontSize: "0.8rem", textTransform: "uppercase" }}>
                <tr>
                  <th scope="col" className="ps-4">User</th>
                  <th scope="col">Email</th>
                  <th scope="col">Role</th>
                  <th scope="col">Status</th>
                  <th scope="col">Password State</th>
                  <th scope="col" className="text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = isCurrentUser(u);
                  return (
                    <tr key={u.id}>
                      {/* Name & Department */}
                      <td className="ps-4 py-3">
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-semibold"
                            style={{
                              width: "34px",
                              height: "34px",
                              fontSize: "0.85rem",
                              backgroundColor:
                                u.role === "Administrator"
                                  ? "#4338CA"
                                  : u.role === "ITStaff"
                                  ? "#006B3C"
                                  : "#4B5563",
                            }}
                          >
                            {u.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="fw-semibold text-dark d-flex align-items-center gap-2">
                              <span>{u.fullName}</span>
                              {isSelf && (
                                <span className="badge bg-success-subtle text-success border border-success-subtle py-0" style={{ fontSize: "0.7rem" }}>
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                              {u.department || "No Department"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="text-muted">{u.email}</td>

                      {/* Role Pill */}
                      <td>
                        {u.role === "Administrator" ? (
                          <span
                            className="badge rounded-pill px-2 py-1"
                            style={{ backgroundColor: "#EEF2FF", color: "#4338CA", border: "1px solid #C7D2FE" }}
                          >
                            Administrator
                          </span>
                        ) : u.role === "ITStaff" ? (
                          <span
                            className="badge rounded-pill px-2 py-1"
                            style={{ backgroundColor: "#EAF6EF", color: "#006B3C", border: "1px solid #A7F3D0" }}
                          >
                            IT Staff
                          </span>
                        ) : (
                          <span
                            className="badge rounded-pill px-2 py-1 bg-light text-secondary border"
                          >
                            Requester
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td>
                        {u.isActive ? (
                          <span className="badge bg-success-subtle text-success border border-success-subtle">
                            Active
                          </span>
                        ) : (
                          <span className="badge bg-secondary-subtle text-secondary border">
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Password State */}
                      <td>
                        {u.mustChangePassword ? (
                          <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">
                            Must Change
                          </span>
                        ) : (
                          <span className="text-muted small">Standard</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="text-end pe-4">
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            id={`edit-user-${u.id}-btn`}
                            className="btn btn-outline-secondary"
                            onClick={() => handleOpenEdit(u)}
                            title="Edit user details"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            id={`reset-pass-${u.id}-btn`}
                            className="btn btn-outline-secondary"
                            onClick={() => handleOpenResetPass(u)}
                            title="Set initial password"
                          >
                            Reset Password
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && users.length > 0 && (
          <div className="card-footer bg-white border-top d-flex justify-content-between align-items-center py-3 px-4 flex-wrap gap-2">
            <span className="text-muted small">
              Page {currentPage} of {totalPages} ({totalCount} users)
            </span>
            <div className="btn-group btn-group-sm">
              <button
                type="button"
                className="btn btn-outline-secondary"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* Create User Modal */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header border-bottom pb-3">
                <h5 className="modal-title fw-bold" style={{ color: "#006B3C" }}>
                  + Create New User Account
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCreateModal(false)}
                  disabled={createSubmitting}
                />
              </div>
              <form onSubmit={handleCreateSubmit}>
                <div className="modal-body p-4">
                  {createError && (
                    <div className="alert alert-danger small py-2 mb-3" role="alert">
                      {createError}
                    </div>
                  )}

                  <div className="mb-3">
                    <label htmlFor="create-user-fullname" className="form-label small fw-semibold">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="create-user-fullname"
                      className="form-control form-control-sm"
                      placeholder="e.g. Alex Thompson"
                      value={createForm.fullName}
                      onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="create-user-email" className="form-label small fw-semibold">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="create-user-email"
                      className="form-control form-control-sm"
                      placeholder="e.g. alex.t@toktickit.com"
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label htmlFor="create-user-role" className="form-label small fw-semibold">
                        Role *
                      </label>
                      <select
                        id="create-user-role"
                        className="form-select form-select-sm"
                        value={createForm.role}
                        onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as Role })}
                      >
                        <option value="Requester">Requester</option>
                        <option value="ITStaff">IT Staff</option>
                        <option value="Administrator">Administrator</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label htmlFor="create-user-department" className="form-label small fw-semibold">
                        Department
                      </label>
                      <input
                        type="text"
                        id="create-user-department"
                        className="form-control form-control-sm"
                        placeholder="e.g. IT Operations"
                        value={createForm.department}
                        onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="create-user-password" className="form-label small fw-semibold">
                      Initial Password *
                    </label>
                    <input
                      type="password"
                      id="create-user-password"
                      className="form-control form-control-sm"
                      placeholder="Minimum 8 characters (upper, lower, digit/symbol)"
                      value={createForm.initialPassword}
                      onChange={(e) => setCreateForm({ ...createForm, initialPassword: e.target.value })}
                      required
                    />
                    <div className="form-text text-muted" style={{ fontSize: "0.75rem" }}>
                      User will be required to change this initial password upon first login (AC-09).
                    </div>
                  </div>

                  <div className="form-check form-switch mb-1">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="create-user-active"
                      checked={createForm.isActive}
                      onChange={(e) => setCreateForm({ ...createForm, isActive: e.target.checked })}
                    />
                    <label className="form-check-label small" htmlFor="create-user-active">
                      Active Account (can log in immediately)
                    </label>
                  </div>
                </div>

                <div className="modal-footer border-top bg-light">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setShowCreateModal(false)}
                    disabled={createSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    id="submit-create-user-btn"
                    className="btn btn-sm text-white fw-semibold px-3"
                    style={{ backgroundColor: "#006B3C", borderColor: "#006B3C" }}
                    disabled={createSubmitting}
                  >
                    {createSubmitting ? "Creating..." : "Create Account"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Edit User Modal */}
      {/* ========================================================================= */}
      {editUserTarget && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header border-bottom pb-3">
                <h5 className="modal-title fw-bold text-dark">
                  Edit User: {editUserTarget.fullName}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setEditUserTarget(null)}
                  disabled={editSubmitting}
                />
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="modal-body p-4">
                  {editError && (
                    <div className="alert alert-danger small py-2 mb-3" role="alert">
                      {editError}
                    </div>
                  )}

                  <div className="mb-3">
                    <label htmlFor="edit-user-fullname" className="form-label small fw-semibold">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="edit-user-fullname"
                      className="form-control form-control-sm"
                      value={editForm.fullName}
                      onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="edit-user-email" className="form-label small fw-semibold">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="edit-user-email"
                      className="form-control form-control-sm"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label htmlFor="edit-user-role" className="form-label small fw-semibold">
                        Role
                      </label>
                      <select
                        id="edit-user-role"
                        className="form-select form-select-sm"
                        value={editForm.role}
                        disabled={isCurrentUser(editUserTarget)}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value as Role })}
                      >
                        <option value="Requester">Requester</option>
                        <option value="ITStaff">IT Staff</option>
                        <option value="Administrator">Administrator</option>
                      </select>
                      {isCurrentUser(editUserTarget) && (
                        <div className="form-text text-muted" style={{ fontSize: "0.75rem" }}>
                          You cannot demote your own Administrator role (BR-12).
                        </div>
                      )}
                    </div>

                    <div className="col-6">
                      <label htmlFor="edit-user-department" className="form-label small fw-semibold">
                        Department
                      </label>
                      <input
                        type="text"
                        id="edit-user-department"
                        className="form-control form-control-sm"
                        value={editForm.department || ""}
                        onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-check form-switch mb-1">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="edit-user-active"
                      checked={editForm.isActive}
                      disabled={isCurrentUser(editUserTarget)}
                      onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                    />
                    <label className="form-check-label small" htmlFor="edit-user-active">
                      Active Account
                    </label>
                    {isCurrentUser(editUserTarget) && (
                      <div className="form-text text-muted" style={{ fontSize: "0.75rem" }}>
                        You cannot deactivate your own account (BR-12).
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-footer border-top bg-light">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setEditUserTarget(null)}
                    disabled={editSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    id="submit-edit-user-btn"
                    className="btn btn-sm text-white fw-semibold px-3"
                    style={{ backgroundColor: "#006B3C", borderColor: "#006B3C" }}
                    disabled={editSubmitting}
                  >
                    {editSubmitting ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Reset Password Modal */}
      {/* ========================================================================= */}
      {resetPassTarget && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header border-bottom pb-3">
                <h5 className="modal-title fw-bold text-dark">
                  Reset Password for {resetPassTarget.fullName}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setResetPassTarget(null)}
                  disabled={resetSubmitting}
                />
              </div>
              <form onSubmit={handleResetSubmit}>
                <div className="modal-body p-4">
                  {resetError && (
                    <div className="alert alert-danger small py-2 mb-3" role="alert">
                      {resetError}
                    </div>
                  )}

                  <p className="text-muted small mb-3">
                    Enter a new temporary password for <strong>{resetPassTarget.email}</strong>.
                  </p>

                  <div className="mb-3">
                    <label htmlFor="reset-user-password" className="form-label small fw-semibold">
                      New Initial Password *
                    </label>
                    <input
                      type="password"
                      id="reset-user-password"
                      className="form-control form-control-sm"
                      placeholder="Minimum 8 characters"
                      value={resetPasswordInput}
                      onChange={(e) => setResetPasswordInput(e.target.value)}
                      required
                    />
                    <div className="form-text text-muted" style={{ fontSize: "0.75rem" }}>
                      User will be required to change this password upon their next login (FR-16).
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top bg-light">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setResetPassTarget(null)}
                    disabled={resetSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    id="submit-reset-password-btn"
                    className="btn btn-sm text-white fw-semibold px-3"
                    style={{ backgroundColor: "#006B3C", borderColor: "#006B3C" }}
                    disabled={resetSubmitting}
                  >
                    {resetSubmitting ? "Resetting..." : "Reset Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
