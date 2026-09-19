import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Login } from "../../src/components/Login.js";
import * as api from "../../src/api.js";
import { User } from "../../src/types.js";

const mockActiveUser: User = {
  id: 1,
  email: "admin@kmutt.ac.th",
  fullName: "System Admin",
  role: "Admin",
  isActive: true,
  mustChangePassword: false,
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
};

const mockMustChangeUser: User = {
  id: 2,
  email: "newuser@kmutt.ac.th",
  fullName: "New IT Staff",
  role: "IT_Staff",
  isActive: true,
  mustChangePassword: true,
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
};

describe("Login and Mandatory Password Change Component (UI-01, AC-01, AC-02)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("UI-01.1: renders login form with email and password inputs", () => {
    render(<Login onSuccess={vi.fn()} />);

    expect(screen.getByText(/TokTickIT Sign In/i)).toBeInTheDocument();
    expect(screen.getByTestId("login-email")).toBeInTheDocument();
    expect(screen.getByTestId("login-password")).toBeInTheDocument();
    expect(screen.getByTestId("login-submit")).toBeInTheDocument();
  });

  it("UI-01.2: validates required inputs and displays error on empty submit", async () => {
    render(<Login onSuccess={vi.fn()} />);

    fireEvent.click(screen.getByTestId("login-submit"));

    expect(await screen.findByTestId("login-error")).toBeInTheDocument();
    expect(screen.getByText(/Please enter both email address and password/i)).toBeInTheDocument();
  });

  it("UI-01.3: displays error message on invalid credentials or inactive account (BR-01)", async () => {
    vi.spyOn(api, "loginUser").mockRejectedValue(new Error("Invalid email or password"));

    render(<Login onSuccess={vi.fn()} />);

    fireEvent.change(screen.getByTestId("login-email"), {
      target: { value: "inactive@kmutt.ac.th" },
    });
    fireEvent.change(screen.getByTestId("login-password"), {
      target: { value: "WrongPassword123!" },
    });
    fireEvent.click(screen.getByTestId("login-submit"));

    expect(await screen.findByTestId("login-error")).toBeInTheDocument();
    expect(screen.getByText(/Invalid email or password/i)).toBeInTheDocument();
  });

  it("UI-01.4: logs in directly and calls onSuccess when mustChangePassword is false (AC-01)", async () => {
    const onSuccessMock = vi.fn();
    vi.spyOn(api, "loginUser").mockResolvedValue({
      user: mockActiveUser,
      token: "mock-jwt-token",
    });

    render(<Login onSuccess={onSuccessMock} />);

    fireEvent.change(screen.getByTestId("login-email"), {
      target: { value: "admin@kmutt.ac.th" },
    });
    fireEvent.change(screen.getByTestId("login-password"), {
      target: { value: "Admin@12345" },
    });
    fireEvent.click(screen.getByTestId("login-submit"));

    await waitFor(() => {
      expect(onSuccessMock).toHaveBeenCalledWith(mockActiveUser);
    });
  });

  it("UI-01.5: switches to mandatory password change screen when mustChangePassword is true (AC-02, BR-02)", async () => {
    vi.spyOn(api, "loginUser").mockResolvedValue({
      user: mockMustChangeUser,
      token: "mock-jwt-token",
    });

    render(<Login onSuccess={vi.fn()} />);

    fireEvent.change(screen.getByTestId("login-email"), {
      target: { value: "newuser@kmutt.ac.th" },
    });
    fireEvent.change(screen.getByTestId("login-password"), {
      target: { value: "Initial@123" },
    });
    fireEvent.click(screen.getByTestId("login-submit"));

    expect(await screen.findByText(/Mandatory Password Change/i)).toBeInTheDocument();
    expect(screen.getByTestId("current-password")).toBeInTheDocument();
    expect(screen.getByTestId("new-password")).toBeInTheDocument();
    expect(screen.getByTestId("confirm-new-password")).toBeInTheDocument();
    expect(screen.getByTestId("change-password-submit")).toBeDisabled();
  });

  it("UI-01.6: validates password complexity checklist and completes password change (AC-02)", async () => {
    const onSuccessMock = vi.fn();
    const updatedUser: User = { ...mockMustChangeUser, mustChangePassword: false };

    vi.spyOn(api, "changePassword").mockResolvedValue({
      message: "Password changed successfully",
      user: updatedUser,
    });

    render(<Login initialUser={mockMustChangeUser} onSuccess={onSuccessMock} />);

    expect(screen.getByText(/Mandatory Password Change/i)).toBeInTheDocument();

    const currentInput = screen.getByTestId("current-password");
    const newInput = screen.getByTestId("new-password");
    const confirmInput = screen.getByTestId("confirm-new-password");
    const submitBtn = screen.getByTestId("change-password-submit");

    fireEvent.change(currentInput, { target: { value: "Initial@123" } });
    fireEvent.change(newInput, { target: { value: "short" } });
    fireEvent.change(confirmInput, { target: { value: "short" } });
    expect(submitBtn).toBeDisabled();

    // Fill valid new password meeting all complexity criteria
    fireEvent.change(newInput, { target: { value: "StrongNewPass!2026" } });
    fireEvent.change(confirmInput, { target: { value: "StrongNewPass!2026" } });

    await waitFor(() => {
      expect(submitBtn).toBeEnabled();
    });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.changePassword).toHaveBeenCalledWith(
        "Initial@123",
        "StrongNewPass!2026",
        "StrongNewPass!2026"
      );
      expect(onSuccessMock).toHaveBeenCalledWith(updatedUser);
    });
  });
});
