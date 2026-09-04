import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RequesterTicketDetail } from "../../src/components/RequesterTicketDetail.js";
import { RequesterProvider } from "../../src/context/RequesterContext.js";
import * as api from "../../src/api.js";
import { Ticket } from "../../src/types.js";

const mockRequester = {
  id: 1,
  fullName: "Jennifer Anderson",
  email: "jennifer.anderson@kmutt.ac.th",
  department: "Computer Engineering",
};

const mockTicketData: Ticket = {
  id: 42,
  ticketNumber: "TKT-2026-000042",
  summary: "Laptop battery drains quickly under load",
  description:
    "Battery drains in less than 30 minutes after updating system to version 14.5.",
  requestedPriority: "High",
  itPriority: "Medium",
  status: "Open",
  requesterId: 1,
  requester: {
    id: 1,
    fullName: "Jennifer Anderson",
    email: "jennifer.anderson@kmutt.ac.th",
  },
  categoryId: 2,
  category: {
    id: 2,
    name: "Hardware",
  },
  relatedSystemId: 7,
  relatedSystem: {
    id: 7,
    name: "Corporate Laptop",
  },
  attachments: [
    {
      id: 101,
      originalName: "battery-report.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 245000,
      isRemoved: false,
      createdAt: "2026-09-04T10:00:00.000Z",
    },
    {
      id: 102,
      originalName: "old-diagnostic-log.txt",
      mimeType: "text/plain",
      fileSizeBytes: 50000,
      isRemoved: true,
      removedAt: "2026-09-04T11:00:00.000Z",
      removalReason: "Uploaded wrong machine log",
      createdAt: "2026-09-04T09:00:00.000Z",
    },
  ],
  createdAt: "2026-09-04T08:30:00.000Z",
  updatedAt: "2026-09-04T11:00:00.000Z",
};

describe("RequesterTicketDetail Component Tests (UI-07, UI-08)", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("toktickit_requester", JSON.stringify(mockRequester));
    vi.restoreAllMocks();

    vi.spyOn(api, "fetchTicketDetail").mockResolvedValue(mockTicketData);
  });

  it("UI-07: renders ticket details in read-only containers with metadata grid (AC-10)", async () => {
    render(
      <RequesterProvider>
        <RequesterTicketDetail ticketId={42} onBack={vi.fn()} />
      </RequesterProvider>
    );

    // Wait for ticket to load
    await waitFor(() => {
      expect(screen.getByTestId("detail-ticket-number")).toHaveTextContent("TKT-2026-000042");
    });

    // Check read-only summary container (AC-10)
    const summaryEl = screen.getByTestId("detail-summary");
    expect(summaryEl).toBeInTheDocument();
    expect(summaryEl).toHaveTextContent("Laptop battery drains quickly under load");
    expect(summaryEl.tagName.toLowerCase()).not.toBe("input"); // not an editable input

    // Check read-only description container (AC-10)
    const descEl = screen.getByTestId("detail-description");
    expect(descEl).toBeInTheDocument();
    expect(descEl).toHaveTextContent("Battery drains in less than 30 minutes");
    expect(descEl.tagName.toLowerCase()).not.toBe("textarea"); // not an editable textarea

    // Check metadata grid
    expect(screen.getByTestId("detail-category")).toHaveTextContent("Hardware");
    expect(screen.getByTestId("detail-system")).toHaveTextContent("Corporate Laptop");
    expect(screen.getByTestId("detail-requested-priority")).toHaveTextContent("High");
    expect(screen.getByTestId("detail-it-priority")).toHaveTextContent("Medium");
    expect(screen.getByTestId("detail-requester")).toHaveTextContent("Jennifer Anderson");
  });

  it("UI-08: renders active attachment and soft-removed attachment with badge and disabled download (AC-12)", async () => {
    render(
      <RequesterProvider>
        <RequesterTicketDetail ticketId={42} onBack={vi.fn()} />
      </RequesterProvider>
    );

    // Wait for attachment section to render
    await waitFor(() => {
      expect(screen.getByTestId("attachment-section")).toBeInTheDocument();
    });

    // Active attachment check: has download and remove buttons
    const activeItem = screen.getByTestId("attachment-item-101");
    expect(activeItem).toBeInTheDocument();
    expect(activeItem).toHaveTextContent("battery-report.pdf");
    expect(screen.getByTestId("download-attachment-101")).toBeInTheDocument();
    expect(screen.getByTestId("remove-attachment-101")).toBeInTheDocument();

    // Soft-removed attachment check (UI-08, AC-12):
    // Displays "Removed" badge
    const removedBadge = screen.getByTestId("removed-badge");
    expect(removedBadge).toBeInTheDocument();
    expect(removedBadge).toHaveTextContent("Removed");

    // Displays mandatory removal reason banner
    const reasonBanner = screen.getByTestId("removal-reason-102");
    expect(reasonBanner).toBeInTheDocument();
    expect(reasonBanner).toHaveTextContent("Uploaded wrong machine log");

    // Download button must be disabled / blocked (410 Gone)
    const disabledDownloadBtn = screen.getByTestId("download-disabled-102");
    expect(disabledDownloadBtn).toBeInTheDocument();
    expect(disabledDownloadBtn).toBeDisabled();
  });

  it("handles soft-removal modal flow with mandatory reason validation (AC-12, BR-11)", async () => {
    const removeSpy = vi.spyOn(api, "removeAttachment").mockResolvedValue({
      id: 101,
      originalName: "battery-report.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 245000,
      isRemoved: true,
      removedAt: "2026-09-04T12:00:00.000Z",
      removalReason: "Document contains confidential telemetry",
      createdAt: "2026-09-04T10:00:00.000Z",
    });

    render(
      <RequesterProvider>
        <RequesterTicketDetail ticketId={42} onBack={vi.fn()} />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("remove-attachment-101")).toBeInTheDocument();
    });

    // Click remove button to open confirmation modal
    fireEvent.click(screen.getByTestId("remove-attachment-101"));

    // Modal is displayed
    expect(screen.getByTestId("removal-modal")).toBeInTheDocument();
    const reasonInput = screen.getByTestId("removal-reason-input");
    const confirmBtn = screen.getByTestId("confirm-removal-btn");

    // Initially confirm button is disabled because reason < 3 chars
    expect(confirmBtn).toBeDisabled();

    // Enter reason
    fireEvent.change(reasonInput, {
      target: { value: "Document contains confidential telemetry" },
    });

    expect(confirmBtn).not.toBeDisabled();

    // Click confirm removal
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(removeSpy).toHaveBeenCalledWith(
        1,
        101,
        "Document contains confidential telemetry"
      );
    });
  });

  it("navigates back to ticket list when Back button is clicked", async () => {
    const onBackMock = vi.fn();

    render(
      <RequesterProvider>
        <RequesterTicketDetail ticketId={42} onBack={onBackMock} />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("back-to-tickets-btn")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("back-to-tickets-btn"));
    expect(onBackMock).toHaveBeenCalledTimes(1);
  });
});
