import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { UserManagement } from "../../src/components/UserManagement.js";
import * as api from "../../src/api.js";
import { AdminUser, PaginatedAdminUsers } from "../../src/types.js";

// Mock RequesterContext
const mockCurrentRequester = {
  id: 1,
  fullName: "System Administrator",
  email: "admin@toktickit.com",
  role: "Administrator" as const,
};

vi.mock("../../src/context/RequesterContext.js", () => ({
  useRequester: () => ({
    currentRequester: mockCurrentRequester,
  }),
}));

describe("Lab 3 Issue 6: UserManagement Component (UI-04, FR-13, FR-14, FR-15)", () => {
  const mockUsers: AdminUser[] = [
    {
      id: 1,
      fullName: "System Administrator",
      email: "admin@toktickit.com",
      role: "Administrator",
      department: "IT Administration",
      isActive: true,
      mustChangePassword: false,
      createdAt: "2026-08-01T00:00:00Z",
    },
    {
      id: 5,
      fullName: "Michael Brown",
      email: "mbrown@toktickit.com",
      role: "ITStaff",
      department: "IT Infrastructure",
      isActive: true,
      mustChangePassword: false,
      createdAt: "2026-08-02T00:00:00Z",
    },
    {
      id: 10,
      fullName: "Jennifer Anderson",
      email: "janderson@toktickit.com",
      role: "Requester",
      department: "Computer Engineering",
      isActive: false,
      mustChangePassword: true,
      createdAt: "2026-08-03T00:00:00Z",
    },
  ];

  const mockPaginatedResponse: PaginatedAdminUsers = {
    users: mockUsers,
    pagination: {
      page: 1,
      limit: 10,
      totalCount: 3,
      totalPages: 1,
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, "fetchAdminUsers").mockResolvedValue(mockPaginatedResponse);
  });

  it("renders user table, role badges, status badges, and search/filter controls (UI-04)", async () => {
    render(<UserManagement />);

    expect(screen.getByText(/Loading user accounts.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("User Management")).toBeInTheDocument();
      expect(screen.getByText("3 Total Users")).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Search by name or email.../i)).toBeInTheDocument();
      expect(screen.getByText("System Administrator")).toBeInTheDocument();
      expect(screen.getByText("Michael Brown")).toBeInTheDocument();
      expect(screen.getByText("Jennifer Anderson")).toBeInTheDocument();
      expect(screen.getByText("IT Infrastructure")).toBeInTheDocument();
      expect(screen.getByText("Computer Engineering")).toBeInTheDocument();
    });

    // Check presence of role badges
    expect(screen.getAllByText("Administrator").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("IT Staff").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Requester").length).toBeGreaterThanOrEqual(1);

    // Check status badges
    expect(screen.getAllByText("Active").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Inactive")).toBeInTheDocument();

    // Check "You" badge for current admin user
    expect(screen.getByText("You")).toBeInTheDocument();
  });

  it("triggers search and filters when inputs change", async () => {
    const fetchSpy = vi.spyOn(api, "fetchAdminUsers").mockResolvedValue(mockPaginatedResponse);

    render(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByText("System Administrator")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search by name or email.../i);
    fireEvent.change(searchInput, { target: { value: "Michael" } });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          search: "Michael",
        })
      );
    });

    const roleSelect = document.getElementById("filter-role-select") as HTMLSelectElement;
    fireEvent.change(roleSelect, { target: { value: "ITStaff" } });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          role: "ITStaff",
        })
      );
    });
  });

  it("opens Create User modal, validates, and creates a new user account (FR-14, AC-09)", async () => {
    const createSpy = vi.spyOn(api, "createAdminUser").mockResolvedValue({
      user: {
        id: 15,
        fullName: "Alex Thompson",
        email: "alex.t@toktickit.com",
        role: "ITStaff",
        department: "Operations",
        isActive: true,
        mustChangePassword: true,
        createdAt: "2026-09-18T12:00:00Z",
      },
    });

    render(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByText("User Management")).toBeInTheDocument();
    });

    // Open Create Modal
    const createBtn = screen.getByRole("button", { name: /\+ Create New User/i });
    fireEvent.click(createBtn);

    expect(screen.getByText(/\+ Create New User Account/i)).toBeInTheDocument();

    // Fill form
    fireEvent.change(document.getElementById("create-user-fullname")!, {
      target: { value: "Alex Thompson" },
    });
    fireEvent.change(document.getElementById("create-user-email")!, {
      target: { value: "alex.t@toktickit.com" },
    });
    fireEvent.change(document.getElementById("create-user-role")!, {
      target: { value: "ITStaff" },
    });
    fireEvent.change(document.getElementById("create-user-department")!, {
      target: { value: "Operations" },
    });
    fireEvent.change(document.getElementById("create-user-password")!, {
      target: { value: "InitialPassword123!" },
    });

    // Submit
    const submitBtn = screen.getByRole("button", { name: /Create Account/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith({
        fullName: "Alex Thompson",
        email: "alex.t@toktickit.com",
        role: "ITStaff",
        department: "Operations",
        initialPassword: "InitialPassword123!",
        isActive: true,
      });
    });

    // Verify modal closed and success alert shown
    await waitFor(() => {
      expect(screen.getByText(/created successfully/i)).toBeInTheDocument();
    });
  });

  it("opens Edit User modal and updates user details (FR-15)", async () => {
    const updateSpy = vi.spyOn(api, "updateAdminUser").mockResolvedValue({
      user: {
        ...mockUsers[1],
        fullName: "Michael Brown Updated",
      },
    });

    render(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByText("Michael Brown")).toBeInTheDocument();
    });

    // Click Edit button for Michael Brown (id 5)
    const editBtn = document.getElementById("edit-user-5-btn")!;
    fireEvent.click(editBtn);

    expect(screen.getByText(/Edit User: Michael Brown/i)).toBeInTheDocument();

    // Update name
    fireEvent.change(document.getElementById("edit-user-fullname")!, {
      target: { value: "Michael Brown Updated" },
    });

    // Submit
    const saveBtn = screen.getByRole("button", { name: /Save Changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        5,
        expect.objectContaining({
          fullName: "Michael Brown Updated",
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/updated successfully/i)).toBeInTheDocument();
    });
  });

  it("disables Active toggle and Role dropdown when editing own account (BR-12)", async () => {
    render(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByText("System Administrator")).toBeInTheDocument();
    });

    // Click Edit for own account (id 1)
    const editBtn = document.getElementById("edit-user-1-btn")!;
    fireEvent.click(editBtn);

    expect(screen.getByText(/Edit User: System Administrator/i)).toBeInTheDocument();

    const activeToggle = document.getElementById("edit-user-active") as HTMLInputElement;
    expect(activeToggle).toBeDisabled();
    expect(screen.getByText(/You cannot deactivate your own account/i)).toBeInTheDocument();

    const roleSelect = document.getElementById("edit-user-role") as HTMLSelectElement;
    expect(roleSelect).toBeDisabled();
    expect(screen.getByText(/You cannot demote your own Administrator role/i)).toBeInTheDocument();
  });

  it("opens Reset Password modal and resets password (FR-16)", async () => {
    const resetSpy = vi.spyOn(api, "resetAdminUserPassword").mockResolvedValue({
      message: "Initial password set successfully. User must change password at next login.",
    });

    render(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByText("Michael Brown")).toBeInTheDocument();
    });

    // Click Reset Password for Michael Brown (id 5)
    const resetBtn = document.getElementById("reset-pass-5-btn")!;
    fireEvent.click(resetBtn);

    expect(screen.getByText(/Reset Password for Michael Brown/i)).toBeInTheDocument();

    // Enter new password
    fireEvent.change(document.getElementById("reset-user-password")!, {
      target: { value: "TempPassword123!" },
    });

    // Submit
    const submitBtn = document.getElementById("submit-reset-password-btn")!;
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(resetSpy).toHaveBeenCalledWith(5, "TempPassword123!");
    });

    await waitFor(() => {
      expect(screen.getByText(/Password for "Michael Brown" has been reset/i)).toBeInTheDocument();
    });
  });
});
