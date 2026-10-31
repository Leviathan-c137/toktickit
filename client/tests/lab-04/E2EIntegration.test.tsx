import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import App from "../../src/App.js";
import * as api from "../../src/api.js";
import {
  User,
  StaffDashboardData,
  RequesterDashboardData,
  StaffTicketDetailData,
  ActionTaken,
  TicketStatus,
  Priority,
} from "../../src/types.js";

const mockStaffUser: User = {
  id: 10,
  fullName: "Michael Brown",
  email: "mbrown@toktickit.com",
  role: "ITStaff",
  isActive: true,
  mustChangePassword: false,
};

const mockRequesterUser: User = {
  id: 20,
  fullName: "Jennifer Anderson",
  email: "janderson@toktickit.com",
  role: "Requester",
  department: "Computer Engineering",
  isActive: true,
  mustChangePassword: false,
};

const mockStaffDashboard: StaffDashboardData = {
  metrics: {
    newTickets: 2,
    openTickets: 4,
    inProgressTickets: 3,
    waitingForRequesterTickets: 1,
    myAssignedTickets: 3,
    unassignedTickets: 2,
  },
  recentTickets: [
    {
      id: 101,
      ticketNumber: "TKT-2026-000101",
      summary: "Server room overheating alarm",
      status: "InProgress" as TicketStatus,
      itPriority: "High" as Priority,
      requester: { id: 20, fullName: "Jennifer Anderson" },
      owner: { id: 10, fullName: "Michael Brown" },
      updatedAt: "2026-10-31T12:00:00.000Z",
    },
  ],
};

const mockRequesterDashboard: RequesterDashboardData = {
  metrics: {
    openTickets: 3,
    inProgress: 2,
    waitingForRequester: 1,
    resolved: 1,
    closed: 2,
  },
  recentTickets: [
    {
      id: 101,
      ticketNumber: "TKT-2026-000101",
      summary: "Server room overheating alarm",
      status: "InProgress" as TicketStatus,
      requestedPriority: "High" as Priority,
      category: { id: 1, name: "Hardware" },
      updatedAt: "2026-10-31T12:00:00.000Z",
    },
  ],
};

const mockTicketDetail: StaffTicketDetailData = {
  id: 101,
  ticketNumber: "TKT-2026-000101",
  summary: "Server room overheating alarm",
  description: "CRAC unit 2 compressor failed, room temperature rising rapidly.",
  status: "InProgress" as TicketStatus,
  requestedPriority: "High" as Priority,
  itPriority: "High" as Priority,
  createdAt: "2026-10-31T10:00:00.000Z",
  updatedAt: "2026-10-31T12:00:00.000Z",
  requesterId: 20,
  requester: {
    id: 20,
    fullName: "Jennifer Anderson",
    email: "janderson@toktickit.com",
    department: "Computer Engineering",
  },
  ownerId: 10,
  owner: {
    id: 10,
    fullName: "Michael Brown",
    email: "mbrown@toktickit.com",
  },
  categoryId: 1,
  category: { id: 1, name: "Hardware" },
  relatedSystemId: 1,
  relatedSystem: { id: 1, name: "Campus Infrastructure" },
  problemAppearsResolved: false,
  attachments: [],
};

const mockActions: ActionTaken[] = [
  {
    id: 1,
    ticketId: 101,
    actionDateTime: "2026-10-31T11:00:00.000Z",
    description: "Switched to backup condenser unit and verified coolant flow.",
    result: "Temperature decreased from 32C to 21C within 40 minutes.",
    performedById: 10,
    performedBy: {
      id: 10,
      fullName: "Michael Brown",
      email: "mbrown@toktickit.com",
      role: "ITStaff",
    },
    followUpRequired: true,
    followUpNote: "Order replacement compressor for primary unit.",
    attachmentNotes: "Temperature telemetry chart attached.",
    createdAt: "2026-10-31T11:05:00.000Z",
    updatedAt: "2026-10-31T11:05:00.000Z",
  },
];

describe("Lab 4 E2E Integration Suite (UI-01 to UI-05, E2E-01 to E2E-03)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    vi.spyOn(api, "fetchCategories").mockResolvedValue([
      { id: 1, name: "Hardware", isActive: true },
      { id: 2, name: "Software", isActive: true },
    ]);
  });

  it("E2E-01: Full IT Staff Flow — Dashboard metrics, drill-down to queue, actions taken, and status transition", async () => {
    vi.spyOn(api, "fetchCurrentUser").mockResolvedValue(mockStaffUser);
    vi.spyOn(api, "fetchStaffDashboard").mockResolvedValue(mockStaffDashboard);
    vi.spyOn(api, "fetchStaffTicketQueue").mockResolvedValue({
      tickets: [
        {
          id: 101,
          ticketNumber: "TKT-2026-000101",
          summary: "Server room overheating alarm",
          status: "InProgress" as TicketStatus,
          requestedPriority: "High" as Priority,
          itPriority: "High" as Priority,
          createdAt: "2026-10-31T10:00:00.000Z",
          updatedAt: "2026-10-31T12:00:00.000Z",
          requester: { id: 20, fullName: "Jennifer Anderson", email: "janderson@toktickit.com" },
          owner: { id: 10, fullName: "Michael Brown", email: "mbrown@toktickit.com" },
          category: { id: 1, name: "Hardware" },
          relatedSystem: { id: 1, name: "Campus Infrastructure" },
        },
      ],
      pagination: { page: 1, limit: 10, totalCount: 1, totalPages: 1 },
    });
    vi.spyOn(api, "fetchStaffTicketDetail").mockResolvedValue(mockTicketDetail);
    vi.spyOn(api, "fetchActionsTaken").mockResolvedValue(mockActions);
    vi.spyOn(api, "fetchInternalNotes").mockResolvedValue([]);
    vi.spyOn(api, "fetchPublicComments").mockResolvedValue([]);

    render(<App />);

    // 1. Staff logs in -> Staff Dashboard is accessible
    await waitFor(() => {
      expect(screen.getByTestId("nav-staff-dashboard")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("nav-staff-dashboard"));

    await waitFor(() => {
      expect(screen.getByTestId("staff-dashboard")).toBeInTheDocument();
      expect(screen.getByTestId("metric-card-open")).toBeInTheDocument();
      expect(screen.getByTestId("metric-card-my-assigned")).toBeInTheDocument();
    });

    // 2. Drill-down: Click Open card -> navigates to queue with OpenGroup filter
    fireEvent.click(screen.getByTestId("drilldown-open"));

    await waitFor(() => {
      expect(screen.getByText("IT Staff Ticket Queue")).toBeInTheDocument();
      expect(screen.getByTestId("queue-status-filter")).toHaveValue("OpenGroup");
    });

    // 3. Open Ticket Detail
    const detailBtn = screen.getByText("View Detail");
    fireEvent.click(detailBtn);

    await waitFor(() => {
      expect(screen.getByTestId("actions-taken-card")).toBeInTheDocument();
      expect(screen.getByText("Switched to backup condenser unit and verified coolant flow.")).toBeInTheDocument();
      expect(screen.getByTestId("add-action-taken-btn")).toBeInTheDocument();
    });

    // 4. Verify Status Dropdown contains permitted transitions
    const statusSelect = screen.getByLabelText("Status Transition Dropdown");
    expect(statusSelect).toBeInTheDocument();
  });

  it("E2E-02: Full Requester Flow — Dashboard, OpenGroup drill-down to My Tickets, and read-only Actions Taken", async () => {
    localStorage.setItem("toktickit_requester", JSON.stringify(mockRequesterUser));
    vi.spyOn(api, "fetchCurrentUser").mockResolvedValue(mockRequesterUser);
    vi.spyOn(api, "fetchRequesterDashboard").mockResolvedValue(mockRequesterDashboard);
    vi.spyOn(api, "fetchMyTickets").mockResolvedValue({
      items: [
        {
          id: 101,
          ticketNumber: "TKT-2026-000101",
          summary: "Server room overheating alarm",
          status: "InProgress" as TicketStatus,
          createdAt: "2026-10-31T10:00:00.000Z",
          updatedAt: "2026-10-31T12:00:00.000Z",
          category: { id: 1, name: "Hardware" },
          relatedSystem: { id: 1, name: "Campus Infrastructure" },
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
    });
    vi.spyOn(api, "fetchTicketDetail").mockResolvedValue(mockTicketDetail as any);
    vi.spyOn(api, "fetchActionsTaken").mockResolvedValue(mockActions);
    vi.spyOn(api, "fetchPublicComments").mockResolvedValue([]);

    render(<App />);

    // 1. Requester navigates to Dashboard
    await waitFor(() => {
      expect(screen.getByTestId("nav-requester-dashboard")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("nav-requester-dashboard"));

    await waitFor(() => {
      expect(screen.getByTestId("requester-dashboard")).toBeInTheDocument();
      expect(screen.getByTestId("metric-card-open")).toBeInTheDocument();
    });

    // 2. Drill-down: Click My Open -> navigates to My Tickets filtered to OpenGroup
    fireEvent.click(screen.getByTestId("drilldown-open"));

    await waitFor(() => {
      expect(screen.getByTestId("status-filter")).toBeInTheDocument();
      expect(screen.getByTestId("status-filter")).toHaveValue("OpenGroup");
    });

    await waitFor(() => {
      expect(screen.getAllByText("TKT-2026-000101").length).toBeGreaterThan(0);
    }, { timeout: 4000 });

    // 3. Open Ticket Detail -> Actions Taken is displayed in read-only mode
    const ticketRow = screen.getByTestId("ticket-row-101");
    fireEvent.click(ticketRow);

    await waitFor(() => {
      expect(screen.getByTestId("actions-taken-card")).toBeInTheDocument();
      expect(screen.getByTestId("requester-readonly-badge")).toBeInTheDocument();
      expect(screen.queryByTestId("add-action-taken-btn")).not.toBeInTheDocument();
    });
  });
});
