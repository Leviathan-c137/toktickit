import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import App from "../../src/App.js";
import * as api from "../../src/api.js";
import {
  User,
  AdminUser,
  PaginatedAdminUsers,
  StaffTicketItem,
  StaffTicketDetailData,
  InternalNote,
  PublicComment,
} from "../../src/types.js";

const mockAdminUser: User = {
  id: 1,
  email: "admin@kmutt.ac.th",
  fullName: "Admin Pongrit",
  role: "Administrator",
  isActive: true,
  mustChangePassword: false,
};

const mockStaffUser: User = {
  id: 2,
  email: "staff@kmutt.ac.th",
  fullName: "Staff Somchai",
  role: "ITStaff",
  isActive: true,
  mustChangePassword: false,
};

const mockAdminUserRecords: AdminUser[] = [
  {
    id: 1,
    fullName: "Admin Pongrit",
    email: "admin@kmutt.ac.th",
    role: "Administrator",
    department: "IT Services",
    isActive: true,
    mustChangePassword: false,
    createdAt: "2026-09-01T00:00:00.000Z",
  },
  {
    id: 2,
    fullName: "Staff Somchai",
    email: "staff@kmutt.ac.th",
    role: "ITStaff",
    department: "IT Support",
    isActive: true,
    mustChangePassword: false,
    createdAt: "2026-09-01T00:00:00.000Z",
  },
  {
    id: 3,
    fullName: "Jennifer Anderson",
    email: "requester@kmutt.ac.th",
    role: "Requester",
    department: "Computer Engineering",
    isActive: true,
    mustChangePassword: false,
    createdAt: "2026-09-01T00:00:00.000Z",
  },
];

const mockPaginatedAdminUsers: PaginatedAdminUsers = {
  users: mockAdminUserRecords,
  pagination: {
    page: 1,
    limit: 10,
    totalCount: 3,
    totalPages: 1,
  },
};

const mockStaffTickets: StaffTicketItem[] = [
  {
    id: 101,
    ticketNumber: "TKT-2026-000101",
    summary: "VPN Connection drops constantly",
    requestedPriority: "High",
    itPriority: "High",
    status: "InProgress",
    createdAt: "2026-09-18T10:00:00.000Z",
    updatedAt: "2026-09-18T12:00:00.000Z",
    requester: {
      id: 3,
      fullName: "Jennifer Anderson",
      email: "jennifer.anderson@kmutt.ac.th",
      department: "Computer Engineering",
    },
    owner: null,
    category: { id: 4, name: "Network" },
    relatedSystem: { id: 1, name: "VPN Gateway" },
    _count: {
      attachments: 0,
      publicComments: 1,
      internalNotes: 1,
    },
  },
];

const mockStaffTicketDetailData: StaffTicketDetailData = {
  id: 101,
  ticketNumber: "TKT-2026-000101",
  summary: "VPN Connection drops constantly",
  description: "User cannot stay connected to campus VPN for more than 5 minutes.",
  requestedPriority: "High",
  itPriority: "High",
  status: "InProgress",
  createdAt: "2026-09-18T10:00:00.000Z",
  updatedAt: "2026-09-18T12:00:00.000Z",
  requester: {
    id: 3,
    fullName: "Jennifer Anderson",
    email: "requester@kmutt.ac.th",
    department: "Computer Engineering",
  },
  owner: null,
  category: { id: 4, name: "Network" },
  relatedSystem: { id: 1, name: "VPN Gateway" },
  attachments: [],
};

const mockInitialNotes: InternalNote[] = [
  {
    id: 1,
    ticketId: 101,
    author: {
      id: 2,
      fullName: "Staff Somchai",
      role: "ITStaff",
    },
    content: "Investigating gateway server logs.",
    createdAt: "2026-09-18T10:30:00.000Z",
  },
];

const mockInitialComments: PublicComment[] = [
  {
    id: 1,
    ticketId: 101,
    author: {
      id: 3,
      fullName: "Jennifer Anderson",
      role: "Requester",
    },
    content: "Happens on both Wi-Fi and mobile hotspot.",
    createdAt: "2026-09-18T10:15:00.000Z",
  },
];

describe("Lab 3 E2E Integration Suite (UI-01, UI-02, UI-03, UI-04, E2E-01 to E2E-03)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("E2E-03: Full Admin Flow — Login, User Table, Create User, Self-Deactivation Guard, Password Reset", async () => {
    vi.spyOn(api, "fetchCurrentUser").mockResolvedValue(null);
    vi.spyOn(api, "loginUser").mockResolvedValue({
      user: mockAdminUser,
      token: "admin-jwt-token",
    });
    vi.spyOn(api, "fetchAdminUsers").mockResolvedValue(mockPaginatedAdminUsers);

    render(<App />);

    // 1. Navigate to Sign In via Header
    const signInBtn = await screen.findByTestId("header-sign-in-btn");
    fireEvent.click(signInBtn);

    // 2. Perform Admin Login
    expect(screen.getByText(/TokTickIT Sign In/i)).toBeInTheDocument();
    fireEvent.change(screen.getByTestId("login-email"), {
      target: { value: "admin@kmutt.ac.th" },
    });
    fireEvent.change(screen.getByTestId("login-password"), {
      target: { value: "Admin@12345" },
    });
    fireEvent.click(screen.getByTestId("login-submit"));

    // 3. Lands on User Management screen
    expect(await screen.findByRole("heading", { name: /User Management/i })).toBeInTheDocument();
    expect(screen.getByTestId("user-profile-badge")).toHaveTextContent("Admin Pongrit");

    // 4. Verify user list displayed
    expect(await screen.findByText("staff@kmutt.ac.th")).toBeInTheDocument();
    expect(screen.getByText("requester@kmutt.ac.th")).toBeInTheDocument();

    // 5. Open Create User Modal
    const createBtn = screen.getByRole("button", { name: /\+ Create New User/i });
    fireEvent.click(createBtn);

    expect(await screen.findByText("+ Create New User Account")).toBeInTheDocument();

    const createdAdminUserRecord: AdminUser = {
      id: 4,
      fullName: "New IT Engineer",
      email: "newit@kmutt.ac.th",
      role: "ITStaff",
      department: "IT Infrastructure",
      isActive: true,
      mustChangePassword: true,
      createdAt: "2026-09-19T00:00:00.000Z",
    };

    vi.spyOn(api, "createAdminUser").mockResolvedValue({
      user: createdAdminUserRecord,
    });

    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: "New IT Engineer" },
    });
    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: "newit@kmutt.ac.th" },
    });
    fireEvent.change(screen.getByLabelText(/^Role/i), {
      target: { value: "ITStaff" },
    });
    fireEvent.change(screen.getByLabelText(/Initial Password \*/i), {
      target: { value: "Initial@123" },
    });

    const saveBtn = screen.getByRole("button", { name: /Create Account/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(api.createAdminUser).toHaveBeenCalledWith({
        fullName: "New IT Engineer",
        email: "newit@kmutt.ac.th",
        role: "ITStaff",
        department: "",
        initialPassword: "Initial@123",
        isActive: true,
      });
    });

    // 6. Test Admin Safety Rule: Self-Deactivation Guard (BR-12)
    const adminRow = screen.getByText("admin@kmutt.ac.th").closest("tr")!;
    const editBtn = within(adminRow).getByRole("button", { name: "Edit" });
    fireEvent.click(editBtn);

    expect(await screen.findByText(/Edit User:/i)).toBeInTheDocument();

    // Status toggle should be disabled for self
    const activeToggle = screen.getByRole("checkbox");
    expect(activeToggle).toBeDisabled();

    // Close modal
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));

    // 7. Test Password Reset for staff user
    const staffRow = screen.getByText("staff@kmutt.ac.th").closest("tr")!;
    const resetBtn = within(staffRow).getByRole("button", { name: "Reset Password" });
    fireEvent.click(resetBtn);

    expect(await screen.findByText(/Reset Password for/i)).toBeInTheDocument();

    vi.spyOn(api, "resetAdminUserPassword").mockResolvedValue({
      message: "Password reset successfully",
    });

    fireEvent.change(screen.getByLabelText(/New Initial Password/i), {
      target: { value: "StaffTemp@1234" },
    });

    const submitResetBtn = document.getElementById("submit-reset-password-btn")!;
    fireEvent.click(submitResetBtn);

    await waitFor(() => {
      expect(api.resetAdminUserPassword).toHaveBeenCalledWith(2, "StaffTemp@1234");
    });
  });

  it("E2E-02: Full IT Staff Flow — Login, Queue Filter, Detail View, Claim Ticket, Notes, Comments", async () => {
    vi.spyOn(api, "fetchCurrentUser").mockResolvedValue(null);
    vi.spyOn(api, "loginUser").mockResolvedValue({
      user: mockStaffUser,
      token: "staff-jwt-token",
    });
    vi.spyOn(api, "fetchStaffTicketQueue").mockResolvedValue({
      tickets: mockStaffTickets,
      pagination: {
        page: 1,
        limit: 10,
        totalCount: 1,
        totalPages: 1,
      },
    });
    vi.spyOn(api, "fetchCategories").mockResolvedValue([
      { id: 4, name: "Network" },
    ]);
    vi.spyOn(api, "fetchStaffTicketDetail").mockResolvedValue(mockStaffTicketDetailData);
    vi.spyOn(api, "fetchActiveStaffUsers").mockResolvedValue([
      { id: 2, fullName: "Staff Somchai", email: "staff@kmutt.ac.th", role: "ITStaff" },
    ]);
    vi.spyOn(api, "fetchInternalNotes").mockResolvedValue(mockInitialNotes);
    vi.spyOn(api, "fetchPublicComments").mockResolvedValue(mockInitialComments);

    render(<App />);

    // 1. Sign In as IT Staff
    const signInBtn = await screen.findByTestId("header-sign-in-btn");
    fireEvent.click(signInBtn);

    fireEvent.change(screen.getByTestId("login-email"), {
      target: { value: "staff@kmutt.ac.th" },
    });
    fireEvent.change(screen.getByTestId("login-password"), {
      target: { value: "Staff@12345" },
    });
    fireEvent.click(screen.getByTestId("login-submit"));

    // 2. Lands on Ticket Queue
    expect(await screen.findByRole("heading", { name: /IT Staff Ticket Queue/i })).toBeInTheDocument();
    expect(screen.getByTestId("user-profile-badge")).toHaveTextContent("Staff Somchai");

    // 3. View Queue item and click View Detail
    expect(await screen.findByText("TKT-2026-000101")).toBeInTheDocument();
    const viewDetailBtn = screen.getByRole("button", { name: /View Detail/i });
    fireEvent.click(viewDetailBtn);

    // 4. Ticket Detail View loaded
    expect(await screen.findByText(/VPN Connection drops constantly/i)).toBeInTheDocument();
    expect(screen.getByText(/User cannot stay connected to campus VPN/i)).toBeInTheDocument();

    // 5. Claim Ticket Ownership (FR-10, BR-07)
    vi.spyOn(api, "updateTicketOwner").mockResolvedValue({
      ticketId: 101,
      owner: { id: 2, fullName: "Staff Somchai", email: "staff@kmutt.ac.th" },
    });

    const claimSelect = document.getElementById("ticket-claim-select") as HTMLSelectElement;
    expect(claimSelect).toBeInTheDocument();
    fireEvent.change(claimSelect, { target: { value: "2" } });

    await waitFor(() => {
      expect(api.updateTicketOwner).toHaveBeenCalledWith(101, 2);
    });

    // 6. Post Confidential Internal Note (FR-08, BR-05)
    const newNote: InternalNote = {
      id: 2,
      ticketId: 101,
      author: {
        id: 2,
        fullName: "Staff Somchai",
        role: "ITStaff",
      },
      content: "Restarted authentication proxy service.",
      createdAt: "2026-09-18T13:00:00.000Z",
    };

    vi.spyOn(api, "createInternalNote").mockResolvedValue(newNote);

    // Switch to Internal Notes tab
    const notesTab = screen.getByRole("button", { name: /Internal Notes/i });
    fireEvent.click(notesTab);

    expect(screen.getByText(/Confidential • IT Staff & Admin Only/i)).toBeInTheDocument();
    expect(await screen.findByText("Investigating gateway server logs.")).toBeInTheDocument();

    const noteInput = document.getElementById("internal-note-input") as HTMLTextAreaElement;
    fireEvent.change(noteInput, {
      target: { value: "Restarted authentication proxy service." },
    });

    const postNoteBtn = screen.getByRole("button", { name: /Post Internal Note/i });
    fireEvent.click(postNoteBtn);

    await waitFor(() => {
      expect(api.createInternalNote).toHaveBeenCalledWith(101, "Restarted authentication proxy service.");
    });

    // 7. Post Public Comment (FR-07)
    const newComment: PublicComment = {
      id: 2,
      ticketId: 101,
      author: {
        id: 2,
        fullName: "Staff Somchai",
        role: "ITStaff",
      },
      content: "Please verify if you can stay connected now.",
      createdAt: "2026-09-18T13:05:00.000Z",
    };

    vi.spyOn(api, "createPublicComment").mockResolvedValue(newComment);

    const commentsTab = screen.getByRole("button", { name: /Public Comments/i });
    fireEvent.click(commentsTab);

    expect(await screen.findByText("Happens on both Wi-Fi and mobile hotspot.")).toBeInTheDocument();

    const commentInput = document.getElementById("publicCommentInput") as HTMLTextAreaElement;
    fireEvent.change(commentInput, {
      target: { value: "Please verify if you can stay connected now." },
    });

    const postCommentBtn = screen.getByRole("button", { name: /^Post Comment$/i });
    fireEvent.click(postCommentBtn);

    await waitFor(() => {
      expect(api.createPublicComment).toHaveBeenCalledWith(101, "Please verify if you can stay connected now.");
    });

    // 8. Sign Out
    const logoutBtn = screen.getByTestId("logout-btn");
    vi.spyOn(api, "logoutUser").mockResolvedValue();
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(api.logoutUser).toHaveBeenCalled();
      expect(screen.getByText(/TokTickIT Sign In/i)).toBeInTheDocument();
    });
  });
});
