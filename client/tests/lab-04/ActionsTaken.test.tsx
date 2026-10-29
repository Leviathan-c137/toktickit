import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ActionsTaken } from "../../src/components/ActionsTaken.js";
import * as api from "../../src/api.js";
import { ActionTaken } from "../../src/types.js";

describe("Lab 4 Issue 3: ActionsTaken Component (UI-01, UI-02, AC-01 to AC-04, AC-07)", () => {
  const mockActions: ActionTaken[] = [
    {
      id: 1,
      ticketId: 10,
      actionDateTime: "2026-10-28T09:30:00.000Z",
      description: "Inspected hardware chassis and identified thermal throttling on CPU core 2.",
      result: "Applied new thermal paste and verified temperature dropped from 92C to 58C.",
      followUpRequired: false,
      followUpNote: null,
      attachmentNotes: "See HWMonitor log attachment #1",
      createdAt: "2026-10-28T09:35:00.000Z",
      updatedAt: "2026-10-28T09:35:00.000Z",
      performedBy: {
        id: 5,
        fullName: "Michael Brown",
        email: "mbrown@toktickit.com",
        role: "ITStaff",
      },
    },
    {
      id: 2,
      ticketId: 10,
      actionDateTime: "2026-10-28T14:15:00.000Z",
      description: "Replaced faulty battery pack with OEM standard unit #BT-882.",
      result: "Battery calibrated to 100% capacity.",
      followUpRequired: true,
      followUpNote: "Conduct 48-hour drain test to ensure cell retention above 90%.",
      attachmentNotes: "Battery serial number batch report B2026",
      createdAt: "2026-10-28T14:20:00.000Z",
      updatedAt: "2026-10-28T14:20:00.000Z",
      performedBy: {
        id: 6,
        fullName: "Sarah Johnson",
        email: "sjohnson@toktickit.com",
        role: "ITStaff",
      },
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // UI-01 & AC-04: List rendering in chronological order with all details
  it("renders chronological actions taken list with performer, results, notes, and badges (AC-01, AC-04)", async () => {
    vi.spyOn(api, "fetchActionsTaken").mockResolvedValue(mockActions);

    render(<ActionsTaken ticketId={10} readOnly={false} />);

    expect(screen.getByTestId("actions-loading")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByTestId("actions-loading")).not.toBeInTheDocument();
    });

    // Badge count
    expect(screen.getByTestId("actions-count-badge")).toHaveTextContent("2");

    // Action 1 details
    expect(screen.getByTestId("action-performer-1")).toHaveTextContent("Michael Brown (ITStaff)");
    expect(
      screen.getByText(/Inspected hardware chassis and identified thermal throttling/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Applied new thermal paste and verified temperature dropped/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/HWMonitor log attachment #1/i)).toBeInTheDocument();
    expect(screen.queryByTestId("action-followup-badge-1")).not.toBeInTheDocument();

    // Action 2 details with follow-up note
    expect(screen.getByTestId("action-performer-2")).toHaveTextContent("Sarah Johnson (ITStaff)");
    expect(
      screen.getByText(/Replaced faulty battery pack with OEM standard unit/i)
    ).toBeInTheDocument();
    expect(screen.getByTestId("action-followup-badge-2")).toHaveTextContent("Follow-Up Required");
    expect(screen.getByTestId("action-followup-note-2")).toHaveTextContent(
      "Conduct 48-hour drain test to ensure cell retention above 90%."
    );

    // Edit buttons available for IT Staff
    expect(screen.getByTestId("edit-action-btn-1")).toBeInTheDocument();
    expect(screen.getByTestId("edit-action-btn-2")).toBeInTheDocument();
    expect(screen.getByTestId("add-action-taken-btn")).toBeInTheDocument();
  });

  // AC-11, BR-12: Empty State
  it("renders empty state illustration and message when ticket has 0 actions taken (AC-11, BR-12)", async () => {
    vi.spyOn(api, "fetchActionsTaken").mockResolvedValue([]);

    render(<ActionsTaken ticketId={10} readOnly={false} />);

    await waitFor(() => {
      expect(screen.getByTestId("actions-empty-state")).toBeInTheDocument();
    });

    expect(screen.getByText("No Actions Recorded Yet")).toBeInTheDocument();
    expect(screen.getByTestId("actions-count-badge")).toHaveTextContent("0");
  });

  // UI-02, AC-03, FR-05, FR-06: Requester read-only mode
  it("renders read-only mode for Requesters with action history but no add/edit buttons (UI-02, AC-03, FR-05)", async () => {
    vi.spyOn(api, "fetchActionsTaken").mockResolvedValue(mockActions);

    render(<ActionsTaken ticketId={10} readOnly={true} />);

    await waitFor(() => {
      expect(screen.getByTestId("requester-readonly-badge")).toHaveTextContent("Actions recorded by IT Staff");
    });

    // Content is viewable
    expect(screen.getByTestId("action-item-1")).toBeInTheDocument();
    expect(screen.getByTestId("action-item-2")).toBeInTheDocument();

    // Add and Edit buttons are strictly hidden
    expect(screen.queryByTestId("add-action-taken-btn")).not.toBeInTheDocument();
    expect(screen.queryByTestId("edit-action-btn-1")).not.toBeInTheDocument();
    expect(screen.queryByTestId("edit-action-btn-2")).not.toBeInTheDocument();
  });

  // UI-01, AC-02, BR-04: Create modal opening and validation
  it("validates mandatory fields and conditional follow-up note requirement (UI-01, AC-02, BR-04)", async () => {
    vi.spyOn(api, "fetchActionsTaken").mockResolvedValue([]);

    render(<ActionsTaken ticketId={10} readOnly={false} />);

    await waitFor(() => {
      expect(screen.getByTestId("add-action-taken-btn")).toBeInTheDocument();
    });

    // Open Create Modal
    fireEvent.click(screen.getByTestId("add-action-taken-btn"));
    expect(screen.getByTestId("action-modal")).toBeInTheDocument();

    // Attempt submitting without filling required fields
    fireEvent.click(screen.getByTestId("submit-action-btn"));

    expect(screen.getByTestId("action-description-error")).toHaveTextContent(
      "Action description is required (minimum 5 characters)."
    );
    expect(screen.getByTestId("action-result-error")).toHaveTextContent(
      "Result is required (minimum 3 characters)."
    );

    // Provide description and result
    fireEvent.change(screen.getByTestId("action-description-input"), {
      target: { value: "Configured static IP route for campus subnet." },
    });
    fireEvent.change(screen.getByTestId("action-result-input"), {
      target: { value: "Ping successful." },
    });

    // Toggle Follow-Up Required switch
    const toggle = screen.getByTestId("follow-up-toggle");
    fireEvent.click(toggle);

    // Follow-up note input is now rendered
    expect(screen.getByTestId("follow-up-note-input")).toBeInTheDocument();

    // Attempt submitting with follow-up required but empty note
    fireEvent.click(screen.getByTestId("submit-action-btn"));
    expect(screen.getByTestId("follow-up-note-error")).toHaveTextContent(
      "Follow-up note is mandatory when follow-up is required"
    );
  });

  // AC-01: Successfully create an Action Taken
  it("submits valid Action Taken and updates the actions list with notification (AC-01)", async () => {
    vi.spyOn(api, "fetchActionsTaken").mockResolvedValue([]);
    const createdAction: ActionTaken = {
      id: 99,
      ticketId: 10,
      actionDateTime: "2026-10-28T16:00:00.000Z",
      description: "Tested network switch port buffer capacity.",
      result: "Packet drop decreased to 0%.",
      followUpRequired: true,
      followUpNote: "Re-verify after peak registration hours tomorrow morning.",
      attachmentNotes: "Switch port Gi0/12 statistics attached",
      createdAt: "2026-10-28T16:05:00.000Z",
      updatedAt: "2026-10-28T16:05:00.000Z",
      performedBy: {
        id: 5,
        fullName: "Michael Brown",
        email: "mbrown@toktickit.com",
        role: "ITStaff",
      },
    };
    const createSpy = vi.spyOn(api, "createActionTaken").mockResolvedValue(createdAction);

    render(<ActionsTaken ticketId={10} readOnly={false} />);

    await waitFor(() => {
      expect(screen.getByTestId("add-action-taken-btn")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("add-action-taken-btn"));

    // Fill form
    fireEvent.change(screen.getByTestId("action-description-input"), {
      target: { value: "Tested network switch port buffer capacity." },
    });
    fireEvent.change(screen.getByTestId("action-result-input"), {
      target: { value: "Packet drop decreased to 0%." },
    });

    // Toggle follow-up and enter note
    fireEvent.click(screen.getByTestId("follow-up-toggle"));
    fireEvent.change(screen.getByTestId("follow-up-note-input"), {
      target: { value: "Re-verify after peak registration hours tomorrow morning." },
    });

    // Enter attachment note
    fireEvent.change(screen.getByTestId("action-attachment-notes-input"), {
      target: { value: "Switch port Gi0/12 statistics attached" },
    });

    // Submit form
    fireEvent.click(screen.getByTestId("submit-action-btn"));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledTimes(1);
    });

    expect(createSpy).toHaveBeenCalledWith(
      10,
      expect.objectContaining({
        description: "Tested network switch port buffer capacity.",
        result: "Packet drop decreased to 0%.",
        followUpRequired: true,
        followUpNote: "Re-verify after peak registration hours tomorrow morning.",
        attachmentNotes: "Switch port Gi0/12 statistics attached",
      })
    );

    // Modal closed and success banner displayed
    await waitFor(() => {
      expect(screen.queryByTestId("action-modal")).not.toBeInTheDocument();
      expect(screen.getByTestId("action-success-alert")).toHaveTextContent(
        "Action Taken recorded successfully."
      );
      expect(screen.getByTestId("action-item-99")).toBeInTheDocument();
    });
  });

  // FR-02, AC-01: Edit an existing Action Taken
  it("opens edit modal with existing values and updates the record (FR-02)", async () => {
    vi.spyOn(api, "fetchActionsTaken").mockResolvedValue(mockActions);
    const updatedAction: ActionTaken = {
      ...mockActions[0],
      description: "Inspected hardware chassis and replaced thermal sensor ribbon cable.",
      result: "Chassis temperature normal and diagnostics clear.",
      updatedAt: "2026-10-28T10:00:00.000Z",
    };
    const updateSpy = vi.spyOn(api, "updateActionTaken").mockResolvedValue(updatedAction);

    render(<ActionsTaken ticketId={10} readOnly={false} />);

    await waitFor(() => {
      expect(screen.getByTestId("edit-action-btn-1")).toBeInTheDocument();
    });

    // Click Edit on action 1
    fireEvent.click(screen.getByTestId("edit-action-btn-1"));

    expect(screen.getByTestId("action-modal")).toBeInTheDocument();
    expect(screen.getByTestId("action-description-input")).toHaveValue(mockActions[0].description);
    expect(screen.getByTestId("action-result-input")).toHaveValue(mockActions[0].result);

    // Update values
    fireEvent.change(screen.getByTestId("action-description-input"), {
      target: { value: "Inspected hardware chassis and replaced thermal sensor ribbon cable." },
    });
    fireEvent.change(screen.getByTestId("action-result-input"), {
      target: { value: "Chassis temperature normal and diagnostics clear." },
    });

    fireEvent.click(screen.getByTestId("submit-action-btn"));

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        10,
        1,
        expect.objectContaining({
          description: "Inspected hardware chassis and replaced thermal sensor ribbon cable.",
          result: "Chassis temperature normal and diagnostics clear.",
          expectedUpdatedAt: mockActions[0].updatedAt,
        })
      );
    });

    await waitFor(() => {
      expect(screen.queryByTestId("action-modal")).not.toBeInTheDocument();
      expect(screen.getByTestId("action-success-alert")).toHaveTextContent(
        "Action Taken updated successfully."
      );
    });
  });

  // AC-07, BR-08: Concurrency Conflict Handling (HTTP 409)
  it("displays conflict error alert when server returns HTTP 409 Conflict (AC-07, BR-08)", async () => {
    vi.spyOn(api, "fetchActionsTaken").mockResolvedValue(mockActions);
    const conflictError: any = new Error("Record modified concurrently");
    conflictError.status = 409;
    conflictError.code = "CONFLICT";
    vi.spyOn(api, "updateActionTaken").mockRejectedValue(conflictError);

    render(<ActionsTaken ticketId={10} readOnly={false} />);

    await waitFor(() => {
      expect(screen.getByTestId("edit-action-btn-1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("edit-action-btn-1"));

    fireEvent.change(screen.getByTestId("action-description-input"), {
      target: { value: "Attempting simultaneous edit from another tab." },
    });

    fireEvent.click(screen.getByTestId("submit-action-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("action-form-error")).toHaveTextContent(
        "Conflict detected: This record was modified by another user concurrently."
      );
    });

    // Modal stays open so user does not lose unsaved input
    expect(screen.getByTestId("action-modal")).toBeInTheDocument();
  });
});
