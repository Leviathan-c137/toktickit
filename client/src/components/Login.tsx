import React, { useState } from "react";
import { User } from "../types.js";
import { loginUser, changePassword } from "../api.js";

interface LoginProps {
  initialUser?: User | null;
  onSuccess: (user: User) => void;
  onCancel?: () => void;
}

export const Login: React.FC<LoginProps> = ({ initialUser, onSuccess, onCancel }) => {
  const [step, setStep] = useState<"login" | "change-password">(
    initialUser?.mustChangePassword ? "change-password" : "login"
  );

  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Current logged in user waiting for password change
  const [currentUser, setCurrentUser] = useState<User | null>(initialUser || null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changeError, setChangeError] = useState("");
  const [isChanging, setIsChanging] = useState(false);

  // Password strength validation
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumOrSpec = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmNewPassword;
  const isNewDifferent = currentPassword.length > 0 && newPassword.length > 0 && currentPassword !== newPassword;
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasNumOrSpec && passwordsMatch && isNewDifferent;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!email.trim() || !password) {
      setLoginError("Please enter both email address and password.");
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await loginUser(email.trim(), password);
      if (res.user.mustChangePassword) {
        setCurrentUser(res.user);
        setCurrentPassword(password);
        setStep("change-password");
      } else {
        onSuccess(res.user);
      }
    } catch (err: any) {
      setLoginError(err.message || "Invalid email or password");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError("");

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setChangeError("All password fields are required.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setChangeError("New password and confirmation do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setChangeError("New password must be different from current password.");
      return;
    }

    if (!isPasswordValid) {
      setChangeError("New password does not meet the complexity requirements.");
      return;
    }

    setIsChanging(true);
    try {
      const res = await changePassword(currentPassword, newPassword, confirmNewPassword);
      onSuccess(res.user);
    } catch (err: any) {
      setChangeError(err.message || "Failed to change password. Please try again.");
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: 520 }}>
      {step === "login" ? (
        <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
          <div
            className="p-4 text-white text-center"
            style={{ backgroundColor: "#006B3C" }}
          >
            <div
              className="d-inline-flex align-items-center justify-content-center mb-2 rounded-circle shadow-sm"
              style={{
                width: "48px",
                height: "48px",
                backgroundColor: "#EAF6EF",
                color: "#006B3C",
                fontSize: "1.4rem",
                fontWeight: "bold",
              }}
            >
              ✓
            </div>
            <h2 className="h4 fw-bold mb-1">TokTickIT Sign In</h2>
            <p className="mb-0 text-white-50" style={{ fontSize: "0.9rem" }}>
              University IT Service Desk & User Management Portal
            </p>
          </div>

          <div className="card-body p-4 p-md-5">
            {loginError && (
              <div
                className="alert alert-danger d-flex align-items-center mb-4 py-2 px-3 rounded-3"
                role="alert"
                data-testid="login-error"
                style={{ fontSize: "0.9rem" }}
              >
                <span className="me-2 fw-bold">⚠</span>
                <div>{loginError}</div>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} noValidate>
              <div className="mb-3">
                <label
                  htmlFor="login-email"
                  className="form-label fw-semibold text-secondary"
                  style={{ fontSize: "0.85rem" }}
                >
                  Email Address
                </label>
                <input
                  id="login-email"
                  data-testid="login-email"
                  type="email"
                  className="form-control form-control-lg rounded-3"
                  placeholder="name@kmutt.ac.th"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoggingIn}
                  required
                />
              </div>

              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label
                    htmlFor="login-password"
                    className="form-label fw-semibold text-secondary mb-0"
                    style={{ fontSize: "0.85rem" }}
                  >
                    Password
                  </label>
                </div>
                <input
                  id="login-password"
                  data-testid="login-password"
                  type="password"
                  className="form-control form-control-lg rounded-3"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoggingIn}
                  required
                />
              </div>

              <button
                type="submit"
                data-testid="login-submit"
                className="btn btn-lg w-100 fw-semibold text-white rounded-3 shadow-sm mb-3"
                style={{ backgroundColor: "#006B3C" }}
                disabled={isLoggingIn}
              >
                {isLoggingIn ? "Signing In..." : "Sign In"}
              </button>

              {onCancel && (
                <button
                  type="button"
                  className="btn btn-outline-secondary w-100 rounded-3"
                  onClick={onCancel}
                >
                  Back to Portal
                </button>
              )}
            </form>
          </div>
        </div>
      ) : (
        <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
          <div
            className="p-4 text-white text-center"
            style={{ backgroundColor: "#B45309" }}
          >
            <div
              className="d-inline-flex align-items-center justify-content-center mb-2 rounded-circle shadow-sm"
              style={{
                width: "48px",
                height: "48px",
                backgroundColor: "#FEF3C7",
                color: "#92400E",
                fontSize: "1.3rem",
                fontWeight: "bold",
              }}
            >
              🔒
            </div>
            <h2 className="h4 fw-bold mb-1">Mandatory Password Change</h2>
            <p className="mb-0 text-white-50" style={{ fontSize: "0.88rem" }}>
              Welcome{currentUser?.fullName ? `, ${currentUser.fullName}` : ""}! Please update your initial password to continue.
            </p>
          </div>

          <div className="card-body p-4 p-md-5">
            {changeError && (
              <div
                className="alert alert-danger d-flex align-items-center mb-4 py-2 px-3 rounded-3"
                role="alert"
                data-testid="change-password-error"
                style={{ fontSize: "0.9rem" }}
              >
                <span className="me-2 fw-bold">⚠</span>
                <div>{changeError}</div>
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} noValidate>
              <div className="mb-3">
                <label
                  htmlFor="current-password"
                  className="form-label fw-semibold text-secondary"
                  style={{ fontSize: "0.85rem" }}
                >
                  Current (Initial) Password
                </label>
                <input
                  id="current-password"
                  data-testid="current-password"
                  type="password"
                  className="form-control rounded-3"
                  placeholder="Enter initial password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={isChanging}
                  required
                />
              </div>

              <div className="mb-3">
                <label
                  htmlFor="new-password"
                  className="form-label fw-semibold text-secondary"
                  style={{ fontSize: "0.85rem" }}
                >
                  New Password
                </label>
                <input
                  id="new-password"
                  data-testid="new-password"
                  type="password"
                  className="form-control rounded-3"
                  placeholder="Enter new strong password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isChanging}
                  required
                />
              </div>

              <div className="mb-3">
                <label
                  htmlFor="confirm-new-password"
                  className="form-label fw-semibold text-secondary"
                  style={{ fontSize: "0.85rem" }}
                >
                  Confirm New Password
                </label>
                <input
                  id="confirm-new-password"
                  data-testid="confirm-new-password"
                  type="password"
                  className="form-control rounded-3"
                  placeholder="Confirm new password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  disabled={isChanging}
                  required
                />
              </div>

              {/* Password Requirements Checklist */}
              <div
                className="p-3 mb-4 rounded-3 border"
                style={{ backgroundColor: "#F9FAFB", fontSize: "0.82rem" }}
              >
                <div className="fw-semibold text-secondary mb-2">Password Requirements:</div>
                <div className={`d-flex align-items-center mb-1 ${hasMinLength ? "text-success" : "text-muted"}`}>
                  <span className="me-2">{hasMinLength ? "✓" : "○"}</span> At least 8 characters
                </div>
                <div className={`d-flex align-items-center mb-1 ${hasUpper ? "text-success" : "text-muted"}`}>
                  <span className="me-2">{hasUpper ? "✓" : "○"}</span> Contains uppercase letter (A-Z)
                </div>
                <div className={`d-flex align-items-center mb-1 ${hasLower ? "text-success" : "text-muted"}`}>
                  <span className="me-2">{hasLower ? "✓" : "○"}</span> Contains lowercase letter (a-z)
                </div>
                <div className={`d-flex align-items-center mb-1 ${hasNumOrSpec ? "text-success" : "text-muted"}`}>
                  <span className="me-2">{hasNumOrSpec ? "✓" : "○"}</span> Contains a number or special character
                </div>
                <div className={`d-flex align-items-center ${passwordsMatch ? "text-success" : "text-muted"}`}>
                  <span className="me-2">{passwordsMatch ? "✓" : "○"}</span> Passwords match
                </div>
              </div>

              <button
                type="submit"
                data-testid="change-password-submit"
                className="btn btn-lg w-100 fw-semibold text-white rounded-3 shadow-sm"
                style={{ backgroundColor: "#006B3C" }}
                disabled={isChanging || !isPasswordValid}
              >
                {isChanging ? "Updating Password..." : "Update Password & Continue"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
