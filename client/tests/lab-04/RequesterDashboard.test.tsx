import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RequesterDashboard } from "../../src/components/RequesterDashboard.js";
import { RequesterProvider } from "../../src/context/RequesterContext.js";
import * as api from "../../src/api.js";
import { RequesterDashboardData, Requester } from "../../src/types.js";

describe("Lab 4 Issue 5: Requester Dashboard Component (UI-04, AC-08, AC-10, FR-10, BR-09, BR-12)", () => {
  const mockRequester: Requester = {
    id: 1,
    fullName: "Jennifer Anderson",
    email: "janderson@toktickit.com",
    department: "Computer Engineering",
  };

  const mockDashboardData: RequesterDashboardData = {
    metrics: {
      openTickets: 3,
      inProgress: 2,
      waitingForRequester: 1,
      resolved: 5,
      closed: 12,
    },
    recentTickets: [
      {
        id: 101,
        ticketNumber: "TKT-2026-000101",
        summary: "Laptop thermal throttling during build",
        status: "InProgress",
        requestedPriority: "High",
        category: { id: 2, name: "Hardware" },
        updatedAt: "2026-10-31T09:30:00.000Z",
      },
      {
        id: 102,
        ticketNumber: "TKT-2026-000102",
        summary: "Cannot access engineering file share",
        status: "Open",
        requestedPriority: "Medium",
        category: { id: 3, name: "Network" },
        updatedAt: "2026-10-31T08:00:00.000Z",
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (props?: Partial<React.ComponentProps<typeof RequesterDashboard>>) => {
    const defaultProps = {
      currentRequester: mockRequester,
      onCreateTicket: vi.fn(),
      onViewMyTickets: vi.fn(),
      onSelectTicket: vi.fn(),
      ...props,
    };

    return {
      ...render(
        <RequesterProvider initialRequester={mockRequester}>
          <RequesterDashboard {...defaultProps} />
        </RequesterProvider>
      ),
      props: defaultProps,
    };
  };

  it("renders welcome header and 4 metric cards with authoritative counts (AC-08, FR-10)", async () => {
    vi.spyOn(api, "fetchRequesterDashboard").mockResolvedValue(mockDashboardData);

    renderComponent();

    // Verify greeting
    await waitFor(() => {
      expect(screen.getByText(/Welcome back, Jennifer Anderson!/i)).toBeInTheDocument();
    });

    // Verify 4 Metric cards
    expect(screen.getByTestId("metric-card-open")).toBeInTheDocument();
    expect(screen.getByTestId("metric-card-inprogress")).toBeInTheDocument();
    expect(screen.getByTestId("metric-card-resolved")).toBeInTheDocument();
    expect(screen.getByTestId("metric-card-closed")).toBeInTheDocument();

    // Verify counts
    expect(screen.getByText("3")).toBeInTheDocument(); // Open
    expect(screen.getByText("2")).toBeInTheDocument(); // In Progress
    expect(screen.getByText("5")).toBeInTheDocument(); // Resolved
    expect(screen.getByText("12")).toBeInTheDocument(); // Closed
  });

  it("renders recent tickets table with summary, status, and category info", async () => {
    vi.spyOn(api, "fetchRequesterDashboard").mockResolvedValue(mockDashboardData);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("TKT-2026-000101")).toBeInTheDocument();
      expect(screen.getByText("Laptop thermal throttling during build")).toBeInTheDocument();
      expect(screen.getByText("TKT-2026-000102")).toBeInTheDocument();
      expect(screen.getByText("Cannot access engineering file share")).toBeInTheDocument();
    });
  });

  it("navigates to filtered ticket list when clicking metric drill-down links (AC-10, FR-12)", async () => {
    vi.spyOn(api, "fetchRequesterDashboard").mockResolvedValue(mockDashboardData);

    const { props } = renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("drilldown-open")).toBeInTheDocument();
    });

    // Drill down to Open
    fireEvent.click(screen.getByTestId("drilldown-open"));
    expect(props.onViewMyTickets).toHaveBeenCalledWith("OpenGroup");

    // Drill down to InProgress
    fireEvent.click(screen.getByTestId("drilldown-inprogress"));
    expect(props.onViewMyTickets).toHaveBeenCalledWith("InProgress");

    // Drill down to Resolved
    fireEvent.click(screen.getByTestId("drilldown-resolved"));
    expect(props.onViewMyTickets).toHaveBeenCalledWith("Resolved");

    // Drill down to Closed
    fireEvent.click(screen.getByTestId("drilldown-closed"));
    expect(props.onViewMyTickets).toHaveBeenCalledWith("Closed");
  });

  it("navigates to ticket detail view when clicking a ticket row or view button", async () => {
    vi.spyOn(api, "fetchRequesterDashboard").mockResolvedValue(mockDashboardData);

    const { props } = renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("recent-ticket-row-101")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("recent-ticket-row-101"));
    expect(props.onSelectTicket).toHaveBeenCalledWith(101);

    fireEvent.click(screen.getByTestId("view-ticket-102"));
    expect(props.onSelectTicket).toHaveBeenCalledWith(102);
  });

  it("triggers quick actions: create ticket and view all tickets", async () => {
    vi.spyOn(api, "fetchRequesterDashboard").mockResolvedValue(mockDashboardData);

    const { props } = renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("quick-create-ticket")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("quick-create-ticket"));
    expect(props.onCreateTicket).toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("quick-view-tickets"));
    expect(props.onViewMyTickets).toHaveBeenCalled();
  });

  it("renders safe empty state when requester has zero recent tickets (AC-11, BR-12, FR-13)", async () => {
    vi.spyOn(api, "fetchRequesterDashboard").mockResolvedValue({
      metrics: {
        openTickets: 0,
        inProgress: 0,
        waitingForRequester: 0,
        resolved: 0,
        closed: 0,
      },
      recentTickets: [],
    });

    const { props } = renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("empty-recent-tickets")).toBeInTheDocument();
    });

    expect(screen.getByText("No recent tickets found")).toBeInTheDocument();
    expect(screen.getByText("+ Create Your First Ticket")).toBeInTheDocument();

    fireEvent.click(screen.getByText("+ Create Your First Ticket"));
    expect(props.onCreateTicket).toHaveBeenCalled();
  });

  it("reloads dashboard data when clicking refresh button", async () => {
    const fetchSpy = vi.spyOn(api, "fetchRequesterDashboard").mockResolvedValue(mockDashboardData);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("refresh-dashboard-btn")).toBeInTheDocument();
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId("refresh-dashboard-btn"));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
  });
});
