import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { StaffTicketDetail } from "../../src/components/StaffTicketDetail.js";
import * as api from "../../src/api.js";
import { StaffTicketDetailData, StaffUser } from "../../src/types.js";

describe("Lab 3 Issue 5: StaffTicketDetail Component (UI-03, FR-10, FR-11, FR-12)", () => {
  const mockTicket: StaffTicketDetailData = {
    id: 10,
    ticketNumber: "TKT-2026-000010",
    summary: "Laptop battery drains quickly",
    description: "Battery drains from 100% to 10% in 45 minutes.",
    requestedPriority: "Medium",
    itPriority: "High",
    status: "InProgress",
    createdAt: "2026-09-18T10:00:00Z",
    updatedAt: "2026-09-18T11:00:00Z",
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
    relatedSystem: { id: 1, name: "Corporate Laptop" },
    attachments: [
      {
        id: 1,
        originalName: "battery_diagnostic.pdf",
        mimeType: "application/pdf",
        fileSizeBytes: 204800,
        isRemoved: false,
        createdAt: "2026-09-18T10:05:00Z",
      },
    ],
  };

  const mockStaffUsers: StaffUser[] = [
    { id: 5, fullName: "Michael Brown", email: "mbrown@toktickit.com", role: "ITStaff" },
    { id: 6, fullName: "Sarah Johnson", email: "sjohnson@toktickit.com", role: "ITStaff" },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, "fetchStaffTicketDetail").mockResolvedValue(mockTicket);
    vi.spyOn(api, "fetchActiveStaffUsers").mockResolvedValue(mockStaffUsers);
    vi.spyOn(api, "fetchPublicComments").mockResolvedValue([]);
    vi.spyOn(api, "fetchInternalNotes").mockResolvedValue([]);
  });

  it("renders ticket metadata, requester info, attachments, and action controls", async () => {
    render(<StaffTicketDetail ticketId={10} onBack={vi.fn()} />);

    expect(screen.getAllByText(/Loading ticket details.../i).length).toBeGreaterThan(0);

    await waitFor(() => {
      expect(screen.getAllByText("TKT-2026-000010").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Laptop battery drains quickly")).toBeInTheDocument();
      expect(screen.getByText("Battery drains from 100% to 10% in 45 minutes.")).toBeInTheDocument();
      expect(screen.getByText("Jennifer Anderson")).toBeInTheDocument();
      expect(screen.getByText("Computer Engineering")).toBeInTheDocument();
      expect(screen.getByText("Hardware")).toBeInTheDocument();
      expect(screen.getByText("Corporate Laptop")).toBeInTheDocument();
      expect(screen.getByText("battery_diagnostic.pdf")).toBeInTheDocument();
    });
  });

  it("updates IT priority when selector changed", async () => {
    const prioritySpy = vi.spyOn(api, "updateTicketPriority").mockResolvedValue({
      ticketId: 10,
      itPriority: "Urgent",
    });

    render(<StaffTicketDetail ticketId={10} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getAllByText("TKT-2026-000010").length).toBeGreaterThanOrEqual(1);
    });

    const prioritySelect = document.getElementById("ticket-it-priority-select") as HTMLSelectElement;
    expect(prioritySelect).toBeInTheDocument();
    expect(prioritySelect.value).toBe("High");

    fireEvent.change(prioritySelect, { target: { value: "Urgent" } });

    await waitFor(() => {
      expect(prioritySpy).toHaveBeenCalledWith(10, "Urgent");
    });
  });

  it("updates status when transition dropdown changed", async () => {
    const statusSpy = vi.spyOn(api, "updateTicketStatus").mockResolvedValue({
      ticketId: 10,
      status: "Resolved",
    });

    render(<StaffTicketDetail ticketId={10} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getAllByText("TKT-2026-000010").length).toBeGreaterThanOrEqual(1);
    });

    const statusSelect = document.getElementById("ticket-status-select") as HTMLSelectElement;
    expect(statusSelect).toBeInTheDocument();

    fireEvent.change(statusSelect, { target: { value: "Resolved" } });

    await waitFor(() => {
      expect(statusSpy).toHaveBeenCalledWith(10, "Resolved");
    });
  });

  it("switches between Public Comments and Internal Notes tabs", async () => {
    render(<StaffTicketDetail ticketId={10} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getAllByText("TKT-2026-000010").length).toBeGreaterThanOrEqual(1);
    });

    // Public Comments is default active
    expect(screen.getByRole("button", { name: /Public Comments/i })).toBeInTheDocument();
    expect(screen.getByText(/Visible to Requester & IT Staff/i)).toBeInTheDocument();

    // Click on Internal Notes tab
    const notesTabBtn = screen.getByRole("button", { name: /Internal Notes/i });
    fireEvent.click(notesTabBtn);

    await waitFor(() => {
      expect(screen.getByText(/Confidential • IT Staff & Admin Only/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Record diagnostic steps/i)).toBeInTheDocument();
    });
  });

  it("triggers onBack callback when clicking Back to Queue", async () => {
    const backSpy = vi.fn();
    render(<StaffTicketDetail ticketId={10} onBack={backSpy} />);

    await waitFor(() => {
      expect(screen.getAllByText("TKT-2026-000010").length).toBeGreaterThanOrEqual(1);
    });

    const backButton = screen.getByRole("button", { name: /Back to Queue/i });
    fireEvent.click(backButton);

    expect(backSpy).toHaveBeenCalledTimes(1);
  });
});
