import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MyTickets } from "../../src/components/MyTickets.js";
import { RequesterProvider } from "../../src/context/RequesterContext.js";
import * as api from "../../src/api.js";
import { PaginatedTickets, Category } from "../../src/types.js";

const mockCategories: Category[] = [
  { id: 1, name: "Account and Access" },
  { id: 2, name: "Hardware" },
  { id: 4, name: "Network" },
];

const mockRequester = {
  id: 1,
  fullName: "Jennifer Anderson",
  email: "jennifer.anderson@kmutt.ac.th",
  department: "Computer Engineering",
};

const mockTicketsData: PaginatedTickets = {
  items: [
    {
      id: 101,
      ticketNumber: "TKT-2026-000101",
      summary: "Laptop keyboard replacement",
      category: { id: 2, name: "Hardware" },
      relatedSystem: { id: 7, name: "Corporate Laptop" },
      requestedPriority: "High",
      itPriority: "Medium",
      status: "New",
      createdAt: "2026-09-04T10:00:00.000Z",
      updatedAt: "2026-09-04T10:00:00.000Z",
      activeAttachmentsCount: 2,
    },
    {
      id: 102,
      ticketNumber: "TKT-2026-000102",
      summary: "Wi-Fi disconnection in lab",
      category: { id: 4, name: "Network" },
      relatedSystem: { id: 2, name: "Campus Wi-Fi" },
      requestedPriority: "Medium",
      itPriority: "Medium",
      status: "Open",
      createdAt: "2026-09-03T09:00:00.000Z",
      updatedAt: "2026-09-03T09:00:00.000Z",
      activeAttachmentsCount: 0,
    },
  ],
  pagination: {
    page: 1,
    limit: 10,
    totalItems: 2,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  },
};

const mockEmptyData: PaginatedTickets = {
  items: [],
  pagination: {
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },
};

describe("MyTickets Component Tests (UI-05, UI-06)", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("toktickit_requester", JSON.stringify(mockRequester));
    vi.restoreAllMocks();

    vi.spyOn(api, "fetchCategories").mockResolvedValue(mockCategories);
    vi.spyOn(api, "fetchMyTickets").mockResolvedValue(mockTicketsData);
  });

  it("UI-05: renders ticket table and updates when filters change (AC-07, AC-08)", async () => {
    const fetchSpy = vi.spyOn(api, "fetchMyTickets").mockResolvedValue(mockTicketsData);

    render(
      <RequesterProvider>
        <MyTickets onCreateTicket={vi.fn()} />
      </RequesterProvider>
    );

    // Wait for table to render
    await waitFor(() => {
      expect(screen.getByTestId("tickets-table")).toBeInTheDocument();
    });

    const table = screen.getByTestId("tickets-table");
    expect(within(table).getByText("TKT-2026-000101")).toBeInTheDocument();
    expect(within(table).getByText("Laptop keyboard replacement")).toBeInTheDocument();
    expect(within(table).getByText("TKT-2026-000102")).toBeInTheDocument();
    expect(within(table).getByText("Wi-Fi disconnection in lab")).toBeInTheDocument();

    // Check ticket count badge
    expect(screen.getByTestId("ticket-count-badge")).toHaveTextContent("2 Tickets");

    // Select category filter
    const categorySelect = screen.getByTestId("category-filter");
    fireEvent.change(categorySelect, { target: { value: "2" } });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ categoryId: 2 })
      );
    });

    // Select priority filter
    const prioritySelect = screen.getByTestId("priority-filter");
    fireEvent.change(prioritySelect, { target: { value: "High" } });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ requestedPriority: "High" })
      );
    });
  });

  it("UI-06: renders empty state when user has zero tickets (AC-09)", async () => {
    vi.spyOn(api, "fetchMyTickets").mockResolvedValue(mockEmptyData);
    const createTicketMock = vi.fn();

    render(
      <RequesterProvider>
        <MyTickets onCreateTicket={createTicketMock} />
      </RequesterProvider>
    );

    // Verify empty state is displayed
    await waitFor(() => {
      expect(screen.getByTestId("empty-tickets-state")).toBeInTheDocument();
      expect(screen.getByText("No tickets yet")).toBeInTheDocument();
    });

    // Verify clicking "+ Create Ticket" calls callback
    const createBtn = screen.getByTestId("empty-create-ticket-btn");
    fireEvent.click(createBtn);
    expect(createTicketMock).toHaveBeenCalledTimes(1);
  });

  it("UI-06: renders no-results state with clear button when filters yield 0 matches (AC-09)", async () => {
    // Initially return tickets, then empty on search
    vi.spyOn(api, "fetchMyTickets")
      .mockResolvedValueOnce(mockTicketsData)
      .mockResolvedValue(mockEmptyData);

    render(
      <RequesterProvider>
        <MyTickets onCreateTicket={vi.fn()} />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("tickets-table")).toBeInTheDocument();
    });

    // Type in search input to filter
    const searchInput = screen.getByTestId("search-tickets-input");
    fireEvent.change(searchInput, { target: { value: "nonexistent query" } });

    // Verify No-Results state appears after debounced search
    await waitFor(
      () => {
        expect(screen.getByTestId("no-results-state")).toBeInTheDocument();
        expect(screen.getByText("No tickets match your search")).toBeInTheDocument();
      },
      { timeout: 1500 }
    );

    // Clicking Clear Filters resets search input and restores list
    const clearBtn = screen.getByTestId("no-results-clear-btn");
    fireEvent.click(clearBtn);

    await waitFor(() => {
      expect((searchInput as HTMLInputElement).value).toBe("");
    });
  });

  it("calls onSelectTicket when a ticket row or card is clicked", async () => {
    const onSelectTicketMock = vi.fn();

    render(
      <RequesterProvider>
        <MyTickets onCreateTicket={vi.fn()} onSelectTicket={onSelectTicketMock} />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("tickets-table")).toBeInTheDocument();
    });

    const ticketRow = screen.getByTestId("ticket-row-101");
    fireEvent.click(ticketRow);

    expect(onSelectTicketMock).toHaveBeenCalledWith(101);
  });
});
