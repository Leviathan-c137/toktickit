import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { StaffDashboard } from "../../src/components/StaffDashboard.js";
import * as api from "../../src/api.js";
import { StaffDashboardData, User } from "../../src/types.js";

describe("Lab 4 Issue 5: IT Staff Dashboard Component (UI-05, AC-09, AC-10, FR-11, BR-10, BR-12)", () => {
  const mockStaffUser: User = {
    id: 5,
    fullName: "Michael Brown",
    email: "mbrown@toktickit.com",
    role: "ITStaff",
    mustChangePassword: false,
    department: "IT Operations",
    isActive: true,
  };

  const mockStaffDashboardData: StaffDashboardData = {
    metrics: {
      newTickets: 14,
      openTickets: 23,
      inProgressTickets: 18,
      waitingForRequesterTickets: 7,
      myAssignedTickets: 16,
      unassignedTickets: 8,
    },
    recentTickets: [
      {
        id: 201,
        ticketNumber: "TKT-2026-000201",
        summary: "Cannot connect to campus Wi-Fi",
        status: "New",
        itPriority: "High",
        requester: { id: 9, fullName: "Alice Walker" },
        owner: null,
        updatedAt: "2026-10-31T09:45:00.000Z",
      },
      {
        id: 202,
        ticketNumber: "TKT-2026-000202",
        summary: "VPN access gateway timeout",
        status: "InProgress",
        itPriority: "Urgent",
        requester: { id: 10, fullName: "Bob Smith" },
        owner: { id: 5, fullName: "Michael Brown" },
        updatedAt: "2026-10-31T09:15:00.000Z",
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (props?: Partial<React.ComponentProps<typeof StaffDashboard>>) => {
    const defaultProps = {
      currentUser: mockStaffUser,
      onCreateTicket: vi.fn(),
      onViewQueue: vi.fn(),
      onSelectTicket: vi.fn(),
      ...props,
    };

    return {
      ...render(<StaffDashboard {...defaultProps} />),
      props: defaultProps,
    };
  };

  it("renders welcome header and 5 operational metric cards (AC-09, FR-11)", async () => {
    vi.spyOn(api, "fetchStaffDashboard").mockResolvedValue(mockStaffDashboardData);

    renderComponent();

    // Verify greeting
    await waitFor(() => {
      expect(screen.getByText(/Welcome back, Michael!/i)).toBeInTheDocument();
    });

    // Verify 5 metric cards
    expect(screen.getByTestId("metric-card-new")).toBeInTheDocument();
    expect(screen.getByTestId("metric-card-open")).toBeInTheDocument();
    expect(screen.getByTestId("metric-card-inprogress")).toBeInTheDocument();
    expect(screen.getByTestId("metric-card-waiting")).toBeInTheDocument();
    expect(screen.getByTestId("metric-card-my-assigned")).toBeInTheDocument();

    // Verify metric numerical counts
    expect(screen.getByText("14")).toBeInTheDocument(); // New
    expect(screen.getByText("23")).toBeInTheDocument(); // Open
    expect(screen.getByText("18")).toBeInTheDocument(); // In Progress
    expect(screen.getByText("7")).toBeInTheDocument(); // Waiting Req
    expect(screen.getByText("16")).toBeInTheDocument(); // My Assigned
  });

  it("renders recent queue tickets table with ticket details, requester, and owner", async () => {
    vi.spyOn(api, "fetchStaffDashboard").mockResolvedValue(mockStaffDashboardData);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("TKT-2026-000201")).toBeInTheDocument();
      expect(screen.getByText("Cannot connect to campus Wi-Fi")).toBeInTheDocument();
      expect(screen.getByText("Alice Walker")).toBeInTheDocument();
      expect(screen.getByText("Unassigned")).toBeInTheDocument();

      expect(screen.getByText("TKT-2026-000202")).toBeInTheDocument();
      expect(screen.getByText("VPN access gateway timeout")).toBeInTheDocument();
      expect(screen.getByText("Bob Smith")).toBeInTheDocument();
      expect(screen.getByText("Assigned to: Michael Brown")).toBeInTheDocument();
    });
  });

  it("navigates to filtered queue when clicking metric drill-down links (AC-10, FR-12)", async () => {
    vi.spyOn(api, "fetchStaffDashboard").mockResolvedValue(mockStaffDashboardData);

    const { props } = renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("drilldown-new")).toBeInTheDocument();
    });

    // Drill down to New
    fireEvent.click(screen.getByTestId("drilldown-new"));
    expect(props.onViewQueue).toHaveBeenCalledWith({ status: "New" });

    // Drill down to Open
    fireEvent.click(screen.getByTestId("drilldown-open"));
    expect(props.onViewQueue).toHaveBeenCalledWith({ status: "Open" });

    // Drill down to InProgress
    fireEvent.click(screen.getByTestId("drilldown-inprogress"));
    expect(props.onViewQueue).toHaveBeenCalledWith({ status: "InProgress" });

    // Drill down to Waiting Req
    fireEvent.click(screen.getByTestId("drilldown-waiting"));
    expect(props.onViewQueue).toHaveBeenCalledWith({ status: "WaitingForRequester" });

    // Drill down to My Assigned
    fireEvent.click(screen.getByTestId("drilldown-my-assigned"));
    expect(props.onViewQueue).toHaveBeenCalledWith({ ownerId: "5" });
  });

  it("navigates to staff ticket detail view when clicking a ticket row or view button", async () => {
    vi.spyOn(api, "fetchStaffDashboard").mockResolvedValue(mockStaffDashboardData);

    const { props } = renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("staff-recent-ticket-row-201")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("staff-recent-ticket-row-201"));
    expect(props.onSelectTicket).toHaveBeenCalledWith(201);

    fireEvent.click(screen.getByTestId("staff-view-ticket-202"));
    expect(props.onSelectTicket).toHaveBeenCalledWith(202);
  });

  it("triggers quick actions: create ticket, search queue, and my queue", async () => {
    vi.spyOn(api, "fetchStaffDashboard").mockResolvedValue(mockStaffDashboardData);

    const { props } = renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("staff-quick-create-ticket")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("staff-quick-create-ticket"));
    expect(props.onCreateTicket).toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("staff-quick-search-queue"));
    expect(props.onViewQueue).toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("staff-quick-my-queue"));
    expect(props.onViewQueue).toHaveBeenCalledWith({ ownerId: "5" });
  });

  it("renders safe empty state when queue has zero recent tickets (AC-11, BR-12, FR-13)", async () => {
    vi.spyOn(api, "fetchStaffDashboard").mockResolvedValue({
      metrics: {
        newTickets: 0,
        openTickets: 0,
        inProgressTickets: 0,
        waitingForRequesterTickets: 0,
        myAssignedTickets: 0,
        unassignedTickets: 0,
      },
      recentTickets: [],
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("empty-recent-queue-tickets")).toBeInTheDocument();
    });

    expect(screen.getByText("Queue is clear!")).toBeInTheDocument();
    expect(screen.getByText("There are no recent tickets requiring attention.")).toBeInTheDocument();
  });

  it("reloads staff dashboard data when clicking refresh button", async () => {
    const fetchSpy = vi.spyOn(api, "fetchStaffDashboard").mockResolvedValue(mockStaffDashboardData);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("refresh-staff-dashboard-btn")).toBeInTheDocument();
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId("refresh-staff-dashboard-btn"));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
  });
});
