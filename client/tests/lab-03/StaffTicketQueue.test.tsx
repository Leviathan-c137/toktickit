import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { StaffTicketQueue } from "../../src/components/StaffTicketQueue.js";
import * as api from "../../src/api.js";
import { PaginatedStaffTickets } from "../../src/types.js";

describe("Lab 3 Issue 4: StaffTicketQueue Component (UI-02, FR-09, AC-05)", () => {
  const mockCategories = [
    { id: 1, name: "Hardware" },
    { id: 2, name: "Network" },
  ];

  const mockQueueData: PaginatedStaffTickets = {
    tickets: [
      {
        id: 10,
        ticketNumber: "TKT-2026-000010",
        summary: "Laptop battery drains quickly",
        requestedPriority: "Medium",
        itPriority: "High",
        status: "InProgress",
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
        createdAt: "2026-09-18T10:00:00Z",
        updatedAt: "2026-09-18T11:00:00Z",
        _count: { attachments: 1, publicComments: 2, internalNotes: 1 },
      },
      {
        id: 11,
        ticketNumber: "TKT-2026-000011",
        summary: "Wi-Fi disconnection in lab",
        requestedPriority: "Low",
        itPriority: "Medium",
        status: "Open",
        requester: {
          id: 2,
          fullName: "Prapatsorn Katip",
          email: "pkatip@toktickit.com",
          department: "Electrical Engineering",
        },
        owner: null,
        category: { id: 2, name: "Network" },
        relatedSystem: { id: 2, name: "Campus Wi-Fi" },
        createdAt: "2026-09-18T09:00:00Z",
        updatedAt: "2026-09-18T09:30:00Z",
        _count: { attachments: 0, publicComments: 0, internalNotes: 0 },
      },
    ],
    pagination: {
      page: 1,
      limit: 10,
      totalCount: 2,
      totalPages: 1,
    },
  };

  const mockEmptyQueueData: PaginatedStaffTickets = {
    tickets: [],
    pagination: {
      page: 1,
      limit: 10,
      totalCount: 0,
      totalPages: 1,
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, "fetchCategories").mockResolvedValue(mockCategories);
  });

  it("renders queue table with ticket rows, badges, and total count", async () => {
    vi.spyOn(api, "fetchStaffTicketQueue").mockResolvedValue(mockQueueData);

    render(<StaffTicketQueue />);

    await waitFor(() => {
      expect(screen.getByText("TKT-2026-000010")).toBeInTheDocument();
    });

    expect(screen.getByText("IT Staff Ticket Queue")).toBeInTheDocument();
    expect(screen.getByText(/2 Tickets/i)).toBeInTheDocument();
    expect(screen.getByText("Laptop battery drains quickly")).toBeInTheDocument();
    expect(screen.getByText("Jennifer Anderson")).toBeInTheDocument();
    expect(screen.getByText(/Michael Brown/i)).toBeInTheDocument();
    expect(screen.getByText("TKT-2026-000011")).toBeInTheDocument();
    expect(screen.getByText("Wi-Fi disconnection in lab")).toBeInTheDocument();
    expect(screen.getAllByText(/Unassigned/i).length).toBeGreaterThanOrEqual(2);
  });

  it("renders all filter controls and allows searching", async () => {
    const fetchSpy = vi.spyOn(api, "fetchStaffTicketQueue").mockResolvedValue(mockQueueData);

    render(<StaffTicketQueue />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search ticket # or summary.../i)).toBeInTheDocument();
      expect(screen.getByDisplayValue("All Categories")).toBeInTheDocument();
      expect(screen.getByDisplayValue("All Statuses")).toBeInTheDocument();
      expect(screen.getByDisplayValue("All IT Priorities")).toBeInTheDocument();
      expect(screen.getByDisplayValue("All Owners")).toBeInTheDocument();
    });

    // Enter search term
    const searchInput = screen.getByPlaceholderText(/Search ticket # or summary.../i);
    fireEvent.change(searchInput, { target: { value: "battery" } });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          search: "battery",
        })
      );
    });
  });

  it("filters by status and owner dropdown", async () => {
    const fetchSpy = vi.spyOn(api, "fetchStaffTicketQueue").mockResolvedValue(mockQueueData);

    render(<StaffTicketQueue />);

    await waitFor(() => {
      expect(screen.getByText("TKT-2026-000010")).toBeInTheDocument();
    });

    // Change status filter
    const statusSelect = screen.getByDisplayValue("All Statuses");
    fireEvent.change(statusSelect, { target: { value: "InProgress" } });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "InProgress",
        })
      );
    });

    // Change owner filter
    const ownerSelect = screen.getByDisplayValue("All Owners");
    fireEvent.change(ownerSelect, { target: { value: "unassigned" } });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerId: "unassigned",
        })
      );
    });
  });

  it("renders no-matching-results state with clear filters button", async () => {
    vi.spyOn(api, "fetchStaffTicketQueue").mockResolvedValue(mockEmptyQueueData);

    render(<StaffTicketQueue />);

    const searchInput = screen.getByPlaceholderText(/Search ticket # or summary.../i);
    fireEvent.change(searchInput, { target: { value: "NonExistentTerm" } });

    await waitFor(() => {
      expect(screen.getByText(/No matching tickets found/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Clear Filters/i })).toBeInTheDocument();
    });
  });

  it("calls onSelectTicket callback when clicking View Detail", async () => {
    vi.spyOn(api, "fetchStaffTicketQueue").mockResolvedValue(mockQueueData);
    const selectSpy = vi.fn();

    render(<StaffTicketQueue onSelectTicket={selectSpy} />);

    await waitFor(() => {
      expect(screen.getByText("TKT-2026-000010")).toBeInTheDocument();
    });

    const viewDetailButtons = screen.getAllByRole("button", { name: /View Detail/i });
    fireEvent.click(viewDetailButtons[0]);

    expect(selectSpy).toHaveBeenCalledWith(10);
  });
});
