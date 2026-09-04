import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import App from "../../src/App.js";
import * as api from "../../src/api.js";
import { Ticket, TicketListItem } from "../../src/types.js";

const mockRequesters = [
  {
    id: 1,
    fullName: "Jennifer Anderson",
    email: "jennifer.anderson@kmutt.ac.th",
    department: "Computer Engineering",
    isActive: true,
  },
  {
    id: 2,
    fullName: "Michael Brown",
    email: "michael.brown@kmutt.ac.th",
    department: "Information Technology",
    isActive: true,
  },
];

const mockCategories = [
  { id: 1, name: "Account and Access" },
  { id: 2, name: "Hardware" },
];

const mockSystems = [
  { id: 1, name: "Email" },
  { id: 7, name: "Corporate Laptop" },
];

describe("End-to-End Client Lifecycle Integration (E2E-01, E2E-02, AC-01 to AC-12)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();

    vi.spyOn(api, "fetchActiveRequesters").mockResolvedValue(mockRequesters);
    vi.spyOn(api, "fetchCategories").mockResolvedValue(mockCategories);
    vi.spyOn(api, "fetchRelatedSystems").mockResolvedValue(mockSystems);
  });

  it("E2E-01: Full user journey from Requester Selection to Ticket Detail and Soft-Removal", async () => {
    const createdMockTicket: Ticket = {
      id: 101,
      ticketNumber: "TKT-2026-000101",
      summary: "E2E Vitest: Laptop screen flickering",
      description: "Screen flickers heavily under graphic workload.",
      requestedPriority: "High",
      itPriority: "Medium",
      status: "New",
      requesterId: 1,
      requester: {
        id: 1,
        fullName: "Jennifer Anderson",
        email: "jennifer.anderson@kmutt.ac.th",
        department: "Computer Engineering",
      },
      categoryId: 2,
      category: { id: 2, name: "Hardware" },
      relatedSystemId: 7,
      relatedSystem: { id: 7, name: "Corporate Laptop" },
      attachments: [
        {
          id: 501,
          originalName: "flicker_log.pdf",
          mimeType: "application/pdf",
          fileSizeBytes: 10240,
          isRemoved: false,
          createdAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const mockTicketListItem: TicketListItem = {
      id: 101,
      ticketNumber: "TKT-2026-000101",
      summary: "E2E Vitest: Laptop screen flickering",
      requestedPriority: "High",
      itPriority: "Medium",
      status: "New",
      category: { id: 2, name: "Hardware" },
      relatedSystem: { id: 7, name: "Corporate Laptop" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      activeAttachmentsCount: 1,
    };

    vi.spyOn(api, "createTicket").mockResolvedValue(createdMockTicket);
    vi.spyOn(api, "fetchMyTickets").mockResolvedValue({
      items: [mockTicketListItem],
      pagination: {
        page: 1,
        limit: 10,
        totalItems: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    });

    vi.spyOn(api, "fetchTicketDetail").mockResolvedValue(createdMockTicket);

    const removeAttachmentSpy = vi
      .spyOn(api, "removeAttachment")
      .mockResolvedValue({
        id: 501,
        originalName: "flicker_log.pdf",
        mimeType: "application/pdf",
        fileSizeBytes: 10240,
        isRemoved: true,
        removedAt: new Date().toISOString(),
        removalReason: "User uploaded wrong document",
        createdAt: new Date().toISOString(),
      });

    // 1. Initial Render: Requester Gate (AC-01)
    render(<App />);

    // Selector options load
    await screen.findByText("Development Requester Selector");
    const selectEl = screen.getByTestId("requester-select");
    fireEvent.change(selectEl, { target: { value: "1" } });

    const continueBtn = screen.getByTestId("continue-btn");
    expect(continueBtn).toBeEnabled();
    fireEvent.click(continueBtn);

    // 2. Context established (AC-02)
    await screen.findByText("Welcome, Jennifer Anderson");
    expect(screen.getByText("Computer Engineering", { selector: ".card-body *, .navbar *" })).toBeInTheDocument();

    // 3. Navigate to Ticket Creation (AC-03)
    const createBtn = screen.getByTestId("create-ticket-cta");
    fireEvent.click(createBtn);

    await screen.findByText("Create IT Support Ticket");

    // Fill form
    fireEvent.change(screen.getByTestId("summary-input"), {
      target: { value: "E2E Vitest: Laptop screen flickering" },
    });
    fireEvent.change(screen.getByTestId("description-input"), {
      target: { value: "Screen flickers heavily under graphic workload." },
    });
    fireEvent.change(screen.getByTestId("priority-select"), {
      target: { value: "High" },
    });

    // Submit ticket
    fireEvent.click(screen.getByTestId("submit-ticket-btn"));

    // Verify Success View & Ticket Number format (AC-03, BR-01, FR-04)
    await screen.findByText("Ticket Created Successfully");
    expect(screen.getByTestId("created-ticket-number")).toHaveTextContent("TKT-2026-000101");

    // 4. Return to My Tickets dashboard (AC-07, AC-08)
    const backDashboardBtn = screen.getByText("Back to Dashboard");
    fireEvent.click(backDashboardBtn);

    const table = await screen.findByTestId("tickets-table");
    expect(within(table).getByText("TKT-2026-000101")).toBeInTheDocument();
    expect(within(table).getByText("E2E Vitest: Laptop screen flickering")).toBeInTheDocument();

    // 5. Select ticket row to view detail (AC-10)
    const ticketRow = screen.getByTestId("ticket-row-101");
    fireEvent.click(ticketRow);

    // Detail view rendered
    await screen.findByTestId("detail-ticket-number");
    expect(screen.getByTestId("detail-ticket-number")).toHaveTextContent("TKT-2026-000101");
    expect(screen.getByTestId("detail-summary")).toHaveTextContent(
      "E2E Vitest: Laptop screen flickering"
    );
    expect(screen.getByTestId("detail-description")).toHaveTextContent(
      "Screen flickers heavily under graphic workload."
    );

    // 6. Attachment soft-removal (AC-12, BR-11)
    const removeBtn = screen.getByTestId("remove-attachment-501");
    fireEvent.click(removeBtn);

    // Modal opens
    await screen.findByTestId("removal-modal");
    const reasonInput = screen.getByTestId("removal-reason-input");
    fireEvent.change(reasonInput, { target: { value: "User uploaded wrong document" } });

    const confirmBtn = screen.getByTestId("confirm-removal-btn");
    expect(confirmBtn).toBeEnabled();
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(removeAttachmentSpy).toHaveBeenCalledWith(1, 501, "User uploaded wrong document");
    });

    // 7. Verify soft-removed badge and blocked download
    await screen.findByTestId("removed-attachments-section");
    expect(screen.getByTestId("removed-badge")).toHaveTextContent("Removed");
    expect(screen.getByTestId("download-disabled-501")).toBeDisabled();

    // 8. Back to My Tickets
    fireEvent.click(screen.getByTestId("back-to-tickets-btn"));
    await screen.findByTestId("tickets-table");
  });

  it("E2E-02: Multi-requester ownership isolation (AC-07, AC-11, BR-12)", async () => {
    // Requester 1 has a ticket
    vi.spyOn(api, "fetchMyTickets").mockImplementation(async (requesterId) => {
      if (requesterId === 1) {
        return {
          items: [
            {
              id: 101,
              ticketNumber: "TKT-2026-000101",
              summary: "Jennifer's Secret Ticket",
              requestedPriority: "High",
              itPriority: "High",
              status: "New",
              category: { id: 1, name: "Account and Access" },
              relatedSystem: { id: 1, name: "Email" },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              activeAttachmentsCount: 0,
            },
          ],
          pagination: {
            page: 1,
            limit: 10,
            totalItems: 1,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          },
        };
      }
      // Requester 2 has 0 tickets
      return {
        items: [],
        pagination: {
          page: 1,
          limit: 10,
          totalItems: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    });

    // Start with Requester 1 in localStorage
    localStorage.setItem("toktickit_requester", JSON.stringify(mockRequesters[0]));
    render(<App />);

    // Verify Requester 1 sees their ticket
    const table = await screen.findByTestId("tickets-table");
    expect(within(table).getByText("Jennifer's Secret Ticket")).toBeInTheDocument();
    expect(screen.getByText("Welcome, Jennifer Anderson")).toBeInTheDocument();

    // Switch requester via Change button in header
    const changeBtn = screen.getByTestId("change-requester-btn");
    fireEvent.click(changeBtn);

    // Select Michael Brown (Requester 2)
    await screen.findByTestId("requester-select");
    fireEvent.change(screen.getByTestId("requester-select"), { target: { value: "2" } });
    fireEvent.click(screen.getByTestId("continue-btn"));

    // Verify Requester 2 context active
    await screen.findByText("Welcome, Michael Brown");

    // Verify Jennifer's ticket is NOT present in Michael Brown's view
    expect(screen.queryByText("Jennifer's Secret Ticket")).not.toBeInTheDocument();
    expect(screen.getByTestId("empty-tickets-state")).toBeInTheDocument();
  });
});
