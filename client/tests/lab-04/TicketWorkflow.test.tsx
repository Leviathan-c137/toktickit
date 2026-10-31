import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { StaffTicketDetail } from "../../src/components/StaffTicketDetail.js";
import { RequesterTicketDetail } from "../../src/components/RequesterTicketDetail.js";
import { RequesterProvider } from "../../src/context/RequesterContext.js";
import * as api from "../../src/api.js";
import { StaffTicketDetailData, Ticket, StaffUser, Requester } from "../../src/types.js";

describe("Lab 4 Issue 4: Ticket Workflow, Status Transitions, and Resolution Gate UI (UI-03, AC-05, AC-06, FR-07, BR-06, BR-07)", () => {
  const mockRequester: Requester = {
    id: 1,
    fullName: "Jennifer Anderson",
    email: "janderson@toktickit.com",
    department: "Computer Engineering",
  };

  const baseStaffTicket: StaffTicketDetailData = {
    id: 15,
    ticketNumber: "TKT-2026-000015",
    summary: "Workstation network adapter failure",
    description: "Workstation drops connectivity after 10 minutes of usage.",
    requestedPriority: "High",
    itPriority: "High",
    status: "New",
    createdAt: "2026-10-30T09:00:00.000Z",
    updatedAt: "2026-10-30T09:30:00.000Z",
    requester: {
      id: 1,
      fullName: "Jennifer Anderson",
      email: "janderson@toktickit.com",
      department: "Computer Engineering",
    },
    owner: {
      id: 5,
      fullName: "Michael Brown",
      email: "mbrown@toktickit.com",
    },
    category: { id: 1, name: "Hardware" },
    relatedSystem: { id: 1, name: "Staff Workstation" },
    attachments: [],
    actionsTaken: [],
  };

  const baseRequesterTicket: Ticket = {
    id: 15,
    ticketNumber: "TKT-2026-000015",
    summary: "Workstation network adapter failure",
    description: "Workstation drops connectivity after 10 minutes of usage.",
    requestedPriority: "High",
    itPriority: "High",
    status: "InProgress",
    requesterId: 1,
    requester: {
      id: 1,
      fullName: "Jennifer Anderson",
      email: "janderson@toktickit.com",
      department: "Computer Engineering",
    },
    categoryId: 1,
    category: { id: 1, name: "Hardware" },
    relatedSystemId: 1,
    relatedSystem: { id: 1, name: "Staff Workstation" },
    attachments: [],
    createdAt: "2026-10-30T09:00:00.000Z",
    updatedAt: "2026-10-30T09:30:00.000Z",
  };

  const mockStaffUsers: StaffUser[] = [
    { id: 5, fullName: "Michael Brown", email: "mbrown@toktickit.com", role: "ITStaff" },
  ];

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("toktickit_requester", JSON.stringify(mockRequester));
    vi.restoreAllMocks();
    vi.spyOn(api, "fetchActiveStaffUsers").mockResolvedValue(mockStaffUsers);
    vi.spyOn(api, "fetchPublicComments").mockResolvedValue([]);
    vi.spyOn(api, "fetchInternalNotes").mockResolvedValue([]);
    vi.spyOn(api, "fetchActionsTaken").mockResolvedValue([]);
  });

  // ---------------------------------------------------------------------------
  // 1. IT Staff Status State Machine Transitions (BR-06, AC-05)
  // ---------------------------------------------------------------------------
  describe("IT Staff Status Dropdown & Permitted Transitions (BR-06, AC-05)", () => {
    it("renders only permitted transitions for New status (Open, Cancelled per BR-06)", async () => {
      vi.spyOn(api, "fetchStaffTicketDetail").mockResolvedValue({
        ...baseStaffTicket,
        status: "New",
      });

      render(<StaffTicketDetail ticketId={15} onBack={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getAllByText("TKT-2026-000015").length).toBeGreaterThan(0);
      });

      const select = document.getElementById("ticket-status-select") as HTMLSelectElement;
      expect(select).toBeInTheDocument();
      expect(select.value).toBe("New");

      // Verify permitted options (BR-06)
      const optionValues = Array.from(select.options).map((o) => o.value);
      expect(optionValues).toContain("New");
      expect(optionValues).toContain("Open");
      expect(optionValues).toContain("Cancelled");

      // Verify forbidden states under BR-06 are excluded
      expect(optionValues).not.toContain("InProgress");
      expect(optionValues).not.toContain("Resolved");
      expect(optionValues).not.toContain("Closed");
      expect(optionValues).not.toContain("WaitingForRequester");
    });

    it("renders permitted transitions for InProgress status (WaitingForRequester, Resolved, Cancelled)", async () => {
      vi.spyOn(api, "fetchStaffTicketDetail").mockResolvedValue({
        ...baseStaffTicket,
        status: "InProgress",
      });

      render(<StaffTicketDetail ticketId={15} onBack={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getAllByText("TKT-2026-000015").length).toBeGreaterThan(0);
      });

      const select = document.getElementById("ticket-status-select") as HTMLSelectElement;
      const optionValues = Array.from(select.options).map((o) => o.value);
      expect(optionValues).toContain("InProgress");
      expect(optionValues).toContain("WaitingForRequester");
      expect(optionValues).toContain("Resolved");
      expect(optionValues).toContain("Cancelled");

      // Forbidden states from InProgress
      expect(optionValues).not.toContain("New");
      expect(optionValues).not.toContain("Closed");
    });

    it("renders permitted transitions for Resolved status (Closed, Reopened)", async () => {
      vi.spyOn(api, "fetchStaffTicketDetail").mockResolvedValue({
        ...baseStaffTicket,
        status: "Resolved",
      });

      render(<StaffTicketDetail ticketId={15} onBack={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getAllByText("TKT-2026-000015").length).toBeGreaterThan(0);
      });

      const select = document.getElementById("ticket-status-select") as HTMLSelectElement;
      const optionValues = Array.from(select.options).map((o) => o.value);
      expect(optionValues).toContain("Resolved");
      expect(optionValues).toContain("Closed");
      expect(optionValues).toContain("Reopened");

      // Forbidden states from Resolved
      expect(optionValues).not.toContain("InProgress");
      expect(optionValues).not.toContain("Open");
    });

    it("renders permitted transitions for legacy Pending status (InProgress, WaitingForRequester, Resolved, Cancelled)", async () => {
      vi.spyOn(api, "fetchStaffTicketDetail").mockResolvedValue({
        ...baseStaffTicket,
        status: "Pending",
      });

      render(<StaffTicketDetail ticketId={15} onBack={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getAllByText("TKT-2026-000015").length).toBeGreaterThan(0);
      });

      const select = document.getElementById("ticket-status-select") as HTMLSelectElement;
      const optionValues = Array.from(select.options).map((o) => o.value);
      expect(optionValues).toContain("Pending");
      expect(optionValues).toContain("InProgress");
      expect(optionValues).toContain("WaitingForRequester");
      expect(optionValues).toContain("Resolved");
      expect(optionValues).toContain("Cancelled");
    });

    it("disables status dropdown for terminal Cancelled status", async () => {
      vi.spyOn(api, "fetchStaffTicketDetail").mockResolvedValue({
        ...baseStaffTicket,
        status: "Cancelled",
      });

      render(<StaffTicketDetail ticketId={15} onBack={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getAllByText("TKT-2026-000015").length).toBeGreaterThan(0);
      });

      const select = document.getElementById("ticket-status-select") as HTMLSelectElement;
      expect(select).toBeDisabled();
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Status Mutation & Concurrency Conflict (BR-08, AC-07)
  // ---------------------------------------------------------------------------
  describe("Status Mutation & Concurrency Handling (BR-08, AC-07)", () => {
    it("successfully transitions status and passes expectedUpdatedAt", async () => {
      vi.spyOn(api, "fetchStaffTicketDetail").mockResolvedValue({
        ...baseStaffTicket,
        status: "Open",
      });

      const updateSpy = vi.spyOn(api, "updateTicketStatus").mockResolvedValue({
        id: 15,
        ticketId: 15,
        ticketNumber: "TKT-2026-000015",
        status: "InProgress",
        updatedAt: "2026-10-30T10:00:00.000Z",
      });

      render(<StaffTicketDetail ticketId={15} onBack={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getAllByText("TKT-2026-000015").length).toBeGreaterThan(0);
      });

      const select = document.getElementById("ticket-status-select") as HTMLSelectElement;
      fireEvent.change(select, { target: { value: "InProgress" } });

      await waitFor(() => {
        expect(updateSpy).toHaveBeenCalledWith(15, "InProgress", "2026-10-30T09:30:00.000Z");
        expect(screen.getByText(/Ticket status updated to InProgress/i)).toBeInTheDocument();
      });
    });

    it("displays error alert when concurrency conflict occurs (409 Conflict)", async () => {
      vi.spyOn(api, "fetchStaffTicketDetail").mockResolvedValue({
        ...baseStaffTicket,
        status: "Open",
      });

      const conflictErr: any = new Error("Conflict detected");
      conflictErr.status = 409;
      conflictErr.code = "CONFLICT";
      vi.spyOn(api, "updateTicketStatus").mockRejectedValue(conflictErr);

      render(<StaffTicketDetail ticketId={15} onBack={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getAllByText("TKT-2026-000015").length).toBeGreaterThan(0);
      });

      const select = document.getElementById("ticket-status-select") as HTMLSelectElement;
      fireEvent.change(select, { target: { value: "InProgress" } });

      await waitFor(() => {
        expect(
          screen.getByText(/Conflict detected: This ticket has been modified by another user/i)
        ).toBeInTheDocument();
      });
    });

    it("opens confirmation dialog when selecting terminal Cancelled status", async () => {
      vi.spyOn(api, "fetchStaffTicketDetail").mockResolvedValue({
        ...baseStaffTicket,
        status: "Open",
      });

      const updateSpy = vi.spyOn(api, "updateTicketStatus").mockResolvedValue({
        id: 15,
        ticketId: 15,
        ticketNumber: "TKT-2026-000015",
        status: "Cancelled",
        updatedAt: "2026-10-30T10:15:00.000Z",
      });

      render(<StaffTicketDetail ticketId={15} onBack={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getAllByText("TKT-2026-000015").length).toBeGreaterThan(0);
      });

      const select = document.getElementById("ticket-status-select") as HTMLSelectElement;
      fireEvent.change(select, { target: { value: "Cancelled" } });

      // Confirmation modal should appear
      await waitFor(() => {
        expect(screen.getByTestId("status-confirm-modal")).toBeInTheDocument();
        expect(screen.getByText(/Are you sure you want to transition this ticket to/i)).toBeInTheDocument();
      });

      // Click Confirm in modal
      const confirmBtn = screen.getByTestId("confirm-status-transition-btn");
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(updateSpy).toHaveBeenCalledWith(15, "Cancelled", "2026-10-30T09:30:00.000Z");
      });
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Requester Resolution Gate & Advisory Indication (AC-06, BR-07, FR-08)
  // ---------------------------------------------------------------------------
  describe("Requester Resolution Gate (AC-06, BR-07, FR-08)", () => {
    it("renders read-only status badge and no status select dropdown for Requester", async () => {
      vi.spyOn(api, "fetchTicketDetail").mockResolvedValue(baseRequesterTicket);
      vi.spyOn(api, "fetchActiveRequesters").mockResolvedValue([mockRequester]);

      render(
        <RequesterProvider>
          <RequesterTicketDetail ticketId={15} onBack={vi.fn()} />
        </RequesterProvider>
      );

      await waitFor(() => {
        expect(screen.getAllByText("TKT-2026-000015").length).toBeGreaterThan(0);
      });

      // Status selector must NOT exist
      expect(document.getElementById("ticket-status-select")).not.toBeInTheDocument();

      // Problem Appears Resolved advisory button must be present
      expect(screen.getByTestId("problem-resolved-btn")).toBeInTheDocument();
    });

    it("triggers advisory indication without directly modifying ticket status", async () => {
      vi.spyOn(window, "confirm").mockReturnValue(true);
      vi.spyOn(api, "fetchTicketDetail").mockResolvedValue(baseRequesterTicket);
      vi.spyOn(api, "fetchActiveRequesters").mockResolvedValue([mockRequester]);
      const advisorySpy = vi.spyOn(api, "indicateProblemResolved").mockResolvedValue({
        message: "Resolution notice recorded",
        status: "InProgress",
      });

      render(
        <RequesterProvider>
          <RequesterTicketDetail ticketId={15} onBack={vi.fn()} />
        </RequesterProvider>
      );

      await waitFor(() => {
        expect(screen.getAllByText("TKT-2026-000015").length).toBeGreaterThan(0);
      });

      const resolveBtn = screen.getByTestId("problem-resolved-btn");
      fireEvent.click(resolveBtn);

      await waitFor(() => {
        expect(advisorySpy).toHaveBeenCalledWith(15);
        expect(
          screen.getByText(/Your indication has been recorded/i)
        ).toBeInTheDocument();
      });
    });
  });
});
